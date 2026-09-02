"""
Router: /api/dengue-arboviroses-apui — ERSUS 360
Casos de dengue/arboviroses via SINAN/DATASUS dados abertos.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sinan_service import buscar_dengue
from services.cache_service import cache_get, cache_set

router = APIRouter(prefix="/api/dengue-arboviroses-apui", tags=["dengue_arboviroses_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    ck = f"sinan_dengue_{ano}"
    cached = cache_get(ck)
    if cached:
        return cached
    result = await buscar_dengue(ano)
    result["verificado_em"] = _TS()
    if result.get("situacao_dado") == "oficial_validado":
        cache_set(ck, result, ttl=3600)
    return result


@router.get("/serie-historica")
async def serie_historica():
    anos = []
    for a in range(_ANO() - 4, _ANO() + 1):
        r = await buscar_dengue(a)
        anos.append({"ano": a, "total_casos": r.get("total_casos"), "incidencia_100k": r.get("incidencia_100k"), "situacao_dado": r.get("situacao_dado")})
    any_real = any(a["situacao_dado"] == "oficial_validado" for a in anos)
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "fonte": "SINAN — DATASUS dados abertos", "verificado_em": _TS(), "anos": anos}


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    result = await buscar_dengue(ano)
    alertas = []
    incid = result.get("incidencia_100k")
    if incid is not None and incid >= 300:
        alertas.append({"gravidade": "critico", "mensagem": f"Incidência de dengue ({incid}/100k) em nível epidêmico (≥300/100k)."})
    elif incid is not None and incid >= 100:
        alertas.append({"gravidade": "atencao", "mensagem": f"Incidência de dengue ({incid}/100k) em nível de alerta (≥100/100k)."})
    return {**result, "alertas": alertas, "verificado_em": _TS()}


@router.get("/sazonalidade")
async def sazonalidade():
    return {"situacao_dado": "nao_disponivel", "nota": "Sazonalidade mensal requer endpoint SINAN com filtro de mês (pendente).", "verificado_em": _TS()}


@router.get("/acoes")
async def acoes():
    return {"situacao_dado": "nao_disponivel", "nota": "Ações de controle vetorial requerem integração SINAN + e-SUS PEC (pendente).", "verificado_em": _TS()}
