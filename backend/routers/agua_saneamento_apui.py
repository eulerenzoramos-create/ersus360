"""Router: /api/agua-saneamento-apui — ERSUS 360 — SINAN dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sinan_service import buscar_agravos_resumo
router = APIRouter(prefix="/api/agua-saneamento-apui", tags=["agua_saneamento_apui"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
_NOTA = "SISÁGUA/SNIS pendentes. SINAN como proxy de agravos associados ao saneamento inadequado."
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    sinan = await buscar_agravos_resumo(ano)
    return {"situacao_dado": ("oficial_validado" if any(d.get("situacao_dado") == "oficial_validado" for d in sinan) else "nao_disponivel"), "ano": ano, "agravos": sinan, "nota": _NOTA, "fonte": "SINAN — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
