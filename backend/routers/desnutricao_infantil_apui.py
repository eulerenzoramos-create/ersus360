"""
Router: /api/desnutricao-infantil-apui — ERSUS 360
Desnutrição infantil via SIA (SISVAN proxy) + SIH — DATASUS dados abertos.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sia_service import buscar_producao
from services.sih_service import buscar_internacoes
from services.sim_sinasc_service import buscar_nascidos_vivos

router = APIRouter(prefix="/api/desnutricao-infantil-apui", tags=["desnutricao_infantil_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "Estado nutricional infantil individual (SISVAN) requer e-SUS PEC (pendente). SIA/SIH como proxy epidemiológico."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    nasc = await buscar_nascidos_vivos(ano)
    sih  = await buscar_internacoes(ano)
    sia  = await buscar_producao(ano)
    return {
        "situacao_dado": nasc.get("situacao_dado"),
        "ano": ano,
        "nascidos_vivos": nasc.get("total_nascidos"),
        "internacoes": sih.get("total_internacoes"),
        "producao_ambulatorial": sia.get("total_procedimentos"),
        "nota": _NOTA,
        "fonte": "SINASC + SIA + SIH — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/sisvan")
async def sisvan():
    return {"situacao_dado": "nao_disponivel", "nota": _NOTA, "verificado_em": _TS()}


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
