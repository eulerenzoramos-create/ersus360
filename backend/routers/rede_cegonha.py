from fastapi import APIRouter

router = APIRouter(prefix="/api/rede-cegonha", tags=["rede_cegonha"])

_DASHBOARD = {
    "gestantes_acompanhadas": 312,
    "cobertura_prenatal_pct": 84.6,
    "consultas_minimas_6_pct": 62.4,
    "primeira_consulta_ate_12sem_pct": 48.2,
    "partos_ano": 284,
    "cesareas_pct": 52.4,
    "obitos_maternos_ano": 1,
    "obitos_fetais_ano": 4,
    "obitos_neonatais_precoces_ano": 2,
    "sifilis_congenita_casos": 8,
    "status_prenatal": "atencao",
    "status_parto": "critico",
}

_PRENATAL = [
    {"indicador": "1ª consulta até 12ª semana",          "valor": 48.2, "meta": 60.0,  "unidade": "%", "status": "atencao"},
    {"indicador": "6+ consultas de pré-natal",            "valor": 62.4, "meta": 75.0,  "unidade": "%", "status": "atencao"},
    {"indicador": "USG obstétrico realizado",             "valor": 71.8, "meta": 90.0,  "unidade": "%", "status": "atencao"},
    {"indicador": "Teste HIV pré-natal",                  "valor": 94.2, "meta": 100.0, "unidade": "%", "status": "ok"},
    {"indicador": "Teste Sífilis pré-natal",              "valor": 96.4, "meta": 100.0, "unidade": "%", "status": "ok"},
    {"indicador": "Glicemia / TTOG",                     "valor": 78.4, "meta": 90.0,  "unidade": "%", "status": "atencao"},
    {"indicador": "Vacinação dTpa atualizada",            "valor": 88.6, "meta": 95.0,  "unidade": "%", "status": "atencao"},
    {"indicador": "Sulfato ferroso prescrito",            "valor": 91.2, "meta": 100.0, "unidade": "%", "status": "ok"},
    {"indicador": "Consulta odontológica pré-natal",      "valor": 42.8, "meta": 75.0,  "unidade": "%", "status": "critico"},
    {"indicador": "Teste toxoplasmose",                   "valor": 82.1, "meta": 90.0,  "unidade": "%", "status": "atencao"},
]

_PARTO = {
    "local_parto": [
        {"local": "HPS Manaus (referência)",         "partos": 231, "pct": 81.3},
        {"local": "HEMOAM / outras unidades Manaus",  "partos": 53,  "pct": 18.7},
        {"local": "Apuí (domiciliar/sem estrutura)",  "partos": 0,   "pct": 0.0},
    ],
    "tipo_parto": [
        {"tipo": "Cesariana",     "n": 149, "pct": 52.4},
        {"tipo": "Normal/vaginal","n": 135, "pct": 47.5},
    ],
    "consulta_puerperio_ate_42dias_pct": 54.8,
    "meta_puerperio_pct": 75.0,
    "obs": "Apuí não possui maternidade — 100% das gestantes referenciadas a Manaus (600 km). Alta taxa de cesariana (52,4%) — acima do recomendado pela OMS (<15%).",
}

_MORTALIDADE = [
    {"evento": "Óbito materno",           "casos_2025": 1, "taxa": 344.8, "unidade": "por 100k NV", "meta": 20.0,  "status": "critico"},
    {"evento": "Óbito fetal (natimorto)", "casos_2025": 4, "taxa": 13.8,  "unidade": "por 1k NV",   "meta": 8.0,   "status": "critico"},
    {"evento": "Óbito neonatal precoce",  "casos_2025": 2, "taxa": 6.9,   "unidade": "por 1k NV",   "meta": 5.0,   "status": "atencao"},
    {"evento": "Sífilis congênita",       "casos_2025": 8, "taxa": 27.6,  "unidade": "por 1k NV",   "meta": 0.5,   "status": "critico"},
    {"evento": "HIV perinatal",           "casos_2025": 0, "taxa": 0.0,   "unidade": "por 1k NV",   "meta": 0.1,   "status": "ok"},
]

_HISTORICO = [
    {"ano": "2022", "cobertura_prenatal": 76.4, "consultas_6mais": 52.1, "cesareas_pct": 48.2, "obitos_mat": 0, "sifilis_cong": 5},
    {"ano": "2023", "cobertura_prenatal": 80.2, "consultas_6mais": 57.4, "cesareas_pct": 50.1, "obitos_mat": 2, "sifilis_cong": 6},
    {"ano": "2024", "cobertura_prenatal": 83.1, "consultas_6mais": 59.8, "cesareas_pct": 51.8, "obitos_mat": 1, "sifilis_cong": 7},
    {"ano": "2025", "cobertura_prenatal": 84.6, "consultas_6mais": 62.4, "cesareas_pct": 52.4, "obitos_mat": 1, "sifilis_cong": 8},
]

_INDICADORES = [
    {"indicador": "Cobertura pré-natal",              "valor": 84.6, "meta": 90.0, "unidade": "%",        "status": "atencao", "observacao": "15,4% das gestantes sem acompanhamento regular"},
    {"indicador": "Sífilis congênita (taxa/1k NV)",   "valor": 27.6, "meta": 0.5,  "unidade": "por 1k",  "status": "critico", "observacao": "8 casos em 2025 — ALERTA EPIDEMIOLÓGICO; meta de eliminação muito distante"},
    {"indicador": "Taxa de cesariana",                "valor": 52.4, "meta": 30.0, "unidade": "%",        "status": "critico", "observacao": "52,4% — mais que o dobro recomendado pela OMS; ausência de maternidade local"},
    {"indicador": "Razão mortalidade materna",        "valor": 344.8,"meta": 20.0, "unidade": "por 100k", "status": "critico", "observacao": "1 óbito materno em 2025 (pré-eclâmpsia grave em trânsito para Manaus)"},
    {"indicador": "Consulta puerperial até 42 dias",  "valor": 54.8, "meta": 75.0, "unidade": "%",        "status": "atencao", "observacao": "45,2% das puérperas sem retorno para consulta no prazo"},
    {"indicador": "Consulta odontológica pré-natal",  "valor": 42.8, "meta": 75.0, "unidade": "%",        "status": "critico", "observacao": "Apenas 42,8% das gestantes com atendimento odontológico durante gestação"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/prenatal")
def prenatal():
    return _PRENATAL


@router.get("/parto")
def parto():
    return _PARTO


@router.get("/mortalidade")
def mortalidade():
    return _MORTALIDADE


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
