"""
Router: /api/icsap — ERSUS 360
Internações por Condições Sensíveis à Atenção Primária via SIH/DATASUS.
Sem dados fictícios — nao_disponivel quando API não responder.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query

from services.sih_service import buscar_internacoes, buscar_historico
from services.cache_service import cache_get, cache_set

router = APIRouter(prefix="/api/icsap", tags=["ICSAP"])

_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    """Dashboard ICSAP."""
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
    """Histórico ICSAP — últimos 5 anos via SIH/DATASUS."""
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


@router.get("/causas")
async def causas():
    """Causas ICSAP por CID — requer filtro diagnóstico SIH (pendente)."""
    return {
        "situacao_dado": "nao_disponivel",
        "nota": "Detalhamento por CID requer endpoint SIH com filtro diagnóstico (pendente).",
        "verificado_em": _TS(),
    }


@router.get("/por-esf")
async def por_esf():
    """ICSAP por equipe de saúde — requer cruzamento SIH + PEC (pendente)."""
    return {
        "situacao_dado": "nao_disponivel",
        "nota": "Requer integração cruzada SIH + e-SUS PEC (pendente).",
        "verificado_em": _TS(),
    }


@router.get("/acoes")
async def acoes():
    """Ações para redução do ICSAP — requer análise cruzada (pendente)."""
    return {
        "situacao_dado": "nao_disponivel",
        "nota": "Requer integração cruzada SIH + e-SUS PEC (pendente).",
        "verificado_em": _TS(),
    }
