"""
Router: /api/imunizacao-apui — ERSUS 360
Dados de cobertura vacinal via SI-PNI / DATASUS dados abertos.
Sem dados ficticios — nao_disponivel quando API nao responder.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query

from services.pni_service import buscar_cobertura, buscar_historico
from services.cache_service import cache_get, cache_set

router = APIRouter(prefix="/api/imunizacao-apui", tags=["imunizacao_apui"])

_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


@router.get("/vacinas")
async def vacinas(ano: int = Query(0, description="Ano (0 = ano anterior)")):
    """Cobertura vacinal por imunobiológico — SI-PNI/DATASUS."""
    if not ano:
        ano = date.today().year - 1
    ck = f"pni_cobertura_{ano}"
    cached = cache_get(ck)
    if cached:
        return cached
    result = await buscar_cobertura(ano)
    result["verificado_em"] = _TS()
    cache_set(ck, result, ttl=3600)
    return result


@router.get("/historico")
async def historico(anos: int = Query(5, ge=1, le=10)):
    """Histórico de cobertura vacinal — últimos N anos."""
    ck = f"pni_historico_{anos}"
    cached = cache_get(ck)
    if cached:
        return cached
    items = await buscar_historico(anos)
    result = {
        "situacao_dado": "oficial_validado" if any(i.get("situacao_dado") == "oficial_validado" for i in items) else "nao_disponivel",
        "fonte": "SI-PNI / DATASUS dados abertos",
        "verificado_em": _TS(),
        "anos": items,
    }
    cache_set(ck, result, ttl=3600)
    return result


@router.get("/dashboard")
async def dashboard():
    """Dashboard imunização — cobertura do ano anterior."""
    ano = date.today().year - 1
    result = await buscar_cobertura(ano)
    result["verificado_em"] = _TS()
    return result


@router.get("/indicadores")
async def indicadores():
    """Indicadores de imunização — cobertura e vacinas abaixo da meta."""
    ano = date.today().year - 1
    result = await buscar_cobertura(ano)
    vacinas = result.get("vacinas", [])
    criticas = [v for v in vacinas if v.get("status") == "critico"]
    atencao  = [v for v in vacinas if v.get("status") == "atencao"]
    return {
        "situacao_dado":       result.get("situacao_dado", "nao_disponivel"),
        "ano":                 ano,
        "media_cobertura_pct": result.get("media_cobertura_pct"),
        "total_vacinas":       len(vacinas),
        "vacinas_criticas":    len(criticas),
        "vacinas_atencao":     len(atencao),
        "nomes_criticas":      [v["vacina"] for v in criticas],
        "fonte":               result.get("fonte"),
        "verificado_em":       _TS(),
    }


@router.get("/cadeia-frio")
async def cadeia_frio():
    """Cadeia de frio — requer integração CNES/PNI (pendente)."""
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados de cadeia de frio requerem integração CNES/PNI configurada.",
        "verificado_em": _TS(),
    }
