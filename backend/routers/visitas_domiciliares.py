"""Router: /api/visitas-domiciliares — ERSUS 360 — e-Gestor APS dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.fns_api_service import buscar_indicadores_previne
from services.sia_service import buscar_producao_aps
router = APIRouter(prefix="/api/visitas-domiciliares", tags=["Visitas Domiciliares"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
_NOTA = "Contagem individual de visitas requer e-SUS PEC (pendente). Indicadores Previne como proxy de cobertura ACS."
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    previne = await buscar_indicadores_previne(ano); sia = await buscar_producao_aps(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [previne, sia])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "indicadores_previne": previne, "producao_aps": sia, "nota": _NOTA, "fonte": "e-Gestor APS + SIA — dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
@router.get("/resumo")
async def resumo(ano: int = Query(0)): return await dashboard(ano=ano)
