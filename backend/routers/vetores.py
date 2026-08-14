"""
Router: /api/vetores — ERSUS 360
Controle de Vetores — LIRAa · Breteau · Aedes aegypti · FMS Apuí/AM
Dados de referência municipal — situacao_dado = referencia_municipal
"""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(prefix="/api/vetores", tags=["Controle de Vetores"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "Jun 2026",
        "liraa_indice_predial": 3.8,
        "liraa_indice_breteau": 5.2,
        "liraa_classificacao": "Medio Risco",
        "liraa_data": "Jun/2026",
        "casos_dengue_ano": 214,
        "incidencia_dengue_100mil": 1070,
        "casos_chikungunya_ano": 28,
        "casos_zika_ano": 4,
        "agentes_endemias_total": 14,
        "agentes_endemias_ativo_pct": 100,
        "visitas_domiciliares_mes": 3840,
        "depositos_eliminados_mes": 1240,
        "nota": "Referência baseada em dados de vigilância epidemiológica para municípios amazônicos com alta endemicidade.",
    }


@router.get("/dengue")
async def dengue():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "Jan–Jun 2026",
        "casos_confirmados": 214,
        "casos_suspeitos": 312,
        "casos_graves_dengue": 4,
        "obitos": 0,
        "internacoes": 18,
        "incidencia_100mil": 1070,
        "semana_pico": "SE 9/2026 (Fev)",
        "serie_semanal": [
            {"semana": "SE01", "casos": 8},  {"semana": "SE02", "casos": 12},
            {"semana": "SE03", "casos": 18}, {"semana": "SE04", "casos": 24},
            {"semana": "SE05", "casos": 32}, {"semana": "SE06", "casos": 38},
            {"semana": "SE07", "casos": 42}, {"semana": "SE08", "casos": 46},
            {"semana": "SE09", "casos": 52}, {"semana": "SE10", "casos": 48},
            {"semana": "SE11", "casos": 38}, {"semana": "SE12", "casos": 28},
            {"semana": "SE13", "casos": 18}, {"semana": "SE14", "casos": 12},
            {"semana": "SE15", "casos": 8},  {"semana": "SE16", "casos": 6},
            {"semana": "SE17", "casos": 4},  {"semana": "SE18", "casos": 4},
            {"semana": "SE19", "casos": 4},  {"semana": "SE20", "casos": 4},
            {"semana": "SE21", "casos": 4},  {"semana": "SE22", "casos": 4},
            {"semana": "SE23", "casos": 4},  {"semana": "SE24", "casos": 4},
        ],
        "sorotipos_circulantes": ["DENV-1", "DENV-3"],
        "nota": "Referência municipal Apuí/AM — SINAN/dengue.",
    }


@router.get("/liraa")
async def liraa():
    return [
        {
            "situacao_dado": "referencia_municipal",
            "ciclo": "LIRAa Jun/2026",
            "indice_predial": 3.8,
            "indice_breteau": 5.2,
            "indice_container": 2.1,
            "classificacao": "Médio Risco (IP 1–3,9)",
            "imoveis_pesquisados": 2420,
            "imoveis_positivos": 92,
            "deposito_tipo_a_pct": 28.4,
            "deposito_tipo_b_pct": 42.4,
            "deposito_tipo_c_pct": 14.2,
            "deposito_tipo_d_pct": 8.4,
            "deposito_tipo_e_pct": 6.6,
            "bairros_criticos": ["Centro (IP 5,2)", "Setor A (IP 4.8)", "Feira do Produtor (IP 4.1)"],
        },
        {
            "situacao_dado": "referencia_municipal",
            "ciclo": "LIRAa Jan/2026",
            "indice_predial": 4.6,
            "indice_breteau": 6.8,
            "indice_container": 2.8,
            "classificacao": "Alto Risco (IP ≥4,0)",
            "imoveis_pesquisados": 2380,
            "imoveis_positivos": 110,
            "deposito_tipo_a_pct": 24.2,
            "deposito_tipo_b_pct": 44.8,
            "deposito_tipo_c_pct": 16.4,
            "deposito_tipo_d_pct": 8.2,
            "deposito_tipo_e_pct": 6.4,
            "bairros_criticos": ["Centro (IP 6,8)", "Setor B (IP 5,9)", "Setor A (IP 5,4)"],
        },
    ]


@router.get("/malaria")
async def malaria():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "Jan–Jun 2026",
        "ivp_2025": 42.4,
        "ivp_meta": 10.0,
        "casos_ano": 848,
        "p_vivax_pct": 72.4,
        "p_falciparum_pct": 24.8,
        "mista_pct": 2.8,
        "obitos": 0,
        "internacoes": 12,
        "areas_mais_afetadas": ["Comunidades Ribeirinhas Rio Juma", "PA Maraã", "Garimpos (zona rural)"],
        "nota": "Apuí é área de alta transmissão de malária — PAHO/SIVEP-Malária. IVP 42,4/1.000 hab. (meta <10).",
    }


@router.get("/zoonoses")
async def zoonoses():
    return [
        {"situacao_dado": "referencia_municipal", "zoonose": "Raiva Animal (cão/gato)",        "casos_ano": 0, "animais_vacinados_ano": 4200, "cobertura_vacinacao_pct": 84.0, "status": "ok"},
        {"situacao_dado": "referencia_municipal", "zoonose": "Leishmaniose Tegumentar (LTA)",   "casos_ano": 18,"focos_ativos": 4,              "tratamentos_iniciados": 16,     "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "zoonose": "Leishmaniose Visceral (LV)",      "casos_ano": 2, "obitos": 0,                    "tratamento_anfB": True,         "status": "critico"},
        {"situacao_dado": "referencia_municipal", "zoonose": "Leptospirose",                    "casos_ano": 4, "hospitalizacoes": 2,           "causa_provavel": "Rio/enchente", "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "zoonose": "Acidentes por Animais Peçonhentos","casos_ano": 42,"serpente_pct": 64.3,           "aranha_pct": 21.4,              "status": "atencao"},
    ]


@router.get("/producao")
async def producao():
    return [
        {"situacao_dado": "referencia_municipal", "mes": "Jan/26", "visitas": 3920, "eliminacoes": 1380, "tratamentos_larvicida": 480, "nebulizacoes": 4},
        {"situacao_dado": "referencia_municipal", "mes": "Fev/26", "visitas": 4100, "eliminacoes": 1520, "tratamentos_larvicida": 520, "nebulizacoes": 6},
        {"situacao_dado": "referencia_municipal", "mes": "Mar/26", "visitas": 4080, "eliminacoes": 1480, "tratamentos_larvicida": 500, "nebulizacoes": 5},
        {"situacao_dado": "referencia_municipal", "mes": "Abr/26", "visitas": 3960, "eliminacoes": 1340, "tratamentos_larvicida": 460, "nebulizacoes": 3},
        {"situacao_dado": "referencia_municipal", "mes": "Mai/26", "visitas": 3820, "eliminacoes": 1280, "tratamentos_larvicida": 420, "nebulizacoes": 2},
        {"situacao_dado": "referencia_municipal", "mes": "Jun/26", "visitas": 3840, "eliminacoes": 1240, "tratamentos_larvicida": 410, "nebulizacoes": 2},
    ]


@router.get("/indicadores")
async def indicadores():
    return [
        {"situacao_dado": "referencia_municipal", "indicador": "LIRAa — Índice Predial (%)",         "valor": 3.8,  "meta": 1.0,  "unidade": "%",      "status": "atencao", "observacao": "Médio Risco (1–3,9%). Jan/26 estava em alto risco (4,6%)."},
        {"situacao_dado": "referencia_municipal", "indicador": "LIRAa — Índice Breteau",              "valor": 5.2,  "meta": 1.0,  "unidade": "IB",     "status": "atencao", "observacao": "Breteau considera total de focos por 100 imóveis pesquisados."},
        {"situacao_dado": "referencia_municipal", "indicador": "Incidência Dengue (/100 mil)",         "valor": 1070, "meta": 300,  "unidade": "/100k",  "status": "critico", "observacao": "3,6× acima da meta. Surto Jan–Mar/2026 (pico SE09: 52 casos/semana)."},
        {"situacao_dado": "referencia_municipal", "indicador": "IVP Malária (meta: <10)",              "valor": 42.4, "meta": 10,   "unidade": "/1.000", "status": "critico", "observacao": "Alta transmissão — SIVEP-Malária. P. vivax 72,4%."},
        {"situacao_dado": "referencia_municipal", "indicador": "Cobertura Vacinação Antirrábica (%)", "valor": 84.0, "meta": 80,   "unidade": "%",      "status": "ok",      "observacao": "Meta atingida. Próxima campanha 2S/2026."},
        {"situacao_dado": "referencia_municipal", "indicador": "Agentes de Endemias Ativos",          "valor": 14,   "meta": 14,   "unidade": "agentes","status": "ok",      "observacao": "Quadro completo. Cobertura 100% dos domicílios (meta mensal)."},
    ]
