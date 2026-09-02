"""
Router: /api/saude-garimpo-apui — ERSUS 360
Saúde garimpo/mercúrio via SINAN + SIH — DATASUS dados abertos.
Apuí/AM: garimpo ilegal com exposição a mercúrio — contexto crítico.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sinan_service import buscar_agravos_resumo
from services.sih_service import buscar_internacoes

router = APIRouter(prefix="/api/saude-garimpo-apui", tags=["saude_garimpo_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "Notificações de intoxicação por mercúrio requerem SINAN T56.1 (pendente). IBAMA/FUNAI: dados de exposição ambiental pendentes."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    agravos = await buscar_agravos_resumo(ano)
    sih     = await buscar_internacoes(ano)
    return {
        "situacao_dado": ("oficial_validado" if any(d.get("situacao_dado") == "oficial_validado" for d in agravos) else "nao_disponivel"),
        "ano": ano,
        "agravos_sinan": agravos,
        "internacoes": sih.get("total_internacoes"),
        "nota": _NOTA,
        "fonte": "SINAN + SIH — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
