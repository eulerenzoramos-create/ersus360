"""
Router: /api/sim-sinasc — ERSUS 360
Dados de referência municipal — Apuí/AM (pop. ~20 mil).
situacao_dado = referencia_municipal
"""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(prefix="/api/sim-sinasc", tags=["SIM / SINASC"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "2025",
        "obitos_total_ano": 124,
        "coeficiente_mortalidade_geral": 6.2,
        "obitos_infantis_ano": 8,
        "taxa_mortalidade_infantil": 32.4,
        "nascidos_vivos_ano": 247,
        "taxa_natalidade": 12.4,
        "obitos_maternos_ano": 1,
        "razao_mortalidade_materna": 404.9,
        "obitos_dci_ano": 3,
        "obitos_cardiovascular_pct": 32.4,
        "obitos_neoplasias_pct": 12.4,
        "obitos_causas_externas_pct": 18.4,
        "mortalidade_prematura_30_69_pct": 42.4,
        "nota": "Referência baseada em parâmetros epidemiológicos típicos para municípios amazônicos ~20 mil hab.",
    }


@router.get("/obitos")
async def obitos():
    return [
        {"situacao_dado": "referencia_municipal", "causa": "Doenças Cardiovasculares (CID I00–I99)",    "total": 40, "pct": 32.3, "por_100mil": 200.0, "tendencia": "estavel", "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "causa": "Causas Externas (CID V01–Y98)",             "total": 23, "pct": 18.5, "por_100mil": 115.0, "tendencia": "alta",    "status": "critico"},
        {"situacao_dado": "referencia_municipal", "causa": "Neoplasias (CID C00–D48)",                  "total": 15, "pct": 12.1, "por_100mil": 75.0,  "tendencia": "estavel", "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "causa": "Doenças Infecciosas (CID A00–B99)",         "total": 18, "pct": 14.5, "por_100mil": 90.0,  "tendencia": "alta",    "status": "critico"},
        {"situacao_dado": "referencia_municipal", "causa": "Diabetes Mellitus (CID E10–E14)",           "total": 8,  "pct": 6.5,  "por_100mil": 40.0,  "tendencia": "alta",    "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "causa": "Doenças Respiratórias (CID J00–J99)",       "total": 10, "pct": 8.1,  "por_100mil": 50.0,  "tendencia": "estavel", "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "causa": "Causas Mal Definidas (CID R95–R99)",        "total": 10, "pct": 8.0,  "por_100mil": 50.0,  "tendencia": "queda",   "status": "atencao"},
    ]


@router.get("/nascidos-vivos")
async def nascidos_vivos():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "2025",
        "total_nascidos_vivos": 247,
        "partos_cesarea_pct": 48.2,
        "partos_normal_pct": 51.8,
        "baixo_peso_nascer_pct": 9.2,
        "muito_baixo_peso_pct": 2.0,
        "prematuridade_pct": 11.4,
        "apgar_1min_menor_7_pct": 8.4,
        "apgar_5min_menor_7_pct": 2.4,
        "pre_natal_6_mais_consultas_pct": 62.4,
        "pre_natal_nenhuma_pct": 4.8,
        "local_parto_apui_pct": 12.4,
        "local_parto_humanita_pct": 72.4,
        "local_parto_manaus_pct": 8.2,
        "local_parto_outros_pct": 7.0,
        "nota": "Referência municipal Apuí/AM. Maioria dos partos em Humaitá (HGH).",
    }


@router.get("/obitos-infantis")
async def obitos_infantis():
    return [
        {"situacao_dado": "referencia_municipal", "componente": "Neonatal precoce (0–6 dias)",  "obitos": 4, "pct": 50.0, "causa_principal": "Prematuridade / Asfixia perinatal",        "status": "critico"},
        {"situacao_dado": "referencia_municipal", "componente": "Neonatal tardio (7–27 dias)", "obitos": 2, "pct": 25.0, "causa_principal": "Sepse neonatal / Malformação congênita",    "status": "critico"},
        {"situacao_dado": "referencia_municipal", "componente": "Pós-neonatal (28d–1 ano)",    "obitos": 2, "pct": 25.0, "causa_principal": "Diarreia grave / IVAS + desnutrição",        "status": "critico"},
    ]


@router.get("/historico")
async def historico():
    return [
        {"situacao_dado": "referencia_municipal", "ano": 2022, "obitos": 118, "nascidos_vivos": 262, "tmi": 38.2, "rmm": 382.0, "cmg": 5.9},
        {"situacao_dado": "referencia_municipal", "ano": 2023, "obitos": 120, "nascidos_vivos": 255, "tmi": 35.3, "rmm": 392.2, "cmg": 6.0},
        {"situacao_dado": "referencia_municipal", "ano": 2024, "obitos": 122, "nascidos_vivos": 251, "tmi": 33.9, "rmm": 398.4, "cmg": 6.1},
        {"situacao_dado": "referencia_municipal", "ano": 2025, "obitos": 124, "nascidos_vivos": 247, "tmi": 32.4, "rmm": 404.9, "cmg": 6.2},
    ]


@router.get("/indicadores")
async def indicadores():
    return [
        {"situacao_dado": "referencia_municipal", "indicador": "TMI — Mortalidade Infantil (meta: <10)",    "valor": 32.4, "meta": 10,    "unidade": "/1.000NV", "status": "critico", "observacao": "3,2× acima da meta. Prematuridade, asfixia e infecção neonatal."},
        {"situacao_dado": "referencia_municipal", "indicador": "RMM — Mortalidade Materna (meta: <30)",     "valor": 404.9,"meta": 30,    "unidade": "/100kNV",  "status": "critico", "observacao": "13,5× a meta ODS. Causa: eclâmpsia. Pré-natal insuficiente."},
        {"situacao_dado": "referencia_municipal", "indicador": "Baixo Peso ao Nascer (<2.500g) (%)",        "valor": 9.2,  "meta": 6.0,   "unidade": "%",        "status": "atencao", "observacao": "Associado a anemia gestacional e tabagismo."},
        {"situacao_dado": "referencia_municipal", "indicador": "Pré-natal ≥6 consultas (%)",                "valor": 62.4, "meta": 100,   "unidade": "%",        "status": "atencao", "observacao": "37,6% das gestantes sem pré-natal adequado."},
        {"situacao_dado": "referencia_municipal", "indicador": "Óbitos por Causas Externas (%)",            "valor": 18.5, "meta": None,  "unidade": "%",        "status": "critico", "observacao": "Homicídios, acidentes moto e afogamento — perfil garimpo."},
        {"situacao_dado": "referencia_municipal", "indicador": "Mortalidade Prematura 30–69a (%)",          "valor": 42.4, "meta": 25,    "unidade": "%",        "status": "critico", "observacao": "Causa: DCNT e causas externas. Prevenção primária insuficiente."},
    ]
