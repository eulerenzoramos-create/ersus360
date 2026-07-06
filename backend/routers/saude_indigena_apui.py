from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-indigena", tags=["saude_indigena"])

_DASHBOARD = {
    "populacao_indigena": 1284,
    "aldeias_total": 18,
    "aldeias_com_emsi": 12,
    "emsi_total": 3,
    "ubsi_total": 2,
    "polo_base": "Apuí",
    "etnias": ["Tenharim", "Mura", "Parintintin", "Jiahui"],
    "cobertura_prenatal_indigena_pct": 72.4,
    "imunizacao_indigena_pct": 78.6,
    "desnutricao_infantil_indigena_pct": 14.8,
    "malaria_indigena_pct_total": 48.4,
    "obitos_indigenas_ano": 12,
    "obito_infantil_indigena_por_mil": 38.4,
    "status_geral": "critico",
}

_ALDEIAS = [
    {"aldeia": "Aldeia Tenharim (Marmelos)",    "etnia": "Tenharim",   "populacao": 384, "emsi": True,  "ubsi": True,  "acesso": "barco/helicóptero", "distancia_polo_km": 180, "status": "atencao"},
    {"aldeia": "Aldeia Jiahui (Rio Marmelos)",   "etnia": "Jiahui",     "populacao": 148, "emsi": True,  "ubsi": False, "acesso": "barco",             "distancia_polo_km": 220, "status": "atencao"},
    {"aldeia": "Aldeia Parintintin",             "etnia": "Parintintin","populacao": 212, "emsi": True,  "ubsi": True,  "acesso": "barco/avião",        "distancia_polo_km": 260, "status": "critico"},
    {"aldeia": "Aldeia Mura (Igapó-Açu)",        "etnia": "Mura",       "populacao": 284, "emsi": False, "ubsi": False, "acesso": "barco",             "distancia_polo_km": 120, "status": "critico"},
    {"aldeia": "Outras 14 aldeias (pequeno porte)","etnia": "Diversas", "populacao": 256, "emsi": False, "ubsi": False, "acesso": "canoa/pé",          "distancia_polo_km": 150, "status": "critico"},
]

_INDICADORES_SAUDE = [
    {"indicador": "Cobertura vacinal infantil indígena",          "valor": 78.6,  "meta": 95.0,  "unidade": "%",        "status": "atencao"},
    {"indicador": "Pré-natal indígena (≥6 consultas)",            "valor": 42.8,  "meta": 75.0,  "unidade": "%",        "status": "critico"},
    {"indicador": "Desnutrição infantil indígena (<5a)",          "valor": 14.8,  "meta": 5.0,   "unidade": "%",        "status": "critico"},
    {"indicador": "Malária em indígenas (% do total municipal)",  "valor": 48.4,  "meta": None,  "unidade": "% casos",  "status": "critico"},
    {"indicador": "Óbito infantil indígena",                      "valor": 38.4,  "meta": 10.0,  "unidade": "por 1k NV","status": "critico"},
    {"indicador": "Aldeias com EMSI presente",                    "valor": 12,    "meta": 18,    "unidade": "aldeias",  "status": "atencao"},
    {"indicador": "Saneamento básico nas aldeias",                "valor": 28.4,  "meta": 80.0,  "unidade": "%",        "status": "critico"},
]

_HISTORICO = [
    {"ano": "2022", "pop_indigena": 1184, "cobertura_vacinal": 72.4, "malaria_casos": 384, "desnutricao_inf": 16.8, "obitos": 14},
    {"ano": "2023", "pop_indigena": 1212, "cobertura_vacinal": 74.8, "malaria_casos": 398, "desnutricao_inf": 15.8, "obitos": 13},
    {"ano": "2024", "pop_indigena": 1248, "cobertura_vacinal": 76.4, "malaria_casos": 408, "desnutricao_inf": 15.2, "obitos": 12},
    {"ano": "2025", "pop_indigena": 1284, "cobertura_vacinal": 78.6, "malaria_casos": 408, "desnutricao_inf": 14.8, "obitos": 12},
]

_INDICADORES = [
    {"indicador": "Óbito infantil indígena",               "valor": 38.4, "meta": 10.0, "unidade": "por 1k NV","status": "critico","observacao": "Taxa quase 4× a meta — causas: diarreia, malária, desnutrição e prematuridade sem UTI neonatal local"},
    {"indicador": "Desnutrição infantil indígena",         "valor": 14.8, "meta": 5.0,  "unidade": "%",        "status": "critico","observacao": "14,8% — quase 2× a taxa municipal (8,4%). Aldeias isoladas com insegurança alimentar"},
    {"indicador": "Aldeias sem EMSI",                      "valor": 6,    "meta": 0,    "unidade": "aldeias",  "status": "critico","observacao": "6 aldeias sem equipe — incluindo a Aldeia Mura (284 hab) e 14 aldeias pequenas"},
    {"indicador": "Malária em indígenas (% total)",        "valor": 48.4, "meta": None, "unidade": "%",        "status": "critico","observacao": "Indígenas com 48,4% dos casos de malária apesar de serem apenas 5,6% da população"},
    {"indicador": "Saneamento básico nas aldeias",         "valor": 28.4, "meta": 80.0, "unidade": "%",        "status": "critico","observacao": "71,6% sem saneamento adequado — agua sem tratamento e fossas rudimentares"},
    {"indicador": "Cobertura vacinal infantil indígena",   "valor": 78.6, "meta": 95.0, "unidade": "%",        "status": "atencao","observacao": "21,4% das crianças indígenas sem esquema vacinal completo — acesso por barco dificulta"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/aldeias")
def aldeias():
    return _ALDEIAS


@router.get("/indicadores-saude")
def indicadores_saude():
    return _INDICADORES_SAUDE


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
