"""
Router: /api/atividade-fisica-apui — ERSUS 360
Atividade física via SIA (NASF/produção) — DATASUS dados abertos.
Prevalência sedentarismo requer VIGITEL/e-SUS PEC (pendente).
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sia_service import buscar_producao

router = APIRouter(prefix="/api/atividade-fisica-apui", tags=["atividade_fisica_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "Prevalência de sedentarismo e dados de NASF requerem e-SUS PEC/VIGITEL (pendente)."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    sia = await buscar_producao(ano)
    return {
        "situacao_dado": sia.get("situacao_dado"),
        "ano": ano,
        "producao_ambulatorial": sia.get("total_procedimentos"),
        "nota": _NOTA,
        "fonte": "SIA — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
