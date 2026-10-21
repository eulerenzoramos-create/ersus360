"""
Diagnóstico técnico da ausência de envio — Monitoramento SIAPS.

Para cada equipe × competência que consta no relatório público de ausência do e-Gestor, cruza as
evidências OFICIAIS que o ERSUS360 consegue consultar e diz, separadamente, o que se sabe de cada etapa:

  SIAPS/e-Gestor   relatório de ausência: subtipo oficial (equipe / atendimento remoto eMulti) e
                   profissionais da equipe listados sem produção válida
  Transmissão      SISAB — relatório público de Validação: fichas RECEBIDAS com o INE na competência
  Processamento    SISAB — mesmas fichas por resultado (Aprovado, Duplicado, Data inválida,
                   Reprovado(CNES/INE/PROF/CBO)) e quantas chegaram DENTRO DO PRAZO
  Cadastro         e-Gestor — validação da equipe na parcela da competência CNES (equipe ativa, unidade
                   válida, vínculo eSB×eSF, suspensões) e o retrato do XML-CNES do mesmo mês, se importado
  Origem (PEC)     não acessível: o ERSUS360 não lê os registros nem o histórico de transmissão do PEC

Classificação (nunca promove hipótese a causa):
  causa_confirmada   uma fonte oficial mostra o motivo (nada recebido; tudo reprovado; só fora do prazo;
                     subtipo eMulti; equipe inativa/unidade inválida no e-Gestor; equipe desativada no CNES)
  possivel_causa     há indícios, falta confirmação (ex.: unidade transmitiu outras equipes e esta não)
  sem_inconsistencia as fontes consultadas não mostram erro que explique a ausência
  indisponivel       não há evidência consultada suficiente

Validação do método (21/10/2026, Apuí/AM, 15 competências 05/2025–07/2026): toda ausência de eSF/eSB
coincidiu com zero fichas aprovadas no prazo no SISAB; nas competências sem ausência, havia fichas aprovadas
no prazo. A eMulti com ausência "atendimento remoto" tinha centenas de fichas aprovadas (o que falta é o remoto).
"""
from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.egestor_ausencia import EgestorAusenciaEvidencia
from services import egestor_pagamento as ep
from services import sisab_validacao as sv

logger = logging.getLogger(__name__)

FONTE_SISAB = "sisab_validacao"
FONTE_PAGAMENTO = "egestor_pagamento"
NOME_FONTE = {
    FONTE_SISAB: sv.FONTE,
    FONTE_PAGAMENTO: "e-Gestor APS — relatório público de pagamento (validação por equipe)",
    "ausencia": "e-Gestor APS — relatório público de ausência de envio",
    "cnes_xml": "XML-CNES do SISAB importado no ERSUS360",
    "pec": "e-SUS APS/PEC municipal",
}
CLASSES = {
    "causa_confirmada": "CAUSA CONFIRMADA",
    "possivel_causa": "POSSÍVEL CAUSA",
    "sem_inconsistencia": "SEM INCONSISTÊNCIA IDENTIFICADA",
    "indisponivel": "DIAGNÓSTICO INDISPONÍVEL",
}
# planos orçamentários com validação por equipe: eSF/eAP, Saúde Bucal, eMulti
PLANOS_COM_EQUIPES = (8, 10, 9)
ST_BLOQUEIO_CADASTRAL = {
    "stEquipeAtiva": "Equipe não ativa na validação do e-Gestor",
    "stEsbAtiva": "eSB não ativa na validação do e-Gestor",
    "stUnidadeValida": "Unidade (CNES) não válida na validação do e-Gestor",
    "stTipoEquipe": "Tipo de equipe não válido na validação do e-Gestor",
}
MOTIVO_REPROVACAO = {
    "CNES": "o CNES informado na ficha não foi validado para a competência",
    "INE": "o INE informado na ficha não foi validado (equipe inexistente, inativa ou de outro estabelecimento)",
    "PROF": "o profissional (CNS) não tinha vínculo válido no CNES com o estabelecimento/equipe na data do registro",
    "CBO": "o CBO do profissional na ficha não corresponde à lotação no CNES ou não é permitido para a ficha",
}


def _hash(obj) -> str:
    return hashlib.sha256(json.dumps(obj, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def _norm(s) -> str:
    return ep._norm(s)


# ── 1. Coleta de evidências ───────────────────────────────────────────────────

async def _pagamento_competencias(ibge: str, competencias: list[str], client: httpx.AsyncClient) -> dict[str, dict]:
    """Validação de cada equipe na parcela que avalia a competência CNES pedida (API pública do e-Gestor)."""
    ibge6, uf = ibge[:6], ibge[:2]
    anos = sorted({int(c[:4]) for c in competencias})
    ag = await ep._get(client, ep.BASE, {"unidadeGeografica": "MUNICIPIO", "coUf": uf, "coMunicipio": ibge6,
                                         "nuParcelaInicio": f"{anos[0]}01", "nuParcelaFim": f"{anos[-1] + 1}12",
                                         "tipoRelatorio": "AGRUPADO"})
    por_comp = {f"{g['nuCompCnes'][:4]}-{g['nuCompCnes'][4:]}": g for g in ag.get("agrupamentos") or []}
    saida: dict[str, dict] = {}
    for comp in competencias:
        g = por_comp.get(comp)
        if not g:
            saida[comp] = {"publicado": False}
            continue
        equipes = []
        for plano in g.get("listaPagamentoPlanoOrcamentario") or []:
            co_plano = plano["coSeqPlanoOrcamentario"]
            if co_plano not in PLANOS_COM_EQUIPES:
                continue
            for c in await ep._get(client, f"{ep.BASE}/componente-pagamento",
                                   {"coProcesso": g["coProcesso"], "coPlanoOrcamentario": co_plano}):
                if c["coComponentePagamento"] not in ep.TIPO_POR_COMPONENTE:
                    continue
                d = await ep._get(client, f"{ep.BASE}/municipio/relatorio-detalhado", {
                    "nuParcela": c["nuParcela"], "nuCompCnes": c["nuCompCnes"], "coMunicipio": ibge6,
                    "coComponentePagamento": c["coComponentePagamento"], "coProcesso": c["coProcesso"],
                    "coProcessoPagamento": c["coProcessoPagamento"], "coProcessoValidacao": c["coProcessoValidacao"],
                    "coPlanoOrcamentario": c["coPlanoOrcamentario"]})
                for e in (d.get("validacoesEquipes") if isinstance(d, dict) else None) or []:
                    ine = str(e.get("coEquipe") or e.get("coEquipeEsb") or "").zfill(10)
                    if not ine.strip("0"):
                        continue
                    vinc = e.get("coEquipeEsfEap")
                    equipes.append({
                        "ine": ine, "co_componente": c["coComponentePagamento"],
                        "componente": (c.get("dsComponentePagamento") or "").strip(),
                        "cnes": str(e.get("codigoEstabelecimento") or e.get("coCnes") or "").zfill(7) or None,
                        "ine_vinculada": str(vinc).zfill(10) if vinc else None,
                        "st_pagamento": e.get("stPagamento"),
                        "situacoes": {k: v for k, v in e.items() if k.startswith("st")},
                        "pendencias": ep.pendencias(e),
                    })
        saida[comp] = {"publicado": True, "parcela": g["nuParcela"], "equipes": equipes}
    return saida


async def _gravar(db: AsyncSession, mid: int, fonte: str, comp: str, situacao: str, payload: dict,
                  mensagem: str | None, usuario: str | None, agora: datetime) -> bool:
    """Grava a evidência; devolve True se o conteúdo oficial mudou desde a última consulta."""
    ev = (await db.execute(select(EgestorAusenciaEvidencia).where(
        EgestorAusenciaEvidencia.municipio_id == mid, EgestorAusenciaEvidencia.fonte == fonte,
        EgestorAusenciaEvidencia.competencia == comp))).scalar_one_or_none()
    if situacao == "erro" and ev is not None and ev.situacao == "ok":
        ev.mensagem = mensagem          # falha momentânea não apaga a última evidência válida
        return False
    novo = _hash(payload) if situacao == "ok" else None
    if ev is None:
        ev = EgestorAusenciaEvidencia(municipio_id=mid, fonte=fonte, competencia=comp)
        db.add(ev)
    mudou = bool(ev.hash and novo and ev.hash != novo)
    if mudou:
        ev.hash_anterior, ev.alterado_em = ev.hash, agora
    ev.situacao, ev.mensagem, ev.payload, ev.hash = situacao, mensagem, json.dumps(payload, ensure_ascii=False), novo
    ev.consultado_por, ev.consultado_em = usuario, agora
    return mudou


async def coletar_evidencias(db: AsyncSession, mid: int, ibge: str, competencias: list[str],
                             usuario: str | None = None, client: httpx.AsyncClient | None = None) -> dict:
    """Consulta SISAB (validação) e e-Gestor (pagamento) para as competências pedidas e grava as evidências."""
    fechar = client is None
    client = client or httpx.AsyncClient(timeout=sv.TIMEOUT, follow_redirects=True, headers=sv.HEADERS)
    agora = datetime.utcnow()
    feitos, erros, alteradas = [], [], []
    try:
        for comp in sorted(set(competencias)):
            try:
                val = await sv.validacao_competencia(ibge, comp, client)
                if val["disponivel"]:
                    payload = {"total": val["total"], "no_prazo": val["no_prazo"]}
                    if await _gravar(db, mid, FONTE_SISAB, comp, "ok", payload, None, usuario, agora):
                        alteradas.append({"fonte": FONTE_SISAB, "competencia": comp})
                else:
                    ult = (val["competencias_disponiveis"] or [None])[-1]
                    await _gravar(db, mid, FONTE_SISAB, comp, "nao_publicado", {"ultima_disponivel": ult},
                                  f"Competência ainda não disponível no relatório de validação do SISAB (última: {ult})",
                                  usuario, agora)
                feitos.append({"fonte": FONTE_SISAB, "competencia": comp, "disponivel": val["disponivel"]})
            except sv.SisabIndisponivel as e:
                await _gravar(db, mid, FONTE_SISAB, comp, "erro", {}, str(e), usuario, agora)
                erros.append({"fonte": FONTE_SISAB, "competencia": comp, "erro": str(e)})
        try:
            pag = await _pagamento_competencias(ibge, sorted(set(competencias)), client)
            for comp, dado in pag.items():
                if dado["publicado"]:
                    if await _gravar(db, mid, FONTE_PAGAMENTO, comp, "ok", dado, None, usuario, agora):
                        alteradas.append({"fonte": FONTE_PAGAMENTO, "competencia": comp})
                else:
                    await _gravar(db, mid, FONTE_PAGAMENTO, comp, "nao_publicado", {},
                                  "Parcela que avalia esta competência CNES ainda não publicada no e-Gestor", usuario, agora)
                feitos.append({"fonte": FONTE_PAGAMENTO, "competencia": comp, "disponivel": dado["publicado"]})
        except (httpx.HTTPError, ValueError, KeyError, TypeError) as e:
            msg = f"e-Gestor (relatório público de pagamento) indisponível: {e}"
            for comp in competencias:
                await _gravar(db, mid, FONTE_PAGAMENTO, comp, "erro", {}, msg, usuario, agora)
            erros.append({"fonte": FONTE_PAGAMENTO, "erro": msg})
        await db.commit()
    finally:
        if fechar:
            await client.aclose()
    return {"consultas": feitos, "erros": erros, "alteradas": alteradas, "consultado_em": agora.isoformat() + "Z"}


async def evidencias(db: AsyncSession, mid: int) -> dict[tuple[str, str], EgestorAusenciaEvidencia]:
    rows = (await db.execute(select(EgestorAusenciaEvidencia).where(EgestorAusenciaEvidencia.municipio_id == mid))).scalars()
    return {(r.fonte, r.competencia): r for r in rows}


# ── 2. Regras do diagnóstico (puras) ──────────────────────────────────────────

def _iso(dt: datetime | None) -> str | None:
    return dt.isoformat() + "Z" if dt else None


def ev_info(ev) -> dict:
    """Evidência gravada → dict simples usado pelas regras (ou None quando nunca consultada)."""
    if ev is None:
        return {"situacao": "nao_consultado", "payload": {}, "consultado_em": None, "mensagem": None}
    return {"situacao": ev.situacao, "payload": json.loads(ev.payload or "{}"), "consultado_em": _iso(ev.consultado_em),
            "mensagem": ev.mensagem}


def _achado(codigo, categoria, classe, papel, titulo, descricao, fonte, consultado_em, erro_oficial=None) -> dict:
    """papel: 'causa' (explica a ausência), 'contexto' (fato relevante) ou 'consequencia'."""
    return {"codigo": codigo, "categoria": categoria, "classe": classe, "papel": papel, "titulo": titulo,
            "descricao": descricao, "fonte": NOME_FONTE.get(fonte, fonte), "consultado_em": consultado_em,
            "erro_oficial": erro_oficial, "orientacao": ORIENTACOES.get(codigo)}


def diagnosticar(ctx: dict) -> dict:
    """ctx: ine, competencia, equipe, tipo_equipe, ausencia{descricao,qt_texto,coletado_em}, profissionais[],
    sisab{situacao,payload,consultado_em,mensagem}, pagamento{...}, cnes_xml{data_arquivo,equipe,pendencias}|None,
    pec{ultimo_sinal}|None, cnes_equipe (CNES conhecido da equipe, de outras fontes)."""
    ine, comp = ctx["ine"], ctx["competencia"]
    aus, sis, pag = ctx.get("ausencia") or {}, ctx["sisab"], ctx["pagamento"]
    achados: list[dict] = []
    etapas: dict[str, dict] = {}
    nao_verificado: list[str] = []
    desc = _norm(aus.get("descricao"))

    # SIAPS / e-Gestor — relatório de ausência
    etapas["siaps"] = {"status": "ausencia", "texto": f"Ausência de envio — {aus.get('descricao') or '—'} ({aus.get('qt_texto') or '—'})",
                       "fonte": NOME_FONTE["ausencia"], "consultado_em": aus.get("coletado_em")}
    remoto = "REMOTO" in desc
    if remoto:
        so_remoto = "DA EQUIPE E DO" not in desc
        achados.append(_achado(
            "AUSENCIA_ATENDIMENTO_REMOTO", "D", "confirmada", "causa",
            "Falta produção válida de atendimento remoto (eMulti)" if so_remoto else "Falta produção válida da equipe e do atendimento remoto (eMulti)",
            f"O próprio relatório oficial classifica a ausência como: “{aus.get('descricao')}”.", "ausencia", aus.get("coletado_em"),
            {"codigo": "dsSubTipoSuspensao", "descricao": aus.get("descricao")}))
    profs = ctx.get("profissionais") or []
    if profs:
        cbos = sorted({p.get("cbo") or "—" for p in profs})
        achados.append(_achado(
            "PROFISSIONAL_SEM_PRODUCAO", "C", "possivel", "causa",
            f"{len(profs)} profissional(is) da equipe listado(s) sem produção válida",
            f"O relatório oficial de ausência lista, para este INE, profissional(is) sem produção válida (CBO {', '.join(cbos)}). "
            "Identificação apenas mascarada no ERSUS360.", "ausencia", aus.get("coletado_em")))

    # SISAB — transmissão e processamento
    r = None
    if sis["situacao"] == "ok":
        r = sv.resumo_ine(sis["payload"], ine)
        cnes_eq = (r["cnes"] or [None])[0] or ctx.get("cnes_equipe")
        outras_mesma_unidade = sum(l["total"] for l in sis["payload"].get("total", [])
                                   if cnes_eq and l["cnes"] == cnes_eq and l["ine"] and l["ine"] != ine
                                   and l["validacao"] == "Aprovado")
        unidade_total = sum(l["total"] for l in sis["payload"].get("total", []) if cnes_eq and l["cnes"] == cnes_eq)
        if r["recebidos"] == 0:
            etapas["transmissao"] = {"status": "nao_recebido", "texto": f"Nenhuma ficha com o INE {ine} foi recebida pelo SISAB na competência.",
                                     "fonte": sv.FONTE, "consultado_em": sis["consultado_em"]}
            etapas["processamento"] = {"status": "sem_registros", "texto": "Nada a processar: nenhum registro recebido.",
                                       "fonte": sv.FONTE, "consultado_em": sis["consultado_em"]}
            achados.append(_achado(
                "SEM_RECEBIMENTO_FEDERAL", "B", "confirmada", "causa",
                "Produção da equipe não chegou à base federal (SISAB)",
                f"O relatório de validação do SISAB não mostra nenhuma ficha (aprovada, reprovada ou duplicada) com o INE {ine} "
                "na competência. Ficam descartadas rejeição no processamento e envio fora do prazo. A origem — produção não "
                "registrada, registrada sem o INE ou não transmitida — precisa ser conferida no PEC.",
                FONTE_SISAB, sis["consultado_em"], {"codigo": "0 fichas recebidas", "descricao": "Nenhum registro com o INE no SISAB"}))
            if cnes_eq and outras_mesma_unidade > 0:
                achados.append(_achado(
                    "UNIDADE_TRANSMITIU_OUTRAS_EQUIPES", "A", "possivel", "causa",
                    "A unidade transmitiu produção de outras equipes, mas não desta",
                    f"Na mesma competência o SISAB aprovou {outras_mesma_unidade} ficha(s) de outras equipes do CNES {cnes_eq}. "
                    "A transmissão da unidade funcionou; o indício é de produção desta equipe não registrada no PEC com o seu INE "
                    "(profissional sem atendimentos registrados, afastado, ou registrando em outra equipe).",
                    FONTE_SISAB, sis["consultado_em"]))
            elif cnes_eq and unidade_total == 0:
                achados.append(_achado(
                    "UNIDADE_SEM_ENVIO", "B", "possivel", "causa",
                    "Nenhuma ficha da unidade inteira foi recebida",
                    f"O SISAB não recebeu nenhuma ficha do CNES {cnes_eq} na competência: indício de falha de transmissão/"
                    "sincronização da unidade (ou de ausência total de registro). Confirmar no PEC.",
                    FONTE_SISAB, sis["consultado_em"]))
            sem_ine = [l for l in sis["payload"].get("total", []) if cnes_eq and l["cnes"] == cnes_eq and not l["ine"]
                       and not l["validacao"].lower().startswith("n")]          # "Não Aplicado" = fichas sem equipe por natureza
            if sem_ine:
                det = ", ".join(f"{l['validacao']}{'(' + l['motivo'] + ')' if l['motivo'] else ''}: {l['total']}" for l in sem_ine)
                achados.append(_achado(
                    "REGISTROS_SEM_INE", "A", "possivel", "causa",
                    "A unidade enviou fichas sem identificação de equipe (INE)",
                    f"No CNES {cnes_eq}, o SISAB recebeu fichas sem INE nesta competência ({det}). Produção registrada sem a "
                    "equipe não conta para ela — conferir se é produção desta equipe.",
                    FONTE_SISAB, sis["consultado_em"]))
        else:
            etapas["transmissao"] = {"status": "recebido",
                                     "texto": f"{r['recebidos']} ficha(s) recebida(s) pelo SISAB; {r['recebidos_no_prazo']} dentro do prazo.",
                                     "fonte": sv.FONTE, "consultado_em": sis["consultado_em"]}
            partes = [f"{r['aprovados']} aprovada(s)"]
            if r["reprovados"]:
                partes.append(f"{r['reprovados']} reprovada(s) (" + ", ".join(f"{k}: {v}" for k, v in r["reprovados_por_motivo"].items()) + ")")
            if r["duplicados"]:
                partes.append(f"{r['duplicados']} duplicada(s)")
            if r["data_invalida"]:
                partes.append(f"{r['data_invalida']} com data inválida")
            partes.append(f"{r['aprovados_no_prazo']} aprovada(s) no prazo")
            etapas["processamento"] = {"status": "processado", "texto": "; ".join(partes) + ".", "fonte": sv.FONTE,
                                       "consultado_em": sis["consultado_em"]}
            for motivo, qt in r["reprovados_por_motivo"].items():
                explic = "; ".join(MOTIVO_REPROVACAO[m] for m in MOTIVO_REPROVACAO if m in motivo.upper()) or "motivo informado pelo SISAB"
                toda = r["aprovados"] == 0
                achados.append(_achado(
                    "REJEICAO_VALIDACAO", "C", "confirmada" if toda else "possivel", "causa" if toda else "contexto",
                    f"Fichas reprovadas na validação — Reprovado({motivo})",
                    f"{qt} ficha(s) da equipe reprovada(s): {explic}." + (" Nenhuma ficha foi aprovada." if toda else ""),
                    FONTE_SISAB, sis["consultado_em"], {"codigo": f"Reprovado({motivo})", "descricao": explic}))
            if r["data_invalida"] and r["aprovados"] == 0:
                achados.append(_achado(
                    "DATA_INVALIDA", "A", "confirmada", "causa", "Fichas com data inválida",
                    f"{r['data_invalida']} ficha(s) com data inválida para a competência e nenhuma aprovada.",
                    FONTE_SISAB, sis["consultado_em"], {"codigo": "Data inválida", "descricao": "data do atendimento fora da competência/inválida"}))
            if r["aprovados"] > 0 and r["aprovados_no_prazo"] == 0:
                achados.append(_achado(
                    "ENVIO_FORA_DO_PRAZO", "B", "confirmada", "causa", "Produção aprovada, mas enviada fora do prazo",
                    f"O SISAB aprovou {r['aprovados']} ficha(s) da equipe, mas nenhuma chegou dentro do prazo da competência "
                    "(a lista de ausência considera só produção válida enviada no prazo).",
                    FONTE_SISAB, sis["consultado_em"], {"codigo": "fora do prazo", "descricao": "envio após o prazo da competência"}))
            if r["duplicados"] and r["aprovados"] == 0 and not r["reprovados"]:
                achados.append(_achado(
                    "SO_DUPLICADOS", "B", "confirmada", "causa", "Só fichas duplicadas recebidas",
                    f"As {r['duplicados']} ficha(s) recebidas foram classificadas como duplicadas (não contam como produção nova).",
                    FONTE_SISAB, sis["consultado_em"], {"codigo": "Duplicado", "descricao": "ficha já recebida anteriormente"}))
            if r["aprovados_no_prazo"] > 0 and not remoto:
                achados.append(_achado(
                    "DIVERGENCIA_SISAB_SIAPS", "D", "informativo", "contexto",
                    "SISAB aprovou produção no prazo, mas a equipe consta na lista",
                    f"Há {r['aprovados_no_prazo']} ficha(s) aprovada(s) no prazo no SISAB. A regra de ausência pode exigir produção de "
                    "profissional/tipo específico, ou o processamento do SIAPS divergiu. Confirmar com o retorno detalhado do SIAPS.",
                    FONTE_SISAB, sis["consultado_em"]))
    elif sis["situacao"] == "nao_publicado":
        etapas["transmissao"] = etapas["processamento"] = {
            "status": "pendente_fonte", "texto": sis["mensagem"], "fonte": sv.FONTE, "consultado_em": sis["consultado_em"]}
        achados.append(_achado("PROCESSAMENTO_PENDENTE", "D", "informativo", "contexto",
                               "Relatório de validação da competência ainda não publicado",
                               sis["mensagem"] or "", FONTE_SISAB, sis["consultado_em"]))
        nao_verificado.append("Transmissão e processamento (SISAB) — competência ainda não publicada")
    else:
        texto = ("Fonte indisponível na última consulta: " + (sis["mensagem"] or "")) if sis["situacao"] == "erro" \
            else "Ainda não consultado. Use “Verificar fontes oficiais”."
        etapas["transmissao"] = etapas["processamento"] = {"status": "nao_verificado", "texto": texto, "fonte": sv.FONTE,
                                                           "consultado_em": sis["consultado_em"]}
        nao_verificado.append("Transmissão e processamento (SISAB — relatório de validação)")

    # e-Gestor — validação da equipe na parcela da competência (cadastro e consequência)
    consequencias: list[dict] = []
    estabelecimento = (r["cnes"] if r else []) or ([ctx["cnes_equipe"]] if ctx.get("cnes_equipe") else [])
    if pag["situacao"] == "ok":
        eqs = [e for e in pag["payload"].get("equipes", []) if e["ine"] == ine]
        parcela = pag["payload"].get("parcela", "")
        rot_parc = f"{int(parcela[4:])}ª parcela/{parcela[:4]}" if parcela else "parcela"
        if not eqs:
            cad = {"status": "nao_listada", "texto": f"Equipe não consta na validação do pagamento ({rot_parc}).",
                   "fonte": NOME_FONTE[FONTE_PAGAMENTO], "consultado_em": pag["consultado_em"]}
            if ctx.get("tipo_equipe") in ("eSF", "eAP", "eSB", "eMulti"):
                achados.append(_achado("EQUIPE_FORA_DO_PAGAMENTO", "C", "possivel", "contexto",
                                       "Equipe não listada na validação do pagamento da competência",
                                       f"A equipe não aparece entre as equipes validadas na {rot_parc}. Conferir credenciamento/homologação.",
                                       FONTE_PAGAMENTO, pag["consultado_em"]))
        else:
            e = eqs[0]
            estabelecimento = estabelecimento or ([e["cnes"]] if e.get("cnes") else [])
            pend = [p for e2 in eqs for p in e2["pendencias"]]
            bloqueios = [p for p in pend if p["campo"] in ST_BLOQUEIO_CADASTRAL]
            cad = {"status": "pendencia" if pend else "regular",
                   "texto": (f"{rot_parc}: " + "; ".join(f"{p['rotulo']}: {p['situacao']}" for p in pend)) if pend
                   else f"{rot_parc}: equipe ativa, unidade válida, sem suspensão cadastral.",
                   "fonte": NOME_FONTE[FONTE_PAGAMENTO], "consultado_em": pag["consultado_em"]}
            for p in bloqueios:
                achados.append(_achado("CADASTRO_BLOQUEIO_EGESTOR", "C", "confirmada", "causa", ST_BLOQUEIO_CADASTRAL[p["campo"]],
                                       f"Na validação oficial da {rot_parc}: {p['rotulo']} = {p['situacao']}.",
                                       FONTE_PAGAMENTO, pag["consultado_em"], {"codigo": p["campo"], "descricao": f"{p['rotulo']}: {p['situacao']}"}))
            for p in pend:
                if p["campo"] not in ST_BLOQUEIO_CADASTRAL and p["campo"] != "stSuspensaoProducao" and p["campo"] != "stPagamento":
                    achados.append(_achado("PENDENCIA_CADASTRAL_EGESTOR", "C", "confirmada", "contexto", p["rotulo"],
                                           f"Na validação oficial da {rot_parc}: {p['rotulo']} = {p['situacao']}.",
                                           FONTE_PAGAMENTO, pag["consultado_em"], {"codigo": p["campo"], "descricao": f"{p['rotulo']}: {p['situacao']}"}))
            st_prod = next((e2["situacoes"].get("stSuspensaoProducao") for e2 in eqs if e2["situacoes"].get("stSuspensaoProducao")), None)
            st_pag = e.get("st_pagamento")
            consequencias.append({
                "texto": f"{rot_parc} (competência CNES {comp[5:]}/{comp[:4]}): pagamento “{st_pag or '—'}”; "
                         f"suspensão por falta de produção “{st_prod or 'não informada'}”.",
                "suspenso_por_producao": bool(st_prod and "SUSPENS" in _norm(st_prod) and not _norm(st_prod).startswith("NAO")),
                "fonte": NOME_FONTE[FONTE_PAGAMENTO], "consultado_em": pag["consultado_em"]})
        etapas["cadastro"] = cad
    else:
        etapas["cadastro"] = {"status": "nao_verificado",
                              "texto": pag["mensagem"] or "Validação do pagamento ainda não consultada.",
                              "fonte": NOME_FONTE[FONTE_PAGAMENTO], "consultado_em": pag["consultado_em"]}
        nao_verificado.append("Validação cadastral e consequência financeira (e-Gestor, pagamento da competência)")

    # XML-CNES do mesmo mês (se importado)
    cx = ctx.get("cnes_xml")
    if cx:
        eq = cx.get("equipe")
        quando = cx.get("data_arquivo")
        if eq is None:
            achados.append(_achado("EQUIPE_AUSENTE_CNES_XML", "C", "possivel", "causa", "Equipe não consta no retrato do CNES do mês",
                                   f"O XML-CNES de {quando} não traz o INE {ine}.", "cnes_xml", quando))
        else:
            if eq.get("desativada_em"):
                achados.append(_achado("EQUIPE_DESATIVADA_CNES", "C", "confirmada", "causa", "Equipe desativada no CNES",
                                       f"O XML-CNES de {quando} registra desativação da equipe em {eq['desativada_em']}.", "cnes_xml", quando,
                                       {"codigo": "DT_DESATIVACAO", "descricao": eq["desativada_em"]}))
            for p in cx.get("pendencias") or []:
                achados.append(_achado("COMPOSICAO_CNES", "C", "possivel", "contexto", p["mensagem"],
                                       f"Retrato do CNES de {quando}: {p['mensagem']}. {p['orientacao']}", "cnes_xml", quando))
    else:
        nao_verificado.append("Composição da equipe no CNES na competência (nenhum XML-CNES do mesmo mês importado)")

    # Origem — PEC municipal (nunca acessado diretamente)
    pec = ctx.get("pec") or {}
    agente = (f"agente local com último sinal em {pec['ultimo_sinal']}, mas ele não coleta registros nem lotes de transmissão"
              if pec.get("ultimo_sinal") else "agente local não instalado")
    etapas["origem"] = {"status": "nao_verificado",
                        "texto": f"Não verificável pelo ERSUS360 ({agente}). Conferir no PEC os atendimentos da equipe e os lotes enviados.",
                        "fonte": NOME_FONTE["pec"], "consultado_em": None}
    nao_verificado.append("Registros de produção e lotes de transmissão no e-SUS APS/PEC municipal")

    # classificação
    causas_conf = [a for a in achados if a["classe"] == "confirmada" and a["papel"] == "causa"]
    causas_poss = [a for a in achados if a["classe"] == "possivel" and a["papel"] == "causa"]
    if causas_conf:
        classe = "causa_confirmada"
    elif causas_poss:
        classe = "possivel_causa"
    elif sis["situacao"] == "ok":
        classe = "sem_inconsistencia"
    else:
        classe = "indisponivel"
    principal = (causas_conf or causas_poss or [None])[0]
    causa = principal["titulo"] if principal else (
        "As fontes consultadas não mostram erro que explique a ausência." if classe == "sem_inconsistencia"
        else "Sem evidência consultada suficiente para determinar o motivo.")
    hipoteses = [a["titulo"] for a in causas_poss if a is not principal]
    datas = [d for d in (sis["consultado_em"], pag["consultado_em"], aus.get("coletado_em")) if d]
    orient = []
    vistos = set()
    for a in achados:
        if a["orientacao"] and a["codigo"] not in vistos and (a["classe"] in ("confirmada", "possivel") or a["codigo"] == "DIVERGENCIA_SISAB_SIAPS"):
            vistos.add(a["codigo"])
            orient.append({"codigo": a["codigo"], "classe": a["classe"], "problema": a["titulo"], **a["orientacao"]})
    if classe in ("sem_inconsistencia", "indisponivel") and "DIVERGENCIA_SISAB_SIAPS" not in vistos:
        orient.append({"codigo": "VERIFICAR_ORIGEM", "classe": "verificar", "problema": "Motivo não identificado nas fontes consultadas",
                       **ORIENTACOES["VERIFICAR_ORIGEM"]})
    return {
        "ine": ine, "competencia": comp, "equipe": ctx.get("equipe"), "tipo_equipe": ctx.get("tipo_equipe"),
        "tipologia": ctx.get("tipologia"), "estabelecimento": estabelecimento,
        "situacao_siaps": etapas["siaps"], "etapas": etapas, "achados": achados,
        "classificacao": classe, "classificacao_rotulo": CLASSES[classe], "causa": causa,
        "hipoteses_a_verificar": hipoteses, "consequencias": consequencias,
        "orientacoes": orient, "fontes_nao_verificadas": nao_verificado,
        "ultima_verificacao": max(datas) if datas else None,
    }


# ── 3. Plano de regularização (orientação técnica por achado) ────────────────
REGRA_REENVIO = ("Antes de reenviar ou alterar registros, confirmar no calendário/nota técnica vigente do SIAPS se a "
                 "competência ainda aceita envio e quais correções são permitidas; não alterar produção sem autorização.")

ORIENTACOES: dict[str, dict] = {
    "SEM_RECEBIMENTO_FEDERAL": {
        "impacto": "Sem produção válida a equipe permanece na lista de ausência; a repetição pode levar à suspensão do incentivo da equipe.",
        "sistema": "e-SUS APS/PEC municipal (atendimentos e Transmissão de dados)",
        "procedimento": "1) Conferir no PEC se há atendimentos da equipe na competência com o INE correto; 2) conferir se os lotes "
                        "da unidade foram enviados e aceitos; 3) se houver produção não transmitida, avaliar o envio conforme o prazo vigente.",
        "responsavel": "Coordenação da APS + responsável técnico do PEC/TI da unidade",
        "providencia": "Possível retransmissão — somente após confirmar o prazo da competência.",
    },
    "UNIDADE_TRANSMITIU_OUTRAS_EQUIPES": {
        "impacto": "A falta é específica da equipe: o incentivo dela fica em risco mesmo com a unidade transmitindo.",
        "sistema": "e-SUS APS/PEC (agenda/atendimentos e lotação do profissional) e SCNES",
        "procedimento": "Verificar se os profissionais da equipe atenderam na competência, se registraram os atendimentos "
                        "no PEC selecionando a equipe (INE) correta e se estavam afastados/sem agenda.",
        "responsavel": "Coordenação de Saúde Bucal/APS e gerente da unidade",
        "providencia": "Correção de rotina de registro; retransmissão só se houver produção registrada e não enviada.",
    },
    "UNIDADE_SEM_ENVIO": {
        "impacto": "Toda a produção da unidade fica sem contabilização na competência.",
        "sistema": "e-SUS APS/PEC da unidade (conectividade, sincronização, Transmissão de dados)",
        "procedimento": "Conferir conectividade e configuração de envio do PEC/CDS da unidade e a lista de lotes enviados.",
        "responsavel": "TI municipal / responsável técnico do PEC",
        "providencia": "Possível retransmissão — após confirmar o prazo da competência.",
    },
    "REGISTROS_SEM_INE": {
        "impacto": "Fichas sem INE não contam para nenhuma equipe.",
        "sistema": "e-SUS APS/PEC (lotação do profissional ao registrar)",
        "procedimento": "Orientar os profissionais a registrar com a lotação da equipe; conferir lotações sem equipe no PEC.",
        "responsavel": "Coordenação da APS",
        "providencia": "Correção da rotina de registro.",
    },
    "REJEICAO_VALIDACAO": {
        "impacto": "Fichas reprovadas não são contabilizadas.",
        "sistema": "SCNES (vínculos, CBO, INE, CNES) e e-SUS APS/PEC",
        "procedimento": "Conferir no SCNES o vínculo do profissional com o estabelecimento e a equipe na data do atendimento "
                        "(CNS, CBO, INE, CNES) e corrigir o cadastro; depois conferir se a ficha pode ser reenviada.",
        "responsavel": "Responsável pelo SCNES + coordenação da APS",
        "providencia": "Correção cadastral; retransmissão conforme regras do SISAB/SIAPS.",
    },
    "DATA_INVALIDA": {
        "impacto": "Fichas com data inválida não contam na competência.",
        "sistema": "e-SUS APS/PEC (data do atendimento) e relógio do equipamento",
        "procedimento": "Conferir a data dos atendimentos e a data/hora dos computadores/tablets da unidade.",
        "responsavel": "Gerente da unidade / TI",
        "providencia": "Correção de configuração; reenvio só se permitido.",
    },
    "ENVIO_FORA_DO_PRAZO": {
        "impacto": "Produção enviada após o prazo não afasta a ausência da competência.",
        "sistema": "e-SUS APS/PEC (rotina de transmissão)",
        "procedimento": "Ajustar a rotina para transmitir diariamente e conferir o envio antes do prazo final (aba Processamento e Validação).",
        "responsavel": "Responsável técnico do PEC e gerente da unidade",
        "providencia": "Sem reenvio: corrigir a rotina para as próximas competências.",
    },
    "SO_DUPLICADOS": {
        "impacto": "Duplicadas não contam como produção nova.",
        "sistema": "e-SUS APS/PEC (Transmissão de dados)",
        "procedimento": "Verificar se a produção nova da competência foi de fato transmitida (e não apenas reenvio de lotes antigos).",
        "responsavel": "Responsável técnico do PEC",
        "providencia": "Possível transmissão da produção pendente — após confirmar o prazo.",
    },
    "DIVERGENCIA_SISAB_SIAPS": {
        "impacto": "A equipe pode ser tratada como sem produção mesmo com fichas aprovadas.",
        "sistema": "SIAPS/e-Gestor (área logada) e nota técnica do componente",
        "procedimento": "Comparar a regra de ausência da equipe (profissionais e tipos de produção exigidos) com o que foi aprovado; "
                        "se persistir, registrar questionamento no canal oficial do Ministério da Saúde.",
        "responsavel": "Coordenação da APS / gestão municipal",
        "providencia": "Verificação junto ao Ministério; não reenviar sem orientação.",
    },
    "AUSENCIA_ATENDIMENTO_REMOTO": {
        "impacto": "A eMulti fica sem a produção de atendimento remoto exigida, mesmo com outros atendimentos aprovados.",
        "sistema": "e-SUS APS/PEC (registro de atendimentos remotos/teleatendimento da eMulti)",
        "procedimento": "Conferir se a eMulti realizou e registrou atendimentos remotos na competência, conforme a nota técnica vigente do componente eMulti.",
        "responsavel": "Coordenação da eMulti",
        "providencia": "Organizar e registrar a oferta de atendimento remoto nas próximas competências.",
    },
    "PROFISSIONAL_SEM_PRODUCAO": {
        "impacto": "A falta de produção de um profissional exigido pode manter a equipe na lista.",
        "sistema": "e-SUS APS/PEC (produção do profissional) e SCNES (vínculo)",
        "procedimento": "Conferir se o profissional estava ativo, com agenda e registrando no PEC com a equipe correta.",
        "responsavel": "Gerente da unidade",
        "providencia": "Correção de registro/lotação; retransmissão só se houver produção não enviada.",
    },
    "CADASTRO_BLOQUEIO_EGESTOR": {
        "impacto": "Equipe/unidade inválida não tem produção contabilizada nem repasse.",
        "sistema": "SCNES e credenciamento/homologação no e-Gestor",
        "procedimento": "Regularizar no SCNES a situação apontada e acompanhar a validação na parcela seguinte.",
        "responsavel": "Responsável pelo SCNES + gestão municipal",
        "providencia": "Correção cadastral.",
    },
    "PENDENCIA_CADASTRAL_EGESTOR": {
        "impacto": "Pendência apontada na validação oficial da equipe; pode afetar o repasse.",
        "sistema": "SCNES / e-Gestor",
        "procedimento": "Conferir e regularizar a situação apontada no SCNES.",
        "responsavel": "Responsável pelo SCNES",
        "providencia": "Correção cadastral.",
    },
    "EQUIPE_FORA_DO_PAGAMENTO": {
        "impacto": "Equipe fora da validação do pagamento não recebe incentivo na parcela.",
        "sistema": "e-Gestor (credenciamento/homologação) e SCNES",
        "procedimento": "Conferir a situação de credenciamento/homologação e o cadastro da equipe no SCNES.",
        "responsavel": "Gestão municipal",
        "providencia": "Verificação cadastral.",
    },
    "EQUIPE_AUSENTE_CNES_XML": {
        "impacto": "Equipe fora do CNES do mês não tem produção validada.",
        "sistema": "SCNES",
        "procedimento": "Conferir no SCNES se a equipe estava cadastrada e ativa na competência.",
        "responsavel": "Responsável pelo SCNES",
        "providencia": "Correção cadastral.",
    },
    "EQUIPE_DESATIVADA_CNES": {
        "impacto": "Produção de equipe desativada não é validada.",
        "sistema": "SCNES",
        "procedimento": "Confirmar se a desativação foi intencional; se não, regularizar no SCNES.",
        "responsavel": "Responsável pelo SCNES + gestão municipal",
        "providencia": "Correção cadastral.",
    },
    "COMPOSICAO_CNES": {
        "impacto": "Composição incompleta pode impedir validação e repasse da equipe.",
        "sistema": "SCNES",
        "procedimento": "Regularizar as lotações exigidas da equipe no SCNES.",
        "responsavel": "Responsável pelo SCNES",
        "providencia": "Correção cadastral.",
    },
    "VERIFICAR_ORIGEM": {
        "impacto": "Sem causa identificada, o risco de repetição continua.",
        "sistema": "e-SUS APS/PEC municipal e SIAPS (área logada)",
        "procedimento": "Conferir no PEC os atendimentos e lotes da competência e, no SIAPS, o retorno detalhado da equipe.",
        "responsavel": "Coordenação da APS",
        "providencia": "Investigação manual; registrar o resultado no Acompanhamento.",
    },
}
for _o in ORIENTACOES.values():
    _o["regra"] = REGRA_REENVIO
