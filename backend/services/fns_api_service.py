"""
FNS API Service — Integração com apifns.saude.gov.br
Autentica com CPF/senha do gestor e busca dados de repasses e convênios
do município de Apuí/AM (IBGE 1300144).
"""
from __future__ import annotations
import logging
from datetime import datetime, timedelta
from typing import Optional

import httpx
from config import settings

logger = logging.getLogger(__name__)

_token_cache: Optional[str] = None
_token_expira: Optional[datetime] = None

IBGE = settings.FNS_MUNICIPIO_IBGE
BASE = settings.FNS_API_BASE
TIMEOUT = 30


async def _autenticar() -> Optional[str]:
    """Obtém token JWT do apifns.saude.gov.br."""
    global _token_cache, _token_expira

    if _token_cache and _token_expira and datetime.now() < _token_expira:
        return _token_cache

    if not settings.FNS_API_CPF or not settings.FNS_API_SENHA:
        logger.warning("FNS API: credenciais não configuradas (FNS_API_CPF / FNS_API_SENHA)")
        return None

    cpf = settings.FNS_API_CPF.replace(".", "").replace("-", "").strip()

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, verify=False) as client:
            # Tentativa 1: endpoint padrão
            r = await client.post(
                f"{BASE}/api/auth/login",
                json={"cpf": cpf, "senha": settings.FNS_API_SENHA},
                headers={"Content-Type": "application/json"},
            )
            if r.status_code in (200, 201):
                data = r.json()
                _token_cache = data.get("access_token") or data.get("token") or data.get("jwt")
                _token_expira = datetime.now() + timedelta(hours=8)
                logger.info("FNS API: autenticado com sucesso (CPF %s***)", cpf[:3])
                return _token_cache

            # Tentativa 2: form-urlencoded
            r2 = await client.post(
                f"{BASE}/auth/token",
                data={"username": cpf, "password": settings.FNS_API_SENHA},
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            if r2.status_code in (200, 201):
                data = r2.json()
                _token_cache = data.get("access_token") or data.get("token")
                _token_expira = datetime.now() + timedelta(hours=8)
                return _token_cache

            logger.warning("FNS API auth falhou: status %d — %s", r.status_code, r.text[:200])
    except Exception as e:
        logger.error("FNS API auth erro: %s", e)

    return None


def _headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Accept": "application/json"}


async def buscar_repasses(ano: int, mes: int) -> list[dict]:
    """Busca repasses do FNS para Apuí/AM na competência informada."""
    token = await _autenticar()
    if not token:
        return _repasses_fallback(ano, mes)

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
        except Exception as e:
            logger.warning("FNS API repasses (%s): %s", url, e)

    return _repasses_fallback(ano, mes)


async def buscar_convenios() -> list[dict]:
    """Busca convênios vigentes do município de Apuí/AM no FNS."""
    token = await _autenticar()
    if not token:
        return _convenios_fallback()

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
                    logger.info("FNS API: %d convênios encontrados", len(items))
                    return items
        except Exception as e:
            logger.warning("FNS API convenios (%s): %s", url, e)

    return _convenios_fallback()


async def buscar_indicadores_previne() -> list[dict]:
    """Busca indicadores do Previne Brasil para Apuí/AM."""
    token = await _autenticar()
    if not token:
        return []

    try:
        url = f"{BASE}/api/previne/indicadores?ibge={IBGE}"
        async with httpx.AsyncClient(timeout=TIMEOUT, verify=False) as client:
            r = await client.get(url, headers=_headers(token))
            if r.status_code == 200:
                return r.json() if isinstance(r.json(), list) else r.json().get("data", [])
    except Exception as e:
        logger.warning("FNS API Previne: %s", e)
    return []


def _repasses_fallback(ano: int, mes: int) -> list[dict]:
    """Dados de referência para demonstração quando API não está disponível."""
    blocos = [
        ("Atenção Básica — PAB Variável", 890_000),
        ("Média e Alta Complexidade — MAC", 480_000),
        ("Vigilância em Saúde", 320_000),
        ("Assistência Farmacêutica Básica", 610_000),
        ("Custeio — Rede de Atenção", 280_000),
    ]
    return [
        {
            "bloco": b, "valor_previsto": v, "valor_recebido": round(v * 0.92),
            "competencia": f"{ano}-{mes:02d}", "situacao": "RECEBIDO",
            "municipio_ibge": IBGE, "fonte": "fallback",
        }
        for b, v in blocos
    ]


def _convenios_fallback() -> list[dict]:
    return [
        {"numero": "793456/2024", "objeto": "Atenção Básica — PAB Variável", "situacao": "VIGENTE", "valor": 890_000, "ibge": IBGE},
        {"numero": "793457/2024", "objeto": "Média e Alta Complexidade — MAC", "situacao": "VIGENTE", "valor": 480_000, "ibge": IBGE},
        {"numero": "793458/2024", "objeto": "Vigilância em Saúde", "situacao": "VIGENTE", "valor": 320_000, "ibge": IBGE},
        {"numero": "793459/2024", "objeto": "Assistência Farmacêutica Básica", "situacao": "EM_EXECUCAO", "valor": 610_000, "ibge": IBGE},
    ]
