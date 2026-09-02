"""
Router: /api/atencao-primaria-apui — ERSUS 360
Atenção Primária via e-Gestor APS (SIAPS) + SIA produção APS — DATASUS dados abertos.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.fns_api_service import buscar_indicadores_previne
from services.sia_service import buscar_producao_aps, buscar_producao
from services.cnes_service import buscar_estabelecimentos

router = APIRouter(prefix="/api/atencao-primaria-apui", tags=["atencao_primaria_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    indicadores = await buscar_indicadores_previne()
    sia_aps     = await buscar_producao_aps(ano)
    cnes        = await buscar_estabelecimentos()
    any_real = sia_aps.get("situacao_dado") == "oficial_validado" or len(indicadores) > 0
    return {
        "situacao_dado": "oficial_validado" if any_real else "nao_disponivel",
        "ano": ano,
        "indicadores_egestor": indicadores,
        "producao_aps": sia_aps,
        "estabelecimentos": cnes.get("total"),
        "fonte": "e-Gestor APS + SIA + CNES — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/producao")
async def producao(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    result = await buscar_producao_aps(ano)
    result["verificado_em"] = _TS()
    return result


@router.get("/indicadores")
async def indicadores():
    data = await buscar_indicadores_previne()
    return {
        "situacao_dado": "oficial_validado" if data else "nao_disponivel",
        "indicadores": data,
        "fonte": "e-Gestor APS — dados abertos",
        "verificado_em": _TS(),
    }
