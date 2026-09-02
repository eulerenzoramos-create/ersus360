"""
Router: /api/vacinacao — ERSUS 360 (genérico)
Cobertura vacinal via SI-PNI — DATASUS dados abertos.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.pni_service import buscar_cobertura, buscar_historico

router = APIRouter(prefix="/api/vacinacao", tags=["vacinacao"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    result = await buscar_cobertura(ano)
    result["verificado_em"] = _TS()
    return result


@router.get("/historico")
async def historico_vacinacao():
    items = await buscar_historico(5)
    any_real = any(i.get("situacao_dado") == "oficial_validado" for i in items)
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "fonte": "SI-PNI — DATASUS dados abertos", "verificado_em": _TS(), "anos": items}


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
