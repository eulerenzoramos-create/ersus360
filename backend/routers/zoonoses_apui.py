"""
Router: /api/zoonoses-apui — ERSUS 360
Zoonoses via SINAN — DATASUS dados abertos.
(Raiva, leptospirose, febre amarela — Amazônia)
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sinan_service import buscar_agravos_resumo

router = APIRouter(prefix="/api/zoonoses-apui", tags=["zoonoses_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "Dados específicos de raiva/leptospirose requerem endpoint SINAN /zoonoses (pendente disponibilização API pública)."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    agravos = await buscar_agravos_resumo(ano)
    return {
        "situacao_dado": agravos.get("situacao_dado"),
        "ano": ano,
        "agravos_sinan": agravos,
        "nota": _NOTA,
        "fonte": "SINAN — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
