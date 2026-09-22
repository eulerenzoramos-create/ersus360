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
from tenancy.contexto import ibge7
from tenancy.credenciais import credencial, configurado

logger = logging.getLogger(__name__)

# Token por município (IBGE) — nunca reaproveitado entre municípios
_tokens: dict[str, tuple[Optional[str], datetime]] = {}


def _token_em_cache() -> Optional[str]:
    item = _tokens.get(ibge7())
    return item[0] if item and item[0] and datetime.now() < item[1] else None


def _guardar(token: Optional[str], horas: int) -> Optional[str]:
    _tokens[ibge7()] = (token, datetime.now() + timedelta(hours=horas))
    return token

BASE    = settings.FNS_API_BASE
TIMEOUT = 30


async def _autenticar() -> Optional[str]:
    """Obtem token JWT do apifns.saude.gov.br via credenciais do Railway."""
    em_cache = _token_em_cache()
    if em_cache:
        return em_cache

    if not configurado("FNS"):
        logger.info("FNS API: credenciais do município %s não configuradas", ibge7())
        return None

    cpf = credencial("FNS", "CPF").replace(".", "").replace("-", "").strip()

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, verify=False) as client:
            r = await client.post(
                f"{BASE}/api/auth/login",
                json={"cpf": cpf, "senha": credencial("FNS", "SENHA")},
                headers={"Content-Type": "application/json"},
            )
            if r.status_code in (200, 201):
                data = r.json()
                _guardar(data.get("access_token") or data.get("token") or data.get("jwt"), 8)
                logger.info("FNS API: autenticado (CPF %s***)", cpf[:3])
                return _token_em_cache()

            r2 = await client.post(
                f"{BASE}/auth/token",
                data={"username": cpf, "password": credencial("FNS", "SENHA")},
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            if r2.status_code in (200, 201):
                data = r2.json()
                _guardar(data.get("access_token") or data.get("token"), 8)
                return _token_em_cache()

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
        f"{BASE}/api/repasse/municipio/{ibge7()}/competencia/{competencia}",
        f"{BASE}/api/transferencias?municipio={ibge7()}&competencia={competencia}",
        f"{BASE}/repasses?ibge={ibge7()}&ano={ano}&mes={mes}",
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
        f"{BASE}/api/convenio/municipio/{ibge7()}",
        f"{BASE}/api/convenios?municipio={ibge7()}&situacao=VIGENTE",
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
        url = f"{BASE}/api/previne/indicadores?ibge={ibge7()}"
        async with httpx.AsyncClient(timeout=TIMEOUT, verify=False) as client:
            r = await client.get(url, headers=_headers(token))
            if r.status_code == 200:
                return r.json() if isinstance(r.json(), list) else r.json().get("data", [])
    except Exception as exc:
        logger.warning("FNS API Previne: %s", exc)
    return []


async def resumo_indicadores_aps(ano: int | None = None) -> dict:
    """Resumo dos indicadores do financiamento APS para os painéis:
    {situacao_dado, indicadores, ano}. Sem dado da API = não disponível."""
    lista = await buscar_indicadores_previne()
    return {
        "situacao_dado": "oficial_validado" if lista else "nao_disponivel",
        "indicadores": lista or None,
        "ano": ano,
    }
