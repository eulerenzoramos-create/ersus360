"""Router: /api/planejamento — ERSUS 360 — SIOPS+fns_api_service dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.siops_service import buscar_apuracao, buscar_historico
from services.fns_api_service import buscar_indicadores_previne
router = APIRouter(prefix="/api/planejamento", tags=["Planejamento"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    siops = await buscar_apuracao(ano); hist = await buscar_historico(); fns = await buscar_indicadores_previne(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [siops, fns])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "despesa_saude": siops.get("despesa_total_saude"), "indicadores_previne": fns.get("indicadores"), "historico": hist, "fonte": "SIOPS + e-Gestor APS — dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
