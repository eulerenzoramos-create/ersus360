"""
SIH Service — Sistema de Informacao Hospitalar via DATASUS dados abertos
https://apidadosabertos.saude.gov.br/sih/
API indisponivel → nao_disponivel (sem fallback com dados ficticios).
"""
from __future__ import annotations
import logging
from datetime import date
from typing import Optional

import httpx
from config import settings

logger = logging.getLogger(__name__)

_BASE    = "https://apidadosabertos.saude.gov.br/sih"
_IBGE6   = settings.FNS_MUNICIPIO_IBGE[:6]
_TIMEOUT = 15

_ICSAP_PREFIXOS = (
    "A00","A01","A02","A03","A05","A06","A08","A09",
    "B05","B06","B16","B18","B26",
    "E10","E11","E12","E13","E14",
    "I10","I11","I20","I25","I50",
    "J00","J01","J02","J03","J04","J05","J06",
    "J13","J14","J15","J18",
    "J20","J21","J22","J40","J41","J42","J43","J44",
    "K25","K26","K27","K28",
    "K92",
    "N10","N12","N30","N39",
    "O",
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


def _sem_dado(ano: int) -> dict:
    return {
        "ano":              ano,
        "situacao_dado":    "nao_disponivel",
        "total_internacoes": None,
        "fonte":            "nao_disponivel",
        "nota":             "API SIH/DATASUS nao retornou dados para este municipio/ano.",
    }


async def buscar_internacoes(ano: int) -> dict:
    """Internacoes hospitalares do municipio no ano."""
    data = await _get(f"{_BASE}/autorizacao-internacao-hospitalar", {
        "co_municipio_internacao": _IBGE6,
        "ano_internacao":          ano,
        "offset":                  0,
        "limit":                   500,
    })

    aih: list = []
    if isinstance(data, list):
        aih = data
    elif isinstance(data, dict):
        aih = data.get("items") or data.get("data") or []

    if aih:
        total     = len(aih)
        icsap     = sum(1 for a in aih if _is_icsap(str(a.get("diag_princ") or a.get("cid_principal") or "")))
        obitos    = sum(1 for a in aih if str(a.get("morte") or a.get("obito") or "0") in ("1", "S", True))
        taxa_100k = round(total / 25_000 * 100_000, 1)
        icsap_pct = round(icsap / total * 100, 1) if total else 0
        return {
            "ano":                 ano,
            "total_internacoes":   total,
            "icsap":               icsap,
            "icsap_pct":           icsap_pct,
            "obitos_hospitalares": obitos,
            "taxa_internacao_100k": taxa_100k,
            "situacao_dado":       "oficial_validado",
            "fonte":               "sih_datasus",
        }

    return _sem_dado(ano)


async def buscar_historico(anos: int = 5) -> list[dict]:
    """Historico anual de internacoes — anos sem dado retornam nao_disponivel."""
    ano_atual = date.today().year
    resultado = []
    for a in range(ano_atual - anos, ano_atual):
        d = await buscar_internacoes(a)
        resultado.append({
            "ano":              a,
            "total_internacoes": d.get("total_internacoes"),
            "icsap":             d.get("icsap"),
            "icsap_pct":         d.get("icsap_pct"),
            "situacao_dado":     d.get("situacao_dado", "nao_disponivel"),
            "fonte":             d.get("fonte"),
        })
    return resultado
