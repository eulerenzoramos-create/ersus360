"""
SIOPS Service — API publica de dados abertos do Ministerio da Saude
https://apidadosabertos.saude.gov.br/siops/
API indisponivel → nao_disponivel (sem fallback com dados ficticios).
"""
from __future__ import annotations
import logging
from datetime import date
from typing import Optional

import httpx
from config import settings

logger = logging.getLogger(__name__)

_BASE    = "https://apidadosabertos.saude.gov.br/siops"
_TIMEOUT = 15
_IBGE    = settings.FNS_MUNICIPIO_IBGE


async def _get(path: str, params: dict) -> Optional[dict | list]:
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as cli:
            r = await cli.get(f"{_BASE}{path}", params=params)
            if r.status_code == 200:
                return r.json()
    except Exception as exc:
        logger.debug("SIOPS API erro: %s", exc)
    return None


def _sem_dado(ano: int) -> dict:
    return {
        "municipio":      getattr(settings, "MUNICIPIO_NOME", "Apui"),
        "uf":             getattr(settings, "MUNICIPIO_UF", "AM"),
        "ibge":           _IBGE,
        "ano":            ano,
        "situacao_dado":  "nao_disponivel",
        "fonte":          "nao_disponivel",
        "nota":           "API SIOPS nao retornou dados para este municipio/ano.",
    }


async def buscar_apuracao(ano: int) -> dict:
    """Indicadores SIOPS anuais para o municipio."""
    data = await _get(
        "/indicadores/indicadoressiops",
        {"ano": ano, "codIbge": _IBGE, "offset": 0, "limit": 1},
    )
    items = None
    if isinstance(data, list) and data:
        items = data[0]
    elif isinstance(data, dict):
        items = (data.get("items") or data.get("data") or [None])[0] if data else None
        if not items:
            items = data

    if items:
        try:
            rec = float(items.get("receitaImpostos") or items.get("receitaImpostosTotal") or 0)
            gps = float(items.get("gastoProprio") or items.get("gastoProprioDeSaude") or 0)
            pct = float(items.get("percentualGasto") or items.get("pcGastoSaude") or 0)
            if not pct and rec:
                pct = round(gps / rec * 100, 2)
            meta = float(items.get("percentualMinimo") or 15.0)
            return {
                "municipio":   getattr(settings, "MUNICIPIO_NOME", "Apui"),
                "uf":          getattr(settings, "MUNICIPIO_UF", "AM"),
                "ibge":        _IBGE,
                "ano":         ano,
                "receita_impostos": rec,
                "minimo_constitucional_pct_obrigatorio":    meta,
                "minimo_constitucional_valor_obrigatorio":  round(rec * meta / 100, 2),
                "gasto_total_saude":     float(items.get("gastoTotalSaude") or 0),
                "gasto_proprio_saude":   gps,
                "minimo_constitucional_pct_aplicado": pct,
                "superavit_minimo_pct":  round(pct - meta, 2),
                "status_minimo":         "atingido" if pct >= meta else "nao_atingido",
                "transferencias_sus":    float(items.get("transferencias") or 0),
                "situacao_dado":         "oficial_validado",
                "fonte":                 "siops_api",
            }
        except Exception as exc:
            logger.warning("SIOPS parse erro: %s", exc)

    return _sem_dado(ano)


async def buscar_historico() -> list[dict]:
    """Historico dos ultimos 5 anos — anos sem dado retornam nao_disponivel."""
    ano_atual = date.today().year
    resultados = []
    for ano in range(ano_atual - 4, ano_atual + 1):
        d = await _get(
            "/indicadores/indicadoressiops",
            {"ano": ano, "codIbge": _IBGE, "offset": 0, "limit": 1},
        )
        pct: Optional[float] = None
        if isinstance(d, list) and d:
            pct = float(d[0].get("percentualGasto") or d[0].get("pcGastoSaude") or 0) or None
        elif isinstance(d, dict):
            pct = float(d.get("percentualGasto") or d.get("pcGastoSaude") or 0) or None

        if pct:
            resultados.append({
                "ano":           ano,
                "minimo_pct":    round(pct, 2),
                "status":        "atingido" if pct >= 15 else "nao_atingido",
                "situacao_dado": "oficial_validado",
                "fonte":         "siops_api",
            })
        else:
            resultados.append({
                "ano":           ano,
                "minimo_pct":    None,
                "situacao_dado": "nao_disponivel",
                "fonte":         "nao_disponivel",
            })

    return resultados
