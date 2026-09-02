"""Router: /api/urgencia-emergencia-apui2 — ERSUS 360 (alias) — SIH dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sih_service import buscar_internacoes
router = APIRouter(prefix="/api/urgencia-emergencia-apui2", tags=["urgencia_emergencia_apui2"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    sih = await buscar_internacoes(ano)
    return {"situacao_dado": sih.get("situacao_dado"), "ano": ano, "internacoes": sih.get("total_internacoes"), "taxa_100k": sih.get("taxa_internacao_100k"), "fonte": "SIH — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
