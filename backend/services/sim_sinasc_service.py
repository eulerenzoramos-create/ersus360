"""
SIM / SINASC Service — API publica DATASUS (dados abertos)
https://apidadosabertos.saude.gov.br/sim/
https://apidadosabertos.saude.gov.br/sinasc/
API indisponivel → nao_disponivel (sem fallback com dados ficticios).
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
_IBGE6       = settings.FNS_MUNICIPIO_IBGE[:6]


async def _get(url: str, params: dict) -> Optional[dict | list]:
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as cli:
            r = await cli.get(url, params=params)
            if r.status_code == 200:
                return r.json()
    except Exception as exc:
        logger.debug("SIM/SINASC API erro %s: %s", url, exc)
    return None


def _sem_dado_obitos(ano: int) -> dict:
    return {
        "ano":            ano,
        "situacao_dado":  "nao_disponivel",
        "total_obitos":   None,
        "fonte":          "nao_disponivel",
        "nota":           "API SIM/DATASUS nao retornou dados para este municipio/ano.",
    }


def _sem_dado_nasc(ano: int) -> dict:
    return {
        "ano":               ano,
        "situacao_dado":     "nao_disponivel",
        "total_nascimentos": None,
        "fonte":             "nao_disponivel",
        "nota":              "API SINASC/DATASUS nao retornou dados para este municipio/ano.",
    }


async def buscar_obitos(ano: int) -> dict:
    """Obitos gerais do municipio via SIM/DATASUS."""
    data = await _get(f"{_BASE_SIM}/causas-obito", {
        "co_municipio_ocor": _IBGE6,
        "ano_obito":         ano,
        "offset":            0,
        "limit":             200,
    })

    obitos: list = []
    if isinstance(data, list):
        obitos = data
    elif isinstance(data, dict):
        obitos = data.get("items") or data.get("data") or []

    if obitos:
        total      = len(obitos)
        ext_count  = sum(1 for o in obitos if _is_causa_externa(o))
        card_count = sum(1 for o in obitos if _is_cardiovascular(o))
        return {
            "ano":                    ano,
            "total_obitos":           total,
            "causas_externas":        ext_count,
            "causas_externas_pct":    round(ext_count  / total * 100, 1) if total else 0,
            "cardiovasculares":       card_count,
            "cardiovasculares_pct":   round(card_count / total * 100, 1) if total else 0,
            "obitos_detalhes":        [_normalizar_obito(o) for o in obitos[:50]],
            "situacao_dado":          "oficial_validado",
            "fonte":                  "sim_datasus",
        }

    return _sem_dado_obitos(ano)


async def buscar_nascidos_vivos(ano: int) -> dict:
    """Nascidos vivos do municipio via SINASC/DATASUS."""
    data = await _get(f"{_BASE_SINASC}/nascimento", {
        "co_municipio_nasc": _IBGE6,
        "ano_nasc":          ano,
        "offset":            0,
        "limit":             500,
    })

    nascimentos: list = []
    if isinstance(data, list):
        nascimentos = data
    elif isinstance(data, dict):
        nascimentos = data.get("items") or data.get("data") or []

    if nascimentos:
        total      = len(nascimentos)
        cesarea    = sum(1 for n in nascimentos if str(n.get("tp_parto") or "").startswith("2"))
        prematuros = sum(1 for n in nascimentos if int(n.get("sempregest") or 37) < 37)
        baixo_peso = sum(1 for n in nascimentos if float(n.get("peso") or 2500) < 2500)
        return {
            "ano":               ano,
            "total_nascimentos": total,
            "partos_cesarea":    cesarea,
            "cesarea_pct":       round(cesarea / total * 100, 1) if total else 0,
            "prematuros":        prematuros,
            "baixo_peso":        baixo_peso,
            "situacao_dado":     "oficial_validado",
            "fonte":             "sinasc_datasus",
        }

    return _sem_dado_nasc(ano)


async def buscar_historico_mortalidade() -> list[dict]:
    """Historico anual de mortalidade — anos sem dado retornam nao_disponivel."""
    ano_atual = date.today().year
    resultado = []
    for ano in range(ano_atual - 4, ano_atual):
        data = await _get(f"{_BASE_SIM}/causas-obito", {
            "co_municipio_ocor": _IBGE6,
            "ano_obito":         ano,
            "offset":            0,
            "limit":             1,
        })
        total: Optional[int] = None
        if isinstance(data, dict):
            total = data.get("total") or data.get("totalElements")

        resultado.append({
            "ano":           str(ano),
            "obitos_gerais": total,
            "situacao_dado": "oficial_validado" if total is not None else "nao_disponivel",
            "fonte":         "sim_datasus" if total is not None else "nao_disponivel",
        })

    return resultado


# ── Helpers ───────────────────────────────────────────────────────────────────

def _is_causa_externa(o: dict) -> bool:
    cid = str(o.get("causabas") or o.get("causa_basica") or o.get("cd_causabas") or "")
    return cid.startswith(("V", "W", "X", "Y"))


def _is_cardiovascular(o: dict) -> bool:
    cid = str(o.get("causabas") or o.get("causa_basica") or o.get("cd_causabas") or "")
    if cid and cid[0] == "I":
        try:
            return 0 <= int(cid[1:3]) <= 99
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
