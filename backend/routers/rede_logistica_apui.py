"""Router: /api/rede-logistica-apui — ERSUS 360 — CNES dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.cnes_service import buscar_estabelecimentos
router = APIRouter(prefix="/api/rede-logistica-apui", tags=["rede_logistica_apui"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_NOTA = "Logística de insumos/medicamentos individual requer BNAFAR/HORUS (pendente). CNES como proxy de pontos de acesso."
@router.get("/dashboard")
async def dashboard():
    cnes = await buscar_estabelecimentos()
    return {"situacao_dado": cnes.get("situacao_dado"), "total_estabelecimentos": cnes.get("total"), "nota": _NOTA, "fonte": "CNES — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(): return await dashboard()
