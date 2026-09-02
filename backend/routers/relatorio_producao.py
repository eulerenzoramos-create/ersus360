"""Router: /api/relatorios — ERSUS 360 — SIA+SIH dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sia_service import buscar_producao
from services.sih_service import buscar_internacoes
router = APIRouter(prefix="/api/relatorios", tags=["relatorios"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    sia = await buscar_producao(ano); sih = await buscar_internacoes(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [sia, sih])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "producao_ambulatorial": sia.get("total_procedimentos"), "internacoes": sih.get("total_internacoes"), "fonte": "SIA + SIH — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
@router.get("/producao")
async def producao(ano: int = Query(0)):
    if not ano: ano = _ANO()
    sia = await buscar_producao(ano)
    return {"situacao_dado": sia.get("situacao_dado"), "ano": ano, "total_procedimentos": sia.get("total_procedimentos"), "verificado_em": _TS()}
