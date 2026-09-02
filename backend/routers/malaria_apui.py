"""
Router: /api/malaria-apui — ERSUS 360
Dados de malária via SIVEP-Malária / SINAN / DATASUS dados abertos.
Sem dados ficticios — nao_disponivel quando API nao responder.
Apuí/AM é município endêmico de malária (IPA historicamente alto).
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query

from services.sinan_service import buscar_malaria, buscar_dengue, buscar_agravos_resumo
from services.cache_service import cache_get, cache_set

router = APIRouter(prefix="/api/malaria-apui", tags=["malaria_apui"])

_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO_ATUAL = lambda: date.today().year


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    """Dashboard malária — casos, IPA, espécies."""
    if not ano:
        ano = _ANO_ATUAL() - 1
    ck = f"malaria_dashboard_{ano}"
    cached = cache_get(ck)
    if cached:
        return cached
    result = await buscar_malaria(ano)
    result["verificado_em"] = _TS()
    cache_set(ck, result, ttl=3600)
    return result


@router.get("/estratificacao")
async def estratificacao(ano: int = Query(0)):
    """Estratificação por espécie (Vivax / Falciparum)."""
    if not ano:
        ano = _ANO_ATUAL() - 1
    result = await buscar_malaria(ano)
    total = result.get("total_casos") or 0
    vivax = result.get("vivax", 0)
    falci = result.get("falciparum", 0)
    return {
        "situacao_dado":  result.get("situacao_dado"),
        "ano":            ano,
        "total_casos":    total,
        "vivax":          vivax,
        "falciparum":     falci,
        "pct_vivax":      round(vivax / total * 100, 1) if total else None,
        "pct_falciparum": round(falci / total * 100, 1) if total else None,
        "ipa":            result.get("ipa"),
        "classificacao_ipa": result.get("classificacao_ipa"),
        "fonte":          result.get("fonte"),
        "verificado_em":  _TS(),
    }


@router.get("/sazonalidade")
async def sazonalidade():
    """Sazonalidade — últimos 3 anos (requer API SIVEP com filtro mensal — pendente)."""
    anos = []
    for a in range(_ANO_ATUAL() - 3, _ANO_ATUAL()):
        r = await buscar_malaria(a)
        anos.append({
            "ano":           a,
            "total_casos":   r.get("total_casos"),
            "ipa":           r.get("ipa"),
            "situacao_dado": r.get("situacao_dado"),
        })
    any_real = any(a["situacao_dado"] == "oficial_validado" for a in anos)
    return {
        "situacao_dado": "oficial_validado" if any_real else "nao_disponivel",
        "fonte": "SIVEP-Malária / SINAN DATASUS",
        "verificado_em": _TS(),
        "serie_historica": anos,
        "nota": "Sazonalidade mensal requer endpoint SIVEP com filtro de mês (pendente)." if not any_real else None,
    }


@router.get("/indicadores")
async def indicadores():
    """Indicadores integrados: malária + dengue."""
    ano = _ANO_ATUAL() - 1
    ck = f"malaria_indicadores_{ano}"
    cached = cache_get(ck)
    if cached:
        return cached
    agravos = await buscar_agravos_resumo(ano)
    result = {
        "situacao_dado": "oficial_validado" if any(a.get("situacao_dado") == "oficial_validado" for a in agravos) else "nao_disponivel",
        "ano": ano,
        "fonte": "SINAN / SIVEP-Malária — DATASUS dados abertos",
        "verificado_em": _TS(),
        "agravos": agravos,
    }
    cache_set(ck, result, ttl=3600)
    return result
