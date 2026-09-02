"""
Router: /api/dcnt-cronicas — ERSUS 360
DCNT crônicas via SIH + SIM — DATASUS dados abertos.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sih_service import buscar_internacoes, buscar_historico
from services.sim_sinasc_service import buscar_obitos

router = APIRouter(prefix="/api/dcnt-cronicas", tags=["dcnt_cronicas"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    sih    = await buscar_internacoes(ano)
    obitos = await buscar_obitos(ano)
    return {
        "situacao_dado": sih.get("situacao_dado"),
        "ano": ano,
        "internacoes": sih.get("total_internacoes"),
        "obitos": obitos.get("total_obitos"),
        "nota": "Estratificação CID I/E/J/K/N (DCNT) requer filtro adicional SIH/SIM (pendente).",
        "fonte": "SIH + SIM — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/historico")
async def historico():
    items = await buscar_historico(5)
    any_real = any(i.get("situacao_dado") == "oficial_validado" for i in items)
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "fonte": "SIH — DATASUS dados abertos", "verificado_em": _TS(), "anos": items}


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
