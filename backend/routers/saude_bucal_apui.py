"""
Router: /api/saude-bucal-apui — ERSUS 360
Produção odontológica via SIA/DATASUS (grupo 04 SIGTAP).
Produção via e-SUS PEC requer integração PEC (pendente).
Sem dados fictícios.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query

from services.sia_service import buscar_producao
from services.cache_service import cache_get, cache_set

router = APIRouter(prefix="/api/saude-bucal-apui", tags=["saude_bucal_apui"])

_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_PEC_PENDENTE = "Produção odontológica detalhada (atendimentos, procedimentos por equipe) requer integração e-SUS PEC (pendente)."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    """Dashboard saúde bucal — produção ambulatorial odontológica via SIA."""
    if not ano:
        ano = _ANO()
    ck = f"sia_producao_{ano}"
    cached = cache_get(ck)
    if cached:
        base = cached
    else:
        base = await buscar_producao(ano)
        if base.get("situacao_dado") == "oficial_validado":
            cache_set(ck, base, ttl=3600)
    return {
        **base,
        "modulo": "saude_bucal",
        "nota_pec": _PEC_PENDENTE,
        "verificado_em": _TS(),
    }


@router.get("/producao")
async def producao(ano: int = Query(0)):
    """Produção odontológica ambulatorial."""
    if not ano:
        ano = _ANO()
    return await dashboard(ano=ano)


@router.get("/historico")
async def historico():
    """Histórico de produção — últimos 3 anos via SIA."""
    anos = []
    for a in range(_ANO() - 2, _ANO() + 1):
        r = await buscar_producao(a)
        anos.append({"ano": a, "total_procedimentos": r.get("total_procedimentos"), "situacao_dado": r.get("situacao_dado")})
    any_real = any(a["situacao_dado"] == "oficial_validado" for a in anos)
    return {
        "situacao_dado": "oficial_validado" if any_real else "nao_disponivel",
        "fonte": "SIA — DATASUS dados abertos",
        "verificado_em": _TS(),
        "anos": anos,
    }


@router.get("/epidemiologia")
async def epidemiologia():
    return {"situacao_dado": "nao_disponivel", "nota": "Dados epidemiológicos bucais requerem SB Brasil/DATASUS (pendente).", "verificado_em": _TS()}


@router.get("/indicadores")
async def indicadores():
    return {"situacao_dado": "nao_disponivel", "nota": _PEC_PENDENTE, "verificado_em": _TS()}

