"""
Service: eSUS PEC Integration — Apuí/AM
Autentica via OAuth2, busca dados reais de visitas e cadastros.
Fallback automático para dados de referência se o PEC estiver indisponível.
"""
from __future__ import annotations
import os
import asyncio
from datetime import datetime, timedelta
from typing import Any
import httpx

ESUS_URL      = os.getenv("ESUS_URL",      "http://localhost:8080")
ESUS_USUARIO  = os.getenv("ESUS_USUARIO",  "")
ESUS_SENHA    = os.getenv("ESUS_SENHA",    "")
ESUS_CLIENT   = "microservice-client"
ESUS_SECRET   = "microsservice-secret"

_token_cache: dict[str, Any] = {}   # {"token": str, "expira": datetime}

TIMEOUT = httpx.Timeout(8.0)


async def _obter_token() -> str | None:
    """Autentica no PEC e retorna o access_token. Cache de 50 min."""
    agora = datetime.utcnow()
    if _token_cache.get("token") and _token_cache.get("expira", agora) > agora:
        return _token_cache["token"]

    if not ESUS_USUARIO or not ESUS_SENHA:
        return None

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, verify=False) as c:
            r = await c.post(
                f"{ESUS_URL}/oauth/token",
                auth=(ESUS_CLIENT, ESUS_SECRET),
                data={
                    "grant_type": "password",
                    "username": ESUS_USUARIO,
                    "password": ESUS_SENHA,
                    "scope": "read write",
                },
            )
            if r.status_code == 200:
                data = r.json()
                _token_cache["token"]  = data["access_token"]
                _token_cache["expira"] = agora + timedelta(minutes=50)
                return _token_cache["token"]
    except Exception:
        pass
    return None


async def _get(path: str, params: dict | None = None) -> dict | list | None:
    token = await _obter_token()
    if not token:
        return None
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, verify=False) as c:
            r = await c.get(
                f"{ESUS_URL}/api{path}",
                headers={"Authorization": f"Bearer {token}"},
                params=params or {},
            )
            if r.status_code == 200:
                return r.json()
    except Exception:
        pass
    return None


async def status_pec() -> dict:
    """Testa conectividade com o PEC."""
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(3.0), verify=False) as c:
            r = await c.get(f"{ESUS_URL}/api/info")
            if r.status_code < 500:
                token = await _obter_token()
                return {
                    "conectado": True,
                    "autenticado": token is not None,
                    "url": ESUS_URL,
                    "versao": r.json().get("versao", "?") if r.headers.get("content-type","").startswith("application/json") else "?",
                }
    except Exception:
        pass
    return {"conectado": False, "autenticado": False, "url": ESUS_URL, "versao": None}


async def visitas_domiciliares(cnes: str = "2801168", competencia: str | None = None) -> dict | None:
    """
    Busca ficha de visita domiciliar pelo CNES da UBS.
    Endpoint padrão eSUS PEC: /api/ficha-visita-domiciliar-master
    """
    if not competencia:
        agora = datetime.now()
        competencia = f"{agora.year}{agora.month:02d}"

    return await _get("/ficha-visita-domiciliar-master", {
        "cnes": cnes,
        "competencia": competencia,
    })


async def cadastros_individuais(cnes: str = "2801168", pagina: int = 0) -> dict | None:
    """Ficha de cadastro individual."""
    return await _get("/ficha-cadastro-individual", {
        "cnes": cnes,
        "page": pagina,
        "size": 100,
    })


async def cadastros_domiciliares(cnes: str = "2801168", pagina: int = 0) -> dict | None:
    """Ficha de cadastro domiciliar."""
    return await _get("/ficha-cadastro-domiciliar", {
        "cnes": cnes,
        "page": pagina,
        "size": 100,
    })


async def cidadaos(cnes: str = "2801168") -> dict | None:
    """Lista de cidadãos vinculados ao CNES."""
    return await _get("/cidadao", {"cnes": cnes, "size": 500})
