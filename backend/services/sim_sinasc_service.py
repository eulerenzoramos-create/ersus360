"""
SIM / SINASC Service — API pública DATASUS (dados abertos)
https://apidadosabertos.saude.gov.br/sim/
https://apidadosabertos.saude.gov.br/sinasc/

Fallback: dados de referência para Apuí/AM quando API indisponível.
"""
from __future__ import annotations
import logging
from datetime import date
from typing import Optional

import httpx
from config import settings

logger = logging.getLogger(__name__)

_BASE_SIM    = "https://apidadosabertos.saude.gov.br/sim"
_BASE_SINASC = "https://apidadosabertos.saude.gov.br/sinasc"
_TIMEOUT     = 15
_IBGE6       = settings.FNS_MUNICIPIO_IBGE[:6]  # SIM/SINASC usa 6 dígitos: "130014"


async def _get(url: str, params: dict) -> Optional[dict | list]:
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as cli:
            r = await cli.get(url, params=params)
            if r.status_code == 200:
                return r.json()
    except Exception as exc:
        logger.debug("SIM/SINASC API erro %s: %s", url, exc)
    return None


async def buscar_obitos(ano: int) -> dict:
    """Óbitos gerais do município via SIM/DATASUS."""
    data = await _get(f"{_BASE_SIM}/causas-obito", {
        "co_municipio_ocor": _IBGE6,
        "ano_obito": ano,
        "offset": 0,
        "limit": 200,
    })

    obitos = []
    if isinstance(data, list):
        obitos = data
    elif isinstance(data, dict):
        obitos = data.get("items") or data.get("data") or []

    if obitos:
        total = len(obitos)
        ext_count = sum(1 for o in obitos if _is_causa_externa(o))
        card_count = sum(1 for o in obitos if _is_cardiovascular(o))
        return {
            "ano": ano,
            "total_obitos": total,
            "causas_externas": ext_count,
            "causas_externas_pct": round(ext_count / total * 100, 1) if total else 0,
            "cardiovasculares": card_count,
            "cardiovasculares_pct": round(card_count / total * 100, 1) if total else 0,
            "obitos_detalhes": [_normalizar_obito(o) for o in obitos[:50]],
            "fonte": "sim_datasus",
        }

    return _obitos_fallback(ano)


async def buscar_nascidos_vivos(ano: int) -> dict:
    """Nascidos vivos do município via SINASC/DATASUS."""
    data = await _get(f"{_BASE_SINASC}/nascimento", {
        "co_municipio_nasc": _IBGE6,
        "ano_nasc": ano,
        "offset": 0,
        "limit": 500,
    })

    nascimentos = []
    if isinstance(data, list):
        nascimentos = data
    elif isinstance(data, dict):
        nascimentos = data.get("items") or data.get("data") or []

    if nascimentos:
        total = len(nascimentos)
        cesarea = sum(1 for n in nascimentos if str(n.get("tp_parto") or "").startswith("2"))
        prematuros = sum(1 for n in nascimentos
                        if int(n.get("sempregest") or 37) < 37)
        baixo_peso = sum(1 for n in nascimentos
                        if float(n.get("peso") or 2500) < 2500)
        return {
            "ano": ano,
            "total_nascimentos": total,
            "partos_cesarea": cesarea,
            "cesarea_pct": round(cesarea / total * 100, 1) if total else 0,
            "prematuros": prematuros,
            "baixo_peso": baixo_peso,
            "fonte": "sinasc_datasus",
        }

    return _nascidos_fallback(ano)


async def buscar_historico_mortalidade() -> list[dict]:
    """Histórico anual de mortalidade — últimos 5 anos."""
    from datetime import date
    ano_atual = date.today().year
    anos = list(range(ano_atual - 4, ano_atual))

    resultado = []
    for ano in anos:
        data = await _get(f"{_BASE_SIM}/causas-obito", {
            "co_municipio_ocor": _IBGE6,
            "ano_obito": ano,
            "offset": 0,
            "limit": 1,
        })
        total: Optional[int] = None
        if isinstance(data, dict):
            total = data.get("total") or data.get("totalElements")

        if total is not None:
            resultado.append({"ano": str(ano), "obitos_gerais": total,
                               "fonte": "sim_datasus"})
        else:
            resultado.append(_historico_ano_fallback(ano))

    return resultado or _historico_fallback_lista()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _is_causa_externa(o: dict) -> bool:
    cid = str(o.get("causabas") or o.get("causa_basica") or o.get("cd_causabas") or "")
    return cid.startswith(("V", "W", "X", "Y"))


def _is_cardiovascular(o: dict) -> bool:
    cid = str(o.get("causabas") or o.get("causa_basica") or o.get("cd_causabas") or "")
    # Capítulo IX CID-10: I00-I99
    if cid and cid[0] == "I":
        try:
            num = int(cid[1:3])
            return 0 <= num <= 99
        except ValueError:
            pass
    return False


def _normalizar_obito(o: dict) -> dict:
    return {
        "causa_basica": o.get("causabas_desc") or o.get("causa_basica") or o.get("causabas", "—"),
        "sexo":         o.get("sexo") or "I",
        "idade":        o.get("idade") or 0,
        "local":        o.get("lococor_desc") or o.get("local_ocorrencia") or "—",
        "evitavel":     o.get("evitavel") or False,
    }


# ── Fallbacks ─────────────────────────────────────────────────────────────────

def _obitos_fallback(ano: int) -> dict:
    return {
        "ano": ano,
        "total_obitos": 79,
        "causas_externas": 17,
        "causas_externas_pct": 21.0,
        "cardiovasculares": 23,
        "cardiovasculares_pct": 29.0,
        "obitos_detalhes": [],
        "fonte": "referencia",
    }


def _nascidos_fallback(ano: int) -> dict:
    return {
        "ano": ano,
        "total_nascimentos": 246,
        "partos_cesarea": 89,
        "cesarea_pct": 36.2,
        "prematuros": 14,
        "baixo_peso": 9,
        "fonte": "referencia",
    }


def _historico_ano_fallback(ano: int) -> dict:
    base = {2020: 71, 2021: 78, 2022: 82, 2023: 75, 2024: 80}
    return {"ano": str(ano), "obitos_gerais": base.get(ano, 78), "fonte": "referencia"}


def _historico_fallback_lista() -> list[dict]:
    return [_historico_ano_fallback(a) for a in [2020, 2021, 2022, 2023, 2024]]
