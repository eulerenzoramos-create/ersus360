"""Router: /api/matriciamento-nasf-apui — ERSUS 360 — SIA dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sia_service import buscar_producao
router = APIRouter(prefix="/api/matriciamento-nasf-apui", tags=["matriciamento_nasf_apui"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
_NOTA = "Dados de matriciamento requerem e-SUS PEC (pendente)."
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    sia = await buscar_producao(ano)
    return {"situacao_dado": sia.get("situacao_dado"), "ano": ano, "producao": sia.get("total_procedimentos"), "nota": _NOTA, "fonte": "SIA — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
