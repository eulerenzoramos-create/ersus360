from fastapi import APIRouter

router = APIRouter(prefix="/api/vigilancia-nutricional", tags=["vigilancia_nutricional"])

_DASHBOARD = {
    "acompanhamentos_sisvan_mes": 4284,
    "cobertura_sisvan_pct": 62.4,
    "desnutricao_infantil_pct": 8.4,
    "desnutricao_grave_pct": 1.2,
    "sobrepeso_infantil_pct": 12.8,
    "obesidade_infantil_pct": 6.4,
    "anemia_gestantes_pct": 24.8,
    "anemia_criancas_pct": 32.4,
    "vitamina_a_suplementada_pct": 68.4,
    "ferro_sulfato_gestantes_pct": 84.2,
    "bolsa_familia_acomp_pct": 78.4,
    "status_desnutricao": "atencao",
    "status_anemia": "critico",
}

_ESTADO_NUTRICIONAL = [
    {"faixa": "Crianças <5 anos",
     "n_acompanhados": 1284,
     "categorias": [
         {"cat": "Magreza acentuada",  "pct": 1.2,  "status": "critico"},
         {"cat": "Magreza",            "pct": 7.2,  "status": "atencao"},
         {"cat": "Eutrofia",           "pct": 72.4, "status": "ok"},
         {"cat": "Risco sobrepeso",    "pct": 12.8, "status": "atencao"},
         {"cat": "Sobrepeso/Obesidade","pct": 6.4,  "status": "atencao"},
     ]},
    {"faixa": "Crianças 5–9 anos",
     "n_acompanhados": 984,
     "categorias": [
         {"cat": "Magreza acentuada",  "pct": 0.8,  "status": "atencao"},
         {"cat": "Magreza",            "pct": 5.4,  "status": "atencao"},
         {"cat": "Eutrofia",           "pct": 64.8, "status": "ok"},
         {"cat": "Sobrepeso",          "pct": 18.4, "status": "atencao"},
         {"cat": "Obesidade",          "pct": 10.6, "status": "critico"},
     ]},
    {"faixa": "Adolescentes (10–19 anos)",
     "n_acompanhados": 842,
     "categorias": [
         {"cat": "Magreza",            "pct": 6.2,  "status": "atencao"},
         {"cat": "Eutrofia",           "pct": 60.4, "status": "ok"},
         {"cat": "Sobrepeso",          "pct": 22.8, "status": "atencao"},
         {"cat": "Obesidade",          "pct": 10.6, "status": "critico"},
     ]},
    {"faixa": "Gestantes",
     "n_acompanhados": 312,
     "categorias": [
         {"cat": "Baixo peso",         "pct": 12.4, "status": "critico"},
         {"cat": "Adequado",           "pct": 54.8, "status": "ok"},
         {"cat": "Sobrepeso",          "pct": 22.4, "status": "atencao"},
         {"cat": "Obesidade",          "pct": 10.4, "status": "atencao"},
     ]},
]

_MICRONUTRIENTES = [
    {"micronutriente": "Anemia em crianças <5a (Hb<11)",   "prevalencia_pct": 32.4, "meta_pct": 10.0,  "status": "critico"},
    {"micronutriente": "Anemia em gestantes (Hb<11)",       "prevalencia_pct": 24.8, "meta_pct": 10.0,  "status": "critico"},
    {"micronutriente": "Vitamina A suplementada (<5a)",     "cobertura_pct": 68.4,   "meta_pct": 90.0,  "status": "atencao"},
    {"micronutriente": "Sulfato ferroso gestantes",         "cobertura_pct": 84.2,   "meta_pct": 95.0,  "status": "atencao"},
    {"micronutriente": "Ácido fólico periconcepcional",     "cobertura_pct": 72.4,   "meta_pct": 90.0,  "status": "atencao"},
    {"micronutriente": "Fluoreto sistêmico (água tratada)", "cobertura_pct": 84.6,   "meta_pct": 100.0, "status": "atencao"},
]

_HISTORICO = [
    {"mes": "Jan/25", "acomp_sisvan": 3842, "cobertura_pct": 56.2, "desnutricao_inf_pct": 9.2, "anemia_cri_pct": 34.8},
    {"mes": "Fev/25", "acomp_sisvan": 3924, "cobertura_pct": 57.4, "desnutricao_inf_pct": 8.8, "anemia_cri_pct": 34.2},
    {"mes": "Mar/25", "acomp_sisvan": 4012, "cobertura_pct": 58.8, "desnutricao_inf_pct": 8.6, "anemia_cri_pct": 33.8},
    {"mes": "Abr/25", "acomp_sisvan": 4084, "cobertura_pct": 59.8, "desnutricao_inf_pct": 8.4, "anemia_cri_pct": 33.2},
    {"mes": "Mai/25", "acomp_sisvan": 4148, "cobertura_pct": 60.8, "desnutricao_inf_pct": 8.4, "anemia_cri_pct": 32.8},
    {"mes": "Jun/25", "acomp_sisvan": 4284, "cobertura_pct": 62.4, "desnutricao_inf_pct": 8.4, "anemia_cri_pct": 32.4},
]

_INDICADORES = [
    {"indicador": "Desnutrição infantil (<5a)",            "valor": 8.4,  "meta": 5.0,  "unidade": "%",    "status": "atencao", "observacao": "8,4% das crianças <5a com déficit ponderal — maior prevalência em comunidades ribeirinhas"},
    {"indicador": "Anemia em crianças <5a",                "valor": 32.4, "meta": 10.0, "unidade": "%",    "status": "critico", "observacao": "32,4% — mais de 3× a meta nacional; associada à malária e déficit de ferro"},
    {"indicador": "Anemia em gestantes",                   "valor": 24.8, "meta": 10.0, "unidade": "%",    "status": "critico", "observacao": "24,8% das gestantes com anemia — risco de baixo peso ao nascer e prematuridade"},
    {"indicador": "Cobertura SISVAN",                      "valor": 62.4, "meta": 75.0, "unidade": "%",    "status": "atencao", "observacao": "37,6% da população vulnerável sem acompanhamento nutricional registrado"},
    {"indicador": "Vitamina A (<5a) suplementada",         "valor": 68.4, "meta": 90.0, "unidade": "%",    "status": "atencao", "observacao": "31,6% sem suplementação — deficiência de vitamina A associada a cegueira noturna e infecções"},
    {"indicador": "Obesidade infantil (5–9a)",             "valor": 10.6, "meta": 5.0,  "unidade": "%",    "status": "critico", "observacao": "Dupla carga: desnutrição nas comunidades rurais e obesidade crescente na área urbana"},
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
