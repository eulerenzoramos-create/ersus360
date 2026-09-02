"""
Router: /api/sadt — ERSUS 360
Produção ambulatorial via SIA/DATASUS dados abertos.
Sem dados fictícios — nao_disponivel quando API não responder.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query

from services.sia_service import buscar_producao, buscar_producao_aps
from services.cache_service import cache_get, cache_set

router = APIRouter(prefix="/api/sadt", tags=["sadt"])

_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    """Dashboard de produção ambulatorial — BPA/SIA."""
    if not ano:
        ano = _ANO()
    ck = f"sia_producao_{ano}"
    cached = cache_get(ck)
    if cached:
        return cached
    result = await buscar_producao(ano)
    result["verificado_em"] = _TS()
    if result.get("situacao_dado") == "oficial_validado":
        cache_set(ck, result, ttl=3600)
    return result


@router.get("/historico")
async def historico():
    """Histórico de produção ambulatorial — últimos 3 anos."""
    anos = []
    for a in range(_ANO() - 2, _ANO() + 1):
        r = await buscar_producao(a)
        anos.append({
            "ano": a,
            "total_procedimentos": r.get("total_procedimentos"),
            "per_capita": r.get("per_capita"),
            "status": r.get("status"),
            "situacao_dado": r.get("situacao_dado"),
        })
    any_real = any(a["situacao_dado"] == "oficial_validado" for a in anos)
    return {
        "situacao_dado": "oficial_validado" if any_real else "nao_disponivel",
        "fonte": "SIA — DATASUS dados abertos",
        "verificado_em": _TS(),
        "anos": anos,
    }


@router.get("/aps")
async def producao_aps(ano: int = Query(0)):
    """Produção ambulatorial de APS — grupo 01 SIGTAP."""
    if not ano:
        ano = _ANO()
    ck = f"sia_aps_{ano}"
    cached = cache_get(ck)
    if cached:
        return cached
    result = await buscar_producao_aps(ano)
    result["verificado_em"] = _TS()
    if result.get("situacao_dado") == "oficial_validado":
        cache_set(ck, result, ttl=3600)
    return result


@router.get("/laboratorio")
async def laboratorio():
    """Exames laboratoriais — requer filtro por grupo SIGTAP (pendente)."""
    return {
        "situacao_dado": "nao_disponivel",
        "nota": "Filtro por grupo laboratorial SIGTAP pendente de implementação.",
        "verificado_em": _TS(),
    }


@router.get("/imagem")
async def imagem():
    """Exames de imagem — requer filtro por grupo SIGTAP (pendente)."""
    return {
        "situacao_dado": "nao_disponivel",
        "nota": "Filtro por grupo imagem SIGTAP pendente de implementação.",
        "verificado_em": _TS(),
    }


@router.get("/criticos")
async def criticos(ano: int = Query(0)):
    """Indicadores críticos — produção abaixo da meta per capita."""
    if not ano:
        ano = _ANO()
    result = await buscar_producao(ano)
    alertas = []
    per_cap = result.get("per_capita")
    if per_cap is not None and per_cap < 3.0:
        alertas.append({
            "tipo": "per_capita_critico",
            "gravidade": "critico",
            "valor": per_cap,
            "meta": 5.0,
            "mensagem": f"Produção ambulatorial per capita ({per_cap}) muito abaixo da meta (≥5,0).",
        })
    elif per_cap is not None and per_cap < 5.0:
        alertas.append({
            "tipo": "per_capita_atencao",
            "gravidade": "atencao",
            "valor": per_cap,
            "meta": 5.0,
            "mensagem": f"Produção ambulatorial per capita ({per_cap}) abaixo da meta (≥5,0).",
        })
    return {
        "situacao_dado": result.get("situacao_dado"),
        "ano": ano,
        "alertas": alertas,
        "fonte": result.get("fonte"),
        "verificado_em": _TS(),
    }
