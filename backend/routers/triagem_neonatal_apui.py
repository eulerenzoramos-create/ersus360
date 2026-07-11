from fastapi import APIRouter
router = APIRouter()

@router.get("/api/triagem-neonatal-apui/dashboard")
def tn_dashboard():
    return {
        "nascidos_vivos_ano": 148,
        "partos_domiciliares_pct": 18.2,
        "partos_ubs_ribeirinha_pct": 11.5,
        "partos_hmm_pct": 70.3,
        "cobertura_pezinho_pct": 78.4,
        "cobertura_orelhinha_pct": 46.2,
        "cobertura_olhinho_pct": 52.0,
        "cobertura_coracao_pct": 68.9,
        "cobertura_quadril_pct": 55.4,
        "cobertura_media_pct": 60.2,
        "casos_confirmados_total": 4,
        "tratamentos_iniciados": 3,
        "atraso_medio_pezinho_dias": 9.4,
        "meta_pezinho_dias": 5,
        "kits_teste_disponiveis": 38,
        "kits_meta_mensal": 20,
        "criancas_sem_orelhinha_abs": 80,
        "aparelho_oea_disponivel": True,
        "protocolo_ubs_ribeirinha": False,
    }

@router.get("/api/triagem-neonatal-apui/testes")
def tn_testes():
    return [
        {
            "teste": "Teste do Pezinho",
            "sigla": "PKU/HSC/…",
            "cobertura_pct": 78.4,
            "no_prazo_pct": 52.0,
            "atraso_medio_dias": 9.4,
            "prazo_ideal": "3–5 dias",
            "realizados_ano": 116,
            "alterados": 2,
            "em_acompanhamento": 2,
            "status": "atencao",
            "doencas_rastreadas": ["Fenilcetonúria","Hipotireoidismo","Anemia Falciforme","Fibrose Cística","Biotinidase","CAH"],
        },
        {
            "teste": "Teste da Orelhinha",
            "sigla": "PEATE/EOA",
            "cobertura_pct": 46.2,
            "no_prazo_pct": 61.0,
            "atraso_medio_dias": 22.0,
            "prazo_ideal": "até 3 meses",
            "realizados_ano": 69,
            "alterados": 1,
            "em_acompanhamento": 1,
            "status": "critico",
            "doencas_rastreadas": ["Perda auditiva congênita bilateral"],
        },
        {
            "teste": "Teste do Olhinho",
            "sigla": "RV",
            "cobertura_pct": 52.0,
            "no_prazo_pct": 72.0,
            "atraso_medio_dias": 14.0,
            "prazo_ideal": "antes da alta",
            "realizados_ano": 77,
            "alterados": 1,
            "em_acompanhamento": 1,
            "status": "critico",
            "doencas_rastreadas": ["Retinoblastoma","Catarata","Glaucoma congênito"],
        },
        {
            "teste": "Teste do Coraçãozinho",
            "sigla": "OxiPulso",
            "cobertura_pct": 68.9,
            "no_prazo_pct": 80.0,
            "atraso_medio_dias": 6.0,
            "prazo_ideal": "24–48h de vida",
            "realizados_ano": 102,
            "alterados": 0,
            "em_acompanhamento": 0,
            "status": "atencao",
            "doencas_rastreadas": ["Cardiopatia Congênita Crítica"],
        },
        {
            "teste": "Teste do Quadrilzinho",
            "sigla": "US Quadril",
            "cobertura_pct": 55.4,
            "no_prazo_pct": 45.0,
            "atraso_medio_dias": 38.0,
            "prazo_ideal": "1–3 meses",
            "realizados_ano": 82,
            "alterados": 1,
            "em_acompanhamento": 1,
            "status": "critico",
            "doencas_rastreadas": ["Displasia do Desenvolvimento do Quadril"],
        },
    ]

@router.get("/api/triagem-neonatal-apui/cobertura-zona")
def tn_cobertura_zona():
    return [
        {"zona": "Sede Urbana", "nascimentos": 82, "pezinho_pct": 96.0, "orelhinha_pct": 68.0, "status": "atencao"},
        {"zona": "Zona Rural Estrada", "nascimentos": 28, "pezinho_pct": 71.0, "orelhinha_pct": 32.0, "status": "atencao"},
        {"zona": "Ribeirinha / Igarapé", "nascimentos": 22, "pezinho_pct": 54.0, "orelhinha_pct": 14.0, "status": "critico"},
        {"zona": "Assentamento / Garimpo", "nascimentos": 16, "pezinho_pct": 38.0, "orelhinha_pct": 6.0, "status": "critico"},
    ]

@router.get("/api/triagem-neonatal-apui/historico")
def tn_historico():
    return [
        {"mes": "Jan", "pezinho_pct": 72.0, "orelhinha_pct": 38.0, "coracao_pct": 60.0, "quadril_pct": 44.0},
        {"mes": "Fev", "pezinho_pct": 74.0, "orelhinha_pct": 40.0, "coracao_pct": 63.0, "quadril_pct": 48.0},
        {"mes": "Mar", "pezinho_pct": 76.0, "orelhinha_pct": 42.0, "coracao_pct": 65.0, "quadril_pct": 50.0},
        {"mes": "Abr", "pezinho_pct": 79.0, "orelhinha_pct": 45.0, "coracao_pct": 68.0, "quadril_pct": 53.0},
        {"mes": "Mai", "pezinho_pct": 78.0, "orelhinha_pct": 44.0, "coracao_pct": 70.0, "quadril_pct": 55.0},
        {"mes": "Jun", "pezinho_pct": 78.4, "orelhinha_pct": 46.2, "coracao_pct": 68.9, "quadril_pct": 55.4},
    ]

@router.get("/api/triagem-neonatal-apui/indicadores")
def tn_indicadores():
    return [
        {"indicador": "Cobertura Teste do Pezinho",       "valor": 78.4, "meta": 100, "unidade": "%",   "status": "atencao",  "observacao": "46 RN/ano sem triagem — zona ribeirinha e garimpo com maior lacuna"},
        {"indicador": "Cobertura Orelhinha (OEA)",        "valor": 46.2, "meta": 95,  "unidade": "%",   "status": "critico",  "observacao": "Aparelho OEA disponível no HMM-Humaitá; falta protocolo de triagem universal pré-alta"},
        {"indicador": "Cobertura Olhinho (RV)",           "valor": 52.0, "meta": 100, "unidade": "%",   "status": "critico",  "observacao": "Reflexo vermelho ausente = retinoblastoma não detectado antes de 6 meses"},
        {"indicador": "Pezinho no Prazo (≤5 dias)",       "valor": 52.0, "meta": 90,  "unidade": "%",   "status": "critico",  "observacao": "Atraso médio 9,4 dias — coleta em UBS ribeirinha sem transporte regular para Manaus"},
        {"indicador": "Partos Domiciliares sem Triagem",  "valor": 18.2, "meta": 0,   "unidade": "%",   "status": "critico",  "observacao": "27 RN/ano nascidos em domicílio — sem registro imediato e sem triagem automática"},
        {"indicador": "Casos Confirmados/Ano",            "valor": 4,    "meta": None, "unidade": "casos","status": "atencao", "observacao": "2 hipotireoidismo congênito, 1 perda auditiva bilateral, 1 DDQ — todos em tratamento"},
    ]
