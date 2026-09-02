"""
Router: /api/vigilancia-obito — ERSUS 360
Mortalidade e nascidos vivos via SIM/SINASC — DATASUS dados abertos.
Sem dados fictícios — nao_disponivel quando API não responder.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query

from services.sim_sinasc_service import (
    buscar_obitos, buscar_nascidos_vivos, buscar_historico_mortalidade
)
from services.cache_service import cache_get, cache_set

router = APIRouter(prefix="/api/vigilancia-obito", tags=["vigilancia_obito"])

_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    """Dashboard mortalidade — total de óbitos, causas, taxa."""
    if not ano:
        ano = _ANO()
    ck = f"sim_obitos_{ano}"
    cached = cache_get(ck)
    if cached:
        return cached
    result = await buscar_obitos(ano)
    result["verificado_em"] = _TS()
    if result.get("situacao_dado") == "oficial_validado":
        cache_set(ck, result, ttl=3600)
    return result


@router.get("/historico")
async def historico():
    """Histórico de mortalidade — últimos anos via SIM/DATASUS."""
    ck = "sim_historico"
    cached = cache_get(ck)
    if cached:
        return cached
    items = await buscar_historico_mortalidade()
    any_real = any(i.get("situacao_dado") == "oficial_validado" for i in items)
    result = {
        "situacao_dado": "oficial_validado" if any_real else "nao_disponivel",
        "fonte": "SIM — DATASUS dados abertos",
        "verificado_em": _TS(),
        "anos": items,
    }
    if any_real:
        cache_set(ck, result, ttl=3600)
    return result


@router.get("/nascidos-vivos")
async def nascidos_vivos(ano: int = Query(0)):
    """Nascidos vivos — SINASC/DATASUS."""
    if not ano:
        ano = _ANO()
    ck = f"sinasc_nasc_{ano}"
    cached = cache_get(ck)
    if cached:
        return cached
    result = await buscar_nascidos_vivos(ano)
    result["verificado_em"] = _TS()
    if result.get("situacao_dado") == "oficial_validado":
        cache_set(ck, result, ttl=3600)
    return result


@router.get("/obitos-maternos")
async def obitos_maternos(ano: int = Query(0)):
    """Óbitos maternos — filtrado do SIM por capítulo CID materno."""
    if not ano:
        ano = _ANO()
    result = await buscar_obitos(ano)
    maternos = [
        o for o in result.get("obitos", [])
        if str(o.get("cid", "")).startswith(("O", "P"))
    ]
    return {
        "situacao_dado": result.get("situacao_dado"),
        "ano": ano,
        "total_maternos": len(maternos),
        "obitos": maternos,
        "fonte": result.get("fonte"),
        "verificado_em": _TS(),
    }


@router.get("/obitos-infantis")
async def obitos_infantis(ano: int = Query(0)):
    """Óbitos infantis — menores de 1 ano, via SIM."""
    if not ano:
        ano = _ANO()
    result = await buscar_obitos(ano)
    infantis = [
        o for o in result.get("obitos", [])
        if (o.get("idade_anos") is not None and o["idade_anos"] < 1)
    ]
    return {
        "situacao_dado": result.get("situacao_dado"),
        "ano": ano,
        "total_infantis": len(infantis),
        "obitos": infantis,
        "fonte": result.get("fonte"),
        "verificado_em": _TS(),
    }


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    """Indicadores compostos — óbitos + nascidos vivos."""
    if not ano:
        ano = _ANO()
    obitos = await buscar_obitos(ano)
    nasc   = await buscar_nascidos_vivos(ano)
    total_ob = obitos.get("total_obitos") or 0
    total_nv = nasc.get("total_nascidos") or 0
    tmi = round(total_ob / total_nv * 1000, 1) if total_nv else None
    return {
        "situacao_dado": obitos.get("situacao_dado"),
        "ano": ano,
        "total_obitos": total_ob,
        "total_nascidos_vivos": total_nv,
        "taxa_mortalidade_infantil_estimada": tmi,
        "fonte": "SIM + SINASC — DATASUS dados abertos",
        "verificado_em": _TS(),
    }
