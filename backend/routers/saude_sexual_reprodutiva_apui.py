"""
Router: /api/saude-sexual-reprodutiva-apui — ERSUS 360
Saúde sexual e reprodutiva via SINASC + SIH — DATASUS dados abertos.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sim_sinasc_service import buscar_nascidos_vivos
from services.sih_service import buscar_internacoes

router = APIRouter(prefix="/api/saude-sexual-reprodutiva-apui", tags=["saude_sexual_reprodutiva_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "Planejamento familiar individual e dados de IST requerem e-SUS PEC e SINAN Web (pendente)."


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
        "nota": _NOTA,
        "fonte": "SINASC + SIH — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)


@router.get("/planejamento-familiar")
async def planejamento_familiar():
    return {"situacao_dado": "nao_disponivel", "nota": _NOTA, "verificado_em": _TS()}
