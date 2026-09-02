"""Router: /api/arboviroses — ERSUS 360 — SINAN dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sinan_service import buscar_dengue, buscar_malaria
router = APIRouter(prefix="/api/arboviroses", tags=["arboviroses"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    dengue = await buscar_dengue(ano); malaria = await buscar_malaria(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [dengue, malaria])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "casos_dengue": dengue.get("total_casos"), "casos_malaria": malaria.get("total_casos"), "fonte": "SINAN — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
