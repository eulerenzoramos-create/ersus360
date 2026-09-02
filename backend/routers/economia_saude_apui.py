"""
Router: /api/economia-saude-apui — ERSUS 360
Economia da saúde via SIOPS + SIH (custo) — DATASUS dados abertos.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.siops_service import buscar_apuracao, buscar_historico
from services.sih_service import buscar_internacoes

router = APIRouter(prefix="/api/economia-saude-apui", tags=["economia_saude_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    siops = await buscar_apuracao(ano)
    sih   = await buscar_internacoes(ano)
    return {
        "situacao_dado": siops.get("situacao_dado"),
        "ano": ano,
        "despesa_saude_reais": siops.get("despesa_total_saude"),
        "percentual_ec29": siops.get("percentual_saude_receita"),
        "custo_internacoes_reais": sih.get("valor_total_reais"),
        "fonte": "SIOPS + SIH — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/historico")
async def historico():
    items = await buscar_historico()
    any_real = any(i.get("situacao_dado") == "oficial_validado" for i in items)
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "fonte": "SIOPS — DATASUS dados abertos", "verificado_em": _TS(), "anos": items}


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
