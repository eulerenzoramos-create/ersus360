"""
SIAPS Service — Integração com siaps.saude.gov.br
Busca dados de cofinanciamento APS do município da sessão (credenciais próprias).
"""
from __future__ import annotations
import logging
from datetime import datetime, timedelta
from typing import Optional

import httpx
from config import settings
from tenancy.contexto import ibge7
from tenancy.credenciais import credencial, configurado

logger = logging.getLogger(__name__)

TIMEOUT = 30

# Token por município (IBGE) — nunca reaproveitado entre municípios
_tokens: dict[str, tuple[Optional[str], datetime]] = {}


def _token_em_cache() -> Optional[str]:
    item = _tokens.get(ibge7())
    return item[0] if item and item[0] and datetime.now() < item[1] else None


def _guardar(token: Optional[str], horas: int) -> Optional[str]:
    _tokens[ibge7()] = (token, datetime.now() + timedelta(hours=horas))
    return token


async def _autenticar() -> Optional[str]:
    em_cache = _token_em_cache()
    if em_cache:
        return em_cache

    if not (credencial("SIAPS", "CPF") and credencial("SIAPS", "SENHA")):
        logger.info("SIAPS: credenciais do município %s não configuradas", ibge7())
        return None

    cpf = credencial("SIAPS", "CPF").replace(".", "").replace("-", "").strip()

    endpoints = [
        f"{settings.SIAPS_API_BASE}/api/auth/login",
        f"{settings.SIAPS_API_BASE}/auth/token",
        "https://egestorab.saude.gov.br/gestaoaps/api/auth/login",
    ]

    for url in endpoints:
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT, verify=False) as client:
                r = await client.post(url, json={"cpf": cpf, "senha": credencial("SIAPS", "SENHA")})
                if r.status_code in (200, 201):
                    data = r.json()
                    tok = data.get("access_token") or data.get("token") or data.get("accessToken")
                    if tok:
                        _guardar(tok, 6)
                        logger.info("SIAPS: autenticado com sucesso")
                        return _token_em_cache()
        except Exception as e:
            logger.debug("SIAPS auth tentativa %s: %s", url, e)

    # Tenta com refresh token se disponível
    if credencial("SIAPS", "REFRESH_TOKEN"):
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT, verify=False) as client:
                r = await client.post(
                    f"{settings.SIAPS_API_BASE}/api/auth/refresh",
                    json={"refresh_token": credencial("SIAPS", "REFRESH_TOKEN")},
                )
                if r.status_code in (200, 201):
                    data = r.json()
                    tok = data.get("access_token") or data.get("token")
                    if tok:
                        _guardar(tok, 6)
                        return _token_em_cache()
        except Exception as e:
            logger.debug("SIAPS refresh token: %s", e)

    logger.warning("SIAPS: não foi possível autenticar")
    return None


async def buscar_componente_qualidade(quadrimestre: str = "Q1/26") -> dict:
    """Busca dados do Componente Qualidade do SIAPS para Apuí/AM."""
    token = await _autenticar()

    endpoints = [
        f"{settings.SIAPS_API_BASE}/api/municipios/{ibge7()}/qualidade",
        f"{settings.SIAPS_API_BASE}/api/cofinanciamento/qualidade?ibge={ibge7()}&quadrimestre={quadrimestre}",
        f"https://egestorab.saude.gov.br/gestaoaps/api/municipios/{ibge7()}/qualidade",
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
        f"{settings.SIAPS_API_BASE}/api/municipios/{ibge7()}/vinculo",
        f"{settings.SIAPS_API_BASE}/api/cofinanciamento/vinculo?ibge={ibge7()}&quadrimestre={quadrimestre}",
        f"https://egestorab.saude.gov.br/gestaoaps/api/municipios/{ibge7()}/vinculo",
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
    if credencial("EGESTOR", "TOKEN"):
        headers["Authorization"] = f"Bearer {credencial("EGESTOR", "TOKEN")}"

    endpoints = [
        f"https://egestorab.saude.gov.br/gestaoaps/api/municipios/{ibge7()}/equipes",
        f"{settings.SIAPS_API_BASE}/api/municipios/{ibge7()}/equipes",
        f"https://apidadosabertos.saude.gov.br/cnes/estabelecimentos?municipio_codigo={ibge7()}&limit=100",
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
        "egestor_token_configurado": bool(credencial("EGESTOR", "TOKEN")),
        "siaps_credenciais_configuradas": bool(credencial("SIAPS", "CPF") and credencial("SIAPS", "SENHA")),
        "timestamp": datetime.now().isoformat(),
    }
