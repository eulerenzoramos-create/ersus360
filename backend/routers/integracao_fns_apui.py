"""
Integração FNS — Fundo Nacional de Saúde
Fontes:
  - Portal da Transparência API (pública, IBGE 1300144)
    Env: TRANSPARENCIA_API_KEY
  - FNS autenticado (credenciais já em Railway)
    Env: FNS_API_CPF, FNS_API_SENHA (nunca ecoados)
API indisponível → nao_disponivel. Nunca repasses ou transferências inventadas.
"""
import os
from datetime import datetime
import httpx
from fastapi import APIRouter
from services.cache_service import cache_get, cache_set

router = APIRouter(prefix="/api/integracao-fns-apui", tags=["Integração FNS"])

IBGE_APUI      = "1300144"
TRANSP_KEY     = os.getenv("TRANSPARENCIA_API_KEY", "")
FNS_CPF        = os.getenv("FNS_API_CPF", "")
FNS_SENHA      = os.getenv("FNS_API_SENHA", "")
TRANSP_BASE    = "https://api.portaldatransparencia.gov.br/api-de-dados"
TIMEOUT        = 10.0

_NAO_DISP = {
    "situacao_dado": "nao_disponivel",
    "dados": None,
    "nota": "Dados requerem integração com Portal da Transparência. Configure TRANSPARENCIA_API_KEY no Railway. Nenhum valor inventado.",
}

def _ts():
    return datetime.now().strftime("%Y-%m-%dT%H:%M:%S")


async def _get_transferencias_transparencia():
    cached = cache_get("fns_transferencias")
    if cached:
        return cached

    if not TRANSP_KEY:
        return {**_NAO_DISP, "ultima_atualizacao": _ts()}

    headers = {"chave-api": TRANSP_KEY, "Accept": "application/json"}
    url = f"{TRANSP_BASE}/transferencias-voluntarias-municipio-estado"
    params = {
        "codigoMunicipio": IBGE_APUI,
        "dataInicio": "2025-01-01",
        "dataFim":   "2025-12-31",
        "pagina":    1,
    }

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            r = await client.get(url, headers=headers, params=params)
            r.raise_for_status()
            data = r.json()
            result = {"situacao_dado": "oficial_validado", "fonte": "api", "ultima_atualizacao": _ts(), "dados": data}
            cache_set("fns_transferencias", result, ttl=900)
            return result
    except Exception as e:
        cached_last = cache_get("fns_transferencias_last")
        if cached_last:
            return {**cached_last, "situacao_dado": "oficial_aguardando", "fonte": "cache"}
        return {**_NAO_DISP, "erro": str(e), "ultima_atualizacao": _ts()}


@router.get("/status")
async def status():
    ok = bool(TRANSP_KEY)
    return {
        "sistema": "FNS / Portal da Transparência",
        "credenciais_configuradas": ok,
        "ibge_municipio": IBGE_APUI,
        "env_vars_necessarias": ["TRANSPARENCIA_API_KEY", "FNS_API_CPF", "FNS_API_SENHA"],
        "env_vars_ok": {"TRANSPARENCIA_API_KEY": ok, "FNS_API_CPF": bool(FNS_CPF), "FNS_API_SENHA": bool(FNS_SENHA)},
        "cache_ttl_minutos": 15,
        "ultima_verificacao": _ts(),
    }


@router.get("/transferencias")
async def transferencias():
    return await _get_transferencias_transparencia()


@router.get("/repasses-sus")
async def repasses_sus():
    cached = cache_get("fns_repasses_sus")
    if cached:
        return cached

    if not TRANSP_KEY:
        return {**_NAO_DISP, "ultima_atualizacao": _ts()}

    headers = {"chave-api": TRANSP_KEY, "Accept": "application/json"}
    url = f"{TRANSP_BASE}/transferencias"
    params = {"municipioNome": "APUI", "uf": "AM", "pagina": 1}

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            r = await client.get(url, headers=headers, params=params)
            r.raise_for_status()
            data = r.json()
            result = {"situacao_dado": "oficial_validado", "fonte": "api", "ultima_atualizacao": _ts(), "dados": data}
            cache_set("fns_repasses_sus", result, ttl=900)
            return result
    except Exception as e:
        return {**_NAO_DISP, "erro": str(e), "ultima_atualizacao": _ts()}


@router.get("/dashboard")
async def dashboard():
    tr = await _get_transferencias_transparencia()
    dados_api = tr.get("situacao_dado") == "oficial_validado"
    return {
        "situacao_dado": tr["situacao_dado"],
        "fonte": tr.get("fonte", "sem_dados"),
        "ultima_atualizacao": _ts(),
        "municipio": "Apuí/AM",
        "ibge": IBGE_APUI,
        "credenciais_ok": bool(TRANSP_KEY and FNS_CPF),
        "dados": tr.get("dados") if dados_api else None,
        "nota": None if dados_api else "Configure TRANSPARENCIA_API_KEY no Railway.",
    }
