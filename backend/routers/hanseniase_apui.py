"""
Router: /api/hanseniase-apui — ERSUS 360
Casos de hanseníase via SINAN/DATASUS dados abertos.
Sem dados fictícios — nao_disponivel quando API não responder.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query

from services.sinan_service import buscar_hanseniase
from services.cache_service import cache_get, cache_set

router = APIRouter(prefix="/api/hanseniase-apui", tags=["hanseniase_apui"])

_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    ck = f"sinan_hanseniase_{ano}"
    cached = cache_get(ck)
    if cached:
        return cached
    result = await buscar_hanseniase(ano)
    result["verificado_em"] = _TS()
    if result.get("situacao_dado") == "oficial_validado":
        cache_set(ck, result, ttl=3600)
    return result


@router.get("/formas")
async def formas(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    result = await buscar_hanseniase(ano)
    total = result.get("total_casos") or 0
    mb = result.get("multibacilar", 0)
    pb = result.get("paucibacilar", 0)
    return {
        "situacao_dado": result.get("situacao_dado"),
        "ano": ano,
        "total_casos": total,
        "multibacilar": mb,
        "paucibacilar": pb,
        "pct_mb": round(mb / total * 100, 1) if total else None,
        "fonte": result.get("fonte"),
        "verificado_em": _TS(),
    }


@router.get("/historico")
async def historico():
    anos = []
    for a in range(_ANO() - 3, _ANO() + 1):
        r = await buscar_hanseniase(a)
        anos.append({
            "ano": a,
            "total_casos": r.get("total_casos"),
            "incidencia_100k": r.get("incidencia_100k"),
            "grau2_incap": r.get("grau2_incap"),
            "situacao_dado": r.get("situacao_dado"),
        })
    any_real = any(a["situacao_dado"] == "oficial_validado" for a in anos)
    return {
        "situacao_dado": "oficial_validado" if any_real else "nao_disponivel",
        "fonte": "SINAN — DATASUS dados abertos",
        "verificado_em": _TS(),
        "anos": anos,
    }


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    result = await buscar_hanseniase(ano)
    alertas = []
    grau2 = result.get("grau2_incap", 0) or 0
    total = result.get("total_casos") or 0
    pct_grau2 = round(grau2 / total * 100, 1) if total else 0
    if pct_grau2 > 10:
        alertas.append({"gravidade": "critico", "mensagem": f"Grau 2 de incapacidade ({pct_grau2}%) acima do limite (≤10%)."})
    return {**result, "pct_grau2_incap": pct_grau2, "alertas": alertas, "verificado_em": _TS()}


@router.get("/acoes")
async def acoes():
    return {
        "situacao_dado": "nao_disponivel",
        "nota": "Ações estratégicas requerem integração e-SUS PEC (pendente).",
        "verificado_em": _TS(),
    }

