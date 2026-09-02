"""
Router: /api/equipamentos — ERSUS 360
Estabelecimentos de saúde via CNES/DATASUS (API pública).
Sem dados fictícios — usa fallback confirmado CNES2/DATASUS quando API indisponível.
"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter

from services.cnes_service import buscar_estabelecimentos, buscar_equipes_saude
from services.cache_service import cache_get, cache_set

router = APIRouter(prefix="/api/equipamentos", tags=["equipamentos"])

_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


@router.get("/lista")
async def lista():
    """Lista de estabelecimentos de saúde de Apuí/AM — CNES/DATASUS."""
    ck = "cnes_estabelecimentos"
    cached = cache_get(ck)
    if cached:
        return cached
    items = await buscar_estabelecimentos()
    result = {
        "situacao_dado": "oficial_confirmado" if items else "nao_disponivel",
        "fonte": "CNES — DATASUS dados abertos / confirmado CNES2 2026-08-11",
        "total": len(items),
        "verificado_em": _TS(),
        "estabelecimentos": items,
    }
    if items:
        cache_set(ck, result, ttl=3600)
    return result


@router.get("/resumo")
async def resumo():
    """Resumo de estabelecimentos por tipo."""
    ck = "cnes_resumo"
    cached = cache_get(ck)
    if cached:
        return cached
    items = await buscar_estabelecimentos()
    por_tipo: dict[str, int] = {}
    ativos = 0
    for e in items:
        t = e.get("tipo") or "Não informado"
        por_tipo[t] = por_tipo.get(t, 0) + 1
        if e.get("ativo"):
            ativos += 1
    result = {
        "situacao_dado": "oficial_confirmado" if items else "nao_disponivel",
        "fonte": "CNES — DATASUS dados abertos",
        "total": len(items),
        "ativos": ativos,
        "por_tipo": por_tipo,
        "verificado_em": _TS(),
    }
    if items:
        cache_set(ck, result, ttl=3600)
    return result
