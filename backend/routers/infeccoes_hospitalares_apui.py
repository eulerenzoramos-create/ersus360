"""
Router: /api/infeccoes-hospitalares-apui — ERSUS 360
Infecções hospitalares (IRAS) via SIH — DATASUS dados abertos.
Dados de vigilância hospitalar (CCIH) requerem sistema local.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sih_service import buscar_internacoes

router = APIRouter(prefix="/api/infeccoes-hospitalares-apui", tags=["infeccoes_hospitalares_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "Dados de IRAS/CCIH requerem sistema de vigilância hospitalar local. SIH fornece internações gerais como proxy."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    sih = await buscar_internacoes(ano)
    return {
        "situacao_dado": sih.get("situacao_dado"),
        "ano": ano,
        "internacoes_totais": sih.get("total_internacoes"),
        "nota": _NOTA,
        "fonte": "SIH — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/notificacoes-iras")
async def notificacoes_iras():
    return {"situacao_dado": "nao_disponivel", "nota": _NOTA, "verificado_em": _TS()}


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
