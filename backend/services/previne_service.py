"""
Novo Financiamento APS Service — e-Gestor APS / SISAB
Tenta buscar indicadores via API pública do e-Gestor APS.
Fallback: dados de referência para Apuí/AM.

Endpoints tentados:
  https://egestorab.saude.gov.br/api/v1/previne/municipio/{ibge}/indicadores
  https://apidadosabertos.saude.gov.br/indicadores/previne (se disponível)
"""
from __future__ import annotations
import logging
from typing import Optional

import httpx
from config import settings

logger = logging.getLogger(__name__)

_EGESTOR  = "https://egestorab.saude.gov.br/api/v1"
_TIMEOUT  = 15
_IBGE     = settings.FNS_MUNICIPIO_IBGE  # "1300144"

_META_POR_IND = {1: 60.0, 2: 60.0, 3: 95.0, 4: 60.0, 5: 60.0, 6: 60.0, 7: 60.0}
_NOME_IND = {
    1: "Pré-natal (≥ 6 consultas)",
    2: "Citopatológico do colo do útero",
    3: "Vacinação — DTP/Penta",
    4: "Consulta RN na 1ª semana de vida",
    5: "Acompanhamento de pessoas com HAS",
    6: "Acompanhamento de pessoas com DM",
    7: "Cuidado das Pessoas com Obesidade",
}


async def _get(url: str, params: dict | None = None) -> Optional[dict | list]:
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as cli:
            r = await cli.get(url, params=params or {})
            if r.status_code == 200:
                return r.json()
    except Exception as exc:
        logger.debug("Previne API erro %s: %s", url, exc)
    return None


def _parse_indicador(raw: dict, numero: int) -> dict:
    """Normaliza um indicador vindo de qualquer versão da API e-Gestor."""
    resultado = float(
        raw.get("resultado") or raw.get("percentual") or
        raw.get("resultadoPct") or raw.get("valor") or 0
    )
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
        "numero":      raw.get("numero") or raw.get("indicador") or numero,
        "nome":        raw.get("nome") or raw.get("descricao") or _NOME_IND.get(numero, f"Indicador {numero}"),
        "descricao":   raw.get("descricao") or "",
        "numerador":   numerador,
        "denominador": denominador,
        "resultado_pct": round(resultado, 1),
        "meta_pct":    meta,
        "pontuacao":   pontuacao,
        "status":      status,
        "tendencia":   raw.get("tendencia") or "estavel",
        "eixo":        raw.get("eixo") or ("Criança e Mulher" if numero <= 4 else "Doenças Crônicas"),
        "fonte":       "egestor_api",
    }


async def buscar_indicadores(competencia: str) -> dict:
    """
    Indicadores Novo Financiamento APS municipais.
    competencia: formato AAAAMM, ex: '202507'
    """
    # Tenta e-Gestor APS API
    for url_template in [
        f"{_EGESTOR}/previne/municipio/{_IBGE}/indicadores",
        f"{_EGESTOR}/relatorio/municipio/indicadoresPrevine",
        f"https://apidadosabertos.saude.gov.br/indicadores/previne/municipio/{_IBGE}",
    ]:
        data = await _get(url_template, {"competencia": competencia, "codIbge": _IBGE})
        if not data:
            continue

        # Normaliza resposta
        items: list = []
        if isinstance(data, list):
            items = data
        elif isinstance(data, dict):
            items = data.get("indicadores") or data.get("items") or data.get("data") or []

        if items:
            indicadores = [_parse_indicador(it, i + 1) for i, it in enumerate(items[:7])]
            total_pontos = sum(i["pontuacao"] for i in indicadores)
            atingidos    = sum(1 for i in indicadores if i["status"] in ("verde", "amarelo"))
            media        = round(sum(i["resultado_pct"] for i in indicadores) / len(indicadores), 1) if indicadores else 0
            return {
                "municipio": settings.MUNICIPIO_NOME,
                "uf": settings.MUNICIPIO_UF,
                "ibge": _IBGE,
                "competencia": competencia,
                "total_pontos": total_pontos,
                "pontos_possiveis": 49.0,
                "percentual_pontos": round(total_pontos / 49.0 * 100, 1),
                "indicadores_atingidos": atingidos,
                "indicadores_total": 7,
                "media_geral_pct": media,
                "indicadores": indicadores,
                "fonte": "egestor_api",
            }

    return _indicadores_fallback(competencia)


async def buscar_historico(meses: int = 6) -> dict:
    """Histórico mensal dos indicadores."""
    from datetime import date
    hoje = date.today()
    ano, mes = hoje.year, hoje.month

    historico = []
    for _ in range(meses):
        comp = f"{ano}{mes:02d}"
        data = await _get(
            f"{_EGESTOR}/previne/municipio/{_IBGE}/historico",
            {"competencia": comp},
        )
        if data and isinstance(data, dict) and data.get("mediaGeral"):
            historico.append({
                "competencia": comp,
                "media_geral":  round(float(data["mediaGeral"]), 1),
                "ind1": float(data.get("ind1") or 0),
                "ind2": float(data.get("ind2") or 0),
                "ind3": float(data.get("ind3") or 0),
                "ind4": float(data.get("ind4") or 0),
                "ind5": float(data.get("ind5") or 0),
                "ind6": float(data.get("ind6") or 0),
                "ind7": float(data.get("ind7") or 0),
            })
        mes -= 1
        if mes == 0:
            mes = 12
            ano -= 1

    if not historico:
        historico = _HISTORICO_REF[-meses:]

    return {
        "municipio": "Apuí/AM",
        "historico": list(reversed(historico)),
        "tendencia": "crescente",
    }


# ── Fallbacks ─────────────────────────────────────────────────────────────────

_INDICADORES_REF = [
    {"numero": 1, "nome": "Pré-natal (≥ 6 consultas)", "descricao": "Proporção de gestantes com início no 1º trimestre e ≥ 6 consultas de pré-natal",
     "numerador": 38, "denominador": 45, "resultado_pct": 84.4, "meta_pct": 60.0, "pontuacao": 7.0, "status": "verde", "tendencia": "subindo", "eixo": "Criança e Mulher", "fonte": "referencia"},
    {"numero": 2, "nome": "Citopatológico do colo do útero", "descricao": "Proporção de mulheres (25–64 anos) com coleta de citopatológico na APS",
     "numerador": 512, "denominador": 1190, "resultado_pct": 43.0, "meta_pct": 60.0, "pontuacao": 0.0, "status": "vermelho", "tendencia": "estavel", "eixo": "Criança e Mulher", "fonte": "referencia"},
    {"numero": 3, "nome": "Vacinação — DTP/Penta", "descricao": "Cobertura vacinal em crianças de 1 ano (DTP) e menores de 1 ano (Pentavalente)",
     "numerador": 68, "denominador": 82, "resultado_pct": 82.9, "meta_pct": 95.0, "pontuacao": 5.0, "status": "amarelo", "tendencia": "subindo", "eixo": "Criança e Mulher", "fonte": "referencia"},
    {"numero": 4, "nome": "Consulta RN na 1ª semana de vida", "descricao": "Proporção de recém-nascidos com consulta na 1ª semana de vida",
     "numerador": 41, "denominador": 45, "resultado_pct": 91.1, "meta_pct": 60.0, "pontuacao": 7.0, "status": "verde", "tendencia": "subindo", "eixo": "Criança e Mulher", "fonte": "referencia"},
    {"numero": 5, "nome": "Acompanhamento de pessoas com HAS", "descricao": "Proporção de pessoas com HAS com consulta e PA aferida nos últimos 12 meses",
     "numerador": 324, "denominador": 410, "resultado_pct": 79.0, "meta_pct": 60.0, "pontuacao": 7.0, "status": "verde", "tendencia": "subindo", "eixo": "Doenças Crônicas", "fonte": "referencia"},
    {"numero": 6, "nome": "Acompanhamento de pessoas com DM", "descricao": "Proporção de pessoas com DM com hemoglobina glicada solicitada nos últimos 12 meses",
     "numerador": 89, "denominador": 142, "resultado_pct": 62.7, "meta_pct": 60.0, "pontuacao": 7.0, "status": "verde", "tendencia": "estavel", "eixo": "Doenças Crônicas", "fonte": "referencia"},
    {"numero": 7, "nome": "Cuidado das Pessoas com Obesidade", "descricao": "Proporção de crianças de 5–9 anos com IMC avaliado pelo médico/enfermeiro",
     "numerador": 156, "denominador": 280, "resultado_pct": 55.7, "meta_pct": 60.0, "pontuacao": 0.0, "status": "amarelo", "tendencia": "subindo", "eixo": "Doenças Crônicas", "fonte": "referencia"},
]

_HISTORICO_REF = [
    {"competencia": "202503", "media_geral": 58.3, "ind1": 78.2, "ind2": 38.1, "ind3": 76.4, "ind4": 86.7, "ind5": 72.3, "ind6": 58.9, "ind7": 48.2},
    {"competencia": "202504", "media_geral": 61.4, "ind1": 80.1, "ind2": 39.4, "ind3": 78.2, "ind4": 88.1, "ind5": 74.1, "ind6": 60.2, "ind7": 50.1},
    {"competencia": "202505", "media_geral": 63.8, "ind1": 82.0, "ind2": 41.2, "ind3": 80.1, "ind4": 89.4, "ind5": 76.2, "ind6": 61.8, "ind7": 52.4},
    {"competencia": "202506", "media_geral": 65.9, "ind1": 83.7, "ind2": 42.1, "ind3": 81.5, "ind4": 90.2, "ind5": 77.8, "ind6": 62.5, "ind7": 53.9},
    {"competencia": "202507", "media_geral": 68.4, "ind1": 84.4, "ind2": 43.0, "ind3": 82.9, "ind4": 91.1, "ind5": 79.0, "ind6": 62.7, "ind7": 55.7},
]


def _indicadores_fallback(competencia: str) -> dict:
    total = sum(i["pontuacao"] for i in _INDICADORES_REF)
    atingidos = sum(1 for i in _INDICADORES_REF if i["status"] in ("verde", "amarelo"))
    return {
        "municipio": "Apuí", "uf": "AM", "ibge": "1300144",
        "competencia": competencia,
        "total_pontos": total,
        "pontos_possiveis": 49.0,
        "percentual_pontos": round(total / 49.0 * 100, 1),
        "indicadores_atingidos": atingidos,
        "indicadores_total": 7,
        "media_geral_pct": 68.4,
        "indicadores": _INDICADORES_REF,
        "fonte": "referencia",
    }
