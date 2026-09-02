"""
Router: /api/icsap-apui — ERSUS 360
Internações por Condições Sensíveis à Atenção Primária via SIH/DATASUS.
Sem dados fictícios — nao_disponivel quando API não responder.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query

from services.sih_service import buscar_internacoes, buscar_historico
from services.cache_service import cache_get, cache_set

router = APIRouter(prefix="/api/icsap-apui", tags=["icsap_apui"])

_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    """Dashboard ICSAP — internações totais e ICSAP%."""
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


@router.get("/historico")
async def historico():
    """Histórico ICSAP — últimos 5 anos."""
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
    """Indicadores ICSAP — taxa de internação, % ICSAP, óbitos."""
    if not ano:
        ano = _ANO()
    result = await buscar_internacoes(ano)
    alertas = []
    icsap_pct = result.get("icsap_pct")
    if icsap_pct is not None and icsap_pct > 30:
        alertas.append({
            "tipo": "icsap_elevado",
            "gravidade": "critico",
            "mensagem": f"ICSAP% elevado ({icsap_pct}%). Alta proporção indica lacunas na APS.",
        })
    elif icsap_pct is not None and icsap_pct > 20:
        alertas.append({
            "tipo": "icsap_atencao",
            "gravidade": "atencao",
            "mensagem": f"ICSAP% em atenção ({icsap_pct}%). Monitorar resolutividade da APS.",
        })
    return {
        "situacao_dado": result.get("situacao_dado"),
        "ano": ano,
        "total_internacoes": result.get("total_internacoes"),
        "icsap": result.get("icsap"),
        "icsap_pct": icsap_pct,
        "obitos_hospitalares": result.get("obitos_hospitalares"),
        "taxa_internacao_100k": result.get("taxa_internacao_100k"),
        "alertas": alertas,
        "fonte": result.get("fonte"),
        "verificado_em": _TS(),
    }


@router.get("/condicoes")
async def condicoes():
    """Condições ICSAP por CID — requer filtro por diagnóstico (pendente)."""
    return {
        "situacao_dado": "nao_disponivel",
        "nota": "Detalhamento por condição/CID requer endpoint SIH com filtro diagnóstico (pendente).",
        "verificado_em": _TS(),
    }


@router.get("/acoes")
async def acoes():
    """Ações para redução do ICSAP — requer análise cruzada PEC+SIH (pendente)."""
    return {
        "situacao_dado": "nao_disponivel",
        "nota": "Requer integração cruzada SIH + e-SUS PEC (pendente).",
        "verificado_em": _TS(),
    }
