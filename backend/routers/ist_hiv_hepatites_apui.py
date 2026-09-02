"""
Router: /api/ist-hiv-hepatites-apui — ERSUS 360
IST/HIV via SINAN + SIH — DATASUS dados abertos.
Casos individuais requerem SINAN Web (pendente). Sem dados fictícios.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sinan_service import buscar_agravos_resumo
from services.sih_service import buscar_internacoes

router = APIRouter(prefix="/api/ist-hiv-hepatites-apui", tags=["ist_hiv_hepatites_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "Notificações IST/HIV individuais requerem SINAN Web com autorização municipal (pendente)."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    agravos = await buscar_agravos_resumo(ano)
    sih = await buscar_internacoes(ano)
    return {
        "situacao_dado": ("oficial_validado" if any(d.get("situacao_dado") == "oficial_validado" for d in agravos) else "nao_disponivel"),
        "ano": ano,
        "agravos_notificados": agravos,
        "internacoes": sih.get("total_internacoes"),
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
