"""Router: /api/rdqa — ERSUS 360 — fns_api_service dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.fns_api_service import buscar_indicadores_previne
router = APIRouter(prefix="/api/rdqa", tags=["RDQA"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    fns = await buscar_indicadores_previne(ano)
    return {"situacao_dado": fns.get("situacao_dado"), "ano": ano, "indicadores": fns.get("indicadores"), "fonte": "e-Gestor APS — dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
