"""Router: /api/aps — ERSUS 360 — fns_api_service + SIA dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.fns_api_service import buscar_indicadores_previne
from services.sia_service import buscar_producao_aps
router = APIRouter(prefix="/api/aps", tags=["APS"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    fns = await buscar_indicadores_previne(ano); sia = await buscar_producao_aps(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [fns, sia])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "indicadores_previne": fns.get("indicadores"), "producao_aps": sia.get("total_procedimentos"), "fonte": "e-Gestor APS + SIA — dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
@router.get("/cobertura")
async def cobertura(ano: int = Query(0)): return await dashboard(ano=ano)
