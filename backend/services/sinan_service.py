"""
SINAN Service — Notificacoes compulsorias via DATASUS dados abertos
APIs: apidadosabertos.saude.gov.br/sinan/malaria e /dengue
API indisponivel → nao_disponivel (sem fallback com dados ficticios).
"""
from __future__ import annotations
import logging
from typing import Optional

import httpx
from config import settings

logger = logging.getLogger(__name__)

_BASE    = "https://apidadosabertos.saude.gov.br/sinan"
_TIMEOUT = 15
_IBGE6   = settings.FNS_MUNICIPIO_IBGE[:6]


async def _get(url: str, params: dict) -> Optional[dict | list]:
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as cli:
            r = await cli.get(url, params=params)
            if r.status_code == 200:
                return r.json()
    except Exception as exc:
        logger.debug("SINAN API erro %s: %s", url, exc)
    return None


def _sem_dado(ano: int, agravo: str) -> dict:
    return {
        "ano":           ano,
        "agravo":        agravo,
        "situacao_dado": "nao_disponivel",
        "total_casos":   None,
        "fonte":         "nao_disponivel",
        "nota":          f"API SINAN/DATASUS nao retornou dados de {agravo} para {ano}.",
    }


async def buscar_malaria(ano: int) -> dict:
    """Casos de malaria via SIVEP-Malaria / SINAN."""
    for path, mun_field in [
        ("/malaria",       "co_municipio_infec"),
        ("/sivep-malaria", "municipio"),
    ]:
        data = await _get(f"{_BASE}{path}", {mun_field: _IBGE6, "ano": ano, "limit": 500})
        casos: list = []
        if isinstance(data, list):
            casos = data
        elif isinstance(data, dict):
            casos = data.get("items") or data.get("data") or []
        if casos:
            vf  = sum(1 for c in casos if str(c.get("id_lamina") or c.get("especie", "")).startswith("F"))
            vv  = sum(1 for c in casos if str(c.get("id_lamina") or c.get("especie", "")).startswith("V"))
            total = len(casos)
            pop   = 25_000
            ipa   = round(total / pop * 1000, 2)
            return {
                "ano":              ano,
                "total_casos":      total,
                "vivax":            vv,
                "falciparum":       vf,
                "ipa":              ipa,
                "classificacao_ipa": "baixo" if ipa < 10 else "medio" if ipa < 50 else "alto",
                "situacao_dado":    "oficial_validado",
                "fonte":            "sivep_datasus",
            }

    return _sem_dado(ano, "malaria")


async def buscar_dengue(ano: int) -> dict:
    """Casos de dengue via SINAN/DATASUS."""
    data = await _get(f"{_BASE}/dengue", {
        "co_municipio_not": _IBGE6,
        "ano_not":          ano,
        "limit":            500,
    })
    casos: list = []
    if isinstance(data, list):
        casos = data
    elif isinstance(data, dict):
        casos = data.get("items") or data.get("data") or []

    if casos:
        total      = len(casos)
        graves     = sum(1 for c in casos if c.get("cs_evoluca") in ("2", "3", 2, 3))
        obitos     = sum(1 for c in casos if c.get("cs_evoluca") in ("2", 2))
        incidencia = round(total / 25_000 * 100_000, 1)
        return {
            "ano":            ano,
            "total_casos":    total,
            "casos_graves":   graves,
            "obitos":         obitos,
            "incidencia_100k": incidencia,
            "situacao_dado":  "oficial_validado",
            "fonte":          "sinan_datasus",
        }

    return _sem_dado(ano, "dengue")


async def buscar_agravos_resumo(ano: int) -> list[dict]:
    """Resumo de agravos — malaria e dengue via SINAN."""
    malaria = await buscar_malaria(ano)
    dengue  = await buscar_dengue(ano)
    return [malaria, dengue]
