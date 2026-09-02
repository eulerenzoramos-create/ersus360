"""
Router: /api/saude-adolescente-apui — ERSUS 360
Saúde do adolescente via SINASC/SIH — DATASUS dados abertos.
Acompanhamento individual requer e-SUS PEC (pendente). Sem dados fictícios.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sim_sinasc_service import buscar_nascidos_vivos, buscar_obitos
from services.sih_service import buscar_internacoes
from services.cache_service import cache_get

router = APIRouter(prefix="/api/saude-adolescente-apui", tags=["saude_adolescente_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_PEC = "Acompanhamento de adolescentes (saúde sexual, mental) requer e-SUS PEC (pendente)."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    nasc = await buscar_nascidos_vivos(ano)
    sih  = await buscar_internacoes(ano)
    return {
        "situacao_dado": nasc.get("situacao_dado"),
        "ano": ano,
        "nascidos_vivos": nasc.get("total_nascidos"),
        "internacoes": sih.get("total_internacoes"),
        "nota_pec": _PEC,
        "fonte": "SINASC + SIH — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)


@router.get("/gravidez-adolescencia")
async def gravidez_adolescencia(ano: int = Query(0)):
    """Gravidez na adolescência — requer filtro etário SINASC (pendente)."""
    return {"situacao_dado": "nao_disponivel", "nota": "Filtro por faixa etária materna no SINASC pendente de implementação.", "verificado_em": _TS()}


@router.get("/saude-mental")
async def saude_mental():
    return {"situacao_dado": "nao_disponivel", "nota": _PEC, "verificado_em": _TS()}


@router.get("/acoes")
async def acoes():
    return {"situacao_dado": "nao_disponivel", "nota": _PEC, "verificado_em": _TS()}
