"""Leishmaniose — LTA e LV · FMS Apuí/AM"""
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/leishmaniose", tags=["leishmaniose"])

@lru_cache(maxsize=1)
def _CASOS_LTA():
    return [
        {"forma": "Cutânea localizada",   "casos_ano": 28, "tratados": 26, "cura_pct": 89.3, "abandono": 2,  "efeito_adverso_grave": 0, "status": "atencao"},
        {"forma": "Cutânea disseminada",  "casos_ano": 6,  "tratados": 6,  "cura_pct": 83.3, "abandono": 1,  "efeito_adverso_grave": 1, "status": "atencao"},
        {"forma": "Mucosa",               "casos_ano": 4,  "tratados": 4,  "cura_pct": 75.0, "abandono": 0,  "efeito_adverso_grave": 2, "status": "critico"},
        {"forma": "Cutâneomucosa",        "casos_ano": 2,  "tratados": 2,  "cura_pct": 50.0, "abandono": 0,  "efeito_adverso_grave": 1, "status": "critico"},
    ]


@lru_cache(maxsize=1)
def _MUNICIPIOS_PROCEDENCIA():
    return [
        {"municipio": "Apuí/AM (autóctone)",     "casos_lta": 28, "casos_lv": 2, "pct_total": 70.0},
        {"municipio": "Humaitá/AM",              "casos_lta": 6,  "casos_lv": 0, "pct_total": 15.0},
        {"municipio": "Manicoré/AM",             "casos_lta": 4,  "casos_lv": 1, "pct_total": 12.5},
        {"municipio": "Outros/Ignorado",         "casos_lta": 2,  "casos_lv": 0, "pct_total": 5.0},
    ]


@router.get("/dashboard")
async def dashboard():
    return {
        "casos_lta_ano": 40,
        "casos_lv_ano": 3,
        "casos_lta_mes": 4,
        "casos_lv_mes": 0,
        "taxa_lta_100mil": 212.2,
        "cura_lta_pct": 85.0,
        "cura_lv_pct": 100.0,
        "abandono_lta_pct": 7.5,
        "efeito_adverso_grave_lta": 4,
        "obitos_lv_ano": 0,
        "antimonial_disponivel": True,
        "anfotericina_b_disponivel": True,
        "microscopista_treinado": True,
        "teste_rapido_disponivel": True,
        "imunocromatografico_lv_disponivel": True,
        "laboratorio_referencia": "LACEN/AM — Manaus",
        "status_geral": "atencao",
        "competencia": "Jun/2026",
    }

@router.get("/casos-lta")
async def casos_lta():
    return _CASOS_LTA

@router.get("/procedencia")
async def procedencia():
    return _MUNICIPIOS_PROCEDENCIA

@router.get("/historico")
async def historico():
    return [
        {"ano": "2022", "lta": 32, "lv": 1, "taxa_lta": 169.6, "cura_pct": 84.4},
        {"ano": "2023", "lta": 36, "lv": 2, "taxa_lta": 190.8, "cura_pct": 83.3},
        {"ano": "2024", "lta": 38, "lv": 2, "taxa_lta": 201.4, "cura_pct": 84.2},
        {"ano": "2025", "lta": 42, "lv": 3, "taxa_lta": 222.7, "cura_pct": 83.3},
        {"ano": "2026*","lta": 40, "lv": 3, "taxa_lta": 212.2, "cura_pct": 85.0},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Taxa de detecção LTA (por 100 mil hab.)",         "valor": 212.2,"meta": None,  "unidade": "/100 mil", "status": "critico", "observacao": "Apuí entre os municípios de maior endemicidade no AM — floresta/garimpo como principais fatores de risco"},
        {"indicador": "Cura de LTA",                                     "valor": 85.0, "meta": 90.0, "unidade": "%",        "status": "atencao", "observacao": "Forma mucosa com menor cura (75%) — efeitos adversos do Glucantime limitam completude do esquema"},
        {"indicador": "Abandono do tratamento LTA",                      "valor": 7.5,  "meta": 5.0,  "unidade": "%",        "status": "atencao", "observacao": "3 abandonos em 2026 — garimpeiros e trabalhadores rurais sem fixação de moradia"},
        {"indicador": "Efeitos adversos graves ao Glucantime",           "valor": 4,    "meta": 0,    "unidade": "n/ano",    "status": "atencao", "observacao": "4 casos (cardiotoxicidade 2, hepatotoxicidade 1, nefrotoxicidade 1) — todos manejados com suspensão"},
        {"indicador": "Casos de LV diagnosticados",                      "valor": 3,    "meta": 0,    "unidade": "n/ano",    "status": "atencao", "observacao": "3 casos LV em 2026 — 2 autóctones (área expansão urbana) + 1 procedência Manicoré"},
        {"indicador": "Disponibilidade de antimonial pentavalente",      "valor": 100.0,"meta": 100.0,"unidade": "%",        "status": "ok",      "observacao": "Estoque garantido pela SESA/AM — Glucantime e Anfotericina B disponíveis na farmácia hospitalar"},
    ]
