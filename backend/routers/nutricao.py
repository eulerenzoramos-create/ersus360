"""
Router: /api/nutricao — ERSUS 360 (genérico)
Produção ambulatorial nutricional via SIA — DATASUS dados abertos.
SISVAN individual requer e-SUS PEC (pendente).
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sia_service import buscar_producao

router = APIRouter(prefix="/api/nutricao", tags=["nutricao"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "Vigilância nutricional individual (SISVAN) requer e-SUS PEC (pendente). SIA fornece produção ambulatorial como proxy."


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


@router.get("/sisvan")
async def sisvan():
    return {"situacao_dado": "nao_disponivel", "nota": _NOTA, "verificado_em": _TS()}


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
