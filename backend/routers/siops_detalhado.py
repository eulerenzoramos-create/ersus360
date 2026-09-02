"""
Router: /api/siops-detalhado — ERSUS 360
SIOPS detalhado: EC29, vinculação, execução por bloco — dados abertos.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.siops_service import buscar_apuracao, buscar_historico

router = APIRouter(prefix="/api/siops-detalhado", tags=["siops_detalhado"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    result = await buscar_apuracao(ano)
    result["verificado_em"] = _TS()
    return result


@router.get("/historico")
async def historico():
    items = await buscar_historico()
    any_real = any(i.get("situacao_dado") == "oficial_validado" for i in items)
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "fonte": "SIOPS — DATASUS dados abertos", "verificado_em": _TS(), "anos": items}


@router.get("/ec29")
async def ec29(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    result = await buscar_apuracao(ano)
    pct = result.get("percentual_saude_receita")
    alertas = []
    if pct is not None and pct < 15.0:
        alertas.append({"nivel": "critico", "mensagem": f"EC29: {pct:.1f}% abaixo do mínimo constitucional de 15%"})
    return {
        "situacao_dado": result.get("situacao_dado"),
        "ano": ano,
        "percentual_aplicado_saude": pct,
        "minimo_constitucional_pct": 15.0,
        "alertas": alertas,
        "fonte": "SIOPS — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
