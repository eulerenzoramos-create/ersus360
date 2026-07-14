"""
SIA Service — Sistema de Informação Ambulatorial via DATASUS dados abertos
https://apidadosabertos.saude.gov.br/sia/

Provê:
  - Produção ambulatorial (BPA/PA) do município
  - Procedimentos por grupo (APS, especialidades, exames)
  - Produção per capita
"""
from __future__ import annotations
import logging
from datetime import date
from typing import Optional

import httpx
from config import settings

logger = logging.getLogger(__name__)

_BASE    = "https://apidadosabertos.saude.gov.br/sia"
_IBGE6   = settings.FNS_MUNICIPIO_IBGE[:6]   # "130014"
_TIMEOUT = 15
_POP     = 25_000  # Apuí estimativa


async def _get(url: str, params: dict) -> Optional[dict | list]:
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as cli:
            r = await cli.get(url, params=params)
            if r.status_code == 200:
                return r.json()
    except Exception as exc:
        logger.debug("SIA API erro %s: %s", url, exc)
    return None


async def buscar_producao(ano: int, mes: int = 0) -> dict:
    """Produção ambulatorial BPA do município."""
    if not ano:
        ano = date.today().year - 1

    params = {"co_municipio_estabelecimento": _IBGE6, "ano": ano, "limit": 500}
    if mes:
        params["mes"] = mes

    for path in ["/producao-ambulatorial-bpa", "/bpa", "/procedimento-ambulatorial"]:
        data = await _get(f"{_BASE}{path}", params)
        procs = []
        if isinstance(data, list):
            procs = data
        elif isinstance(data, dict):
            procs = data.get("items") or data.get("data") or []

        if procs:
            total = sum(int(p.get("qt_apresentada") or p.get("quantidade") or 1) for p in procs)
            per_capita = round(total / _POP, 2)
            return {
                "ano": ano,
                "total_procedimentos": total,
                "per_capita": per_capita,
                "meta_per_capita": 5.0,
                "status": "ok" if per_capita >= 5.0 else "atencao" if per_capita >= 3.0 else "critico",
                "fonte": "sia_datasus",
            }

    return _fallback(ano)


async def buscar_producao_aps(ano: int) -> dict:
    """Produção específica de APS (grupos 01-09 SIGTAP)."""
    if not ano:
        ano = date.today().year - 1

    params = {
        "co_municipio_estabelecimento": _IBGE6,
        "ano": ano,
        "co_grupo_procedimento": "01",  # APS
        "limit": 500,
    }
    data = await _get(f"{_BASE}/producao-ambulatorial-bpa", params)
    procs = []
    if isinstance(data, list):
        procs = data
    elif isinstance(data, dict):
        procs = data.get("items") or data.get("data") or []

    if procs:
        total = sum(int(p.get("qt_apresentada") or 1) for p in procs)
        return {"ano": ano, "total_aps": total, "per_capita": round(total / _POP, 2), "fonte": "sia_datasus"}

    return {"ano": ano, "total_aps": 79200, "per_capita": 3.2, "fonte": "referencia"}


def _fallback(ano: int) -> dict:
    return {
        "ano": ano,
        "total_procedimentos": 79_200,
        "per_capita": 3.2,
        "meta_per_capita": 5.0,
        "status": "critico",
        "fonte": "referencia",
    }
