"""
Router: /api/siaps — SIAPS / e-Gestor APS / Componente Qualidade
Autentica com SIAPS_CPF + SIAPS_SENHA (gov.br) ou EGESTOR_TOKEN direto.
Nunca inventa dados — retorna nao_disponivel quando sem acesso.
"""
from __future__ import annotations
import os
import time
import logging
from datetime import datetime

import httpx
from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut
from services.cache_service import cache_get, cache_set

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/siaps", tags=["SIAPS / eGestor APS"])

SIAPS_CPF    = os.getenv("SIAPS_CPF", "").strip().replace(".", "").replace("-", "")
SIAPS_SENHA  = os.getenv("SIAPS_SENHA", "").strip()
# Token Bearer direto (opcional — se informado, usa sem precisar autenticar)
EGESTOR_TOKEN = (
    os.getenv("EGESTOR_TOKEN")
    or os.getenv("SIAPS_TOKEN")
    or ""
)
IBGE_APUI   = "1300144"
IBGE6_APUI  = "130014"   # 6 dígitos para alguns endpoints
CNES_APUI   = os.getenv("CNES_APUI", "6820662")
EGESTOR_BASE = "https://apisiaps.saude.gov.br"
APISIAPS_BASE = "https://egestorab.saude.gov.br"
TIMEOUT     = 15.0

# Cache de token autenticado em memória
_auth_cache: dict = {}


async def _obter_token() -> str:
    """Retorna Bearer token: env var direta ou autentica via CPF+senha."""
    if EGESTOR_TOKEN:
        return EGESTOR_TOKEN

    # Verifica cache de auth
    cached = _auth_cache.get("token")
    expira = _auth_cache.get("expira", 0)
    if cached and expira > time.time():
        return cached

    if not SIAPS_CPF or not SIAPS_SENHA:
        return ""

    async with httpx.AsyncClient(timeout=15, verify=False, follow_redirects=True) as c:
        # Estratégia 1: login direto SIAPS
        try:
            r = await c.post(
                "https://siaps.saude.gov.br/api/auth/login",
                json={"cpf": SIAPS_CPF, "senha": SIAPS_SENHA},
                headers={"Content-Type": "application/json"},
            )
            if r.status_code in (200, 201):
                token = (r.json() or {}).get("access_token") or (r.json() or {}).get("token", "")
                if token:
                    _auth_cache["token"] = token
                    _auth_cache["expira"] = time.time() + 3300
                    logger.info("SIAPS: autenticado via SIAPS login")
                    return token
        except Exception:
            pass

        # Estratégia 2: OAuth2 gov.br
        for client_id in ("siaps", "egestor-aps", "gestaoaps"):
            try:
                r = await c.post(
                    "https://sso.acesso.gov.br/oauth2/token",
                    data={"grant_type": "password", "username": SIAPS_CPF,
                          "password": SIAPS_SENHA, "scope": "openid profile",
                          "client_id": client_id},
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                )
                if r.status_code == 200:
                    token = r.json().get("access_token", "")
                    if token:
                        _auth_cache["token"] = token
                        _auth_cache["expira"] = time.time() + int(r.json().get("expires_in", 3300))
                        logger.info("SIAPS: autenticado via gov.br OAuth2")
                        return token
            except Exception:
                pass

    logger.warning("SIAPS: autenticação falhou — CPF=%s", SIAPS_CPF[:4] + "***")
    return ""


def _ts():
    return datetime.now().strftime("%Y-%m-%dT%H:%M:%S")


def _nao_disp(motivo: str = ""):
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": (
            "Integração com e-Gestor APS indisponível. "
            "Configure SIAPS_CPF e SIAPS_SENHA no Railway. " + motivo
        ).strip(),
        "verificado_em": _ts(),
    }


async def _egestor_get(path: str, cache_key: str, params: dict = {}):
    """Chama e-Gestor APS autenticando dinamicamente se necessário."""
    cached = cache_get(cache_key)
    if cached:
        return cached

    token = await _obter_token()
    headers = {"Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    # Tenta egestorab e apisiaps (fallback público)
    urls_tentadas = [
        f"{EGESTOR_BASE}{path}",
        f"{APISIAPS_BASE}{path}",
    ]
    for url in urls_tentadas:
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT, verify=False, follow_redirects=True) as client:
                r = await client.get(url, headers=headers, params=params)
                if r.status_code == 401:
                    # Limpa cache de token e tenta sem auth
                    _auth_cache.clear()
                    continue
                if r.status_code == 200:
                    data = r.json()
                    result = {
                        "situacao_dado": "oficial_validado",
                        "fonte": "egestor_aps",
                        "ultima_atualizacao": _ts(),
                        "dados": data,
                    }
                    cache_set(cache_key, result, ttl=900)
                    cache_set(f"{cache_key}_last", result, ttl=86400)
                    return result
        except httpx.TimeoutException:
            continue
        except Exception as e:
            logger.debug("egestor_get %s → %s", url, e)
            continue

    last = cache_get(f"{cache_key}_last")
    if last:
        return {**last, "situacao_dado": "oficial_aguardando", "fonte": "cache"}
    return _nao_disp()


@router.get("/abrangencia")
async def abrangencia(_: UserOut = Depends(get_current_user)):
    """Abrangência municipal — equipes por tipo."""
    return await _egestor_get(
        "/componente/abrangencia",
        "siaps_abrangencia",
        {"coMunicipioIbge": IBGE_APUI, "competencias": "202605"},
    )


@router.get("/vinculo-acompanhamento")
async def vinculo_acompanhamento(_: UserOut = Depends(get_current_user)):
    """Componente Vínculo e Acompanhamento Territorial."""
    return await _egestor_get(
        "/componente/cvat/visao-competencia",
        "siaps_vinculo",
        {"coMunicipioIbge": IBGE_APUI, "competencias": "202605",
         "sgEquipes": "eAP,eSF", "stEquipeHomologada": "S",
         "page": "0", "size": "50"},
    )


@router.get("/qualidade")
async def componente_qualidade(_: UserOut = Depends(get_current_user)):
    """Componente Qualidade — indicadores Previne Brasil."""
    return await _egestor_get(
        "/componente/qualidade/resultado",
        "siaps_qualidade",
        {"coMunicipioIbge": IBGE_APUI, "competencias": "202605"},
    )


@router.get("/boas-praticas")
async def boas_praticas(_: UserOut = Depends(get_current_user)):
    """Componente Boas Práticas de Gestão."""
    return await _egestor_get(
        "/componente/boasPraticas",
        "siaps_boas_praticas",
        {"coMunicipioIbge": IBGE_APUI, "competencias": "202605"},
    )


@router.get("/dashboard")
async def dashboard_siaps(_: UserOut = Depends(get_current_user)):
    """Dashboard consolidado — tenta todos os componentes."""
    abr  = await _egestor_get("/componente/abrangencia",            "siaps_abrangencia", {"coMunicipioIbge": IBGE_APUI, "competencias": "202605"})
    qual = await _egestor_get("/componente/qualidade/resultado",    "siaps_qualidade",   {"coMunicipioIbge": IBGE_APUI, "competencias": "202605"})
    vinc = await _egestor_get("/componente/cvat/visao-competencia", "siaps_vinculo",     {"coMunicipioIbge": IBGE_APUI, "competencias": "202605", "page": "0", "size": "50"})

    algum_ok = any(
        d.get("situacao_dado") == "oficial_validado"
        for d in [abr, qual, vinc]
    )
    return {
        "situacao_dado": "oficial_validado" if algum_ok else "nao_disponivel",
        "dados": {
            "abrangencia":  abr.get("dados"),
            "qualidade":    qual.get("dados"),
            "vinculo":      vinc.get("dados"),
        } if algum_ok else None,
        "token_configurado": bool(EGESTOR_TOKEN or (SIAPS_CPF and SIAPS_SENHA)),
        "nota": None if algum_ok else "Configure SIAPS_CPF e SIAPS_SENHA no Railway para dados reais.",
        "verificado_em": _ts(),
    }


@router.post("/refresh-cache")
async def refresh_cache(_: UserOut = Depends(get_current_user)):
    """Invalida o cache e força nova busca no e-Gestor APS."""
    from services.cache_service import _store
    for key in ["siaps_abrangencia", "siaps_qualidade", "siaps_vinculo", "siaps_boas_praticas"]:
        _store.pop(key, None)
    return {
        "situacao_dado": "oficial_validado",
        "dados": {"cache_invalidado": True},
        "nota": "Cache limpo. Próxima consulta buscará dados frescos do e-Gestor APS.",
        "verificado_em": _ts(),
    }


@router.get("/diagnostico-api")
async def diagnostico_api():
    """Testa conectividade com o e-Gestor APS e retorna diagnóstico."""
    token = await _obter_token()
    auth_ok = bool(token)
    result = {
        "token_configurado": auth_ok,
        "siaps_cpf_configurado": bool(SIAPS_CPF),
        "egestor_token_configurado": bool(EGESTOR_TOKEN),
        "egestor_base": EGESTOR_BASE,
        "ibge": IBGE_APUI,
        "cnes": CNES_APUI,
        "verificado_em": _ts(),
    }

    headers = {"Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        async with httpx.AsyncClient(timeout=8.0, verify=False) as client:
            r = await client.get(
                f"{EGESTOR_BASE}/gestaoaps/api/abrangencia",
                headers=headers,
                params={"coIbge": IBGE_APUI, "nuCompetencia": "202604"},
            )
            result["http_status"] = r.status_code
            result["status"] = "ok" if r.status_code < 400 else "erro_http"
            result["nota"] = f"HTTP {r.status_code}"
    except Exception as e:
        result["status"] = "erro_conexao"
        result["nota"] = str(e)

    return result


@router.get("/qualidade/diario")
async def qualidade_diario(_: UserOut = Depends(get_current_user)):
    return await _egestor_get(
        "/componente/qualidade/resultado",
        "siaps_qualidade_diario",
        {"coMunicipioIbge": IBGE_APUI, "competencias": "202605", "tipo": "diario"},
    )


@router.get("/qualidade/mensal")
async def qualidade_mensal(_: UserOut = Depends(get_current_user)):
    return await _egestor_get(
        "/componente/qualidade/resultado",
        "siaps_qualidade_mensal",
        {"coMunicipioIbge": IBGE_APUI, "competencias": "202605", "tipo": "mensal"},
    )


@router.get("/qualidade/quadrimestral")
async def qualidade_quadrimestral(_: UserOut = Depends(get_current_user)):
    return await _egestor_get(
        "/componente/qualidade/resultado",
        "siaps_qualidade_quadrimestral",
        {"coMunicipioIbge": IBGE_APUI, "competencias": "202605", "tipo": "quadrimestral"},
    )
