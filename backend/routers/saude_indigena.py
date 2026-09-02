"""Router: /api/saude-indigena — ERSUS 360 (genérico) — CNES+SIA dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.cnes_service import buscar_estabelecimentos
from services.sia_service import buscar_producao
router = APIRouter(prefix="/api/saude-indigena", tags=["saude_indigena"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    cnes = await buscar_estabelecimentos(); sia = await buscar_producao(ano)
    return {"situacao_dado": cnes.get("situacao_dado"), "ano": ano, "estabelecimentos": cnes.get("total"), "producao": sia.get("total_procedimentos"), "nota": "SIASI/SESAI requer convênio DSEI (pendente).", "fonte": "CNES + SIA — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
