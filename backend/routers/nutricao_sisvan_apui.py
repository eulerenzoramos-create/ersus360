from fastapi import APIRouter

router = APIRouter(prefix="/api/nutricao-sisvan-apui", tags=["nutricao_sisvan_apui"])

_DASHBOARD = {
    "sisvan_cobertura_pct": 48.4,
    "meta_sisvan_pct": 60.0,
    "desnutricao_grave_menor5a_pct": 4.8,
    "meta_desnutricao_pct": 2.0,
    "desnutricao_moderada_menor5a_pct": 8.4,
    "baixo_peso_nascer_pct": 8.2,
    "meta_baixo_peso_pct": 5.0,
    "anemia_gestantes_pct": 28.4,
    "meta_anemia_gestantes_pct": 15.0,
    "anemia_criancas_menor5a_pct": 38.4,
    "excesso_peso_adultos_pct": 38.4,
    "obesidade_adultos_pct": 18.4,
    "desnutricao_idosos_pct": 22.4,
    "vitamina_a_menor5a_pct": 64.2,
    "meta_vitamina_a_pct": 90.0,
    "sulfato_ferroso_gestantes_pct": 72.4,
    "meta_sulfato_ferroso_pct": 90.0,
    "nutrisus_implantado": False,
    "nasf_nutricionista": False,
    "can_implantado": False,
    "status_desnutricao": "critico",
    "status_anemia": "critico",
    "status_sisvan": "atencao",
}

_ESTADO_NUTRICIONAL = [
    {"faixa": "Crianças < 2 anos",   "desnut_grave_pct": 6.4,  "desnut_mod_pct": 10.2, "adequado_pct": 72.4, "excesso_pct": 11.0, "status": "critico"},
    {"faixa": "Crianças 2-5 anos",   "desnut_grave_pct": 4.8,  "desnut_mod_pct": 8.4,  "adequado_pct": 74.8, "excesso_pct": 12.0, "status": "critico"},
    {"faixa": "Escolares 5-10 anos", "desnut_grave_pct": 2.4,  "desnut_mod_pct": 4.8,  "adequado_pct": 68.4, "excesso_pct": 24.4, "status": "atencao"},
    {"faixa": "Adolescentes",         "desnut_grave_pct": 1.2,  "desnut_mod_pct": 3.4,  "adequado_pct": 62.4, "excesso_pct": 33.0, "status": "atencao"},
    {"faixa": "Adultos",              "desnut_grave_pct": 0.8,  "desnut_mod_pct": 2.4,  "adequado_pct": 38.4, "excesso_pct": 58.4, "status": "atencao"},
    {"faixa": "Idosos >= 60 anos",   "desnut_grave_pct": 8.4,  "desnut_mod_pct": 14.0, "adequado_pct": 55.2, "excesso_pct": 22.4, "status": "critico"},
    {"faixa": "Gestantes",            "desnut_grave_pct": 4.2,  "desnut_mod_pct": 8.4,  "adequado_pct": 58.4, "excesso_pct": 29.0, "status": "critico"},
]

_MICRONUTRIENTES = [
    {"micronutriente": "Vitamina A (< 5 anos)",         "cobertura_pct": 64.2, "meta_pct": 90.0, "status": "critico",  "impacto": "Cegueira noturna, imunossupressao, maior mortalidade por diarreia. NutriSUS nao implantado em Apui"},
    {"micronutriente": "Ferro / sulfato ferroso (gest.)","cobertura_pct": 72.4, "meta_pct": 90.0, "status": "critico",  "impacto": "28,4% de anemia em gestantes — prematuridade, baixo peso ao nascer, mortalidade materna aumentada"},
    {"micronutriente": "Ferro (criancas < 5a)",          "cobertura_pct": 58.4, "meta_pct": 90.0, "status": "critico",  "impacto": "38,4% de anemia em menores de 5a — atraso cognitivo, pior desempenho escolar, imunossupressao"},
    {"micronutriente": "Acido folico (gestantes)",       "cobertura_pct": 78.4, "meta_pct": 95.0, "status": "atencao", "impacto": "Defeitos do tubo neural — 2 UBS com desabastecimento reportado em 2025"},
    {"micronutriente": "Fluor (agua tratada < 5a)",      "cobertura_pct": 48.4, "meta_pct": 80.0, "status": "critico",  "impacto": "Agua fluoretada so 48,4% — CEO-d 4,2 em criancas de 5 anos vs meta OMS 2,0"},
]

_HISTORICO = [
    {"ano": "2022", "desnut_grave_5a_pct": 5.8, "anemia_gest_pct": 31.2, "sisvan_cob_pct": 38.4, "excesso_peso_adult_pct": 34.8, "vit_a_pct": 58.4},
    {"ano": "2023", "desnut_grave_5a_pct": 5.4, "anemia_gest_pct": 30.4, "sisvan_cob_pct": 42.4, "excesso_peso_adult_pct": 36.2, "vit_a_pct": 60.4},
    {"ano": "2024", "desnut_grave_5a_pct": 5.0, "anemia_gest_pct": 29.2, "sisvan_cob_pct": 45.8, "excesso_peso_adult_pct": 37.4, "vit_a_pct": 62.8},
    {"ano": "2025", "desnut_grave_5a_pct": 4.8, "anemia_gest_pct": 28.4, "sisvan_cob_pct": 48.4, "excesso_peso_adult_pct": 38.4, "vit_a_pct": 64.2},
]

_INDICADORES = [
    {"indicador": "Desnutricao grave (< 5 anos)",       "valor": 4.8,  "meta": 2.0,  "unidade": "%", "status": "critico", "observacao": "2,4x a meta — seguranca alimentar comprometida em ~240 criancas. Comunidades ribeirinhas estimadas em 12-18% (sem SISVAN local). NutriSUS nao implantado e NASF sem nutricionista"},
    {"indicador": "Anemia em gestantes",                 "valor": 28.4, "meta": 15.0, "unidade": "%", "status": "critico", "observacao": "28,4% vs meta 15% — sulfato ferroso com cobertura de 72,4% (meta 90%). Anemia na gestacao dobra risco de parto prematuro e baixo peso ao nascer (8,2% vs meta 5%)"},
    {"indicador": "Anemia em criancas < 5 anos",         "valor": 38.4, "meta": 20.0, "unidade": "%", "status": "critico", "observacao": "38,4% — causa mais prevalente de deficit cognitivo reversivel. Ferro profilatico nao sistematizado. Crianca com anemia: atraso na linguagem, menor QI, pior desempenho escolar"},
    {"indicador": "Vitamina A (suplementacao < 5a)",     "valor": 64.2, "meta": 90.0, "unidade": "%", "status": "critico", "observacao": "25,8 pp abaixo da meta — NutriSUS nao implantado. Campanha semestral com cobertura irregular. Hipovitaminose A aumenta mortalidade por diarreia e infeccoes em 20-30%"},
    {"indicador": "Cobertura SISVAN",                    "valor": 48.4, "meta": 60.0, "unidade": "%", "status": "atencao", "observacao": "51,6% sem monitoramento nutricional — dados sub-representam situacao real, especialmente ribeirinhos e rurais. Sem dados, sem acao programatica estruturada"},
    {"indicador": "Excesso de peso (adultos)",           "valor": 38.4, "meta": None, "unidade": "%", "status": "atencao", "observacao": "Transicao nutricional: coexistem desnutricao em criancas e obesidade em adultos no mesmo domicilio. Risco cardiovascular e DM2 aumentados. NASF sem nutricionista para orientacao individualizada"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/estado-nutricional")
def estado_nutricional():
    return _ESTADO_NUTRICIONAL


@router.get("/micronutrientes")
def micronutrientes():
    return _MICRONUTRIENTES


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
