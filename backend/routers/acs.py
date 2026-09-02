"""Router: /api/acs — ERSUS 360 — e-Gestor APS + CNES dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.fns_api_service import buscar_indicadores_previne
from services.cnes_service import buscar_estabelecimentos
router = APIRouter(prefix="/api/acs", tags=["ACS"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    previne = await buscar_indicadores_previne(ano); cnes = await buscar_estabelecimentos()
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [previne, cnes])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "indicadores_previne": previne, "estabelecimentos": cnes.get("total"), "nota": "Dados ACS individuais requerem e-SUS PEC (pendente).", "fonte": "e-Gestor APS + CNES — dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
@router.get("/producao")
async def producao(ano: int = Query(0)):
    if not ano: ano = _ANO()
    previne = await buscar_indicadores_previne(ano)
    return {"situacao_dado": previne.get("situacao_dado"), "ano": ano, "indicadores": previne, "verificado_em": _TS()}
