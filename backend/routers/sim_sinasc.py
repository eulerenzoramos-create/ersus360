"""Router: /api/sim-sinasc — ERSUS 360 — SIM+SINASC dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sim_sinasc_service import buscar_obitos, buscar_nascidos_vivos
router = APIRouter(prefix="/api/sim-sinasc", tags=["SIM / SINASC"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    obitos = await buscar_obitos(ano); sinasc = await buscar_nascidos_vivos(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [obitos, sinasc])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "total_obitos": obitos.get("total_obitos"), "nascidos_vivos": sinasc.get("total_nascidos"), "fonte": "SIM + SINASC — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
