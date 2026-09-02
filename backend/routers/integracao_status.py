"""Router: /api/integracao — ERSUS 360 — CNES dados abertos"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter
from services.cnes_service import buscar_estabelecimentos
router = APIRouter(prefix="/api/integracao", tags=["Integrações"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_NOTA = "Status de integração e-SUS PEC/RNDS requer acesso autenticado (pendente). CNES como proxy de infraestrutura."
@router.get("/dashboard")
async def dashboard():
    cnes = await buscar_estabelecimentos()
    return {"situacao_dado": cnes.get("situacao_dado"), "total_estabelecimentos": cnes.get("total"), "nota": _NOTA, "fonte": "CNES — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/status")
async def status(): return await dashboard()
@router.get("/indicadores")
async def indicadores(): return await dashboard()
