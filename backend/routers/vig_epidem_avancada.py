"""Router: /api/vig-epidem-avancada — ERSUS 360 — SINAN avançado"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sinan_service import buscar_agravos_resumo, buscar_malaria, buscar_dengue, buscar_tuberculose, buscar_hanseniase
router = APIRouter(prefix="/api/vig-epidem-avancada", tags=["vig_epidem_avancada"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    mal = await buscar_malaria(ano); den = await buscar_dengue(ano)
    tb = await buscar_tuberculose(ano); hans = await buscar_hanseniase(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [mal, den, tb, hans])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "malaria": mal, "dengue": den, "tuberculose": tb, "hanseniase": hans, "fonte": "SINAN — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
