"""
Router: /api/gestao-hospitalar-apui — ERSUS 360
Internações hospitalares via SIH/DATASUS dados abertos.
Sem dados fictícios — nao_disponivel quando API não responder.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query

from services.sih_service import buscar_internacoes, buscar_historico
from services.cache_service import cache_get, cache_set

router = APIRouter(prefix="/api/gestao-hospitalar-apui", tags=["gestao_hospitalar_apui"])

_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    """Dashboard hospitalar — internações, ICSAP%, óbitos hospitalares."""
    if not ano:
        ano = _ANO()
    ck = f"sih_internacoes_{ano}"
    cached = cache_get(ck)
    if cached:
        return cached
    result = await buscar_internacoes(ano)
    result["verificado_em"] = _TS()
    if result.get("situacao_dado") == "oficial_validado":
        cache_set(ck, result, ttl=3600)
    return result


@router.get("/producao")
async def producao(ano: int = Query(0)):
    """Produção hospitalar — AIH autorizadas."""
    if not ano:
        ano = _ANO()
    return await dashboard(ano=ano)


@router.get("/historico")
async def historico():
    """Histórico de internações — últimos 5 anos via SIH/DATASUS."""
    ck = "sih_historico"
    cached = cache_get(ck)
    if cached:
        return cached
    items = await buscar_historico(5)
    any_real = any(i.get("situacao_dado") == "oficial_validado" for i in items)
    result = {
        "situacao_dado": "oficial_validado" if any_real else "nao_disponivel",
        "fonte": "SIH — DATASUS dados abertos",
        "verificado_em": _TS(),
        "anos": items,
    }
    if any_real:
        cache_set(ck, result, ttl=3600)
    return result


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    """Indicadores hospitalares compostos."""
    if not ano:
        ano = _ANO()
    result = await buscar_internacoes(ano)
    return {
        "situacao_dado": result.get("situacao_dado"),
        "ano": ano,
        "total_internacoes": result.get("total_internacoes"),
        "icsap": result.get("icsap"),
        "icsap_pct": result.get("icsap_pct"),
        "obitos_hospitalares": result.get("obitos_hospitalares"),
        "taxa_internacao_100k": result.get("taxa_internacao_100k"),
        "fonte": result.get("fonte"),
        "verificado_em": _TS(),
    }


@router.get("/fragilidades")
async def fragilidades(ano: int = Query(0)):
    """Fragilidades hospitalares — ICSAP acima de 25% indica lacuna na APS."""
    if not ano:
        ano = _ANO()
    result = await buscar_internacoes(ano)
    fragilidades_lista = []
    icsap_pct = result.get("icsap_pct")
    if icsap_pct is not None and icsap_pct > 25:
        fragilidades_lista.append({
            "indicador": "ICSAP%",
            "valor": icsap_pct,
            "referencia": "≤25%",
            "gravidade": "critico" if icsap_pct > 35 else "atencao",
        })
    return {
        "situacao_dado": result.get("situacao_dado"),
        "ano": ano,
        "fragilidades": fragilidades_lista,
        "fonte": result.get("fonte"),
        "verificado_em": _TS(),
    }
