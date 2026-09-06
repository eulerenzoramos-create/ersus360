"""
Diagnóstico / Cobertura — Apuí/AM
Dados reais do SCNES (monitor_scnes_service) + eMulti (egestor_scraper cache).
Não faz scraping de páginas externas. Não inventa valores financeiros.
"""
from __future__ import annotations

import logging
from datetime import datetime

logger = logging.getLogger(__name__)

IBGE      = "1300144"
MUNICIPIO = "Apuí"
UF        = "AM"
POPULACAO = 19_847  # IBGE Censo 2022


def _competencia_from_parcela(parcela: str) -> str:
    meses = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
             "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"]
    try:
        n = int(parcela[4:])
        return f"{meses[(n - 1) % 12]}/{parcela[:4]}"
    except Exception:
        return parcela


async def buscar_diagnostico_cobertura(parcela: str = "202608") -> dict:
    """
    Monta a resposta com dados reais verificados:
    - Pendências SCNES (fonte: monitor_scnes_service — varredura Set/2026)
    - Scores das 10 equipes (fonte: monitor_scnes_service)
    - Dados eMulti se disponíveis no cache do egestor_scraper
    Dados de pagamento eSF/ACS/eSB: marcados como não disponíveis (exigem auth e-Gestor).
    """
    from services.monitor_scnes_service import _EQUIPES, _PENDENCIAS

    # ── Diagnósticos SCNES (dados reais verificados em campo) ──────────────────
    diagnosticos = []

    criticos = [p for p in _PENDENCIAS if "CRÍTICO" in p["sev"]]
    medios   = [p for p in _PENDENCIAS if "MÉDIO"   in p["sev"]]
    atencoes = [p for p in _PENDENCIAS if "ATENÇÃO" in p["sev"]]

    for p in criticos:
        diagnosticos.append({
            "severidade": "critico",
            "titulo": f"SCNES crítico — {p['equipe']}",
            "texto": p["desc"],
        })

    for p in medios:
        diagnosticos.append({
            "severidade": "alerta",
            "titulo": f"SCNES médio — {p['equipe']}",
            "texto": p["desc"],
        })

    for p in atencoes:
        diagnosticos.append({
            "severidade": "info",
            "titulo": f"SCNES atenção — {p['equipe']}",
            "texto": p["desc"],
        })

    # ── Scores das equipes → diagnóstico por faixa ────────────────────────────
    for eq in _EQUIPES:
        if eq["score"] < 70:
            diagnosticos.append({
                "severidade": "critico",
                "titulo": f"{eq['nome']}: score {eq['score']} — {eq['nivel']}",
                "texto": f"{eq['vinculadas']} pessoas vinculadas. Score abaixo de 70 requer atenção imediata.",
            })
        elif eq["score"] < 80:
            diagnosticos.append({
                "severidade": "alerta",
                "titulo": f"{eq['nome']}: score {eq['score']} — {eq['nivel']}",
                "texto": f"{eq['vinculadas']} pessoas vinculadas. Monitorar indicadores.",
            })

    # ── eMulti: usa cache do scraper se disponível ────────────────────────────
    emulti_data = {
        "qt_credenciadas": 0, "qt_homologadas": 0, "qt_pagas": 0,
        "qt_ampliada": 0, "qt_estrategica": 0, "qt_complementar": 0,
        "qt_atend_remoto": 0,
        "vl_custeio": 0.0, "vl_qualidade": 0.0,
        "vl_atend_remoto": 0.0, "vl_total": 0.0,
    }
    emulti_fonte = "sem_dados"
    try:
        from services.egestor_scraper import get_cached_or_none
        cached = get_cached_or_none()
        if cached:
            custeio = cached.get("custeio", {})
            emulti_data = {
                "qt_credenciadas": custeio.get("equipes_credenciadas") or 0,
                "qt_homologadas":  custeio.get("equipes_homologadas") or 0,
                "qt_pagas":        custeio.get("equipes_pagas") or 0,
                "qt_ampliada":     0,
                "qt_estrategica":  0,
                "qt_complementar": 0,
                "qt_atend_remoto": custeio.get("equipes_atendimento_remoto_pagas") or 0,
                "vl_custeio":      custeio.get("pagamento") or 0.0,
                "vl_qualidade":    cached.get("qualidade", {}).get("pagamento") or 0.0,
                "vl_atend_remoto": cached.get("remoto", {}).get("pagamento") or 0.0,
                "vl_total": (
                    (custeio.get("pagamento") or 0.0)
                    + (cached.get("qualidade", {}).get("pagamento") or 0.0)
                    + (cached.get("remoto", {}).get("pagamento") or 0.0)
                ),
            }
            emulti_fonte = "egestor_cache"
    except Exception as e:
        logger.debug("eMulti cache indisponível: %s", e)

    # ── Monta resumo de equipes para KPIs ─────────────────────────────────────
    total_equipes = len(_EQUIPES)
    score_medio = round(sum(e["score"] for e in _EQUIPES) / total_equipes, 1) if _EQUIPES else 0
    total_vinculadas = sum(e["vinculadas"] for e in _EQUIPES)

    return {
        "fonte": "scnes_verificado",
        "situacao_dado": "disponivel",
        "coletado_em": datetime.utcnow().isoformat() + "Z",
        "municipio": MUNICIPIO,
        "uf": UF,
        "ibge": IBGE,
        "competencia": _competencia_from_parcela(parcela),
        "parcela": int(parcela[4:]) if len(parcela) >= 6 else 0,
        "populacao": POPULACAO,
        # Campos de classificação — indisponíveis sem auth e-Gestor
        "faixa_equidade_esf":       None,
        "classificacao_vinculo_esf": None,
        "classificacao_qualidade_esf": None,
        # KPIs reais SCNES
        "total_equipes_scnes":   total_equipes,
        "score_medio_scnes":     score_medio,
        "total_vinculadas_cvat": total_vinculadas,
        "pendencias_criticas":   len(criticos),
        "pendencias_total":      len(_PENDENCIAS),
        # total_calculado: apenas eMulti (único com dados reais de pagamento)
        "total_calculado": emulti_data["vl_total"],
        # Programas — pagamento eSF/ACS/eSB requer autenticação no e-Gestor
        "esf": {
            "qt_credenciadas": 0, "qt_homologadas": 0, "qt_pagas": 0,
            "qt_100pct": 0, "qt_75pct": 0, "qt_50pct": 0, "qt_25pct": 0,
            "vl_fixo": 0.0, "vl_vinculo": 0.0, "vl_qualidade": 0.0, "vl_total_bruto": 0.0,
        },
        "eap": {"qt_credenciadas": 0, "qt_pagas": 0, "vl_total_bruto": 0.0},
        "emulti": emulti_data,
        "esb": {
            "qt_40h_credenciadas": 0, "qt_40h_homologadas": 0,
            "qt_40h_pagas_modal_i": 0, "qt_40h_pagas_modal_ii": 0,
            "vl_esb_40h": 0.0, "vl_qualidade_40h": 0.0,
            "qt_uom": 0, "vl_uom": 0.0,
            "vl_lrpd_municipal": 0.0, "vl_total_sb_calculado": 0.0,
        },
        "acs": {
            "qt_teto": 0, "qt_direto_credenciado": 0, "qt_direto_pago": 0,
            "vl_direto": 0.0, "vl_parcela_extra_direto": 0.0,
            "qt_indireto_pago": 0, "vl_indireto": 0.0, "vl_total": 0.0,
        },
        "esfrb": {
            "qt_credenciadas": 0, "qt_homologadas": 0, "qt_pagas": 0,
            "qt_embarcacoes": 0, "vl_custeio": 0.0, "vl_qualidade": 0.0, "vl_total": 0.0,
        },
        "per_capita": {"vl_pagamento": 0.0},
        "tetos": {"esf": 0, "eap": 0},
        # Diagnósticos reais ordenados por severidade
        "diagnosticos": diagnosticos,
        # Metadados de fonte para transparência
        "_meta": {
            "scnes_varredura": "06/09/2026",
            "emulti_fonte": emulti_fonte,
            "nota": (
                "Dados de pagamento eSF/ACS/eSB requerem autenticação no e-Gestor APS. "
                "Diagnósticos e scores são baseados na varredura SCNES de Set/2026."
            ),
        },
    }
