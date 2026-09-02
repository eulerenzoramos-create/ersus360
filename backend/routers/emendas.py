"""Router: /api/emendas — ERSUS 360 — SIOPS dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.siops_service import buscar_apuracao, buscar_historico
router = APIRouter(prefix="/api/emendas", tags=["Emendas"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
_NOTA = "Detalhamento por emenda requer InvestSUS/DigiSUS (pendente). SIOPS como proxy de execução financeira."
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    siops = await buscar_apuracao(ano); hist = await buscar_historico()
    return {"situacao_dado": siops.get("situacao_dado"), "ano": ano, "despesa_total_saude": siops.get("despesa_total_saude"), "historico": hist, "nota": _NOTA, "fonte": "SIOPS — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
