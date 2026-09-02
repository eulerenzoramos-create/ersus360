"""
Router: /api/hepatites-virais-apui — ERSUS 360
Hepatites virais via SINAN — DATASUS dados abertos.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sinan_service import buscar_agravos_resumo
from services.sih_service import buscar_internacoes

router = APIRouter(prefix="/api/hepatites-virais-apui", tags=["hepatites_virais_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "Notificações individuais de hepatite A/B/C requerem acesso SINAN Web (pendente autorização municipal)."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    agravos = await buscar_agravos_resumo(ano)
    sih = await buscar_internacoes(ano)
    return {
        "situacao_dado": agravos.get("situacao_dado"),
        "ano": ano,
        "agravos_notificados": agravos,
        "internacoes_totais": sih.get("total_internacoes"),
        "nota": _NOTA,
        "fonte": "SINAN + SIH — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/notificacoes")
async def notificacoes():
    return {"situacao_dado": "nao_disponivel", "nota": _NOTA, "verificado_em": _TS()}


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
