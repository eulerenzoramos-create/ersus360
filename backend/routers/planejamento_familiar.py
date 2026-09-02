"""Router: /api/planejamento-familiar — ERSUS 360 — SINASC+SIA dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sim_sinasc_service import buscar_nascidos_vivos
from services.sia_service import buscar_producao
router = APIRouter(prefix="/api/planejamento-familiar", tags=["planejamento_familiar"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    sinasc = await buscar_nascidos_vivos(ano); sia = await buscar_producao(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [sinasc, sia])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "nascidos_vivos": sinasc.get("total_nascidos"), "producao": sia.get("total_procedimentos"), "fonte": "SINASC + SIA — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
