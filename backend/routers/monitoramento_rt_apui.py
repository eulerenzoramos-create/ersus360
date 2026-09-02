"""Router: /api/monitoramento-rt — ERSUS 360 — SINAN dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sinan_service import buscar_agravos_resumo, buscar_malaria, buscar_dengue
router = APIRouter(prefix="/api/monitoramento-rt", tags=["monitoramento_rt"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    ag = await buscar_agravos_resumo(ano); mal = await buscar_malaria(ano); den = await buscar_dengue(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [ag, mal, den])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "agravos": ag, "malaria": mal, "dengue": den, "nota": "Número de reprodução efetivo (Rt) requer modelagem epidemiológica (pendente).", "fonte": "SINAN — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
@router.get("/rt-estimativa")
async def rt_estimativa(ano: int = Query(0)): return await dashboard(ano=ano)
