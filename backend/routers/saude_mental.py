"""
Router: /api/saude-mental — ERSUS 360
Dados de referência municipal — Apuí/AM 2026.
situacao_dado = referencia_municipal
CAPS tipo I (sem internação), sem leitos psiquiátricos SUS locais.
Referência: CAPS Regional Humaitá / Manaus.
"""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-mental", tags=["saude_mental"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "pacientes_raps_total": 214,
        "servicos_superlotados": 1,
        "leitos_psiq_sus": 0,
        "lista_espera_total": 34,
        "tentativas_suicidio_mes": 2,
        "internacoes_mes": 1,
        "reinternacao_pct": 22,
        "atendimentos_mes": 487,
        "municipio": "Apuí/AM",
        "competencia": "Jun/2026",
    }


@router.get("/servicos-raps")
async def servicos_raps():
    return [
        {
            "servico": "CAPS I — Apuí",
            "status": "atencao",
            "pacientes_ativos": 91,
            "capacidade": 80,
            "ocupacao_pct": 114,
            "lista_espera": 18,
            "tempo_espera_dias": 21,
        },
        {
            "servico": "Apoio em SM nas UBS — ESF Centro",
            "status": "ok",
            "pacientes_ativos": 38,
            "capacidade": 50,
            "ocupacao_pct": 76,
            "lista_espera": 6,
            "tempo_espera_dias": 10,
        },
        {
            "servico": "Apoio em SM nas UBS — ESF Cidade Nova",
            "status": "ok",
            "pacientes_ativos": 44,
            "capacidade": 50,
            "ocupacao_pct": 88,
            "lista_espera": 7,
            "tempo_espera_dias": 12,
        },
        {
            "servico": "Apoio em SM nas UBS — ESF Colônia",
            "status": "ok",
            "pacientes_ativos": 28,
            "capacidade": 40,
            "ocupacao_pct": 70,
            "lista_espera": 3,
            "tempo_espera_dias": 7,
        },
        {
            "servico": "Consultório na Rua — Equipe Volante Rural",
            "status": "ok",
            "pacientes_ativos": 13,
            "capacidade": 30,
            "ocupacao_pct": 43,
            "lista_espera": 0,
            "tempo_espera_dias": 0,
        },
    ]


@router.get("/transtornos")
async def transtornos():
    return [
        {"transtorno": "Transtornos de Ansiedade (F40-F48)",          "casos": 72,  "novos_mes": 8,  "internacoes_ano": 0},
        {"transtorno": "Transtornos Depressivos (F32-F33)",            "casos": 58,  "novos_mes": 5,  "internacoes_ano": 2},
        {"transtorno": "Transtorno por uso de álcool (F10)",           "casos": 41,  "novos_mes": 4,  "internacoes_ano": 3},
        {"transtorno": "Transtorno por uso de outras substâncias (F19)","casos": 18, "novos_mes": 2,  "internacoes_ano": 1},
        {"transtorno": "Esquizofrenia e transt. psicóticos (F20-F29)", "casos": 14,  "novos_mes": 1,  "internacoes_ano": 4},
        {"transtorno": "Transtorno Bipolar (F31)",                     "casos": 9,   "novos_mes": 0,  "internacoes_ano": 1},
        {"transtorno": "Retardo Mental / Deficiência intelectual (F70)","casos": 2,  "novos_mes": 0,  "internacoes_ano": 0},
    ]


@router.get("/historico")
async def historico():
    return [
        {"mes": "Jan/26", "atendimentos": 441, "internacoes": 1, "tentativas_suicidio": 1, "alta_reinternacao_pct": 18},
        {"mes": "Fev/26", "atendimentos": 453, "internacoes": 2, "tentativas_suicidio": 2, "alta_reinternacao_pct": 20},
        {"mes": "Mar/26", "atendimentos": 462, "internacoes": 1, "tentativas_suicidio": 1, "alta_reinternacao_pct": 22},
        {"mes": "Abr/26", "atendimentos": 471, "internacoes": 2, "tentativas_suicidio": 2, "alta_reinternacao_pct": 21},
        {"mes": "Mai/26", "atendimentos": 479, "internacoes": 1, "tentativas_suicidio": 3, "alta_reinternacao_pct": 22},
        {"mes": "Jun/26", "atendimentos": 487, "internacoes": 1, "tentativas_suicidio": 2, "alta_reinternacao_pct": 22},
    ]


@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Taxa de reinternação psiquiátrica",         "valor": 22,  "meta": 15,  "unidade": "%",       "status": "critico",  "observacao": "Acima da meta nacional. CAPS superlotado."},
        {"indicador": "Cobertura CAPS / 100k hab.",                "valor": 5.0, "meta": 7.0, "unidade": "/100k",   "status": "critico",  "observacao": "Único CAPS I para ~20k hab. Necessita expansão."},
        {"indicador": "% pacientes graves sem medicação contínua", "valor": 18,  "meta": 10,  "unidade": "%",       "status": "critico",  "observacao": "Ruptura de estoque de antipsicóticos em Mai/26."},
        {"indicador": "Atendimentos SM na APS / mês",              "valor": 396, "meta": 350, "unidade": "atend.",  "status": "ok",       "observacao": "Apoio matricial e telepsiquiatria funcionando."},
        {"indicador": "Tentativas de suicídio notificadas / mês",  "valor": 2,   "meta": 0,   "unidade": "casos",   "status": "atencao",  "observacao": "Monitoramento pós-tentativa ativo nas equipes."},
        {"indicador": "Lista de espera CAPS (dias médios)",        "valor": 21,  "meta": 14,  "unidade": "dias",    "status": "atencao",  "observacao": "Demanda crescente — sazonalidade chuvas."},
    ]
