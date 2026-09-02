"""
Router: /api/mercurio-garimpo-apui — ERSUS 360
Exposição a mercúrio (garimpo) via SINAN T56.1 + SIH — DATASUS dados abertos.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sinan_service import buscar_agravos_resumo
from services.sih_service import buscar_internacoes

router = APIRouter(prefix="/api/mercurio-garimpo-apui", tags=["mercurio_garimpo_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "Intoxicação por mercúrio CID T56.1 requer SINAN SINITOX (pendente). Dados IBAMA/monitoramento ambiental pendentes."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    agravos = await buscar_agravos_resumo(ano)
    sih     = await buscar_internacoes(ano)
    return {
        "situacao_dado": agravos.get("situacao_dado"),
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
