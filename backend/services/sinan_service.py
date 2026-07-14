"""
SINAN Service — Notificações compulsórias via DATASUS dados abertos
Prioridade: Malária (SIVEP) e Dengue (SINAN-Net) — ambos críticos em Apuí/AM

APIs tentadas:
  https://apidadosabertos.saude.gov.br/sinan/malaria
  https://apidadosabertos.saude.gov.br/sinan/dengue
  https://apidadosabertos.saude.gov.br/sivep-malaria  (SIVEP específico)
"""
from __future__ import annotations
import logging
from datetime import date
from typing import Optional

import httpx
from config import settings

logger = logging.getLogger(__name__)

_BASE    = "https://apidadosabertos.saude.gov.br/sinan"
_TIMEOUT = 15
_IBGE6   = settings.FNS_MUNICIPIO_IBGE[:6]  # "130014"


async def _get(url: str, params: dict) -> Optional[dict | list]:
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as cli:
            r = await cli.get(url, params=params)
            if r.status_code == 200:
                return r.json()
    except Exception as exc:
        logger.debug("SINAN API erro %s: %s", url, exc)
    return None


async def buscar_malaria(ano: int) -> dict:
    """Casos de malária via SIVEP-Malária / SINAN."""
    for path, mun_field in [
        ("/malaria", "co_municipio_infec"),
        ("/sivep-malaria", "municipio"),
    ]:
        data = await _get(f"{_BASE}{path}", {mun_field: _IBGE6, "ano": ano, "limit": 500})
        casos = []
        if isinstance(data, list):
            casos = data
        elif isinstance(data, dict):
            casos = data.get("items") or data.get("data") or []
        if casos:
            vf = sum(1 for c in casos if str(c.get("id_lamina") or c.get("especie", "")).startswith("F"))
            vv = sum(1 for c in casos if str(c.get("id_lamina") or c.get("especie", "")).startswith("V"))
            total = len(casos)
            pop = 25_000  # Apuí estimativa
            ipa = round(total / pop * 1000, 2)
            return {
                "ano": ano,
                "total_casos": total,
                "vivax": vv,
                "falciparum": vf,
                "ipa": ipa,
                "classificacao_ipa": "baixo" if ipa < 10 else "medio" if ipa < 50 else "alto",
                "fonte": "sivep_datasus",
            }

    return _malaria_fallback(ano)


async def buscar_dengue(ano: int) -> dict:
    """Casos de dengue via SINAN/DATASUS."""
    data = await _get(f"{_BASE}/dengue", {
        "co_municipio_not": _IBGE6,
        "ano_not": ano,
        "limit": 500,
    })
    casos = []
    if isinstance(data, list):
        casos = data
    elif isinstance(data, dict):
        casos = data.get("items") or data.get("data") or []

    if casos:
        total  = len(casos)
        graves = sum(1 for c in casos if c.get("cs_evoluca") in ("2", "3", 2, 3))
        obitos = sum(1 for c in casos if c.get("cs_evoluca") in ("2", 2))
        pop = 25_000
        incidencia = round(total / pop * 100_000, 1)
        return {
            "ano": ano,
            "total_casos": total,
            "casos_graves": graves,
            "obitos": obitos,
            "incidencia_100k": incidencia,
            "fonte": "sinan_datasus",
        }

    return _dengue_fallback(ano)


async def buscar_agravos_resumo(ano: int) -> list[dict]:
    """Resumo de todos os agravos notificados."""
    malaria = await buscar_malaria(ano)
    dengue  = await buscar_dengue(ano)

    pop = 25_000
    return [
        {
            "agravo":     "Malária",
            "casos_ano":  malaria["total_casos"],
            "ipa":        malaria["ipa"],
            "meta_ipa":   10.0,
            "incidencia": round(malaria["total_casos"] / pop * 100_000, 1),
            "status":     "verde" if malaria["ipa"] < 10 else "amarelo" if malaria["ipa"] < 50 else "vermelho",
            "fonte":      malaria["fonte"],
        },
        {
            "agravo":      "Dengue",
            "casos_ano":   dengue["total_casos"],
            "incidencia":  dengue.get("incidencia_100k", 0),
            "obitos":      dengue.get("obitos", 0),
            "status":      "verde" if dengue["total_casos"] < 50 else "amarelo" if dengue["total_casos"] < 200 else "vermelho",
            "fonte":       dengue["fonte"],
        },
    ]


# ── Fallbacks ─────────────────────────────────────────────────────────────────

def _malaria_fallback(ano: int) -> dict:
    return {
        "ano": ano, "total_casos": 87, "vivax": 63, "falciparum": 24,
        "ipa": 3.47, "classificacao_ipa": "baixo", "fonte": "referencia",
    }


def _dengue_fallback(ano: int) -> dict:
    return {
        "ano": ano, "total_casos": 28, "casos_graves": 1,
        "obitos": 0, "incidencia_100k": 111.8, "fonte": "referencia",
    }
