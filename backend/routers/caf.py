"""Router: /api/caf — ERSUS 360 — fns_api_service+SIOPS dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.fns_api_service import buscar_indicadores_previne
from services.siops_service import buscar_apuracao
router = APIRouter(prefix="/api/caf", tags=["CAF"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    fns = await buscar_indicadores_previne(ano); siops = await buscar_apuracao(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [fns, siops])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "indicadores_previne": fns.get("indicadores"), "despesa_saude": siops.get("despesa_total_saude"), "fonte": "e-Gestor APS + SIOPS — dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
