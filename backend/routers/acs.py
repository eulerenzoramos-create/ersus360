"""Router: /api/acs — ERSUS 360 — Painel ACS.

Fonte ÚNICA: lote agregado enviado pelo PEC_SYNC_AGENT (agente local somente leitura no
servidor do e-SUS PEC do município) — ver routers/pec_agente.py e services/pec_acs.py.

Sem lote recebido, as rotas respondem "aguardando_integracao_pec" com valores vazios
(None/[]): o painel NÃO exibe números de referência nem nomes ilustrativos como se fossem
dados reais. (A versão anterior trazia 65 ACS e indicadores fixos no código — removidos.)
"""
from __future__ import annotations

import calendar
import logging
from datetime import date, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from routers.pec_agente import lote_mais_recente, situacao_agente
from services import pec_acs
from tenancy.escopo import SessaoMunicipal

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/acs", tags=["ACS"])
DbDep = Annotated[AsyncSession, Depends(get_db)]

_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")  # noqa: E731

AGUARDANDO = "aguardando_integracao_pec"
NOTA_AGUARDANDO = ("Aguardando os dados do e-SUS PEC pelo agente local (PEC_SYNC_AGENT). "
                   "Nenhum número é exibido antes disso — veja a aba Capturar PEC.")


def _fonte(lote) -> dict:
    return {
        "fonte": "esus_pec",
        "situacao_dado": "oficial_pec_agregado",
        "competencia": lote.competencia,
        "periodo": {"inicio": lote.periodo_inicio, "fim": lote.periodo_fim},
        "lido_no_pec_em": lote.gerado_em.isoformat() + "Z" if lote.gerado_em else None,
        "recebido_em": lote.recebido_em.isoformat() + "Z" if lote.recebido_em else None,
        "criterios": (lote.payload or {}).get("criterios") or {},
    }


def _vazio(**extra) -> dict:
    return {"fonte": AGUARDANDO, "situacao_dado": AGUARDANDO, "nota": NOTA_AGUARDANDO,
            "verificado_em": _TS(), **extra}


def _janela(periodo: str, competencia: str, data: str, ano: str) -> tuple[str | None, str | None, str]:
    """Período pedido pela tela → (início, fim, rótulo). Mensal = competência AAAA-MM."""
    if periodo == "diario" and data:
        return data, data, data
    if periodo == "anual" and ano:
        return f"{ano}-01-01", f"{ano}-12-31", ano
    if competencia and len(competencia) == 7:
        a, m = int(competencia[:4]), int(competencia[5:])
        return f"{competencia}-01", f"{competencia}-{calendar.monthrange(a, m)[1]:02d}", competencia
    return None, None, "período do último lote"


async def _lote(db, current, competencia: str = ""):
    comp = competencia if competencia and len(competencia) == 7 else None
    return await lote_mais_recente(db, current.municipio_id, comp) or (
        await lote_mais_recente(db, current.municipio_id) if comp else None)


# ── Painel ────────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def dashboard(current: SessaoMunicipal, db: DbDep, ano: int = Query(0), esf: str = Query(""),
                    competencia: str = Query("")):
    lote = await _lote(db, current, competencia)
    if not lote:
        return _vazio(kpis=None, acs_destaques=[], acs_criticos=[], distribuicao_status={},
                      distribuicao_esf={}, producao_esus=None,
                      mes_referencia={"label": "—"})
    p = lote.payload
    ine = next((e["ine"] for e in p.get("equipes") or [] if esf and (e.get("nome") == esf or e["ine"] == esf)), None)
    lista = pec_acs.lista_acs(p, ine)
    por_esf: dict[str, int] = {}
    for a in lista:
        if a["ativo"]:
            por_esf[a["equipe"]] = por_esf.get(a["equipe"], 0) + 1
    com_pct = [a for a in lista if a["ativo"] and a["pct_visitas"] is not None]
    return {
        **_fonte(lote),
        "mes_referencia": {"label": lote.competencia},
        "kpis": pec_acs.kpis(p, ine),
        "acs_destaques": sorted(com_pct, key=lambda x: -x["pct_visitas"])[:5],
        "acs_criticos": sorted(com_pct, key=lambda x: x["pct_visitas"])[:5],
        "distribuicao_status": {"ativo": sum(1 for a in lista if a["ativo"]),
                                "inativo": sum(1 for a in lista if not a["ativo"])},
        "distribuicao_esf": por_esf,
        "producao_esus": None,
        "verificado_em": _TS(),
    }


@router.get("/indicadores")
async def indicadores(current: SessaoMunicipal, db: DbDep, ano: int = Query(0)):
    return await dashboard(current, db, ano=ano, esf="", competencia="")


@router.get("/producao")
async def producao(current: SessaoMunicipal, db: DbDep, ano: int = Query(0)):
    lote = await _lote(db, current)
    if not lote:
        return _vazio(ano=ano or date.today().year, indicadores=None)
    return {**_fonte(lote), "ano": ano or date.today().year, "indicadores": pec_acs.kpis(lote.payload),
            "verificado_em": _TS()}


@router.get("/lista")
async def lista_acs(current: SessaoMunicipal, db: DbDep, esf: str = Query("")):
    lote = await _lote(db, current)
    if not lote:
        return _vazio(acs=[], total=0)
    p = lote.payload
    ine = next((e["ine"] for e in p.get("equipes") or [] if esf and (e.get("nome") == esf or e["ine"] == esf)), None)
    acs = pec_acs.lista_acs(p, ine)
    return {**_fonte(lote), "acs": acs, "total": len(acs), "verificado_em": _TS()}


@router.get("/microareas")
async def microareas(current: SessaoMunicipal, db: DbDep):
    lote = await _lote(db, current)
    if not lote:
        return _vazio(microareas=[], total=0)
    m = pec_acs.microareas(lote.payload)
    return {**_fonte(lote), "microareas": m, "total": len(m), "verificado_em": _TS()}


# ── Abas e-SUS PEC (mesmo lote) ───────────────────────────────────────────────

@router.get("/esus/status")
async def esus_status(current: SessaoMunicipal, db: DbDep):
    s = await situacao_agente(db, current.municipio_id)
    ok = s["estado"] in ("atualizado", "desatualizado", "conectado")
    return {"conectado": ok, "autenticado": ok, "url": "", "versao": s.get("pec_versao"),
            "instancia": "agente local (somente leitura)" if ok else None, "municipio": current.municipio,
            "agente": s}


@router.get("/esus/visitas")
async def esus_visitas(current: SessaoMunicipal, db: DbDep, periodo: str = Query("mensal"),
                       competencia: str = Query(""), data: str = Query(""), ano: str = Query("")):
    ini, fim, rotulo = _janela(periodo, competencia, data, ano)
    lote = await _lote(db, current, competencia if periodo == "mensal" else "")
    if not lote:
        return {"dados": None, **_vazio()}
    return {"dados": pec_acs.visitas_periodo(lote.payload, ini, fim, rotulo), **_fonte(lote)}


@router.get("/esus/calendario-visitas")
async def esus_calendario(current: SessaoMunicipal, db: DbDep, competencia: str = Query("")):
    lote = await _lote(db, current, competencia)
    if not lote:
        return _vazio(dados=[])
    v = pec_acs.visitas_periodo(lote.payload, None, None, lote.competencia)
    # Só visitas REGISTRADAS no PEC; planejamento do ERSUS360 é outra camada (nunca gravada no PEC)
    return {**_fonte(lote), "dados": [{"data": d["data"], "realizadas": d["realizadas"], "tipo": "registrada_pec"}
                                      for d in v["por_dia"]], "verificado_em": _TS()}


@router.get("/esus/cadastros-individuais")
async def esus_cadastros_individuais(current: SessaoMunicipal, db: DbDep,
                                     pagina: int = Query(1), tamanho: int = Query(50)):
    lote = await _lote(db, current)
    nota = ("Por minimização de dados (LGPD), o ERSUS360 recebe do PEC só contagens por equipe e "
            "microárea — a ficha individual de cada cidadão continua no PEC.")
    if not lote:
        return _vazio(dados=[], total=None, pagina=pagina, tamanho=tamanho)
    k = pec_acs.kpis(lote.payload)
    total = (lote.payload.get("totais") or {}).get("cadastros_individuais") or k["individuos_cadastrados"]
    return {**_fonte(lote), "dados": [], "total": total, "pagina": pagina, "tamanho": tamanho,
            "por_microarea": [{"microarea": m["codigo"], "equipe": m["equipe"], "individuos": m["individuos"]}
                              for m in pec_acs.microareas(lote.payload)],
            "nota": nota, "verificado_em": _TS()}


@router.get("/esus/cadastros-domiciliares")
async def esus_cadastros_domiciliares(current: SessaoMunicipal, db: DbDep,
                                      pagina: int = Query(1), tamanho: int = Query(50)):
    lote = await _lote(db, current)
    if not lote:
        return _vazio(dados=[], total=None, pagina=pagina, tamanho=tamanho)
    k = pec_acs.kpis(lote.payload)
    tot = lote.payload.get("totais") or {}
    return {**_fonte(lote), "dados": [], "total": tot.get("cadastros_domiciliares") or k["domicilios_cadastrados"],
            "familias": tot.get("familias") or k["familias_cadastradas"],
            "por_microarea": [{"microarea": m["codigo"], "equipe": m["equipe"], "domicilios": m["domicilios"],
                               "familias": m["familias_cadastradas"], "pct_familias_visitadas": m["pct_visitas"]}
                              for m in pec_acs.microareas(lote.payload)],
            "pagina": pagina, "tamanho": tamanho, "verificado_em": _TS()}


@router.get("/esus/acs")
async def esus_acs(current: SessaoMunicipal, db: DbDep):
    lote = await _lote(db, current)
    if not lote:
        return _vazio(dados=[], total=0)
    acs = pec_acs.lista_acs(lote.payload)
    return {**_fonte(lote), "dados": acs, "total": len(acs), "verificado_em": _TS()}


@router.get("/esus/territorios")
async def esus_territorios(current: SessaoMunicipal, db: DbDep):
    lote = await _lote(db, current)
    if not lote:
        return _vazio(dados=[], total=0)
    m = pec_acs.microareas(lote.payload)
    return {**_fonte(lote), "dados": m, "total": len(m), "verificado_em": _TS()}


@router.get("/esus/tempo-real")
async def esus_tempo_real(current: SessaoMunicipal, db: DbDep):
    # Não há atualização contínua: o agente consulta o PEC periodicamente. A tela mostra
    # "Atualização automática" com a periodicidade — nunca "tempo real".
    s = await situacao_agente(db, current.municipio_id)
    lote = await _lote(db, current)
    if not lote:
        return {"dados": None, "agente": s, **_vazio()}
    return {**_fonte(lote), "agente": s,
            "dados": {"online": s["estado"] == "atualizado", "kpis_mes": pec_acs.kpis(lote.payload),
                      "ts_verificacao": s["ultimo_contato"], "modo": s["modo"]},
            "verificado_em": _TS()}


class SnapshotIn(BaseModel):
    dados: dict


@router.post("/esus/snapshot", status_code=410)
async def receber_snapshot(body: SnapshotIn):
    """Captura por bookmarklet desativada: o PEC é lido só pelo agente local autorizado."""
    return {"ok": False, "detail": "Captura pela tela desativada. Use o agente local (aba Capturar PEC)."}
