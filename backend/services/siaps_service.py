"""
SIAPS Service — Integração com siaps.saude.gov.br
Busca dados de cofinanciamento APS em tempo real para Apuí/AM (IBGE 1300144).
"""
from __future__ import annotations
import logging
from datetime import datetime, timedelta
from typing import Optional

import httpx
from config import settings

logger = logging.getLogger(__name__)

IBGE = settings.FNS_MUNICIPIO_IBGE
TIMEOUT = 30

_token_cache: Optional[str] = None
_token_expira: Optional[datetime] = None


async def _autenticar() -> Optional[str]:
    global _token_cache, _token_expira

    if _token_cache and _token_expira and datetime.now() < _token_expira:
        return _token_cache

    if not settings.SIAPS_CPF or not settings.SIAPS_SENHA:
        logger.warning("SIAPS: credenciais não configuradas")
        return None

    cpf = settings.SIAPS_CPF.replace(".", "").replace("-", "").strip()

    endpoints = [
        f"{settings.SIAPS_API_BASE}/api/auth/login",
        f"{settings.SIAPS_API_BASE}/auth/token",
        "https://egestorab.saude.gov.br/gestaoaps/api/auth/login",
    ]

    for url in endpoints:
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT, verify=False) as client:
                r = await client.post(url, json={"cpf": cpf, "senha": settings.SIAPS_SENHA})
                if r.status_code in (200, 201):
                    data = r.json()
                    tok = data.get("access_token") or data.get("token") or data.get("accessToken")
                    if tok:
                        _token_cache = tok
                        _token_expira = datetime.now() + timedelta(hours=6)
                        logger.info("SIAPS: autenticado com sucesso")
                        return _token_cache
        except Exception as e:
            logger.debug("SIAPS auth tentativa %s: %s", url, e)

    # Tenta com refresh token se disponível
    if settings.SIAPS_REFRESH_TOKEN:
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT, verify=False) as client:
                r = await client.post(
                    f"{settings.SIAPS_API_BASE}/api/auth/refresh",
                    json={"refresh_token": settings.SIAPS_REFRESH_TOKEN},
                )
                if r.status_code in (200, 201):
                    data = r.json()
                    tok = data.get("access_token") or data.get("token")
                    if tok:
                        _token_cache = tok
                        _token_expira = datetime.now() + timedelta(hours=6)
                        return _token_cache
        except Exception as e:
            logger.debug("SIAPS refresh token: %s", e)

    logger.warning("SIAPS: não foi possível autenticar")
    return None


async def buscar_componente_qualidade(quadrimestre: str = "Q1/26") -> dict:
    """Busca dados do Componente Qualidade do SIAPS para Apuí/AM."""
    token = await _autenticar()

    endpoints = [
        f"{settings.SIAPS_API_BASE}/api/municipios/{IBGE}/qualidade",
        f"{settings.SIAPS_API_BASE}/api/cofinanciamento/qualidade?ibge={IBGE}&quadrimestre={quadrimestre}",
        f"https://egestorab.saude.gov.br/gestaoaps/api/municipios/{IBGE}/qualidade",
    ]

    headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"} if token else {}

    for url in endpoints:
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT, verify=False) as client:
                r = await client.get(url, headers=headers)
                if r.status_code == 200:
                    logger.info("SIAPS: dados de qualidade obtidos com sucesso")
                    return {"fonte": "siaps_live", "quadrimestre": quadrimestre, "dados": r.json()}
        except Exception as e:
            logger.debug("SIAPS qualidade tentativa %s: %s", url, e)

    logger.warning("SIAPS: usando dados em cache local")
    return {"fonte": "cache", "quadrimestre": quadrimestre, "dados": None}


async def buscar_componente_vinculo(quadrimestre: str = "Q1/26") -> dict:
    """Busca dados do Componente Vínculo e Acompanhamento Territorial."""
    token = await _autenticar()
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"} if token else {}

    endpoints = [
        f"{settings.SIAPS_API_BASE}/api/municipios/{IBGE}/vinculo",
        f"{settings.SIAPS_API_BASE}/api/cofinanciamento/vinculo?ibge={IBGE}&quadrimestre={quadrimestre}",
        f"https://egestorab.saude.gov.br/gestaoaps/api/municipios/{IBGE}/vinculo",
    ]

    for url in endpoints:
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT, verify=False) as client:
                r = await client.get(url, headers=headers)
                if r.status_code == 200:
                    return {"fonte": "siaps_live", "quadrimestre": quadrimestre, "dados": r.json()}
        except Exception as e:
            logger.debug("SIAPS vinculo %s: %s", url, e)

    return {"fonte": "cache", "quadrimestre": quadrimestre, "dados": None}


async def buscar_equipes_municipio() -> dict:
    """Busca equipes cadastradas no município via eGestor/SIAPS."""
    token = await _autenticar()
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"} if token else {}

    # Tenta também via eGestor token direto
    if settings.EGESTOR_TOKEN:
        headers["Authorization"] = f"Bearer {settings.EGESTOR_TOKEN}"

    endpoints = [
        f"https://egestorab.saude.gov.br/gestaoaps/api/municipios/{IBGE}/equipes",
        f"{settings.SIAPS_API_BASE}/api/municipios/{IBGE}/equipes",
        f"https://apidadosabertos.saude.gov.br/cnes/estabelecimentos?municipio_codigo={IBGE}&limit=100",
    ]

    for url in endpoints:
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT, verify=False) as client:
                r = await client.get(url, headers=headers)
                if r.status_code == 200:
                    logger.info("SIAPS: equipes obtidas de %s", url)
                    return {"fonte": "live", "dados": r.json()}
        except Exception as e:
            logger.debug("SIAPS equipes %s: %s", url, e)

    return {"fonte": "indisponivel", "dados": None}


async def buscar_status_integracao() -> dict:
    """Verifica status de conectividade com SIAPS/eGestor."""
    token = await _autenticar()
    return {
        "siaps_autenticado": token is not None,
        "egestor_token_configurado": bool(settings.EGESTOR_TOKEN),
        "siaps_credenciais_configuradas": bool(settings.SIAPS_CPF and settings.SIAPS_SENHA),
        "timestamp": datetime.now().isoformat(),
    }
