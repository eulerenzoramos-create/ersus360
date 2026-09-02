"""Router: /api/cancer-rastreio — ERSUS 360 — SINAN+SIA dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sinan_service import buscar_agravos_resumo
from services.sia_service import buscar_producao
router = APIRouter(prefix="/api/cancer-rastreio", tags=["cancer_rastreio"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    sinan = await buscar_agravos_resumo(ano); sia = await buscar_producao(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [*sinan, sia])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "agravos_notificados": sum(d.get("total_casos", 0) or 0 for d in sinan), "producao_oncologia": sia.get("total_procedimentos"), "fonte": "SINAN + SIA — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
