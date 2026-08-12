"""
Integração SIAPS — Sistema de Informações em Assistência Farmacêutica / HORUS
Env vars (Railway):
  SIAPS_TOKEN — Bearer token de acesso ao SIAPS/HORUS
HORUS: https://horus.saude.gov.br
IBGE: 1300144  |  CNES Apuí: 2206406
API indisponível → nao_disponivel. Nunca estoques ou dispensações inventadas.
"""
import os
from datetime import datetime
import httpx
from fastapi import APIRouter
from services.cache_service import cache_get, cache_set

router = APIRouter(prefix="/api/integracao-siaps-apui", tags=["Integração SIAPS"])

IBGE_APUI   = "1300144"
CNES_APUI   = "2206406"
SIAPS_TOKEN = os.getenv("SIAPS_TOKEN", "")
HORUS_BASE  = "https://horus.saude.gov.br/api"
TIMEOUT     = 12.0

_NAO_DISP = {
    "situacao_dado": "nao_disponivel",
    "dados": None,
    "nota": "Dados requerem integração com HORUS/SIAPS. Configure SIAPS_TOKEN no Railway. Nenhum valor inventado.",
}

def _ts():
    return datetime.now().strftime("%Y-%m-%dT%H:%M:%S")

def _auth():
    if SIAPS_TOKEN:
        return {"Authorization": f"Bearer {SIAPS_TOKEN}", "Accept": "application/json"}
    return {"Accept": "application/json"}

async def _horus_get(path: str, cache_key: str, params: dict = {}):
    cached = cache_get(cache_key)
    if cached:
        return cached
    if not SIAPS_TOKEN:
        return {**_NAO_DISP, "ultima_atualizacao": _ts()}
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.get(f"{HORUS_BASE}{path}", headers=_auth(), params=params)
        r.raise_for_status()
        data = r.json()
        result = {"situacao_dado": "oficial_validado", "fonte": "api", "ultima_atualizacao": _ts(), "dados": data}
        cache_set(cache_key, result, ttl=900)
        return result


@router.get("/status")
async def status():
    return {
        "sistema": "SIAPS / HORUS — Assistência Farmacêutica",
        "ibge": IBGE_APUI,
        "cnes": CNES_APUI,
        "env_vars_necessarias": ["SIAPS_TOKEN"],
        "env_vars_ok": {"SIAPS_TOKEN": bool(SIAPS_TOKEN)},
        "credenciais_configuradas": bool(SIAPS_TOKEN),
        "cache_ttl_minutos": 15,
        "ultima_verificacao": _ts(),
    }


@router.get("/estoque")
async def estoque():
    try:
        return await _horus_get(
            "/medicamentos/estoque",
            "siaps_estoque",
            params={"ibge": IBGE_APUI, "cnes": CNES_APUI},
        )
    except Exception as e:
        return {**_NAO_DISP, "erro": str(e), "ultima_atualizacao": _ts()}


@router.get("/dispensacoes")
async def dispensacoes():
    try:
        return await _horus_get(
            "/medicamentos/dispensacoes",
            "siaps_dispensacoes",
            params={"ibge": IBGE_APUI, "competencia": "202506"},
        )
    except Exception as e:
        return {**_NAO_DISP, "erro": str(e), "ultima_atualizacao": _ts()}


@router.get("/aquisicoes")
async def aquisicoes():
    try:
        return await _horus_get(
            "/licitacoes/aquisicoes",
            "siaps_aquisicoes",
            params={"ibge": IBGE_APUI, "ano": 2025},
        )
    except Exception as e:
        return {**_NAO_DISP, "erro": str(e), "ultima_atualizacao": _ts()}


@router.get("/dashboard")
async def dashboard():
    est = await estoque()
    dados_api = est.get("situacao_dado") == "oficial_validado"
    return {
        "situacao_dado": "oficial_validado" if dados_api else "nao_disponivel",
        "fonte": "api" if dados_api else "sem_dados",
        "ultima_atualizacao": _ts(),
        "municipio": "Apuí/AM",
        "ibge": IBGE_APUI,
        "credenciais_ok": bool(SIAPS_TOKEN),
        "dados": est.get("dados") if dados_api else None,
        "nota": None if dados_api else "Configure SIAPS_TOKEN no Railway para obter dados reais do HORUS.",
    }
