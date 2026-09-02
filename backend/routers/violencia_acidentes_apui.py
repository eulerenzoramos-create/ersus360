"""
Router: /api/violencia-acidentes-apui — ERSUS 360
Violência e acidentes via SINAN + SIH — DATASUS dados abertos.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sinan_service import buscar_agravos_resumo
from services.sih_service import buscar_internacoes

router = APIRouter(prefix="/api/violencia-acidentes-apui", tags=["violencia_acidentes_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "Notificações individuais de violência requerem SINAN Web (pendente). Internações por causas externas via SIH disponíveis."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    agravos = await buscar_agravos_resumo(ano)
    sih = await buscar_internacoes(ano)
    alertas = []
    return {
        "situacao_dado": sih.get("situacao_dado"),
        "ano": ano,
        "internacoes_causas_externas_estimadas": sih.get("total_internacoes"),
        "agravos_sinan": agravos,
        "nota": _NOTA,
        "alertas": alertas,
        "fonte": "SINAN + SIH — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/notificacoes")
async def notificacoes():
    return {"situacao_dado": "nao_disponivel", "nota": _NOTA, "verificado_em": _TS()}


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
