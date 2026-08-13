"""
Router: /api/leishmaniose — ERSUS 360
Dados de referência municipal — Apuí/AM 2026.
situacao_dado = referencia_municipal
Leishmaniose Tegumentar Americana (LTA) é endemia no sul do AM.
Apuí tem alta transmissão vetorial (Lutzomyia). LV esporádica.
"""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(prefix="/api/leishmaniose", tags=["leishmaniose"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "casos_lta_ano": 73,
        "casos_lv_ano": 4,
        "formas_cutanea": 52,
        "formas_cutaneo_mucosa": 17,
        "formas_mucosa": 4,
        "formas_visceral": 4,
        "cura_pct": 81,
        "abandono_tratamento_pct": 11,
        "obitos_lv_ano": 0,
        "casos_em_tratamento": 28,
        "casos_novos_mes": 6,
        "incidencia_100k": 365,
        "municipio": "Apuí/AM",
        "competencia": "Jun/2026",
    }


@router.get("/casos-lta")
async def casos_lta():
    return {
        "situacao_dado": "referencia_municipal",
        "por_forma_clinica": [
            {"forma": "Cutânea (LC)",         "n": 52,  "pct": 71, "cura_pct": 88, "abandono_pct": 7},
            {"forma": "Cutâneo-mucosa (LCM)", "n": 17,  "pct": 23, "cura_pct": 71, "abandono_pct": 18},
            {"forma": "Mucosa (LM)",          "n": 4,   "pct": 6,  "cura_pct": 62, "abandono_pct": 22},
        ],
        "por_faixa_etaria": [
            {"faixa": "0-9 anos",  "n": 4},
            {"faixa": "10-19",     "n": 8},
            {"faixa": "20-39",     "n": 29},
            {"faixa": "40-59",     "n": 23},
            {"faixa": "60+",       "n": 9},
        ],
        "por_sexo": [
            {"sexo": "Masculino",  "n": 54, "pct": 74},
            {"sexo": "Feminino",   "n": 19, "pct": 26},
        ],
        "esquema_tratamento": [
            {"esquema": "Antimoniato de N-metilglucamina",  "n": 58, "pct": 79},
            {"esquema": "Anfotericina B lipossomal",        "n": 12, "pct": 16},
            {"esquema": "Miltefosina",                      "n": 3,  "pct": 4},
        ],
    }


@router.get("/procedencia")
async def procedencia():
    return {
        "situacao_dado": "referencia_municipal",
        "por_zona": [
            {"zona": "Zona Rural — Garimpo / Floresta",   "n": 41, "pct": 56},
            {"zona": "Zona Rural — Assentamentos",        "n": 18, "pct": 25},
            {"zona": "Zona Urbana periférica",            "n": 9,  "pct": 12},
            {"zona": "Zona Urbana central",               "n": 5,  "pct": 7},
        ],
        "por_localidade": [
            {"localidade": "PA Realidade / São Paulo",    "n": 19},
            {"localidade": "PA Rio Juma",                 "n": 14},
            {"localidade": "Margem AM-174 km 80-120",     "n": 12},
            {"localidade": "Sede Apuí",                   "n": 14},
            {"localidade": "Outros",                      "n": 14},
        ],
        "nota": "56% dos casos originários de zonas de garimpo e desmatamento recente.",
    }


@router.get("/historico")
async def historico():
    return [
        {"mes": "Jan/26", "casos_novos": 5, "curas": 7,  "abandonos": 1, "em_tratamento": 31},
        {"mes": "Fev/26", "casos_novos": 7, "curas": 6,  "abandonos": 1, "em_tratamento": 31},
        {"mes": "Mar/26", "casos_novos": 8, "curas": 9,  "abandonos": 2, "em_tratamento": 28},
        {"mes": "Abr/26", "casos_novos": 6, "curas": 8,  "abandonos": 1, "em_tratamento": 25},
        {"mes": "Mai/26", "casos_novos": 7, "curas": 6,  "abandonos": 2, "em_tratamento": 24},
        {"mes": "Jun/26", "casos_novos": 6, "curas": 4,  "abandonos": 0, "em_tratamento": 28},
    ]


@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Incidência LTA / 100k hab.",              "valor": 365, "meta": 200, "unidade": "/100k",  "status": "critico",  "observacao": "Município hiperendêmico — taxa nacional ~15/100k."},
        {"indicador": "Taxa de cura LTA",                        "valor": 81,  "meta": 85,  "unidade": "%",      "status": "atencao",  "observacao": "Meta OMS 85%. Forma mucosa reduz a média."},
        {"indicador": "Taxa de abandono tratamento LTA",         "valor": 11,  "meta": 5,   "unidade": "%",      "status": "critico",  "observacao": "Distância unidades e efeitos do antimonial."},
        {"indicador": "Proporção diagnóstico em até 30 dias",    "valor": 67,  "meta": 80,  "unidade": "%",      "status": "atencao",  "observacao": "Acesso difícil em assentamentos rurais."},
        {"indicador": "Casos LV / ano",                          "valor": 4,   "meta": 0,   "unidade": "casos",  "status": "critico",  "observacao": "LV esporádica — canídeos domésticos reservatórios."},
        {"indicador": "Atividades de controle vetorial realizadas","valor": 6,  "meta": 12,  "unidade": "ativ.",  "status": "critico",  "observacao": "Borrifação residual e controle mecânico insuficientes."},
        {"indicador": "Notificação imediata de óbito por LV",    "valor": 0,   "meta": 0,   "unidade": "óbitos", "status": "ok",       "observacao": "Nenhum óbito por LV registrado em 2026."},
    ]
