"""
Router: /api/egestor-ausencia — Monitoramento SIAPS (ausência de envio de produção válida).

Multi-município: tudo é do município da sessão. A fonte é o relatório público do e-Gestor APS e
informa apenas AUSÊNCIA de produção válida e há quantas competências ela dura. Quantidades de
produção, transmissões, rejeições e etapas de processamento NÃO são publicadas: aparecem como
"informação não disponibilizada pela fonte" e nunca são estimadas. Os níveis (verde/amarelo/laranja/
vermelho) são alertas gerenciais internos e não substituem a situação oficial do Ministério da Saúde.
"""
from __future__ import annotations

from typing import Literal, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.egestor_ausencia import EgestorAusencia, EgestorAusenciaAcompanhamento, EgestorAusenciaColeta
from models.equipe_siaps import EquipeSiaps
from routers.auth import ip_de
from routers.fns_previsao import _pode_editar
from services import egestor_ausencia as svc
from tenancy.auditoria import registrar_auditoria
from tenancy.escopo import SessaoMunicipal

router = APIRouter(prefix="/api/egestor-ausencia", tags=["e-Gestor — Monitoramento SIAPS"])

NAO_DISPONIBILIZADO = "Informação não disponibilizada pela fonte"
SEM_DADO_DA_FONTE = ["produção registrada", "produção transmitida", "produção validada", "produção rejeitada",
                     "último envio (data e hora)", "etapas de processamento e validação", "registros rejeitados ou inconsistentes"]
AVISO_NIVEL = ("Classificação por cor = alerta gerencial interno do ERSUS360, a partir do relatório público de "
               "ausência de envio. Não substitui a situação oficial publicada pelo Ministério da Saúde.")
AVISO_SUSPENSAO = ("A presença no relatório de ausência de envio NÃO significa que o recurso foi suspenso. "
                   "Suspensão confirmada só por fonte oficial (ex.: Relatório de Pagamento do e-Gestor) — não verificada aqui.")


def _mes(comp: str) -> int:
    return int(comp[:4]) * 12 + int(comp[5:7])


async def _coletas(db: AsyncSession, mid: int) -> list[EgestorAusenciaColeta]:
    return list((await db.execute(select(EgestorAusenciaColeta).where(EgestorAusenciaColeta.municipio_id == mid)
                                  .order_by(EgestorAusenciaColeta.competencia))).scalars())


async def _linhas(db: AsyncSession, mid: int, comp: str | None = None) -> list[EgestorAusencia]:
    q = select(EgestorAusencia).where(EgestorAusencia.municipio_id == mid)
    if comp:
        q = q.where(EgestorAusencia.competencia == comp)
    return list((await db.execute(q.order_by(EgestorAusencia.competencia, EgestorAusencia.chave))).scalars())


async def _oficiais(db: AsyncSession, mid: int) -> dict[str, EquipeSiaps]:
    eqs = (await db.execute(select(EquipeSiaps).where(EquipeSiaps.municipio_id == mid))).scalars()
    return {e.ine: e for e in eqs}


def _nome(ine: str, oficiais: dict[str, EquipeSiaps]) -> tuple[str, str | None]:
    e = oficiais.get(ine)
    return (e.nome, e.tipo) if e else (f"INE {ine} (fora da lista oficial de equipes do SIAPS)", None)


def _item_equipe(r: EgestorAusencia, oficiais: dict[str, EquipeSiaps]) -> dict:
    nome, tipo = _nome(r.ine or "", oficiais)
    n = svc.nivel(r.qt_consecutivas)
    return {"ine": r.ine, "equipe": nome, "tipo_equipe": tipo, "tipologia": r.tipologia, "descricao": r.descricao,
            "qt_texto": r.qt_texto, "qt_consecutivas": r.qt_consecutivas, "nivel": n, "rotulo": svc.NIVEIS[n]}


async def _competencia_alvo(db: AsyncSession, mid: int, pedida: str | None):
    coletas = await _coletas(db, mid)
    if not coletas:
        return coletas, None
    por_comp = {c.competencia: c for c in coletas}
    return coletas, por_comp.get(pedida) or coletas[-1]


_SEM_COLETA = {"situacao_dado": "nao_disponivel", "fonte": svc.FONTE,
               "mensagem": "Nenhuma competência coletada ainda. Use \"Atualizar dados\" em Integrações e Atualizações."}


# ── Visão geral ──────────────────────────────────────────────────────────────

@router.get("/painel")
async def painel(current: SessaoMunicipal, competencia: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}$"),
                 db: AsyncSession = Depends(get_db)):
    mid = current.municipio_id
    coletas, col = await _competencia_alvo(db, mid, competencia)
    if not col:
        return _SEM_COLETA
    oficiais = await _oficiais(db, mid)
    linhas = await _linhas(db, mid, col.competencia)
    eq = {r.ine: r for r in linhas if r.tipo_registro == "equipe"}
    ativas = {ine for ine, e in oficiais.items() if e.ativa}
    universo = ativas | set(eq)
    por_nivel = {"verde": 0, "amarelo": 0, "laranja": 0, "vermelho": 0}
    for ine in universo:
        por_nivel[svc.nivel(eq[ine].qt_consecutivas if ine in eq else None)] += 1
    total = len(universo)
    ultima_fonte = coletas[-1].ultima_competencia_fonte
    destaques = sorted((_item_equipe(r, oficiais) for r in eq.values() if (r.qt_consecutivas or 0) >= 3),
                       key=lambda x: x["ine"])
    return {
        "situacao_dado": "oficial_validado", "fonte": svc.FONTE, "competencia": col.competencia,
        "competencias_coletadas": [c.competencia for c in coletas],
        "ultima_competencia_coletada": coletas[-1].competencia, "ultima_competencia_fonte": ultima_fonte,
        "coleta_atrasada": bool(ultima_fonte and ultima_fonte > coletas[-1].competencia),
        "gerado_em_fonte": col.data_geracao_fonte, "coletado_em": col.coletado_em.isoformat() + "Z",
        "cards": {
            "equipes_monitoradas": total, "equipes_cadastradas_siaps": len(ativas),
            "equipes_com_producao_valida": por_nivel["verde"], "equipes_sem_producao_valida": total - por_nivel["verde"],
            "pct_regular": round(100 * por_nivel["verde"] / total, 1) if total else None,
            "uma_competencia_sem_envio": por_nivel["amarelo"], "duas_competencias_sem_envio": por_nivel["laranja"],
            "tres_ou_mais_competencias_sem_envio": por_nivel["vermelho"],
            "risco_de_suspensao": por_nivel["laranja"] + por_nivel["vermelho"],
            "estabelecimentos_com_ausencia": col.qt_estabelecimentos, "profissionais_com_ausencia": col.qt_profissionais,
        },
        "nao_disponibilizado_pela_fonte": SEM_DADO_DA_FONTE, "destaques": destaques,
        "avisos": [AVISO_NIVEL, AVISO_SUSPENSAO],
    }


# ── Ausência de envio (reprodução do relatório oficial) ──────────────────────

@router.get("/ausencias")
async def ausencias(current: SessaoMunicipal, competencia: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}$"),
                    db: AsyncSession = Depends(get_db)):
    mid = current.municipio_id
    coletas, col = await _competencia_alvo(db, mid, competencia)
    if not col:
        return _SEM_COLETA
    oficiais = await _oficiais(db, mid)
    linhas = await _linhas(db, mid, col.competencia)
    return {
        "situacao_dado": "oficial_validado", "fonte": svc.FONTE, "competencia": col.competencia,
        "competencias_coletadas": [c.competencia for c in coletas], "gerado_em_fonte": col.data_geracao_fonte,
        "municipio_ibge": col.municipio_ibge,
        "equipes": [_item_equipe(r, oficiais) for r in linhas if r.tipo_registro == "equipe"],
        "estabelecimentos": [{"cnes": r.cnes, "componente": r.componente, "descricao": r.descricao, "qt_texto": r.qt_texto,
                              "qt_consecutivas": r.qt_consecutivas, "nivel": svc.nivel(r.qt_consecutivas)}
                             for r in linhas if r.tipo_registro == "estabelecimento"],
        "profissionais": [{"cns_mascarado": r.cns_mascarado, "cbo": r.cbo, "ine": r.ine, "cnes": r.cnes,
                           "descricao": r.descricao, "qt_texto": r.qt_texto, "qt_consecutivas": r.qt_consecutivas,
                           "nivel": svc.nivel(r.qt_consecutivas)} for r in linhas if r.tipo_registro == "profissional"],
        "avisos": [AVISO_NIVEL],
    }


# ── Situação das equipes (lista oficial × ausência × competências) ───────────

@router.get("/equipes")
async def situacao_equipes(current: SessaoMunicipal, competencia: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}$"),
                           db: AsyncSession = Depends(get_db)):
    mid = current.municipio_id
    coletas, col = await _competencia_alvo(db, mid, competencia)
    oficiais = await _oficiais(db, mid)
    if not col and not oficiais:
        return _SEM_COLETA
    eq = {r.ine: r for r in await _linhas(db, mid, col.competencia) if r.tipo_registro == "equipe"} if col else {}
    acomp = {a.ine: a for a in (await db.execute(select(EgestorAusenciaAcompanhamento).where(
        EgestorAusenciaAcompanhamento.municipio_id == mid))).scalars()}
    itens = []
    for ine in sorted(set(oficiais) | set(eq)):
        nome, tipo = _nome(ine, oficiais)
        r = eq.get(ine)
        n = svc.nivel(r.qt_consecutivas if r else None, coletada=col is not None)
        a = acomp.get(ine)
        itens.append({"ine": ine, "equipe": nome, "tipo_equipe": tipo, "ativa": oficiais[ine].ativa if ine in oficiais else None,
                      "tipologia": r.tipologia if r else None, "nivel": n, "rotulo": svc.NIVEIS[n],
                      "descricao": r.descricao if r else None, "qt_texto": r.qt_texto if r else None,
                      "acompanhamento": a.situacao if a else None, "responsavel": a.responsavel if a else None})
    return {"situacao_dado": "oficial_validado" if col else "nao_disponivel", "fonte": svc.FONTE,
            "competencia": col.competencia if col else None, "equipes": itens, "avisos": [AVISO_NIVEL]}


# ── Histórico, matriz por competência e eventos ──────────────────────────────

@router.get("/historico")
async def historico(current: SessaoMunicipal, meses: int = Query(12, ge=1, le=36), db: AsyncSession = Depends(get_db)):
    mid = current.municipio_id
    coletas = (await _coletas(db, mid))[-meses:]
    if not coletas:
        return _SEM_COLETA
    janela = {c.competencia for c in coletas}
    oficiais = await _oficiais(db, mid)
    linhas = [r for r in await _linhas(db, mid) if r.competencia in janela]
    eq: dict[str, dict[str, int]] = {}
    serie = []
    for c in coletas:
        das = [r for r in linhas if r.competencia == c.competencia and r.tipo_registro == "equipe"]
        for r in das:
            eq.setdefault(r.ine, {})[c.competencia] = r.qt_consecutivas or 0
        niveis = [svc.nivel(r.qt_consecutivas) for r in das]
        serie.append({"competencia": c.competencia, "equipes_com_ausencia": len(das),
                      "amarelo": niveis.count("amarelo"), "laranja": niveis.count("laranja"),
                      "vermelho": niveis.count("vermelho"), "estabelecimentos": c.qt_estabelecimentos,
                      "profissionais": c.qt_profissionais, "gerado_em_fonte": c.data_geracao_fonte})
    comps = [c.competencia for c in coletas]
    matriz = []
    for ine, vals in sorted(eq.items()):
        nome, tipo = _nome(ine, oficiais)
        matriz.append({"ine": ine, "equipe": nome, "tipo_equipe": tipo,
                       "valores": {c: vals.get(c, 0) for c in comps}})   # 0 = sem ausência na competência coletada
    eventos = []
    for ant, atu in zip(comps, comps[1:]):
        if _mes(atu) - _mes(ant) != 1:
            continue                       # só compara competências vizinhas
        antes = {i for i, v in eq.items() if v.get(ant)}
        depois = {i for i, v in eq.items() if v.get(atu)}
        for ine in sorted(antes - depois):
            eventos.append({"competencia": atu, "tipo": "regularizada", "ine": ine, "equipe": _nome(ine, oficiais)[0]})
        for ine in sorted(depois - antes):
            eventos.append({"competencia": atu, "tipo": "entrou_em_ausencia", "ine": ine, "equipe": _nome(ine, oficiais)[0]})
    return {"situacao_dado": "oficial_validado", "fonte": svc.FONTE, "competencias": comps, "serie": serie,
            "matriz": matriz, "eventos": eventos, "avisos": [AVISO_NIVEL]}


# ── Alertas e risco de suspensão ─────────────────────────────────────────────

@router.get("/alertas")
async def alertas(current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    mid = current.municipio_id
    coletas = await _coletas(db, mid)
    if not coletas:
        return _SEM_COLETA
    oficiais = await _oficiais(db, mid)
    atual, anterior = coletas[-1], (coletas[-2] if len(coletas) > 1 else None)
    cur = {r.ine: r for r in await _linhas(db, mid, atual.competencia) if r.tipo_registro == "equipe"}
    ant = {r.ine: r for r in await _linhas(db, mid, anterior.competencia) if r.tipo_registro == "equipe"} if anterior else {}
    vizinha = anterior is not None and _mes(atual.competencia) - _mes(anterior.competencia) == 1
    itens = []
    for ine, r in sorted(cur.items()):
        nome, tipo = _nome(ine, oficiais)
        n = svc.nivel(r.qt_consecutivas)
        if n == "vermelho":
            texto = (f"CRÍTICO: A equipe INE {ine} ({nome}) apresenta três ou mais competências consecutivas sem produção válida. "
                     "Verificar imediatamente a situação do financiamento e as regras aplicáveis.")
        elif n == "laranja":
            texto = (f"ATENÇÃO: A equipe INE {ine} ({nome}) apresenta duas competências consecutivas sem produção válida. "
                     "Verificar transmissão e processamento para evitar possível suspensão do financiamento.")
        else:
            texto = f"INFORMATIVO: A equipe INE {ine} ({nome}) está na primeira competência sem produção válida. Verificar a transmissão."
        itens.append({"ine": ine, "equipe": nome, "tipo_equipe": tipo, "nivel": n, "rotulo": svc.NIVEIS[n],
                      "competencia": atual.competencia, "qt_texto": r.qt_texto, "descricao": r.descricao, "mensagem": texto,
                      "situacao": "risco_de_suspensao" if n in ("laranja", "vermelho") else "pendente_de_verificacao",
                      "suspensao_confirmada": False, "suspensao_confirmada_nota": "Não verificada — consulte o Relatório de Pagamento (e-Gestor)."})
    regularizadas = []
    if vizinha:
        for ine, r in sorted(ant.items()):
            if ine not in cur:
                nome, tipo = _nome(ine, oficiais)
                regularizadas.append({"ine": ine, "equipe": nome, "tipo_equipe": tipo, "regularizada_em": atual.competencia,
                                      "ausencia_anterior": r.qt_texto, "situacao": "regularizada",
                                      "mensagem": f"Regularizada: a equipe INE {ine} ({nome}) saiu da lista de ausência em {atual.competencia}."})
    ordem = {"vermelho": 0, "laranja": 1, "amarelo": 2}
    itens.sort(key=lambda x: (ordem[x["nivel"]], x["ine"]))
    return {"situacao_dado": "oficial_validado", "fonte": svc.FONTE, "competencia": atual.competencia,
            "gerado_em_fonte": atual.data_geracao_fonte, "alertas": itens, "regularizadas": regularizadas,
            "avisos": [AVISO_NIVEL, AVISO_SUSPENSAO]}


# ── Caso individual (equipe) ─────────────────────────────────────────────────

CAUSAS_GERAIS = [
    "Transmissão do e-SUS APS/PEC não concluída ou com falha no envio ao SIAPS.",
    "Produção rejeitada na validação (fichas inconsistentes; CNES, INE ou CBO divergentes do SCNES).",
    "Cadastro da equipe, do estabelecimento ou dos profissionais divergente ou desatualizado no SCNES.",
    "Profissionais sem vínculo ativo ou sem registro de produção na competência.",
]
CAUSA_EMULTI = "eMulti: ausência de produção válida de atendimento remoto / ações compartilhadas registradas no e-SUS APS."
PROVIDENCIAS = [
    "Conferir no e-SUS APS/PEC se a produção da competência foi transmitida e quais lotes foram aceitos ou rejeitados.",
    "Conferir no SCNES o cadastro vigente (INE, CNES, CBO, vínculos) e corrigir divergências.",
    "Reenviar a produção corrigida dentro do prazo da competência e acompanhar o relatório na competência seguinte.",
    "Registrar abaixo o responsável e a situação do acompanhamento.",
]


@router.get("/equipe/{ine}")
async def caso_equipe(current: SessaoMunicipal, ine: str = Path(..., pattern=r"^\d{1,10}$"),
                      db: AsyncSession = Depends(get_db)):
    mid, ine = current.municipio_id, ine.zfill(10)
    coletas = await _coletas(db, mid)
    if not coletas:
        return _SEM_COLETA
    oficiais = await _oficiais(db, mid)
    todas = [r for r in await _linhas(db, mid) if r.ine == ine and r.tipo_registro in ("equipe", "profissional")]
    if ine not in oficiais and not any(r.tipo_registro == "equipe" for r in todas):
        raise HTTPException(404, "Equipe não encontrada nesta fonte")
    eq = {r.competencia: r for r in todas if r.tipo_registro == "equipe"}
    linha_do_tempo = []
    for c in coletas:
        r = eq.get(c.competencia)
        n = svc.nivel(r.qt_consecutivas if r else None)
        linha_do_tempo.append({"competencia": c.competencia, "coletada": True, "nivel": n, "rotulo": svc.NIVEIS[n],
                               "descricao": r.descricao if r else None, "qt_texto": r.qt_texto if r else None,
                               "profissionais_com_ausencia": sum(1 for p in todas if p.tipo_registro == "profissional"
                                                                  and p.competencia == c.competencia)})
    regulares = [t["competencia"] for t in linha_do_tempo if t["nivel"] == "verde"]
    atual = linha_do_tempo[-1]
    nome, tipo = _nome(ine, oficiais)
    emulti = any("emulti" in svc._sem_acento(r.descricao) for r in eq.values())
    a = (await db.execute(select(EgestorAusenciaAcompanhamento).where(
        EgestorAusenciaAcompanhamento.municipio_id == mid, EgestorAusenciaAcompanhamento.ine == ine))).scalar_one_or_none()
    return {
        "situacao_dado": "oficial_validado", "fonte": svc.FONTE, "ine": ine, "equipe": nome, "tipo_equipe": tipo,
        "tipologia": next((r.tipologia for r in eq.values() if r.tipologia), None),
        "situacao_atual": atual, "competencias_com_ausencia": [t["competencia"] for t in linha_do_tempo if t["nivel"] != "verde"],
        "ultima_competencia_sem_ausencia": regulares[-1] if regulares else None,
        "linha_do_tempo": linha_do_tempo, "historico_transmissoes": NAO_DISPONIBILIZADO,
        "processamento_e_rejeicoes": NAO_DISPONIBILIZADO,
        "possiveis_causas": CAUSAS_GERAIS + ([CAUSA_EMULTI] if emulti else []), "providencias_recomendadas": PROVIDENCIAS,
        "orientacao_nota": "Orientações gerais para investigação — confirme no PEC, SCNES e SIAPS. O ERSUS360 não acessa as etapas de processamento.",
        "acompanhamento": {"situacao": a.situacao if a else "pendente", "responsavel": a.responsavel if a else None,
                           "observacao": a.observacao if a else None,
                           "atualizado_em": a.atualizado_em.isoformat() + "Z" if a else None,
                           "atualizado_por": a.atualizado_por if a else None},
        "ultima_verificacao": coletas[-1].coletado_em.isoformat() + "Z",
        "avisos": [AVISO_NIVEL],
    }


class AcompanhamentoIn(BaseModel):
    situacao: Literal["pendente", "em_acompanhamento", "regularizado", "sem_providencia"] = "pendente"
    responsavel: Optional[str] = Field(None, max_length=200)
    observacao: Optional[str] = Field(None, max_length=4000)


@router.put("/equipe/{ine}/acompanhamento")
async def registrar_acompanhamento(request: Request, current: SessaoMunicipal, dados: AcompanhamentoIn,
                                   ine: str = Path(..., pattern=r"^\d{1,10}$"), db: AsyncSession = Depends(get_db)):
    _pode_editar(current)
    mid, ine = current.municipio_id, ine.zfill(10)
    a = (await db.execute(select(EgestorAusenciaAcompanhamento).where(
        EgestorAusenciaAcompanhamento.municipio_id == mid, EgestorAusenciaAcompanhamento.ine == ine))).scalar_one_or_none()
    if a is None:
        a = EgestorAusenciaAcompanhamento(municipio_id=mid, ine=ine)
        db.add(a)
    a.situacao, a.responsavel, a.observacao, a.atualizado_por = dados.situacao, dados.responsavel, dados.observacao, current.username
    await registrar_auditoria(db, "EGESTOR_AUSENCIA_ACOMPANHAMENTO", usuario=current, ip=ip_de(request),
                              tabela="egestor_ausencia_acompanhamentos", detalhe=f"INE {ine}: {dados.situacao}")
    await db.commit()
    return {"ok": True, "ine": ine, "situacao": a.situacao}


# ── Integrações e atualizações ───────────────────────────────────────────────

class SincronizarIn(BaseModel):
    historico: bool = False                       # True = todas as competências publicadas
    competencias: Optional[list[str]] = Field(None, max_length=36)


@router.get("/fonte")
async def fonte(current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    coletas = await _coletas(db, current.municipio_id)
    return {
        "fontes": [{
            "nome": svc.FONTE, "acesso": "API pública, sem login",
            "url": "https://relatorioaps.saude.gov.br/gerenciaaps/ausencia-envio-producao",
            "informa": ["equipes, estabelecimentos e profissionais sem produção válida", "tipologia (código)",
                        "competências consecutivas sem envio (1, 2, 3, superior a 3)", "data de geração do relatório"],
            "nao_informa": SEM_DADO_DA_FONTE,
        }],
        "ultima_coleta": coletas[-1].coletado_em.isoformat() + "Z" if coletas else None,
        "coletas": [{"competencia": c.competencia, "gerado_em_fonte": c.data_geracao_fonte,
                     "coletado_em": c.coletado_em.isoformat() + "Z", "coletado_por": c.coletado_por,
                     "equipes": c.qt_equipes, "estabelecimentos": c.qt_estabelecimentos, "profissionais": c.qt_profissionais}
                    for c in coletas],
        "ultima_competencia_fonte": coletas[-1].ultima_competencia_fonte if coletas else None,
    }


@router.post("/sincronizar")
async def sincronizar(request: Request, current: SessaoMunicipal, dados: SincronizarIn = Body(default_factory=SincronizarIn),
                      db: AsyncSession = Depends(get_db)):
    _pode_editar(current)
    try:
        na_fonte = await svc.listar_competencias()
        if dados.competencias:
            invalidas = [c for c in dados.competencias if c not in na_fonte]
            if invalidas:
                raise HTTPException(422, f"Competência não publicada na fonte: {', '.join(invalidas)}")
            alvo = sorted(dados.competencias)
        else:
            alvo = na_fonte if dados.historico else na_fonte[-3:]
        r = await svc.coletar(db, current.municipio_id, current.municipio_ibge, alvo, current.username,
                              ultima_na_fonte=na_fonte[-1] if na_fonte else None)
    except svc.FonteIndisponivel as e:
        raise HTTPException(503, str(e))
    await registrar_auditoria(db, "EGESTOR_AUSENCIA_SINCRONIZADA", usuario=current, ip=ip_de(request),
                              tabela="egestor_ausencias",
                              detalhe=f"{len(r['coletadas'])} competências coletadas, {len(r['erros'])} erros")
    await db.commit()
    return {**r, "ultima_competencia_fonte": na_fonte[-1] if na_fonte else None}
