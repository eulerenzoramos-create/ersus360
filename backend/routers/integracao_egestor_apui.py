"""
Integração e-Gestor Atenção Básica (SISAB/SCNES)
Env vars (Railway):
  EGESTOR_USUARIO  — login gov.br com perfil gestor municipal
  EGESTOR_SENHA    — senha (nunca ecoada)
  EGESTOR_TOKEN    — Bearer token (se já obtido externamente)
CNES Apuí: http://cnes.datasus.gov.br/pages/estabelecimentos/consulta.jsp
IBGE: 1300144
API indisponível → nao_disponivel. Nunca equipes, cobertura ou profissionais inventados.
"""
import os
from datetime import datetime
import httpx
from fastapi import APIRouter
from services.cache_service import cache_get, cache_set

router = APIRouter(prefix="/api/integracao-egestor-apui", tags=["Integração e-Gestor"])

IBGE_APUI     = "1300144"
CNES_APUI     = os.getenv("CNES_APUI", "6820662")
EGESTOR_USER  = os.getenv("EGESTOR_USUARIO", "")
EGESTOR_PASS  = os.getenv("EGESTOR_SENHA", "")
EGESTOR_TOKEN = os.getenv("EGESTOR_TOKEN", "")
EGESTOR_BASE  = "https://egestorab.saude.gov.br/api"
TIMEOUT       = 12.0

_NAO_DISP = {
    "situacao_dado": "nao_disponivel",
    "dados": None,
    "nota": "Dados requerem integração com e-Gestor APS. Configure EGESTOR_TOKEN no Railway. Nenhum valor inventado.",
}

def _ts():
    return datetime.now().strftime("%Y-%m-%dT%H:%M:%S")

def _auth_header():
    if EGESTOR_TOKEN:
        return {"Authorization": f"Bearer {EGESTOR_TOKEN}"}
    return {}

def _credenciais_ok():
    return bool(EGESTOR_TOKEN or (EGESTOR_USER and EGESTOR_PASS))


async def _fetch_equipes():
    cached = cache_get("egestor_equipes")
    if cached:
        return cached

    if not _credenciais_ok():
        return {**_NAO_DISP, "ultima_atualizacao": _ts()}

    headers = {**_auth_header(), "Content-Type": "application/json"}
    url = f"{EGESTOR_BASE}/gestaoUsuarios/equipes"
    params = {"ibge": IBGE_APUI}

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            r = await client.get(url, headers=headers, params=params)
            r.raise_for_status()
            data = r.json()
            result = {"situacao_dado": "oficial_validado", "fonte": "api", "ultima_atualizacao": _ts(), "dados": data}
            cache_set("egestor_equipes", result, ttl=900)
            return result
    except Exception as e:
        return {**_NAO_DISP, "erro": str(e), "ultima_atualizacao": _ts()}


@router.get("/status")
async def status():
    return {
        "sistema": "e-Gestor Atenção Básica / SISAB",
        "ibge": IBGE_APUI,
        "cnes_sms": CNES_APUI,
        "env_vars_necessarias": ["EGESTOR_USUARIO", "EGESTOR_SENHA", "EGESTOR_TOKEN"],
        "env_vars_ok": {
            "EGESTOR_USUARIO": bool(EGESTOR_USER),
            "EGESTOR_SENHA":   bool(EGESTOR_PASS),
            "EGESTOR_TOKEN":   bool(EGESTOR_TOKEN),
        },
        "credenciais_configuradas": _credenciais_ok(),
        "cache_ttl_minutos": 15,
        "ultima_verificacao": _ts(),
    }


@router.get("/equipes")
async def equipes():
    return await _fetch_equipes()


@router.get("/cobertura-aps")
async def cobertura_aps():
    cached = cache_get("egestor_cobertura")
    if cached:
        return cached

    if not _credenciais_ok():
        return {**_NAO_DISP, "ultima_atualizacao": _ts()}

    try:
        url = f"{EGESTOR_BASE}/gestaoUsuarios/cobertura"
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            r = await client.get(url, headers=_auth_header(), params={"ibge": IBGE_APUI})
            r.raise_for_status()
            data = r.json()
            result = {"situacao_dado": "oficial_validado", "fonte": "api", "ultima_atualizacao": _ts(), "dados": data}
            cache_set("egestor_cobertura", result, ttl=900)
            return result
    except Exception as e:
        return {**_NAO_DISP, "erro": str(e), "ultima_atualizacao": _ts()}


@router.get("/profissionais")
async def profissionais():
    cached = cache_get("egestor_profissionais")
    if cached:
        return cached

    if not _credenciais_ok():
        return {**_NAO_DISP, "ultima_atualizacao": _ts()}

    try:
        url = f"{EGESTOR_BASE}/cnes/profissionais"
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            r = await client.get(url, headers=_auth_header(), params={"ibge": IBGE_APUI})
            r.raise_for_status()
            data = r.json()
            result = {"situacao_dado": "oficial_validado", "fonte": "api", "ultima_atualizacao": _ts(), "dados": data}
            cache_set("egestor_profissionais", result, ttl=900)
            return result
    except Exception as e:
        return {**_NAO_DISP, "erro": str(e), "ultima_atualizacao": _ts()}


@router.get("/dashboard")
async def dashboard():
    eq = await _fetch_equipes()
    dados_api = eq.get("situacao_dado") == "oficial_validado"
    equipes_lista = eq.get("dados", []) if dados_api else []
    return {
        "situacao_dado": "oficial_validado" if dados_api else "nao_disponivel",
        "fonte": "api" if dados_api else "sem_dados",
        "ultima_atualizacao": _ts(),
        "municipio": "Apuí/AM",
        "ibge": IBGE_APUI,
        "credenciais_ok": _credenciais_ok(),
        "equipes_retornadas": len(equipes_lista) if isinstance(equipes_lista, list) else None,
        "dados": equipes_lista if dados_api else None,
        "nota": None if dados_api else "Configure EGESTOR_TOKEN no Railway para obter dados reais.",
    }
