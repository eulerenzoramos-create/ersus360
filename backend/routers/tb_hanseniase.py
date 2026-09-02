"""Router: /api/tb-hanseniase — ERSUS 360 — SINAN dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sinan_service import buscar_tuberculose, buscar_hanseniase
router = APIRouter(prefix="/api/tb-hanseniase", tags=["tb_hanseniase"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    tb = await buscar_tuberculose(ano); hans = await buscar_hanseniase(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [tb, hans])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "casos_tuberculose": tb.get("total_casos"), "casos_hanseniase": hans.get("total_casos"), "fonte": "SINAN — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
