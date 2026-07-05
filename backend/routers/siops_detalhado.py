"""SIOPS Detalhado — EC29 · Vinculação · Teto MAC · Execução por Bloco · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/siops-detalhado", tags=["siops_detalhado"])

@router.get("/dashboard")
async def dashboard():
    return {
        "receita_impostos_arrecadada": 18_640_000.00,
        "vinculacao_minima_ec29_pct": 15.0,
        "aplicacao_saude_pct": 19.8,
        "aplicacao_saude_valor": 3_690_720.00,
        "superavit_ec29_pct": 4.8,
        "superavit_ec29_valor": 895_920.00,
        "teto_mac_anual": 4_284_000.00,
        "mac_executado_pct": 74.2,
        "mac_executado_valor": 3_178_728.00,
        "bloco_atencao_basica_pct": 38.4,
        "bloco_mac_pct": 28.6,
        "bloco_vigilancia_pct": 12.4,
        "bloco_assistencia_farm_pct": 14.8,
        "bloco_gestao_pct": 5.8,
        "competencia": "Mar/2026",
        "status_geral": "ok",
    }

@router.get("/blocos")
async def blocos():
    return [
        {"bloco": "Atenção Básica",           "federal": 1_284_000, "estadual": 284_000, "municipal": 848_000, "total": 2_416_000, "executado": 2_286_400, "pct_exec": 94.6, "pct_total": 38.4, "status": "ok"},
        {"bloco": "Média e Alta Complexidade", "federal": 3_178_728, "estadual": 0,       "municipal": 620_000, "total": 3_798_728, "executado": 3_178_728, "pct_exec": 83.7, "pct_total": 28.6, "status": "ok"},
        {"bloco": "Vigilância em Saúde",       "federal": 284_000,   "estadual": 48_000,  "municipal": 448_000, "total": 780_000,   "executado": 718_400,   "pct_exec": 92.1, "pct_total": 12.4, "status": "ok"},
        {"bloco": "Assistência Farmacêutica",  "federal": 684_000,   "estadual": 84_000,  "municipal": 164_000, "total": 932_000,   "executado": 886_400,   "pct_exec": 95.1, "pct_total": 14.8, "status": "ok"},
        {"bloco": "Gestão do SUS",             "federal": 0,         "estadual": 0,        "municipal": 364_000, "total": 364_000,   "executado": 320_192,   "pct_exec": 87.9, "pct_total": 5.8,  "status": "ok"},
    ]

@router.get("/ec29")
async def ec29():
    return {
        "receita_base": 18_640_000.00,
        "minimo_legal_pct": 15.0,
        "minimo_legal_valor": 2_796_000.00,
        "aplicado_pct": 19.8,
        "aplicado_valor": 3_690_720.00,
        "superavit_pct": 4.8,
        "superavit_valor": 895_920.00,
        "serie_historica": [
            {"ano": 2021, "receita": 14_280_000, "aplicado_pct": 16.2, "aplicado_valor": 2_313_360},
            {"ano": 2022, "receita": 15_640_000, "aplicado_pct": 17.4, "aplicado_valor": 2_721_360},
            {"ano": 2023, "receita": 16_480_000, "aplicado_pct": 18.6, "aplicado_valor": 3_065_280},
            {"ano": 2024, "receita": 17_640_000, "aplicado_pct": 19.2, "aplicado_valor": 3_386_880},
            {"ano": 2025, "receita": 18_120_000, "aplicado_pct": 19.6, "aplicado_valor": 3_551_520},
            {"ano": 2026, "receita": 18_640_000, "aplicado_pct": 19.8, "aplicado_valor": 3_690_720},
        ],
    }

@router.get("/historico")
async def historico():
    return [
        {"mes": "Out/25", "receita_base": 18_120_000, "aplicado": 2_958_480, "pct_ec29": 16.3, "mac_exec_pct": 68.4},
        {"mes": "Nov/25", "receita_base": 18_120_000, "aplicado": 3_040_320, "pct_ec29": 16.8, "mac_exec_pct": 70.2},
        {"mes": "Dez/25", "receita_base": 18_120_000, "aplicado": 3_386_880, "pct_ec29": 18.7, "mac_exec_pct": 72.4},
        {"mes": "Jan/26", "receita_base": 18_640_000, "aplicado": 3_541_600, "pct_ec29": 19.0, "mac_exec_pct": 71.8},
        {"mes": "Fev/26", "receita_base": 18_640_000, "aplicado": 3_616_160, "pct_ec29": 19.4, "mac_exec_pct": 73.6},
        {"mes": "Mar/26", "receita_base": 18_640_000, "aplicado": 3_690_720, "pct_ec29": 19.8, "mac_exec_pct": 74.2},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Vinculação EC29 (receita aplicada)",   "valor": 19.8, "meta": 15.0, "unidade": "%","status": "ok",      "observacao": "Superávit de 4.8 p.p. acima do mínimo constitucional"},
        {"indicador": "Teto MAC executado",                    "valor": 74.2, "meta": 90.0, "unidade": "%","status": "atencao", "observacao": "R$3.178.728 de R$4.284.000 — saldo de R$1.105.272 ainda disponível"},
        {"indicador": "Bloco Atenção Básica — execução",       "valor": 94.6, "meta": 90.0, "unidade": "%","status": "ok",      "observacao": "Execução acima da meta — reforço de custeio nas UBS"},
        {"indicador": "Bloco Assistência Farmacêutica",        "valor": 95.1, "meta": 90.0, "unidade": "%","status": "ok",      "observacao": "COMBASE e CEAF com execução adequada"},
        {"indicador": "Bloco Gestão do SUS — execução",        "valor": 87.9, "meta": 90.0, "unidade": "%","status": "atencao", "observacao": "Treinamentos e capacitações com menor execução no trimestre"},
        {"indicador": "Despesa total em saúde / habitante/ano","valor": 668.4,"meta": 600,  "unidade": "R$","status": "ok",     "observacao": "Acima da média regional para municípios do porte de Apuí"},
    ]
