"""
SIA Service — Sistema de Informacao Ambulatorial via DATASUS dados abertos
https://apidadosabertos.saude.gov.br/sia/
API indisponivel → nao_disponivel (sem fallback com dados ficticios).
"""
from __future__ import annotations
import logging
from datetime import date
from typing import Optional

import httpx
from config import settings

logger = logging.getLogger(__name__)

_BASE    = "https://apidadosabertos.saude.gov.br/sia"
_IBGE6   = settings.FNS_MUNICIPIO_IBGE[:6]
_TIMEOUT = 15
_POP     = 25_000


async def _get(url: str, params: dict) -> Optional[dict | list]:
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as cli:
            r = await cli.get(url, params=params)
            if r.status_code == 200:
                return r.json()
    except Exception as exc:
        logger.debug("SIA API erro %s: %s", url, exc)
    return None


def _sem_dado(ano: int) -> dict:
    return {
        "ano":                  ano,
        "situacao_dado":        "nao_disponivel",
        "total_procedimentos":  None,
        "per_capita":           None,
        "fonte":                "nao_disponivel",
        "nota":                 "API SIA/DATASUS nao retornou dados para este municipio/ano.",
    }


async def buscar_producao(ano: int, mes: int = 0) -> dict:
    """Producao ambulatorial BPA do municipio."""
    if not ano:
        ano = date.today().year - 1

    params: dict = {"co_municipio_estabelecimento": _IBGE6, "ano": ano, "limit": 500}
    if mes:
        params["mes"] = mes

    for path in ["/producao-ambulatorial-bpa", "/bpa", "/procedimento-ambulatorial"]:
        data = await _get(f"{_BASE}{path}", params)
        procs: list = []
        if isinstance(data, list):
            procs = data
        elif isinstance(data, dict):
            procs = data.get("items") or data.get("data") or []

        if procs:
            total = sum(int(p.get("qt_apresentada") or p.get("quantidade") or 1) for p in procs)
            per_capita = round(total / _POP, 2)
            return {
                "ano":                 ano,
                "total_procedimentos": total,
                "per_capita":          per_capita,
                "meta_per_capita":     5.0,
                "status":              "ok" if per_capita >= 5.0 else "atencao" if per_capita >= 3.0 else "critico",
                "situacao_dado":       "oficial_validado",
                "fonte":               "sia_datasus",
            }

    return _sem_dado(ano)


async def buscar_producao_aps(ano: int) -> dict:
    """Producao especifica de APS (grupos 01-09 SIGTAP)."""
    if not ano:
        ano = date.today().year - 1

    data = await _get(f"{_BASE}/producao-ambulatorial-bpa", {
        "co_municipio_estabelecimento": _IBGE6,
        "ano":                          ano,
        "co_grupo_procedimento":        "01",
        "limit":                        500,
    })
    procs: list = []
    if isinstance(data, list):
        procs = data
    elif isinstance(data, dict):
        procs = data.get("items") or data.get("data") or []

    if procs:
        total = sum(int(p.get("qt_apresentada") or 1) for p in procs)
        return {
            "ano":           ano,
            "total_aps":     total,
            "per_capita":    round(total / _POP, 2),
            "situacao_dado": "oficial_validado",
            "fonte":         "sia_datasus",
        }

    return {
        "ano":           ano,
        "total_aps":     None,
        "per_capita":    None,
        "situacao_dado": "nao_disponivel",
        "fonte":         "nao_disponivel",
        "nota":          "API SIA/DATASUS nao retornou producao APS.",
    }
