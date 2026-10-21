"""
Router: /api/egestor-ausencia/diagnostico/* — Diagnóstico técnico da ausência de envio (Monitoramento SIAPS).

Complementa routers/egestor_ausencia.py (mesmo prefixo, mesma tela). Cruza a lista oficial de ausência com
o retorno oficial do processamento (SISAB — relatório público de validação), a validação da equipe no
pagamento do e-Gestor e o XML-CNES do mesmo mês, quando importado. Nada é presumido: o que não foi
consultado aparece como "não verificado" (regras em services/egestor_diagnostico.py).
"""
from __future__ import annotations

import asyncio
import json
import logging
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.cnes_xml import CnesXmlImportacao
from models.egestor_ausencia import EgestorAusencia, EgestorAusenciaAcompanhamento
from models.pec_agente import PecAgenteExecucao
from routers.auth import ip_de
from routers.egestor_ausencia import AVISO_SUSPENSAO, _SEM_COLETA, _coletas, _linhas, _nome, _oficiais
from routers.fns_previsao import _pode_editar
from services import cnes_xml as cxml
from services import egestor_ausencia as svc
from services import egestor_diagnostico as dg
from services import siaps_calendario as cal
from services import sisab_validacao as sv
from tenancy.auditoria import registrar_auditoria
from tenancy.escopo import SessaoMunicipal

router = APIRouter(prefix="/api/egestor-ausencia/diagnostico", tags=["e-Gestor — Monitoramento SIAPS (diagnóstico)"])
logger = logging.getLogger(__name__)

_VERIFICACOES: dict[int, dict] = {}        # estado da verificação em segundo plano, por município

AVISO_DIAGNOSTICO = ("Diagnóstico a partir de fontes oficiais públicas (e-Gestor e SISAB) e dos cadastros importados. "
                     "“Possível causa” é indício, não conclusão. Registros e lotes do PEC municipal não são acessados pelo "
                     "ERSUS360 e precisam ser conferidos na unidade.")


def _iso(dt: datetime | None) -> str | None:
    return dt.isoformat() + "Z" if dt else None


async def contexto_municipio(db: AsyncSession, mid: int) -> dict:
    xmls: dict[str, dict] = {}
    for imp in (await db.execute(select(CnesXmlImportacao).where(CnesXmlImportacao.municipio_id == mid)
                                 .order_by(CnesXmlImportacao.importado_em))).scalars():
        if imp.data_arquivo:
            xmls[imp.data_arquivo[:7]] = {"data_arquivo": imp.data_arquivo, "dados": imp.dados}   # o mais recente do mês vence
    sinal = (await db.execute(select(PecAgenteExecucao.recebido_em).where(
        PecAgenteExecucao.municipio_id == mid, PecAgenteExecucao.tipo == "heartbeat")
        .order_by(PecAgenteExecucao.recebido_em.desc()).limit(1))).scalar_one_or_none()
    return {"coletas": await _coletas(db, mid), "linhas": await _linhas(db, mid), "evid": await dg.evidencias(db, mid),
            "xmls": xmls, "oficiais": await _oficiais(db, mid), "pec": {"ultimo_sinal": _iso(sinal)}}


def cnes_da_equipe(ine: str, cx: dict) -> str | None:
    """CNES da equipe pelas evidências oficiais (pagamento/SISAB, da mais recente à mais antiga) ou pelo XML-CNES."""
    for (fonte, _comp), ev in sorted(cx["evid"].items(), key=lambda kv: kv[0][1], reverse=True):
        if ev.situacao != "ok":
            continue
        p = json.loads(ev.payload or "{}")
        lista = p.get("equipes", []) if fonte == dg.FONTE_PAGAMENTO else p.get("total", [])
        c = next((x["cnes"] for x in lista if x.get("ine") == ine and x.get("cnes")), None)
        if c:
            return c
    for x in cx["xmls"].values():
        eq = next((e for e in json.loads(x["dados"])["equipes"] if e["ine"] == ine), None)
        if eq and eq["estabelecimentos"]:
            return eq["estabelecimentos"][0]
    return None


def _xml_do_mes(ine: str, comp: str, cx: dict) -> dict | None:
    x = cx["xmls"].get(comp)
    if not x:
        return None
    dados = json.loads(x["dados"])
    eq = next((e for e in dados["equipes"] if e["ine"] == ine), None)
    pend = [p for p in cxml.analisar(dados)["pendencias"] if p["ine"] == ine] if eq else []
    return {"data_arquivo": x["data_arquivo"], "equipe": eq, "pendencias": pend}


def diagnostico(ine: str, comp: str, cx: dict, cnes_eq: str | None) -> dict:
    nome, tipo = _nome(ine, cx["oficiais"])
    eq_row = next((r for r in cx["linhas"] if r.competencia == comp and r.tipo_registro == "equipe" and r.ine == ine), None)
    profs = [{"cbo": r.cbo, "cnes": r.cnes, "cns_mascarado": r.cns_mascarado} for r in cx["linhas"]
             if r.competencia == comp and r.tipo_registro == "profissional" and r.ine == ine]
    return dg.diagnosticar({
        "ine": ine, "competencia": comp, "equipe": nome, "tipo_equipe": tipo,
        "tipologia": eq_row.tipologia if eq_row else None,
        "ausencia": {"descricao": eq_row.descricao, "qt_texto": eq_row.qt_texto,
                     "coletado_em": _iso(eq_row.coletado_em)} if eq_row else None,
        "profissionais": profs,
        "sisab": dg.ev_info(cx["evid"].get((dg.FONTE_SISAB, comp))),
        "pagamento": dg.ev_info(cx["evid"].get((dg.FONTE_PAGAMENTO, comp))),
        "cnes_xml": _xml_do_mes(ine, comp, cx), "pec": cx["pec"], "cnes_equipe": cnes_eq,
    })


def casos(cx: dict) -> list[tuple[str, str]]:
    """(INE, competência) de cada ausência de equipe coletada."""
    return sorted({(r.ine, r.competencia) for r in cx["linhas"] if r.tipo_registro == "equipe"}, key=lambda t: (t[1], t[0]))


def reincidentes(cx: dict) -> set[str]:
    """Equipe que saiu da lista (competência coletada sem ausência) e voltou a constar depois."""
    comps = [c.competencia for c in cx["coletas"]]
    aus: dict[str, set[str]] = {}
    for r in cx["linhas"]:
        if r.tipo_registro == "equipe":
            aus.setdefault(r.ine, set()).add(r.competencia)
    saida = set()
    for ine, cs in aus.items():
        e = [c in cs for c in comps]
        if any(e[i] and not e[i + 1] and any(e[i + 2:]) for i in range(len(e) - 1)):
            saida.add(ine)
    return saida


def _br(comp: str) -> str:
    return f"{comp[5:]}/{comp[:4]}"


def conclusao(diags: list[dict], atual_ausente: bool, ultima: str | None) -> str:
    if not diags:
        return "Nenhuma competência com ausência de envio nas competências coletadas."
    conf = [d for d in diags if d["classificacao"] == "causa_confirmada"]
    poss = [d for d in diags if d["classificacao"] == "possivel_causa"]
    partes = [f"{len(diags)} competência(s) com ausência analisada(s): {len(conf)} com causa confirmada, "
              f"{len(poss)} com possível causa e {len(diags) - len(conf) - len(poss)} sem diagnóstico conclusivo."]
    por_causa: dict[str, list[str]] = {}
    for d in conf + poss:
        por_causa.setdefault(d["causa"], []).append(_br(d["competencia"]))
    partes += [f"{causa} ({', '.join(cs)})." for causa, cs in por_causa.items()]
    if ultima:
        partes.append(f"Na competência mais recente coletada ({_br(ultima)}) a equipe "
                      + ("CONTINUA na lista oficial de ausência." if atual_ausente else
                         "não consta na lista oficial de ausência — regularizada nas informações oficiais dessa competência."))
    return " ".join(partes)


# ── endpoints ─────────────────────────────────────────────────────────────────

@router.get("/equipe/{ine}")
async def diagnostico_equipe(request: Request, current: SessaoMunicipal, ine: str = Path(..., pattern=r"^\d{1,10}$"),
                             db: AsyncSession = Depends(get_db)):
    mid, ine = current.municipio_id, ine.zfill(10)
    cx = await contexto_municipio(db, mid)
    if not cx["coletas"]:
        return _SEM_COLETA
    comps = [comp for i, comp in casos(cx) if i == ine]
    if not comps and ine not in cx["oficiais"]:
        raise HTTPException(404, "Equipe não encontrada nesta fonte")
    cnes_eq = cnes_da_equipe(ine, cx)
    diags = [diagnostico(ine, c, cx, cnes_eq) for c in comps]
    ultima = cx["coletas"][-1].competencia
    atual = ultima in comps
    await registrar_auditoria(db, "EGESTOR_DIAGNOSTICO_CONSULTADO", usuario=current, ip=ip_de(request),
                              tabela="egestor_ausencia_evidencias",
                              detalhe=f"INE {ine}: " + (", ".join(f"{d['competencia']}={d['classificacao']}" for d in diags) or "sem ausência"))
    nome, tipo = _nome(ine, cx["oficiais"])
    fontes = sorted({a["fonte"] for d in diags for a in d["achados"]}
                    | {e["fonte"] for d in diags for e in d["etapas"].values() if e.get("consultado_em")})
    return {
        "situacao_dado": "oficial_validado", "ine": ine, "equipe": nome, "tipo_equipe": tipo,
        "estabelecimento": cnes_eq, "municipio": current.municipio, "municipio_ibge": current.municipio_ibge,
        "periodo": {"de": cx["coletas"][0].competencia, "ate": ultima, "competencias_coletadas": len(cx["coletas"])},
        "competencias_com_ausencia": comps, "diagnosticos": diags,
        "ausencia_em_curso": atual, "reincidencia": ine in reincidentes(cx),
        "conclusao": conclusao(diags, atual, ultima), "fontes_consultadas": fontes,
        "avisos": [AVISO_DIAGNOSTICO, AVISO_SUSPENSAO],
    }


@router.get("/resumo")
async def diagnostico_resumo(current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    mid = current.municipio_id
    cx = await contexto_municipio(db, mid)
    if not cx["coletas"]:
        return _SEM_COLETA
    cache: dict[str, str | None] = {}
    lista = []
    for ine, comp in casos(cx):
        if ine not in cache:
            cache[ine] = cnes_da_equipe(ine, cx)
        d = diagnostico(ine, comp, cx, cache[ine])
        lista.append({"ine": ine, "equipe": d["equipe"], "tipo_equipe": d["tipo_equipe"], "competencia": comp,
                      "estabelecimento": (d["estabelecimento"] or [None])[0], "classificacao": d["classificacao"],
                      "classificacao_rotulo": d["classificacao_rotulo"], "causa": d["causa"],
                      "situacao_siaps": d["situacao_siaps"]["texto"], "ultima_verificacao": d["ultima_verificacao"]})
    ultima = cx["coletas"][-1].competencia
    ativas = {i for i, e in cx["oficiais"].items() if e.ativa}
    reinc = reincidentes(cx)
    acomp = {a.ine: a for a in (await db.execute(select(EgestorAusenciaAcompanhamento).where(
        EgestorAusenciaAcompanhamento.municipio_id == mid))).scalars()}
    em_curso = sorted({c["ine"] for c in lista if c["competencia"] == ultima})
    pend_sms = [{"ine": i, "equipe": _nome(i, cx["oficiais"])[0],
                 "acompanhamento": acomp[i].situacao if i in acomp else "pendente",
                 "responsavel": acomp[i].responsavel if i in acomp else None}
                for i in em_curso if not (i in acomp and acomp[i].situacao == "regularizado")]
    n = lambda k: sum(1 for c in lista if c["classificacao"] == k)  # noqa: E731
    return {
        "situacao_dado": "oficial_validado", "competencia_mais_recente": ultima,
        "competencias": [c.competencia for c in cx["coletas"]],
        "cards": {
            "equipes_monitoradas": len(ativas | {c["ine"] for c in lista}),
            "equipes_com_ausencia": len({c["ine"] for c in lista}),
            "competencias_afetadas": len({c["competencia"] for c in lista}),
            "casos": len(lista),
            "inconsistencias_confirmadas": n("causa_confirmada"),
            "possiveis_inconsistencias": n("possivel_causa"),
            "sem_diagnostico_conclusivo": n("sem_inconsistencia") + n("indisponivel"),
            "indisponiveis": n("indisponivel"),
            "equipes_com_reincidencia": len(reinc & {c["ine"] for c in lista}),
            "pendencias_intervencao_sms": len(pend_sms),
        },
        "casos": lista, "reincidentes": sorted(reinc), "pendencias_intervencao_sms": pend_sms,
        "evidencias": [{"fonte": dg.NOME_FONTE[f], "competencia": c, "situacao": e.situacao, "mensagem": e.mensagem,
                        "consultado_em": _iso(e.consultado_em)}
                       for (f, c), e in sorted(cx["evid"].items(), key=lambda kv: (kv[0][1], kv[0][0]))],
        "verificacao": _VERIFICACOES.get(mid),
        "avisos": [AVISO_DIAGNOSTICO],
    }


@router.get("/alertas")
async def diagnostico_alertas(current: SessaoMunicipal, dias_sem_solucao: int = Query(30, ge=1, le=365),
                              db: AsyncSession = Depends(get_db)):
    mid = current.municipio_id
    cx = await contexto_municipio(db, mid)
    if not cx["coletas"]:
        return _SEM_COLETA
    comps = [c.competencia for c in cx["coletas"]]
    ultima, anterior = comps[-1], (comps[-2] if len(comps) > 1 else None)
    por_comp: dict[str, dict[str, EgestorAusencia]] = {}
    for r in cx["linhas"]:
        if r.tipo_registro == "equipe":
            por_comp.setdefault(r.competencia, {})[r.ine] = r
    atual, ant = por_comp.get(ultima, {}), (por_comp.get(anterior, {}) if anterior else {})
    reinc = reincidentes(cx)
    fonte_aus = {"fonte": svc.FONTE, "consultado_em": _iso(cx["coletas"][-1].coletado_em)}
    agora = datetime.utcnow()
    alertas: list[dict] = []

    def add(tipo, gravidade, ine, comp, msg, fonte):
        alertas.append({"tipo": tipo, "gravidade": gravidade, "ine": ine,
                        "equipe": _nome(ine, cx["oficiais"])[0] if ine else None,
                        "competencia": comp, "mensagem": msg, **fonte})

    for ine, r in sorted(atual.items()):
        if ine not in ant:
            add("nova_ocorrencia", "atencao", ine, ultima, f"Nova ocorrência de ausência de envio em {_br(ultima)}.", fonte_aus)
        if (r.qt_consecutivas or 0) >= 2:
            add("consecutivas", "critico" if (r.qt_consecutivas or 0) >= 3 else "alto", ine, ultima,
                f"Ausência em competências consecutivas: {r.qt_texto}.", fonte_aus)
        if ine in reinc:
            add("reincidencia", "alto", ine, ultima, "Reincidência após regularização: a equipe saiu da lista e voltou a constar.", fonte_aus)
    cache: dict[str, str | None] = {}
    for ine, comp in casos(cx):
        if comp not in comps[-3:]:
            continue
        if ine not in cache:
            cache[ine] = cnes_da_equipe(ine, cx)
        for a in diagnostico(ine, comp, cx, cache[ine])["achados"]:
            fonte = {"fonte": a["fonte"], "consultado_em": a["consultado_em"]}
            if a["codigo"] == "REJEICAO_VALIDACAO":
                add("rejeicao", "alto", ine, comp, f"Produção transmitida com rejeição: {a['titulo']}.", fonte)
            elif a["codigo"] in ("CADASTRO_BLOQUEIO_EGESTOR", "PENDENCIA_CADASTRAL_EGESTOR",
                                 "EQUIPE_DESATIVADA_CNES", "EQUIPE_AUSENTE_CNES_XML"):
                add("divergencia_cadastral", "alto", ine, comp, f"Divergência cadastral: {a['titulo']}.", fonte)
    for (fonte, comp), ev in cx["evid"].items():
        if ev.alterado_em and (agora - ev.alterado_em).days <= 7:
            add("alteracao_processamento", "info", None, comp,
                f"Os dados oficiais ({dg.NOME_FONTE[fonte]}) de {_br(comp)} mudaram desde a consulta anterior.",
                {"fonte": dg.NOME_FONTE[fonte], "consultado_em": _iso(ev.consultado_em)})
    acomp = {a.ine: a for a in (await db.execute(select(EgestorAusenciaAcompanhamento).where(
        EgestorAusenciaAcompanhamento.municipio_id == mid))).scalars()}
    for ine in sorted(atual):
        a = acomp.get(ine)
        if a is None:
            add("sem_solucao", "atencao", ine, ultima, "Pendência sem solução: ausência em curso sem acompanhamento registrado.", fonte_aus)
        elif a.situacao in ("pendente", "sem_providencia") and (agora - a.atualizado_em).days >= dias_sem_solucao:
            add("sem_solucao", "atencao", ine, ultima,
                f"Pendência sem solução: acompanhamento “{a.situacao}” sem atualização há {(agora - a.atualizado_em).days} dias.", fonte_aus)
    ordem = {"critico": 0, "alto": 1, "atencao": 2, "info": 3}
    alertas.sort(key=lambda x: (ordem[x["gravidade"]], x["competencia"] or "", x["ine"] or ""))
    return {"situacao_dado": "oficial_validado", "competencia": ultima, "alertas": alertas,
            "gerado_em": _iso(agora), "avisos": [AVISO_DIAGNOSTICO]}


# ── verificação das fontes oficiais ───────────────────────────────────────────

class VerificarIn(BaseModel):
    competencias: Optional[list[str]] = Field(None, max_length=36)
    segundo_plano: bool = True


def competencias_previa(ultima_oficial: str | None, hoje: date | None = None) -> list[dict]:
    """Competências posteriores à última lista oficial de ausência que já começaram (calendário SIAPS)."""
    hoje = hoje or date.today()
    return [c for c in cal.calendario(hoje)
            if (ultima_oficial is None or c["competencia"] > ultima_oficial) and c["situacao"] != "futura"]


async def competencias_para_verificar(db: AsyncSession, mid: int) -> list[str]:
    """Competências com alguma ausência de equipe (diagnóstico) + as ainda sem lista oficial (prévia SISAB)."""
    com_ausencia = {r.competencia for r in await _linhas(db, mid) if r.tipo_registro == "equipe"}
    coletas = await _coletas(db, mid)
    previa = {c["competencia"] for c in competencias_previa(coletas[-1].competencia if coletas else None)} if coletas else set()
    return sorted(com_ausencia | previa)


@router.get("/previa")
async def diagnostico_previa(current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    """Prévia pelo SISAB para competências que o Ministério ainda não publicou na lista de ausência.
    NÃO é a situação oficial: só mostra o que o relatório de validação do SISAB já registra."""
    mid = current.municipio_id
    cx = await contexto_municipio(db, mid)
    if not cx["coletas"]:
        return _SEM_COLETA
    ultima = cx["coletas"][-1].competencia
    equipes = {i: e for i, e in cx["oficiais"].items() if e.ativa}
    saida = []
    for c in competencias_previa(ultima):
        comp = c["competencia"]
        sis = dg.ev_info(cx["evid"].get((dg.FONTE_SISAB, comp)))
        itens = []
        if sis["situacao"] == "ok":
            for ine, e in sorted(equipes.items(), key=lambda kv: kv[1].nome):
                itens.append({"ine": ine, "equipe": e.nome, "tipo_equipe": e.tipo,
                              **dg.previa_equipe(sv.resumo_ine(sis["payload"], ine), e.tipo)})
        saida.append({
            "competencia": comp, "prazo": c["data_limite"], "situacao_prazo": c["situacao"],
            "parcial": c["situacao"] != "envio_encerrado",
            "sisab": sis["situacao"], "mensagem": sis["mensagem"], "consultado_em": sis["consultado_em"],
            "equipes": itens,
            "resumo": {k: sum(1 for x in itens if x["situacao"] == k) for k in dg.PREVIA_SITUACOES},
        })
    return {"situacao_dado": "previa_nao_oficial", "ultima_competencia_oficial": ultima, "competencias": saida,
            "fonte": sv.FONTE, "calendario": cal.FONTE,
            "avisos": ["PRÉVIA — não é a lista oficial. O Ministério publica a ausência de envio depois do processamento; "
                       "a prévia só mostra o que o relatório público de validação do SISAB já registra para cada equipe.",
                       "Competência com prazo em curso: os números ainda mudam até a data limite.",
                       "eMulti: a produção de atendimento remoto não aparece separada no SISAB — a prévia não a avalia."]}


async def rodar_verificacao(mid: int, ibge: str, comps: list[str], usuario: str | None,
                            db: AsyncSession | None = None) -> dict:
    estado = _VERIFICACOES[mid] = {"em_andamento": True, "iniciado_em": _iso(datetime.utcnow()),
                                   "competencias": comps, "resultado": None}
    try:
        if db is None:
            from database import AsyncSessionLocal
            async with AsyncSessionLocal() as sess:
                r = await dg.coletar_evidencias(sess, mid, ibge, comps, usuario)
                await registrar_auditoria(sess, "EGESTOR_DIAGNOSTICO_VERIFICADO", login=usuario, municipio_id=mid,
                                          tabela="egestor_ausencia_evidencias",
                                          detalhe=f"{len(r['consultas'])} consultas, {len(r['erros'])} erros, "
                                                  f"{len(r['alteradas'])} com alteração")
        else:
            r = await dg.coletar_evidencias(db, mid, ibge, comps, usuario)
        estado["resultado"] = r
        return r
    except Exception as e:  # noqa: BLE001 — a verificação nunca derruba a aplicação
        logger.error("Verificação do diagnóstico (município %s) falhou: %s", mid, e, exc_info=True)
        estado["resultado"] = {"erro": "Falha inesperada na verificação; tente novamente mais tarde."}
        return estado["resultado"]
    finally:
        estado["em_andamento"] = False
        estado["concluido_em"] = _iso(datetime.utcnow())


@router.post("/verificar")
async def diagnostico_verificar(request: Request, current: SessaoMunicipal,
                                dados: VerificarIn = Body(default_factory=VerificarIn), db: AsyncSession = Depends(get_db)):
    _pode_editar(current)
    mid = current.municipio_id
    if (_VERIFICACOES.get(mid) or {}).get("em_andamento"):
        raise HTTPException(409, "Já existe uma verificação em andamento para este município")
    comps = sorted(set(dados.competencias)) if dados.competencias else await competencias_para_verificar(db, mid)
    if any(not (len(c) == 7 and c[4] == "-" and c[:4].isdigit() and c[5:].isdigit()) for c in comps):
        raise HTTPException(422, "Competência inválida (use AAAA-MM)")
    if not comps:
        return {"ok": True, "em_andamento": False, "competencias": [],
                "mensagem": "Nenhuma competência com ausência para verificar."}
    await registrar_auditoria(db, "EGESTOR_DIAGNOSTICO_SOLICITADO", usuario=current, ip=ip_de(request),
                              tabela="egestor_ausencia_evidencias", detalhe=f"competências {', '.join(comps)}")
    if dados.segundo_plano:
        _VERIFICACOES[mid] = {"em_andamento": True, "iniciado_em": _iso(datetime.utcnow()), "competencias": comps}
        asyncio.create_task(rodar_verificacao(mid, current.municipio_ibge, comps, current.username))
        return {"ok": True, "em_andamento": True, "competencias": comps,
                "mensagem": f"Verificação iniciada ({len(comps)} competências, cerca de 30 segundos cada)."}
    r = await rodar_verificacao(mid, current.municipio_ibge, comps, current.username, db)
    return {"ok": "erro" not in r, "em_andamento": False, "competencias": comps, **r}


@router.get("/verificacao")
async def diagnostico_verificacao(current: SessaoMunicipal):
    return _VERIFICACOES.get(current.municipio_id) or {"em_andamento": False}
