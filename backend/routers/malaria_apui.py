from fastapi import APIRouter

router = APIRouter(prefix="/api/malaria-apui", tags=["malaria_apui"])

_DASHBOARD = {
    "casos_ano": 1284,
    "ipa": 51.9,
    "meta_ipa_eliminacao": 1.0,
    "ivp_pct": 72.4,
    "iaf_pct": 27.6,
    "casos_graves_ano": 28,
    "obitos_malaria_ano": 2,
    "taxa_mortalidade_100k": 8.1,
    "casos_gestantes_ano": 48,
    "casos_criancas_5a_ano": 184,
    "amostras_examinadas_mes": 284,
    "ivp_ipaivp": 37.5,
    "tratamento_oportuno_pct": 84.2,
    "meta_tratamento_pct": 100.0,
    "municipio_alto_risco": True,
    "borrifacao_intradomiciliar_cobertura_pct": 42.4,
    "mosquiteiro_distribuido_ano": 284,
    "status_ipa": "critico",
    "status_tratamento": "atencao",
    "status_borrifacao": "critico",
    "risco_estratificacao": "ALTO",
}

_ESTRATIFICACAO = [
    {"localidade": "Área urbana (sede)",         "casos_ano": 284,  "ipa": 10.8, "ivp_pct": 68.0, "iaf_pct": 32.0, "risco": "MÉDIO",  "status": "atencao"},
    {"localidade": "Ramal do Acará",             "casos_ano": 212,  "ipa": 79.1, "ivp_pct": 74.0, "iaf_pct": 26.0, "risco": "ALTO",   "status": "critico"},
    {"localidade": "Vila do Juma",               "casos_ano": 184,  "ipa": 64.8, "ivp_pct": 78.0, "iaf_pct": 22.0, "risco": "ALTO",   "status": "critico"},
    {"localidade": "Zona rural / garimpo",       "casos_ano": 284,  "ipa": 98.6, "ivp_pct": 64.0, "iaf_pct": 36.0, "risco": "MUITO ALTO", "status": "critico"},
    {"localidade": "Área ribeirinha (rios)",     "casos_ano": 320,  "ipa": 83.3, "ivp_pct": 76.0, "iaf_pct": 24.0, "risco": "ALTO",   "status": "critico"},
]

_SAZONALIDADE = [
    {"mes": "Jan/25", "casos": 148, "ivp": 108, "iaf": 40, "graves": 4},
    {"mes": "Fev/25", "casos": 138, "ivp": 100, "iaf": 38, "graves": 3},
    {"mes": "Mar/25", "casos": 128, "ivp": 92,  "iaf": 36, "graves": 3},
    {"mes": "Abr/25", "casos": 84,  "ivp": 62,  "iaf": 22, "graves": 2},
    {"mes": "Mai/25", "casos": 72,  "ivp": 52,  "iaf": 20, "graves": 1},
    {"mes": "Jun/25", "casos": 64,  "ivp": 48,  "iaf": 16, "graves": 1},
    {"mes": "Jul/25", "casos": 58,  "ivp": 42,  "iaf": 16, "graves": 1},
    {"mes": "Ago/25", "casos": 68,  "ivp": 50,  "iaf": 18, "graves": 2},
    {"mes": "Set/25", "casos": 84,  "ivp": 60,  "iaf": 24, "graves": 2},
    {"mes": "Out/25", "casos": 112, "ivp": 82,  "iaf": 30, "graves": 3},
    {"mes": "Nov/25", "casos": 124, "ivp": 90,  "iaf": 34, "graves": 3},
    {"mes": "Dez/25", "casos": 148, "ivp": 106, "iaf": 42, "graves": 4},
]

_INDICADORES = [
    {"indicador": "IPA (Índice Parasitário Anual)",  "valor": 51.9, "meta": 1.0,   "unidade": "/1k hab.", "status": "critico", "observacao": "IPA 51,9 vs meta eliminação < 1 — 51,9× acima da meta. Apuí está no Grupo 3 (IPA > 50) de maior risco do PNCM. Sem perspectiva de eliminação a curto prazo"},
    {"indicador": "P. falciparum (% dos casos)",    "valor": 27.6, "meta": 0.0,   "unidade": "%",        "status": "critico", "observacao": "27,6% falciparum — espécie mais grave, pode causar malária cerebral. 28 casos graves em 2025, 2 óbitos. Risco maior em ribeirinhos sem imunidade"},
    {"indicador": "Tratamento oportuno (24h)",      "valor": 84.2, "meta": 100.0, "unidade": "%",        "status": "atencao", "observacao": "15,8% sem tratamento em 24h — distância às unidades de saúde na área ribeirinha e rural é a principal barreira. Risco de progressão para forma grave"},
    {"indicador": "Casos em gestantes",             "valor": 48,   "meta": 0,     "unidade": "casos/ano","status": "critico", "observacao": "48 casos em gestantes — malária na gestação causa aborto, prematuridade e baixo peso. Quinino + clindamicina obrigatório, nem sempre disponível"},
    {"indicador": "Borrifação intradomiciliar",     "valor": 42.4, "meta": 80.0,  "unidade": "%",        "status": "critico", "observacao": "57,6% sem borrifação — principal medida de controle vetorial além dos mosquiteiros. Falta de inseticida, pessoal e logística para zona rural/ribeirinha"},
    {"indicador": "Crianças < 5a com malária/ano",  "valor": 184,  "meta": None,  "unidade": "casos",    "status": "critico", "observacao": "184 casos em crianças < 5a — faixa de maior morbimortalidade. Anemia grave, convulsão febril e malária cerebral são as principais complicações"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/estratificacao")
def estratificacao():
    return _ESTRATIFICACAO


@router.get("/sazonalidade")
def sazonalidade():
    return _SAZONALIDADE


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
