"""Router: /api/mapa-sanitario — ERSUS 360 — CNES dados abertos"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter
from services.cnes_service import buscar_estabelecimentos
router = APIRouter(prefix="/api/mapa-sanitario", tags=["mapa-sanitario"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
@router.get("/dashboard")
async def dashboard():
    cnes = await buscar_estabelecimentos()
    return {"situacao_dado": cnes.get("situacao_dado"), "total_estabelecimentos": cnes.get("total"), "fonte": "CNES — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(): return await dashboard()
