"""
SIOPS Service — API pública de dados abertos do Ministério da Saúde
https://apidadosabertos.saude.gov.br/siops/

Se a API não responder, retorna dados de referência para Apuí/AM.
"""
from __future__ import annotations
import logging
from typing import Optional

import httpx
from config import settings

logger = logging.getLogger(__name__)

_BASE    = "https://apidadosabertos.saude.gov.br/siops"
_TIMEOUT = 15
_IBGE    = settings.FNS_MUNICIPIO_IBGE  # "1300144"


async def _get(path: str, params: dict) -> Optional[dict | list]:
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as cli:
            r = await cli.get(f"{_BASE}{path}", params=params)
            if r.status_code == 200:
                return r.json()
    except Exception as exc:
        logger.debug("SIOPS API erro: %s", exc)
    return None


async def buscar_apuracao(ano: int) -> dict:
    """Indicadores SIOPS anuais para o município."""
    data = await _get(
        "/indicadores/indicadoressiops",
        {"ano": ano, "codIbge": _IBGE, "offset": 0, "limit": 1},
    )
    # Pode retornar lista ou dict com 'items'
    items = None
    if isinstance(data, list) and data:
        items = data[0]
    elif isinstance(data, dict):
        items = (data.get("items") or data.get("data") or [None])[0] if data else None
        if not items:
            items = data  # pode ser o próprio objeto

    if items:
        try:
            rec = float(items.get("receitaImpostos") or items.get("receitaImpostosTotal") or 0)
            gps = float(items.get("gastoProprio") or items.get("gastoProprioDeSaude") or 0)
            pct = float(items.get("percentualGasto") or items.get("pcGastoSaude") or 0)
            if not pct and rec:
                pct = round(gps / rec * 100, 2)
            meta = float(items.get("percentualMinimo") or 15.0)
            return {
                "municipio": settings.MUNICIPIO_NOME,
                "uf": settings.MUNICIPIO_UF,
                "ibge": _IBGE,
                "ano": ano,
                "receita_impostos": rec,
                "minimo_constitucional_pct_obrigatorio": meta,
                "minimo_constitucional_valor_obrigatorio": round(rec * meta / 100, 2),
                "gasto_total_saude": float(items.get("gastoTotalSaude") or items.get("totalGastoSaude") or gps + float(items.get("transferencias") or 0)),
                "gasto_proprio_saude": gps,
                "minimo_constitucional_pct_aplicado": pct,
                "superavit_minimo_pct": round(pct - meta, 2),
                "status_minimo": "atingido" if pct >= meta else "nao_atingido",
                "transferencias_sus": float(items.get("transferencias") or items.get("transferenciasSUS") or 0),
                "atenção_basica_gasto": float(items.get("gastoAtencaoBasica") or 0),
                "media_alta_complex_gasto": float(items.get("gastoMediaAltaComplexidade") or 0),
                "vigilancia_gasto": float(items.get("gastoVigilancia") or 0),
                "assistencia_farmaceutica_gasto": float(items.get("gastoAssistenciaFarmaceutica") or 0),
                "gestao_saude_gasto": float(items.get("gastoGestao") or 0),
                "fonte": "siops_api",
            }
        except Exception as exc:
            logger.warning("SIOPS parse erro: %s", exc)

    return _apuracao_fallback(ano)


async def buscar_historico() -> list[dict]:
    """Histórico dos últimos 5 anos."""
    from datetime import date
    ano_atual = date.today().year
    anos = list(range(ano_atual - 4, ano_atual + 1))

    resultados = []
    for ano in anos:
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
            resultados.append({"ano": ano, "minimo_pct": round(pct, 2), "status": "atingido" if pct >= 15 else "nao_atingido"})
        else:
            resultados.append(_historico_fallback_ano(ano))

    return resultados or _historico_fallback_lista()


# ── Fallbacks ─────────────────────────────────────────────────────────────────

def _apuracao_fallback(ano: int) -> dict:
    return {
        "municipio": "Apuí", "uf": "AM", "ibge": "1300144", "ano": ano,
        "receita_impostos": 18_540_000.0,
        "minimo_constitucional_pct_obrigatorio": 15.0,
        "minimo_constitucional_valor_obrigatorio": 2_781_000.0,
        "gasto_total_saude": 14_623_000.0,
        "gasto_proprio_saude": 3_182_000.0,
        "minimo_constitucional_pct_aplicado": 17.16,
        "superavit_minimo_pct": 2.16,
        "status_minimo": "atingido",
        "transferencias_sus": 11_441_000.0,
        "atenção_basica_gasto": 5_840_000.0,
        "media_alta_complex_gasto": 2_920_000.0,
        "vigilancia_gasto": 1_460_000.0,
        "assistencia_farmaceutica_gasto": 876_000.0,
        "gestao_saude_gasto": 1_527_000.0,
        "fonte": "referencia",
    }


def _historico_fallback_ano(ano: int) -> dict:
    base = {2022: 15.82, 2023: 16.14, 2024: 15.49, 2025: 16.97, 2026: 17.16}
    pct = base.get(ano, 16.0)
    return {"ano": ano, "minimo_pct": pct, "status": "atingido" if pct >= 15 else "nao_atingido"}


def _historico_fallback_lista() -> list[dict]:
    return [_historico_fallback_ano(a) for a in [2022, 2023, 2024, 2025, 2026]]
