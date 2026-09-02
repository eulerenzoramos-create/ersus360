"""
Router: /api/imunizacao — ERSUS 360
Cobertura vacinal via SI-PNI / DATASUS dados abertos.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query

from services.pni_service import buscar_cobertura, buscar_historico
from services.cache_service import cache_get, cache_set

router = APIRouter(prefix="/api/imunizacao", tags=["imunizacao"])

_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    ck = f"pni_cobertura_{ano}"
    cached = cache_get(ck)
    if cached:
        return cached
    result = await buscar_cobertura(ano)
    result["verificado_em"] = _TS()
    cache_set(ck, result, ttl=3600)
    return result


@router.get("/vacinas")
async def vacinas(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    return await dashboard(ano=ano)


@router.get("/historico")
async def historico(anos: int = Query(5)):
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


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    result = await buscar_cobertura(ano)
    vacinas_list = result.get("vacinas", [])
    return {
        "situacao_dado": result.get("situacao_dado"),
        "ano": ano,
        "media_cobertura_pct": result.get("media_cobertura_pct"),
        "vacinas_criticas": sum(1 for v in vacinas_list if v.get("status") == "critico"),
        "vacinas_atencao": sum(1 for v in vacinas_list if v.get("status") == "atencao"),
        "fonte": result.get("fonte"),
        "verificado_em": _TS(),
    }


@router.get("/rede-frio")
async def rede_frio():
    return {"situacao_dado": "nao_disponivel", "nota": "Dados de rede de frio requerem integração CNES/PNI (pendente).", "verificado_em": _TS()}
