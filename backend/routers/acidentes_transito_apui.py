"""
Router: /api/acidentes-transito-apui — ERSUS 360
Acidentes de trânsito via SIH (internações) + SIM (óbitos) — DATASUS dados abertos.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sih_service import buscar_internacoes
from services.sim_sinasc_service import buscar_obitos

router = APIRouter(prefix="/api/acidentes-transito-apui", tags=["acidentes_transito_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "Filtro por causa V01-V99 (acidentes de trânsito) requer query CID no SIH/SIM (pendente implementação de filtro específico)."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    sih    = await buscar_internacoes(ano)
    obitos = await buscar_obitos(ano)
    return {
        "situacao_dado": sih.get("situacao_dado"),
        "ano": ano,
        "internacoes_totais": sih.get("total_internacoes"),
        "obitos_totais": obitos.get("total_obitos"),
        "nota": _NOTA,
        "fonte": "SIH + SIM — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/internacoes")
async def internacoes(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    result = await buscar_internacoes(ano)
    result["nota"] = _NOTA
    result["verificado_em"] = _TS()
    return result


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
