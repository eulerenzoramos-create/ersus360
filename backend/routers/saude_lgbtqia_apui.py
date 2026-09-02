"""Router: /api/saude-lgbtqia-apui — ERSUS 360 — SIA+SINAN dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sia_service import buscar_producao
from services.sinan_service import buscar_agravos_resumo
router = APIRouter(prefix="/api/saude-lgbtqia-apui", tags=["saude_lgbtqia_apui"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    sia = await buscar_producao(ano); sinan = await buscar_agravos_resumo(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [sia, *sinan])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "producao": sia.get("total_procedimentos"), "agravos_notificados": sum(d.get("total_casos", 0) or 0 for d in sinan), "fonte": "SIA + SINAN — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
