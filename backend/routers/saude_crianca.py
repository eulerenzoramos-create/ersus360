"""Router: /api/saude-crianca — ERSUS 360 — SINASC+SIA+fns_api_service dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sim_sinasc_service import buscar_nascidos_vivos
from services.sia_service import buscar_producao
from services.fns_api_service import buscar_indicadores_previne
router = APIRouter(prefix="/api/saude-crianca", tags=["Saúde da Criança"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    sinasc = await buscar_nascidos_vivos(ano); sia = await buscar_producao(ano); fns = await buscar_indicadores_previne(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [sinasc, sia, fns])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "nascidos_vivos": sinasc.get("total_nascidos"), "producao_infantil": sia.get("total_procedimentos"), "indicadores_previne": fns.get("indicadores"), "fonte": "SINASC + SIA + e-Gestor APS — dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
