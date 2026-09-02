"""Router: /api/triagem-neonatal — ERSUS 360 (genérico) — SINASC dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sim_sinasc_service import buscar_nascidos_vivos
router = APIRouter(prefix="/api/triagem-neonatal", tags=["triagem_neonatal"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
_NOTA = "Cobertura individual Teste do Pezinho requer e-SUS PEC (pendente)."
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    nasc = await buscar_nascidos_vivos(ano)
    return {"situacao_dado": nasc.get("situacao_dado"), "ano": ano, "nascidos_vivos": nasc.get("total_nascidos"), "nota": _NOTA, "fonte": "SINASC — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
