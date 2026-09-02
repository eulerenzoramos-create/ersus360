"""Router: /api/infraestrutura-ubs-apui — ERSUS 360 — CNES dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.cnes_service import buscar_estabelecimentos
router = APIRouter(prefix="/api/infraestrutura-ubs-apui", tags=["infraestrutura_ubs_apui"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
@router.get("/dashboard")
async def dashboard():
    cnes = await buscar_estabelecimentos()
    return {"situacao_dado": cnes.get("situacao_dado"), "total_estabelecimentos": cnes.get("total"), "nota": "Detalhes de infraestrutura física (leitos, equipamentos) pendentes de SCNES avançado.", "fonte": "CNES — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(): return await dashboard()
@router.get("/estabelecimentos")
async def estabelecimentos():
    cnes = await buscar_estabelecimentos()
    return {"situacao_dado": cnes.get("situacao_dado"), "dados": cnes, "verificado_em": _TS()}
