"""Router: /api/folha — ERSUS 360 — CNES dados abertos"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter
from services.cnes_service import buscar_estabelecimentos
router = APIRouter(prefix="/api/folha", tags=["Folha de Pagamento"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_NOTA = "Folha individual requer SIAPE/sistema RH municipal (pendente). CNES como proxy de força de trabalho em saúde."
@router.get("/dashboard")
async def dashboard():
    cnes = await buscar_estabelecimentos()
    return {"situacao_dado": cnes.get("situacao_dado"), "total_estabelecimentos": cnes.get("total"), "nota": _NOTA, "fonte": "CNES — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(): return await dashboard()
