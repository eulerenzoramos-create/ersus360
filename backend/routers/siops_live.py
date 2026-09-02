"""
Router: /api/siops-live — ERSUS 360
SIOPS em tempo real — mesmos dados abertos que siops_service.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.siops_service import buscar_apuracao

router = APIRouter(prefix="/api/siops-live", tags=["siops_live"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    result = await buscar_apuracao(ano)
    result["verificado_em"] = _TS()
    return result


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
