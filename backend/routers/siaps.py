"""
Router: /api/siaps — SIAPS / e-Gestor APS / Componente Qualidade
Tenta chamadas reais ao e-Gestor APS com o token configurado no Railway.
Env vars: EGESTOR_TOKEN ou siaps_token (ambos tentados).
Nunca inventa dados — retorna nao_disponivel quando sem acesso.
"""
from __future__ import annotations
import os
from datetime import datetime

import httpx
from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut
from services.cache_service import cache_get, cache_set

router = APIRouter(prefix="/api/siaps", tags=["SIAPS / eGestor APS"])

# Tenta as duas variantes de case (Railway Linux é case-sensitive)
EGESTOR_TOKEN = (
    os.getenv("EGESTOR_TOKEN")
    or os.getenv("egestor_token")
    or os.getenv("siaps_token")
    or os.getenv("SIAPS_TOKEN")
    or ""
)
IBGE_APUI   = "1300144"
IBGE6_APUI  = "130014"   # 6 dígitos para alguns endpoints
CNES_APUI   = os.getenv("CNES_APUI", "6820662")
EGESTOR_BASE = "https://egestorab.saude.gov.br"
TIMEOUT     = 15.0


def _ts():
    return datetime.now().strftime("%Y-%m-%dT%H:%M:%S")


def _nao_disp(motivo: str = ""):
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": (
            f"Integração com e-Gestor APS não configurada. "
            f"Configure EGESTOR_TOKEN no Railway. {motivo}"
        ).strip(),
        "verificado_em": _ts(),
    }


def _headers():
    if EGESTOR_TOKEN:
        return {
            "Authorization": f"Bearer {EGESTOR_TOKEN}",
            "Accept": "application/json",
        }
    return {"Accept": "application/json"}


def _token_ok():
    return bool(EGESTOR_TOKEN)


async def _egestor_get(path: str, cache_key: str, params: dict = {}):
    """Chama e-Gestor APS e retorna resultado padronizado."""
    cached = cache_get(cache_key)
    if cached:
        return cached

    if not _token_ok():
        return _nao_disp()

    url = f"{EGESTOR_BASE}{path}"
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as client:
            r = await client.get(url, headers=_headers(), params=params)
            if r.status_code == 401:
                return _nao_disp("Token inválido ou expirado.")
            if r.status_code == 403:
                return _nao_disp("Acesso negado. Verifique permissões do token.")
            r.raise_for_status()
            data = r.json()
            result = {
                "situacao_dado": "oficial_validado",
                "fonte": "egestor_aps",
                "ultima_atualizacao": _ts(),
                "dados": data,
            }
            cache_set(cache_key, result, ttl=900)
            return result
    except httpx.TimeoutException:
        return _nao_disp("Timeout ao conectar ao e-Gestor APS.")
    except Exception as e:
        last = cache_get(f"{cache_key}_last")
        if last:
            return {**last, "situacao_dado": "oficial_aguardando", "fonte": "cache", "nota_cache": str(e)}
        return _nao_disp(f"Erro: {e}")


@router.get("/abrangencia")
async def abrangencia(_: UserOut = Depends(get_current_user)):
    """Abrangência municipal — equipes por tipo."""
    return await _egestor_get(
        "/gestaoaps/api/abrangencia",
        "siaps_abrangencia",
        {"coIbge": IBGE_APUI, "nuCompetencia": "202604"},
    )


@router.get("/vinculo-acompanhamento")
async def vinculo_acompanhamento(_: UserOut = Depends(get_current_user)):
    """Componente Vínculo e Acompanhamento Territorial."""
    return await _egestor_get(
        "/gestaoaps/api/vinculo",
        "siaps_vinculo",
        {"coIbge": IBGE_APUI, "nuCompetencia": "202604"},
    )


@router.get("/qualidade")
async def componente_qualidade(_: UserOut = Depends(get_current_user)):
    """Componente Qualidade — indicadores Previne Brasil."""
    return await _egestor_get(
        "/gestaoaps/api/resultado",
        "siaps_qualidade",
        {"coIbge": IBGE_APUI, "nuCompetencia": "202604"},
    )


@router.get("/boas-praticas")
async def boas_praticas(_: UserOut = Depends(get_current_user)):
    """Componente Boas Práticas de Gestão."""
    return await _egestor_get(
        "/gestaoaps/api/boasPraticas",
        "siaps_boas_praticas",
        {"coIbge": IBGE_APUI, "nuCompetencia": "202604"},
    )


@router.get("/dashboard")
async def dashboard_siaps(_: UserOut = Depends(get_current_user)):
    """Dashboard consolidado — tenta todos os componentes."""
    abr  = await _egestor_get("/gestaoaps/api/abrangencia",  "siaps_abrangencia",   {"coIbge": IBGE_APUI})
    qual = await _egestor_get("/gestaoaps/api/resultado",    "siaps_qualidade",     {"coIbge": IBGE_APUI})
    vinc = await _egestor_get("/gestaoaps/api/vinculo",      "siaps_vinculo",       {"coIbge": IBGE_APUI})

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
        "token_configurado": _token_ok(),
        "nota": None if algum_ok else "Configure EGESTOR_TOKEN no Railway para dados reais.",
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
    token_ok = _token_ok()
    result = {
        "token_configurado": token_ok,
        "egestor_base": EGESTOR_BASE,
        "ibge": IBGE_APUI,
        "cnes": CNES_APUI,
        "verificado_em": _ts(),
    }

    if not token_ok:
        result["status"] = "sem_token"
        result["nota"] = "Configure EGESTOR_TOKEN no Railway."
        return result

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.get(
                f"{EGESTOR_BASE}/gestaoaps/api/abrangencia",
                headers=_headers(),
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
        "/gestaoaps/api/resultado",
        "siaps_qualidade_diario",
        {"coIbge": IBGE_APUI, "nuCompetencia": "202604", "tipo": "diario"},
    )


@router.get("/qualidade/mensal")
async def qualidade_mensal(_: UserOut = Depends(get_current_user)):
    return await _egestor_get(
        "/gestaoaps/api/resultado",
        "siaps_qualidade_mensal",
        {"coIbge": IBGE_APUI, "nuCompetencia": "202604", "tipo": "mensal"},
    )


@router.get("/qualidade/quadrimestral")
async def qualidade_quadrimestral(_: UserOut = Depends(get_current_user)):
    return await _egestor_get(
        "/gestaoaps/api/resultado",
        "siaps_qualidade_quadrimestral",
        {"coIbge": IBGE_APUI, "nuCompetencia": "202604", "tipo": "quadrimestral"},
    )
