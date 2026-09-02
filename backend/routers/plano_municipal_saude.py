"""Router: /api/plano-municipal-saude — ERSUS 360 — SIOPS+e-Gestor dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.siops_service import buscar_apuracao
from services.fns_api_service import buscar_indicadores_previne
router = APIRouter(prefix="/api/plano-municipal-saude", tags=["plano_municipal_saude"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
_NOTA = "PMS quadrienal requer módulo de planejamento (pendente). SIOPS+e-Gestor como linha de base."
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    siops = await buscar_apuracao(ano); previne = await buscar_indicadores_previne(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [siops, previne])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "financeiro": siops, "indicadores_previne": previne, "nota": _NOTA, "fonte": "SIOPS + e-Gestor APS — dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
