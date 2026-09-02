"""Router: /api/epidemiologia — ERSUS 360 — SINAN dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sinan_service import buscar_agravos_resumo, buscar_malaria, buscar_dengue
router = APIRouter(prefix="/api/epidemiologia", tags=["Epidemiologia"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    agravos = await buscar_agravos_resumo(ano); malaria = await buscar_malaria(ano); dengue = await buscar_dengue(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [*agravos, malaria, dengue])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "total_agravos": sum(d.get("total_casos", 0) or 0 for d in agravos), "casos_malaria": malaria.get("total_casos"), "casos_dengue": dengue.get("total_casos"), "fonte": "SINAN — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
