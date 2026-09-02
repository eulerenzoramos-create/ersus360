"""
Router: /api/reabilitacao-apui — ERSUS 360
Reabilitação via SIA (produção BPA) + CNES — DATASUS dados abertos.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sia_service import buscar_producao
from services.cnes_service import buscar_estabelecimentos

router = APIRouter(prefix="/api/reabilitacao-apui", tags=["reabilitacao_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "Detalhamento por modalidade (fisio, TO, fonoaudiologia) requer query de procedimento específico no SIA (pendente)."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    sia  = await buscar_producao(ano)
    cnes = await buscar_estabelecimentos()
    return {
        "situacao_dado": sia.get("situacao_dado"),
        "ano": ano,
        "producao_ambulatorial": sia.get("total_procedimentos"),
        "estabelecimentos": cnes.get("total"),
        "nota": _NOTA,
        "fonte": "SIA + CNES — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
