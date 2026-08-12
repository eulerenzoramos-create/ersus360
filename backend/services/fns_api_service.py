"""
FNS API Service — Integracao com apifns.saude.gov.br
Autentica com CPF/senha do gestor (Railway env vars) e busca repasses e convenios.
Sem credenciais ou API indisponivel → nao_disponivel (sem dados ficticios).
"""
from __future__ import annotations
import logging
from datetime import datetime, timedelta
from typing import Optional

import httpx
from config import settings

logger = logging.getLogger(__name__)

_token_cache:  Optional[str]      = None
_token_expira: Optional[datetime] = None

IBGE    = settings.FNS_MUNICIPIO_IBGE
BASE    = settings.FNS_API_BASE
TIMEOUT = 30


async def _autenticar() -> Optional[str]:
    """Obtem token JWT do apifns.saude.gov.br via credenciais do Railway."""
    global _token_cache, _token_expira

    if _token_cache and _token_expira and datetime.now() < _token_expira:
        return _token_cache

    if not settings.FNS_API_CPF or not settings.FNS_API_SENHA:
        logger.warning("FNS API: credenciais nao configuradas (FNS_API_CPF / FNS_API_SENHA)")
        return None

    cpf = settings.FNS_API_CPF.replace(".", "").replace("-", "").strip()

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, verify=False) as client:
            r = await client.post(
                f"{BASE}/api/auth/login",
                json={"cpf": cpf, "senha": settings.FNS_API_SENHA},
                headers={"Content-Type": "application/json"},
            )
            if r.status_code in (200, 201):
                data = r.json()
                _token_cache  = data.get("access_token") or data.get("token") or data.get("jwt")
                _token_expira = datetime.now() + timedelta(hours=8)
                logger.info("FNS API: autenticado (CPF %s***)", cpf[:3])
                return _token_cache

            r2 = await client.post(
                f"{BASE}/auth/token",
                data={"username": cpf, "password": settings.FNS_API_SENHA},
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            if r2.status_code in (200, 201):
                data = r2.json()
                _token_cache  = data.get("access_token") or data.get("token")
                _token_expira = datetime.now() + timedelta(hours=8)
                return _token_cache

            logger.warning("FNS API auth falhou: status %d", r.status_code)
    except Exception as exc:
        logger.error("FNS API auth erro: %s", exc)

    return None


def _headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Accept": "application/json"}


def _sem_dado(tipo: str) -> list:
    return []


async def buscar_repasses(ano: int, mes: int) -> list[dict]:
    """Repasses do FNS para o municipio — lista vazia se API indisponivel."""
    token = await _autenticar()
    if not token:
        return []

    competencia = f"{ano}{mes:02d}"
    endpoints = [
        f"{BASE}/api/repasse/municipio/{IBGE}/competencia/{competencia}",
        f"{BASE}/api/transferencias?municipio={IBGE}&competencia={competencia}",
        f"{BASE}/repasses?ibge={IBGE}&ano={ano}&mes={mes}",
    ]

    for url in endpoints:
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT, verify=False) as client:
                r = await client.get(url, headers=_headers(token))
                if r.status_code == 200:
                    data = r.json()
                    items = data if isinstance(data, list) else data.get("content", data.get("data", []))
                    logger.info("FNS API: %d repasses para %s/%s", len(items), mes, ano)
                    return items
        except Exception as exc:
            logger.warning("FNS API repasses (%s): %s", url, exc)

    return []


async def buscar_convenios() -> list[dict]:
    """Convenios vigentes do municipio — lista vazia se API indisponivel."""
    token = await _autenticar()
    if not token:
        return []

    endpoints = [
        f"{BASE}/api/convenio/municipio/{IBGE}",
        f"{BASE}/api/convenios?municipio={IBGE}&situacao=VIGENTE",
    ]

    for url in endpoints:
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT, verify=False) as client:
                r = await client.get(url, headers=_headers(token))
                if r.status_code == 200:
                    data = r.json()
                    items = data if isinstance(data, list) else data.get("content", [])
                    logger.info("FNS API: %d convenios encontrados", len(items))
                    return items
        except Exception as exc:
            logger.warning("FNS API convenios (%s): %s", url, exc)

    return []


async def buscar_indicadores_previne() -> list[dict]:
    """Indicadores Novo Financiamento APS — lista vazia se API indisponivel."""
    token = await _autenticar()
    if not token:
        return []

    try:
        url = f"{BASE}/api/previne/indicadores?ibge={IBGE}"
        async with httpx.AsyncClient(timeout=TIMEOUT, verify=False) as client:
            r = await client.get(url, headers=_headers(token))
            if r.status_code == 200:
                return r.json() if isinstance(r.json(), list) else r.json().get("data", [])
    except Exception as exc:
        logger.warning("FNS API Previne: %s", exc)
    return []
