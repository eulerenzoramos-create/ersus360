"""Router: /api/siconfi — ERSUS 360 — SIOPS dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.siops_service import buscar_apuracao
router = APIRouter(prefix="/api/siconfi", tags=["SICONFI"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
_NOTA = "SICONFI requer acesso STN (pendente). SIOPS como proxy de execução financeira pública."
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    siops = await buscar_apuracao(ano)
    return {"situacao_dado": siops.get("situacao_dado"), "ano": ano, "despesa_total_saude": siops.get("despesa_total_saude"), "percentual_saude_receita": siops.get("percentual_saude_receita"), "nota": _NOTA, "fonte": "SIOPS — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
