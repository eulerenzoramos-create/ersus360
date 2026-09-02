"""
Router: /api/dcnt — ERSUS 360 (genérico)
DCNT via SIH (internações) + SIM (óbitos) — DATASUS dados abertos.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sih_service import buscar_internacoes
from services.sim_sinasc_service import buscar_obitos

router = APIRouter(prefix="/api/dcnt", tags=["dcnt"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1


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
        "nota": "Estratificação por CID (I/E/J/K para DCNT) requer filtro adicional no SIH/SIM (pendente).",
        "fonte": "SIH + SIM — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
