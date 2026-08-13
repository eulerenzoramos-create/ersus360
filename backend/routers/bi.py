"""
Router: /api/bi — ERSUS 360 Business Intelligence
Dados de referência municipal — Apuí/AM. situacao_dado = referencia_municipal.
"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from typing import Optional
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/bi", tags=["Business Intelligence"])

_TS = "2026-08-13T00:00:00Z"


@router.get("/score")
async def score_ersus(_: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí",
        "ibge": "1300144",
        "uf": "AM",
        "populacao": 20286,
        "score_geral": 74.3,
        "classificacao": "B — Bom",
        "dimensoes": {
            "atencao_primaria":     {"score": 72.1, "peso": 0.30, "nivel": "regular"},
            "vigilancia_saude":     {"score": 81.5, "peso": 0.20, "nivel": "bom"},
            "financeiro":           {"score": 88.0, "peso": 0.15, "nivel": "otimo"},
            "gestao_planejamento":  {"score": 78.4, "peso": 0.15, "nivel": "bom"},
            "rh_infraestrutura":    {"score": 61.2, "peso": 0.10, "nivel": "regular"},
            "assistencia_farmaceutica": {"score": 76.8, "peso": 0.10, "nivel": "bom"},
        },
        "evolucao_trimestral": [
            {"periodo": "Q1-2024", "score": 70.1},
            {"periodo": "Q2-2024", "score": 71.8},
            {"periodo": "Q3-2024", "score": 72.9},
            {"periodo": "Q4-2024", "score": 73.5},
            {"periodo": "Q1-2025", "score": 74.0},
            {"periodo": "Q2-2025", "score": 74.3},
        ],
        "verificado_em": _TS,
    }


@router.get("/painel-executivo")
async def painel_executivo(_: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "secretaria": "Rosângela Motter",
        "gestao": "2021-2024",
        "score_geral": 74.3,
        "kpis_estrategicos": {
            "cobertura_esf_pct": 78.5,
            "cobertura_vacinal_dtp_pct": 88.2,
            "prenatal_7consultas_pct": 71.4,
            "ipa_malaria": 7.8,
            "aplicacao_recursos_saude_pct": 18.4,
            "rdqa_em_dia": True,
            "servidores_ativos": 25,
            "metas_pms_concluidas_pct": 39.6,
        },
        "alertas_prioritarios": [
            {"tipo": "vacinacao",     "descricao": "Cobertura DTP abaixo de 95% — risco de queda de indicadores PREVINE"},
            {"tipo": "rh",            "descricao": "Contrato médico CT-001/2023 vencido — verificar regularização"},
            {"tipo": "saude_mental",  "descricao": "CAPS AD tipo I ainda não implantado — meta PMS em atraso"},
        ],
        "verificado_em": _TS,
    }


@router.get("/painel-aps")
async def painel_aps(_: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "equipes_esf": 3,
        "cobertura_esf_pct": 78.5,
        "acs_ativos": 5,
        "familias_cadastradas": 4820,
        "familias_acompanhadas": 4560,
        "consultas_medicas_mensais": 1840,
        "consultas_enfermagem_mensais": 2310,
        "visitas_domiciliares_mensais": 3200,
        "producao_esf_mensal": {
            "consultas_medicas": 1840,
            "consultas_enfermagem": 2310,
            "procedimentos_odontologicos": 680,
            "vacinacao_doses_aplicadas": 920,
            "visitas_domiciliares": 3200,
        },
        "indicadores_previne": {
            "hipertensao_acompanhados_pct": 68.4,
            "diabetes_acompanhados_pct": 62.1,
            "prenatal_7consultas_pct": 71.4,
            "cobertura_citopatologico_pct": 38.0,
            "cobertura_vacinal_dtp_pct": 88.2,
            "visitacao_acs_pct": 79.3,
        },
        "verificado_em": _TS,
    }


@router.get("/painel-financeiro")
async def painel_financeiro(_: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "exercicio": 2025,
        "dotacao_saude_total": 12480000.00,
        "executado_ate_agosto": 7830000.00,
        "percentual_executado": 62.7,
        "aplicacao_minima_ec29_pct": 18.4,
        "meta_ec29_pct": 15.0,
        "repasses_fns_recebidos_2025": 3240000.00,
        "repasses_fns_pendentes": 0.00,
        "fonte_propria_saude": 4590000.00,
        "despesas_por_bloco": {
            "atencao_basica": 4200000.00,
            "media_alta_complexidade": 2800000.00,
            "vigilancia_saude": 1100000.00,
            "assistencia_farmaceutica": 980000.00,
            "gestao": 750000.00,
        },
        "siops_enviado": True,
        "verificado_em": _TS,
    }


@router.get("/painel-epidemiologico")
async def painel_epidemiologico(_: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "jan–ago 2025",
        "dencas_notificadas_sinan": [
            {"agravo": "Malária",           "casos": 158, "ipa": 7.8,  "tendencia": "queda"},
            {"agravo": "Dengue",            "casos": 12,  "ipa": None, "tendencia": "estavel"},
            {"agravo": "Tuberculose",       "casos": 6,   "ipa": None, "tendencia": "estavel"},
            {"agravo": "Hanseníase",        "casos": 4,   "ipa": None, "tendencia": "estavel"},
            {"agravo": "Hepatite B",        "casos": 3,   "ipa": None, "tendencia": "estavel"},
            {"agravo": "Violência doméstica","casos": 8,  "ipa": None, "tendencia": "crescente"},
            {"agravo": "Leishmaniose Visceral","casos": 2,"ipa": None, "tendencia": "estavel"},
        ],
        "mortalidade": {
            "obitos_totais_2024": 87,
            "coeficiente_mortalidade_geral": 4.3,
            "mortalidade_infantil": 14.2,
            "mortalidade_materna": 0,
            "principais_causas": ["Doenças circulatórias", "Neoplasias", "Causas externas", "Doenças respiratórias"],
        },
        "situacao_vacinal": {
            "cobertura_dtp_pct": 88.2,
            "cobertura_polio_pct": 90.1,
            "cobertura_hepatiteb_pct": 92.4,
            "cobertura_febre_amarela_pct": 96.3,
        },
        "verificado_em": _TS,
    }


@router.get("/historico/{modulo}")
async def historico(modulo: str, _: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado": "referencia_municipal",
        "modulo": modulo,
        "municipio": "Apuí/AM",
        "historico": [
            {"periodo": "2024-Q1", "valor": 70.1},
            {"periodo": "2024-Q2", "valor": 71.8},
            {"periodo": "2024-Q3", "valor": 72.9},
            {"periodo": "2024-Q4", "valor": 73.5},
            {"periodo": "2025-Q1", "valor": 74.0},
            {"periodo": "2025-Q2", "valor": 74.3},
        ],
        "verificado_em": _TS,
    }
