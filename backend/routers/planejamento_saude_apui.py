"""Router: /api/planejamento-saude-apui — ERSUS 360 — SIOPS+e-Gestor dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.siops_service import buscar_apuracao, buscar_historico
from services.fns_api_service import buscar_indicadores_previne
router = APIRouter(prefix="/api/planejamento-saude-apui", tags=["planejamento_saude_apui"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
_NOTA = "PMS/PAS municipal requer módulo de planejamento local (pendente). SIOPS+e-Gestor como linha de base."
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    siops = await buscar_apuracao(ano); previne = await buscar_indicadores_previne(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [siops, previne])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "financeiro": siops, "indicadores_previne": previne, "nota": _NOTA, "fonte": "SIOPS + e-Gestor APS — dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
@router.get("/historico")
async def historico():
    hist = await buscar_historico()
    return {"situacao_dado": hist.get("situacao_dado"), "historico": hist, "nota": _NOTA, "verificado_em": _TS()}
