"""
Router: /api/tabagismo-dpoc-apui — ERSUS 360
Tabagismo/DPOC via SIH (internações) + SIM — DATASUS dados abertos.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sih_service import buscar_internacoes
from services.sim_sinasc_service import buscar_obitos

router = APIRouter(prefix="/api/tabagismo-dpoc-apui", tags=["tabagismo_dpoc_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "Filtro por CID J40-J47 (DPOC) e prevalência de tabagismo requerem VIGITEL/e-SUS PEC (pendente)."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    sih    = await buscar_internacoes(ano)
    obitos = await buscar_obitos(ano)
    return {
        "situacao_dado": sih.get("situacao_dado"),
        "ano": ano,
        "internacoes_totais": sih.get("total_internacoes"),
        "obitos_totais": obitos.get("total_obitos"),
        "nota": _NOTA,
        "fonte": "SIH + SIM — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
