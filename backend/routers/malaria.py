"""
Router: /api/malaria — ERSUS 360 (genérico)
Malária via SIVEP-Malária/SINAN — DATASUS dados abertos.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sinan_service import buscar_malaria

router = APIRouter(prefix="/api/malaria", tags=["malaria"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    result = await buscar_malaria(ano)
    result["verificado_em"] = _TS()
    return result


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
