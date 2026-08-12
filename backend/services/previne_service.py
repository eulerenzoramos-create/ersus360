"""
Novo Financiamento APS Service — e-Gestor APS / SISAB
API: https://egestorab.saude.gov.br/api/v1/previne/

Regras:
  - Sem fallback com dados fictícios. API indisponível → retorna nao_disponivel.
  - fonte = "egestor_api" quando dado real; "nao_disponivel" caso contrário.
  - situacao_dado propaga o resultado para o router.
"""
from __future__ import annotations
import logging
from datetime import date

import httpx
from config import settings

logger = logging.getLogger(__name__)

_EGESTOR = "https://egestorab.saude.gov.br/api/v1"
_TIMEOUT = 15
_IBGE    = getattr(settings, "FNS_MUNICIPIO_IBGE", "1300144")

_META_POR_IND = {
    1: 60.0, 2: 60.0, 3: 95.0, 4: 60.0,
    5: 60.0, 6: 60.0, 7: 60.0,
}
_NOME_IND = {
    1: "Pré-natal (≥ 6 consultas)",
    2: "Citopatológico do colo do útero",
    3: "Vacinação — DTP/Pentavalente",
    4: "Consulta RN na 1ª semana de vida",
    5: "Acompanhamento — HAS",
    6: "Acompanhamento — Diabetes",
    7: "Cuidado Pessoas com Obesidade",
}


async def _get(url: str, params: dict | None = None) -> dict | list | None:
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT, follow_redirects=True) as cli:
            r = await cli.get(url, params=params or {})
            if r.status_code == 200:
                return r.json()
            logger.debug("e-Gestor %s → HTTP %s", url, r.status_code)
    except Exception as exc:
        logger.debug("e-Gestor indisponível %s: %s", url, exc)
    return None


def _parse_indicador(raw: dict, numero: int) -> dict:
    resultado   = float(raw.get("resultado") or raw.get("percentual") or
                        raw.get("resultadoPct") or raw.get("valor") or 0)
    numerador   = int(raw.get("numerador") or raw.get("qtd") or 0)
    denominador = int(raw.get("denominador") or raw.get("total") or 0)
    meta        = float(raw.get("meta") or raw.get("metaPct") or _META_POR_IND.get(numero, 60.0))
    pontuacao   = float(raw.get("pontuacao") or raw.get("nota") or 0)

    if resultado >= meta:
        status = "verde"
    elif resultado >= meta * 0.7:
        status = "amarelo"
    else:
        status = "vermelho"

    return {
        "numero":        raw.get("numero") or raw.get("indicador") or numero,
        "nome":          raw.get("nome") or raw.get("descricao") or _NOME_IND.get(numero, f"Indicador {numero}"),
        "descricao":     raw.get("descricao") or "",
        "numerador":     numerador,
        "denominador":   denominador,
        "resultado_pct": round(resultado, 1),
        "meta_pct":      meta,
        "pontuacao":     pontuacao,
        "status":        status,
        "tendencia":     raw.get("tendencia") or "estavel",
        "eixo":          raw.get("eixo") or _NOME_IND.get(numero, ""),
        "situacao_dado": "oficial_validado",
        "fonte":         "egestor_api",
    }


def _sem_dado(competencia: str, nota: str = "") -> dict:
    return {
        "municipio":             getattr(settings, "MUNICIPIO_NOME", "Apuí"),
        "uf":                    getattr(settings, "MUNICIPIO_UF",   "AM"),
        "ibge":                  _IBGE,
        "competencia":           competencia,
        "situacao_dado":         "nao_disponivel",
        "total_pontos":          None,
        "pontos_possiveis":      49.0,
        "percentual_pontos":     None,
        "indicadores_atingidos": None,
        "indicadores_total":     7,
        "media_geral_pct":       None,
        "indicadores":           [],
        "fonte":                 "nao_disponivel",
        "nota": nota or (
            "API e-Gestor APS não retornou dados para esta competência. "
            "Verifique conectividade ou tente novamente mais tarde."
        ),
    }


async def buscar_indicadores(competencia: str) -> dict:
    """
    Indicadores Novo Financiamento APS via API e-Gestor APS.
    Retorna nao_disponivel quando API indisponível — sem fallback fictício.
    """
    urls = [
        (f"{_EGESTOR}/previne/municipio/{_IBGE}/indicadores", {"competencia": competencia}),
        (f"{_EGESTOR}/relatorio/municipio/indicadoresPrevine", {"codIbge": _IBGE, "competencia": competencia}),
        (f"https://apidadosabertos.saude.gov.br/indicadores/previne/municipio/{_IBGE}", {"competencia": competencia}),
    ]

    for url, params in urls:
        data = await _get(url, params)
        if not data:
            continue

        items: list = []
        if isinstance(data, list):
            items = data
        elif isinstance(data, dict):
            items = (data.get("indicadores") or data.get("items") or
                     data.get("data") or data.get("resultado") or [])

        if items:
            indicadores = [_parse_indicador(it, i + 1) for i, it in enumerate(items[:7])]
            total_pontos = sum(ind["pontuacao"] for ind in indicadores)
            atingidos    = sum(1 for ind in indicadores if ind["status"] in ("verde", "amarelo"))
            media        = round(sum(ind["resultado_pct"] for ind in indicadores) / len(indicadores), 1)
            return {
                "municipio":             getattr(settings, "MUNICIPIO_NOME", "Apuí"),
                "uf":                    getattr(settings, "MUNICIPIO_UF", "AM"),
                "ibge":                  _IBGE,
                "competencia":           competencia,
                "situacao_dado":         "oficial_validado",
                "total_pontos":          total_pontos,
                "pontos_possiveis":      49.0,
                "percentual_pontos":     round(total_pontos / 49.0 * 100, 1),
                "indicadores_atingidos": atingidos,
                "indicadores_total":     len(indicadores),
                "media_geral_pct":       media,
                "indicadores":           indicadores,
                "fonte":                 "egestor_api",
            }

    return _sem_dado(competencia)


async def buscar_historico(ibge: str = _IBGE, meses: int = 6) -> dict:
    """Histórico mensal dos indicadores via e-Gestor APS. Sem dado = lista vazia."""
    hoje = date.today()
    ano, mes = hoje.year, hoje.month

    historico = []
    for _ in range(meses):
        comp = f"{ano}{mes:02d}"
        data = await _get(
            f"{_EGESTOR}/previne/municipio/{ibge}/historico",
            {"competencia": comp},
        )
        if data and isinstance(data, dict) and data.get("mediaGeral"):
            historico.append({
                "competencia":  comp,
                "media_geral":  round(float(data["mediaGeral"]), 1),
                "situacao_dado": "oficial_validado",
                "fonte":        "egestor_api",
            })
        mes -= 1
        if mes == 0:
            mes = 12
            ano -= 1

    return {
        "municipio":     getattr(settings, "MUNICIPIO_NOME", "Apuí"),
        "situacao_dado": "oficial_validado" if historico else "nao_disponivel",
        "historico":     list(reversed(historico)),
        "nota": (
            "" if historico else
            "API e-Gestor APS não retornou histórico. Sem dados fictícios."
        ),
    }
