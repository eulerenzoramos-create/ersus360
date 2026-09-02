"""Router: /api/cronograma-repasses — ERSUS 360 — SIOPS dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.siops_service import buscar_apuracao, buscar_historico
router = APIRouter(prefix="/api/cronograma-repasses", tags=["cronograma-repasses"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
_NOTA = "Cronograma FNS detalhado requer e-Gestor FNS (pendente). SIOPS como proxy de transferências."
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    siops = await buscar_apuracao(ano)
    return {"situacao_dado": siops.get("situacao_dado"), "ano": ano, "financeiro": siops, "nota": _NOTA, "fonte": "SIOPS — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
@router.get("/historico")
async def historico():
    hist = await buscar_historico()
    return {"situacao_dado": hist.get("situacao_dado"), "historico": hist, "nota": _NOTA, "verificado_em": _TS()}
