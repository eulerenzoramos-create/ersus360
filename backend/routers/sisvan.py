"""
Router: /api/sisvan — ERSUS 360
SISVAN — Vigilância Nutricional · Estado Nutricional · Marcadores Alimentares · FMS Apuí/AM
Dados de referência municipal — situacao_dado = referencia_municipal
"""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(prefix="/api/sisvan", tags=["SISVAN"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "Jan–Jun 2026",
        "acompanhamentos_mes": 1240,
        "criancas_acompanhadas_menores_5a": 680,
        "gestantes_acompanhadas": 142,
        "adolescentes_acompanhados": 184,
        "adultos_acompanhados": 234,
        "desnutricao_criancas_pct": 6.8,
        "sobrepeso_criancas_pct": 12.4,
        "obesidade_adultos_pct": 22.4,
        "anemia_gestantes_pct": 28.4,
        "aleitamento_exclusivo_6m_pct": 42.4,
        "bolsa_familia_acompanhados_pct": 84.2,
        "nota": "Referência baseada em parâmetros nutricionais típicos para municípios amazônicos ~20 mil hab.",
    }


@router.get("/criancas")
async def criancas():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "Jan–Jun 2026",
        "total_acompanhadas": 680,
        "menores_2_anos": 248,
        "2_a_5_anos": 432,
        "estado_nutricional": [
            {"estado": "Eutrofia",            "n": 458, "pct": 67.4, "status": "ok"},
            {"estado": "Risco nutricional",   "n": 96,  "pct": 14.1, "status": "atencao"},
            {"estado": "Desnutrição aguda",   "n": 28,  "pct": 4.1,  "status": "critico"},
            {"estado": "Desnutrição crônica", "n": 18,  "pct": 2.6,  "status": "critico"},
            {"estado": "Sobrepeso",           "n": 58,  "pct": 8.5,  "status": "atencao"},
            {"estado": "Obesidade",           "n": 22,  "pct": 3.3,  "status": "atencao"},
        ],
        "deficit_altura_idade_pct": 12.4,
        "deficit_peso_idade_pct": 6.8,
        "anemia_menores_5a_pct": 18.4,
        "vitamina_a_suplementada_pct": 72.4,
        "nota": "Déficit estatura-idade reflete desnutrição crônica histórica — zona rural e ribeirinhos.",
    }


@router.get("/gestantes")
async def gestantes():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "Jan–Jun 2026",
        "total_gestantes_acompanhadas": 142,
        "estado_nutricional_pre_gestacional": [
            {"estado": "Baixo Peso",  "n": 18, "pct": 12.7, "status": "atencao"},
            {"estado": "Eutrofia",    "n": 74, "pct": 52.1, "status": "ok"},
            {"estado": "Sobrepeso",   "n": 32, "pct": 22.5, "status": "atencao"},
            {"estado": "Obesidade",   "n": 18, "pct": 12.7, "status": "atencao"},
        ],
        "ganho_peso_insuficiente_pct": 22.4,
        "ganho_peso_excessivo_pct": 18.4,
        "anemia_hemoglobina_menor10_pct": 28.4,
        "sulfato_ferroso_prescrito_pct": 88.4,
        "acido_folico_prescrito_pct": 94.2,
        "nota": "Anemia gestacional alta (28,4%) — associada à dieta pobre em ferro e parasitoses.",
    }


@router.get("/adultos")
async def adultos():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "Jan–Jun 2026",
        "total_adultos_acompanhados": 234,
        "imc_medio": 26.8,
        "estado_nutricional": [
            {"estado": "Baixo Peso",    "n": 12, "pct": 5.1,  "status": "atencao"},
            {"estado": "Eutrofia",      "n": 84, "pct": 35.9, "status": "ok"},
            {"estado": "Sobrepeso",     "n": 86, "pct": 36.8, "status": "atencao"},
            {"estado": "Obesidade G1",  "n": 36, "pct": 15.4, "status": "atencao"},
            {"estado": "Obesidade G2",  "n": 12, "pct": 5.1,  "status": "critico"},
            {"estado": "Obesidade G3",  "n": 4,  "pct": 1.7,  "status": "critico"},
        ],
        "marcadores_alimentares": {
            "consumo_frutas_verduras_diario_pct": 28.4,
            "consumo_ultraprocessados_pct": 62.4,
            "consumo_bebidas_adocadas_pct": 58.4,
            "consumo_peixe_semana_pct": 72.4,
            "consumo_carne_caca_pct": 44.2,
        },
        "nota": "Alto consumo de peixe (riqueza amazônica) convive com ultraprocessados e bebidas adoçadas.",
    }


@router.get("/bolsa-familia")
async def bolsa_familia():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "Jan–Jun 2026",
        "familias_beneficiarias_bolsa_familia": 1840,
        "criancas_acompanhadas_bf": 572,
        "meta_acompanhamento_bf_pct": 85.0,
        "realizado_acompanhamento_bf_pct": 84.2,
        "criancas_vigilancia_nutricional_bf": [
            {"estado": "Eutrofia",                 "n": 378, "pct": 66.1},
            {"estado": "Risco / Desnutrição",      "n": 82,  "pct": 14.3},
            {"estado": "Sobrepeso / Obesidade",    "n": 112, "pct": 19.6},
        ],
        "busca_ativa_pendentes": 48,
        "familia_sem_acompanhamento_bf": 91,
        "observacao": "Descumprimento condicionalidade nutricional: 4,9% — gestão BF encaminhada.",
        "nota": "Referência municipal Apuí/AM.",
    }
