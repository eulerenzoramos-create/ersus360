"""
SI-PNI Service — Cobertura vacinal via e-Gestor AB / DATASUS dados abertos
APIs tentadas:
  https://egestorab.saude.gov.br/api/v1/vacinas/municipio/{ibge}/cobertura
  https://apidadosabertos.saude.gov.br/pni/cobertura
API indisponivel → nao_disponivel (sem fallback com dados ficticios).
"""
from __future__ import annotations
import logging
from datetime import date
from typing import Optional

import httpx
from config import settings

logger = logging.getLogger(__name__)

_IBGE7   = settings.FNS_MUNICIPIO_IBGE
_IBGE6   = settings.FNS_MUNICIPIO_IBGE[:6]
_TIMEOUT = 15

_VACINAS_META = {
    "BCG":           95.0,
    "Hepatite B":    95.0,
    "Pentavalente":  95.0,
    "Pneumococica":  95.0,
    "Rotavirus":     95.0,
    "Meningococica": 95.0,
    "Febre Amarela": 95.0,
    "Triplice Viral": 95.0,
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


def _sem_dado(ano: int) -> dict:
    return {
        "ano":                 ano,
        "situacao_dado":       "nao_disponivel",
        "media_cobertura_pct": None,
        "vacinas":             [],
        "abaixo_meta":         None,
        "fonte":               "nao_disponivel",
        "nota":                "API SI-PNI/DATASUS nao retornou dados para este municipio/ano.",
    }


async def buscar_cobertura(ano: int = 0) -> dict:
    """Cobertura vacinal do municipio — principais imunobiologicos."""
    if not ano:
        ano = date.today().year - 1

    for url, params in [
        (f"https://egestorab.saude.gov.br/api/v1/vacinas/municipio/{_IBGE7}/cobertura", {"ano": ano}),
        ("https://apidadosabertos.saude.gov.br/pni/cobertura", {"co_municipio": _IBGE6, "ano": ano}),
        ("https://apidadosabertos.saude.gov.br/pni/cobertura", {"municipio": _IBGE7, "ano": ano}),
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
                        "vacina":        nome,
                        "cobertura":     cobert,
                        "meta":          meta,
                        "status":        "ok" if cobert >= meta else "atencao" if cobert >= meta * 0.8 else "critico",
                        "situacao_dado": "oficial_validado",
                    })
                media = round(sum(v["cobertura"] for v in vacinas) / len(vacinas), 1) if vacinas else 0
                return {
                    "ano":                 ano,
                    "media_cobertura_pct": media,
                    "vacinas":             vacinas,
                    "abaixo_meta":         sum(1 for v in vacinas if v["status"] != "ok"),
                    "situacao_dado":       "oficial_validado",
                    "fonte":               "pni_datasus",
                }

    return _sem_dado(ano)


async def buscar_historico(anos: int = 5) -> list[dict]:
    """Historico de cobertura vacinal — ultimos anos."""
    ano_atual = date.today().year
    resultado = []
    for a in range(ano_atual - anos, ano_atual):
        data = await buscar_cobertura(a)
        resultado.append({
            "ano":                 a,
            "media_cobertura_pct": data.get("media_cobertura_pct"),
            "situacao_dado":       data.get("situacao_dado", "nao_disponivel"),
            "fonte":               data.get("fonte"),
        })
    return resultado
