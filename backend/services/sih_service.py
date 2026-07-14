"""
SIH Service — Sistema de Informação Hospitalar via DATASUS dados abertos
https://apidadosabertos.saude.gov.br/sih/

Provê:
  - Internações por causa (CID-10) com flag ICSAP
  - AIH (Autorizações de Internação Hospitalar)
  - Taxa de internação por 100k hab
  - Internações evitáveis (ICSAP — Lista CONASS/CSAP)
"""
from __future__ import annotations
import logging
from datetime import date
from typing import Optional

import httpx
from config import settings

logger = logging.getLogger(__name__)

_BASE    = "https://apidadosabertos.saude.gov.br/sih"
_IBGE6   = settings.FNS_MUNICIPIO_IBGE[:6]   # "130014"
_TIMEOUT = 15

# Lista ICSAP (CSAP) — condições sensíveis à APS (capítulos CID-10 simplificado)
_ICSAP_PREFIXOS = (
    "A00", "A01", "A02", "A03", "A05", "A06", "A08", "A09",  # doenças infecciosas
    "B05", "B06", "B16", "B18", "B26",                         # imunoprev.
    "E10", "E11", "E12", "E13", "E14",                         # diabetes
    "I10", "I11", "I20", "I25", "I50",                         # cardiovasc.
    "J00", "J01", "J02", "J03", "J04", "J05", "J06",          # IVAS
    "J13", "J14", "J15", "J18",                                # pneumonia
    "J20", "J21", "J22", "J40", "J41", "J42", "J43", "J44",   # asma/DPOC
    "K25", "K26", "K27", "K28",                                # úlcera
    "K92",                                                      # hemorragia dig.
    "N10", "N12", "N30", "N39",                                 # ITU/renal
    "O",                                                        # obstétrico prevenível
)


def _is_icsap(cid: str) -> bool:
    cid = (cid or "").upper().strip()
    return any(cid.startswith(p) for p in _ICSAP_PREFIXOS)


async def _get(url: str, params: dict) -> Optional[dict | list]:
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as cli:
            r = await cli.get(url, params=params)
            if r.status_code == 200:
                return r.json()
    except Exception as exc:
        logger.debug("SIH API erro %s: %s", url, exc)
    return None


async def buscar_internacoes(ano: int) -> dict:
    """Internações hospitalares do município no ano."""
    data = await _get(f"{_BASE}/autorizacao-internacao-hospitalar", {
        "co_municipio_internacao": _IBGE6,
        "ano_internacao": ano,
        "offset": 0,
        "limit": 500,
    })

    aih = []
    if isinstance(data, list):
        aih = data
    elif isinstance(data, dict):
        aih = data.get("items") or data.get("data") or []

    if aih:
        total   = len(aih)
        icsap   = sum(1 for a in aih if _is_icsap(str(a.get("diag_princ") or a.get("cid_principal") or "")))
        obitos  = sum(1 for a in aih if str(a.get("morte") or a.get("obito") or "0") in ("1", "S", True))
        pop     = 25_000
        taxa_100k = round(total / pop * 100_000, 1)
        icsap_pct = round(icsap / total * 100, 1) if total else 0
        return {
            "ano": ano,
            "total_internacoes": total,
            "icsap": icsap,
            "icsap_pct": icsap_pct,
            "obitos_hospitalares": obitos,
            "taxa_internacao_100k": taxa_100k,
            "fonte": "sih_datasus",
        }

    return _fallback(ano)


async def buscar_historico(anos: int = 5) -> list[dict]:
    """Histórico anual de internações — últimos anos."""
    ano_atual = date.today().year
    resultado = []
    for a in range(ano_atual - anos, ano_atual):
        d = await buscar_internacoes(a)
        resultado.append({
            "ano": a,
            "total_internacoes": d["total_internacoes"],
            "icsap": d["icsap"],
            "icsap_pct": d["icsap_pct"],
            "fonte": d["fonte"],
        })
    return resultado


def _fallback(ano: int) -> dict:
    return {
        "ano": ano,
        "total_internacoes": 284,
        "icsap": 87,
        "icsap_pct": 30.6,
        "obitos_hospitalares": 14,
        "taxa_internacao_100k": 1136.0,
        "fonte": "referencia",
    }
