"""
Router: /api/saude-auditiva-apui — ERSUS 360
Saúde auditiva via SIA (produção audiológica) + SIH — DATASUS dados abertos.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sia_service import buscar_producao
from services.sih_service import buscar_internacoes

router = APIRouter(prefix="/api/saude-auditiva-apui", tags=["saude_auditiva_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "Filtro por procedimento audiológico (SIA) e AASI requer query específica (pendente). Triagem neonatal auditiva via SINASC (pendente)."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    sia = await buscar_producao(ano)
    sih = await buscar_internacoes(ano)
    return {
        "situacao_dado": sia.get("situacao_dado"),
        "ano": ano,
        "producao_ambulatorial": sia.get("total_procedimentos"),
        "internacoes": sih.get("total_internacoes"),
        "nota": _NOTA,
        "fonte": "SIA + SIH — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
