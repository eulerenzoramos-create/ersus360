"""
Router: /api/prenatal-risco-gestacional-apui — ERSUS 360
Pré-natal via SINASC (nascimentos) + SIH (internações obstétricas) — DATASUS.
Acompanhamento pré-natal detalhado requer e-SUS PEC (pendente). Sem dados fictícios.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sim_sinasc_service import buscar_nascidos_vivos, buscar_obitos
from services.sih_service import buscar_internacoes
from services.cache_service import cache_get

router = APIRouter(prefix="/api/prenatal-risco-gestacional-apui", tags=["prenatal_risco_gestacional_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_PEC = "Número de consultas pré-natal, risco gestacional e acompanhamento individual requerem e-SUS PEC (pendente)."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    nasc = await buscar_nascidos_vivos(ano)
    sih  = await buscar_internacoes(ano)
    return {
        "situacao_dado": nasc.get("situacao_dado"),
        "ano": ano,
        "nascidos_vivos": nasc.get("total_nascidos"),
        "internacoes_obstetricas_estimadas": sih.get("total_internacoes"),
        "nota_pec": _PEC,
        "fonte": "SINASC + SIH — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/nascimentos")
async def nascimentos(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    result = await buscar_nascidos_vivos(ano)
    result["verificado_em"] = _TS()
    return result


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)


@router.get("/consultas-prenatal")
async def consultas_prenatal():
    return {"situacao_dado": "nao_disponivel", "nota": _PEC, "verificado_em": _TS()}


@router.get("/risco-gestacional")
async def risco_gestacional():
    return {"situacao_dado": "nao_disponivel", "nota": _PEC, "verificado_em": _TS()}


@router.get("/acoes")
async def acoes():
    return {"situacao_dado": "nao_disponivel", "nota": _PEC, "verificado_em": _TS()}
