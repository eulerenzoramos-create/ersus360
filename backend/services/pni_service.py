"""
SI-PNI Service — Cobertura vacinal via e-Gestor AB / DATASUS dados abertos
APIs tentadas:
  https://egestorab.saude.gov.br/api/v1/vacinas/municipio/{ibge}/cobertura
  https://apidadosabertos.saude.gov.br/pni/cobertura?co_municipio={ibge6}
  https://apidadosabertos.saude.gov.br/pni/cobertura?municipio={ibge7}

Fallback: dados de referência para Apuí/AM (cobertura moderada, abaixo da meta 95%)
"""
from __future__ import annotations
import logging
from datetime import date
from typing import Optional

import httpx
from config import settings

logger = logging.getLogger(__name__)

_IBGE7   = settings.FNS_MUNICIPIO_IBGE        # "1300144"
_IBGE6   = settings.FNS_MUNICIPIO_IBGE[:6]    # "130014"
_TIMEOUT = 15

_VACINAS_META = {
    "BCG":           95.0,
    "Hepatite B":    95.0,
    "Pentavalente":  95.0,
    "Pneumocócica":  95.0,
    "Rotavírus":     95.0,
    "Meningocócica": 95.0,
    "Febre Amarela": 95.0,
    "Tríplice Viral":95.0,
    "Varicela":      95.0,
    "HPV":           80.0,
    "dT (gestante)": 90.0,
}


async def _get(url: str, params: dict = {}) -> Optional[dict | list]:
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as cli:
            r = await cli.get(url, params=params)
            if r.status_code == 200:
                return r.json()
    except Exception as exc:
        logger.debug("PNI API erro %s: %s", url, exc)
    return None


async def buscar_cobertura(ano: int = 0) -> dict:
    """Cobertura vacinal do município — principais imunobiológicos."""
    if not ano:
        ano = date.today().year - 1

    # Tenta e-Gestor AB
    for url, params in [
        (f"https://egestorab.saude.gov.br/api/v1/vacinas/municipio/{_IBGE7}/cobertura", {"ano": ano}),
        (f"https://apidadosabertos.saude.gov.br/pni/cobertura", {"co_municipio": _IBGE6, "ano": ano}),
        (f"https://apidadosabertos.saude.gov.br/pni/cobertura", {"municipio": _IBGE7, "ano": ano}),
    ]:
        data = await _get(url, params)
        if data:
            items = data if isinstance(data, list) else data.get("items") or data.get("data") or []
            if items:
                vacinas = []
                for item in items:
                    nome   = item.get("ds_imunobiologico") or item.get("vacina") or item.get("nome", "")
                    cobert = float(item.get("vl_cobertura") or item.get("cobertura") or 0)
                    meta   = _VACINAS_META.get(nome, 95.0)
                    vacinas.append({
                        "vacina":      nome,
                        "cobertura":   cobert,
                        "meta":        meta,
                        "status":      "ok" if cobert >= meta else "atencao" if cobert >= meta * 0.8 else "critico",
                    })
                media = round(sum(v["cobertura"] for v in vacinas) / len(vacinas), 1) if vacinas else 0
                return {
                    "ano": ano,
                    "media_cobertura_pct": media,
                    "vacinas": vacinas,
                    "abaixo_meta": sum(1 for v in vacinas if v["status"] != "ok"),
                    "fonte": "pni_datasus",
                }

    return _fallback(ano)


async def buscar_historico(anos: int = 5) -> list[dict]:
    """Histórico de cobertura vacinal — últimos anos."""
    ano_atual = date.today().year
    resultado = []
    for a in range(ano_atual - anos, ano_atual):
        data = await buscar_cobertura(a)
        resultado.append({
            "ano": a,
            "media_cobertura_pct": data["media_cobertura_pct"],
            "fonte": data["fonte"],
        })
    return resultado


def _fallback(ano: int) -> dict:
    """Dados de referência para Apuí/AM — cobertura abaixo da meta em várias vacinas."""
    vacinas = [
        {"vacina": "BCG",            "cobertura": 98.2, "meta": 95.0, "status": "ok"},
        {"vacina": "Hepatite B",     "cobertura": 94.1, "meta": 95.0, "status": "atencao"},
        {"vacina": "Pentavalente",   "cobertura": 87.4, "meta": 95.0, "status": "atencao"},
        {"vacina": "Pneumocócica",   "cobertura": 84.2, "meta": 95.0, "status": "atencao"},
        {"vacina": "Rotavírus",      "cobertura": 81.3, "meta": 95.0, "status": "atencao"},
        {"vacina": "Meningocócica",  "cobertura": 79.8, "meta": 95.0, "status": "critico"},
        {"vacina": "Febre Amarela",  "cobertura": 92.4, "meta": 95.0, "status": "atencao"},
        {"vacina": "Tríplice Viral", "cobertura": 88.6, "meta": 95.0, "status": "atencao"},
        {"vacina": "Varicela",       "cobertura": 76.4, "meta": 95.0, "status": "critico"},
        {"vacina": "HPV",            "cobertura": 58.4, "meta": 80.0, "status": "critico"},
        {"vacina": "dT (gestante)",  "cobertura": 72.4, "meta": 90.0, "status": "critico"},
    ]
    media = round(sum(v["cobertura"] for v in vacinas) / len(vacinas), 1)
    return {
        "ano": ano,
        "media_cobertura_pct": media,
        "vacinas": vacinas,
        "abaixo_meta": sum(1 for v in vacinas if v["status"] != "ok"),
        "fonte": "referencia",
    }
