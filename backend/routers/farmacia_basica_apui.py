"""
Router: /api/farmacia-basica-apui — ERSUS 360
Farmácia básica via SIA (produção BPA) — DATASUS dados abertos.
Dispensação individual requer HORUS/REME (pendente integração).
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sia_service import buscar_producao

router = APIRouter(prefix="/api/farmacia-basica-apui", tags=["farmacia_basica_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "Dispensação individual e estoque requerem HORUS/REME (pendente integração). SIA fornece produção ambulatorial como proxy."


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


@router.get("/dispensacao")
async def dispensacao():
    return {"situacao_dado": "nao_disponivel", "nota": _NOTA, "verificado_em": _TS()}


@router.get("/estoque")
async def estoque():
    return {"situacao_dado": "nao_disponivel", "nota": _NOTA, "verificado_em": _TS()}


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
