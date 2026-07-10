"""Saúde Sexual e Reprodutiva — Planejamento Familiar / IST / Pré-Natal · Apuí/AM"""
from fastapi import APIRouter
router = APIRouter(prefix="/api/saude-sexual-reprodutiva-apui", tags=["Saúde Sexual Reprodutiva Apuí"])

DASHBOARD = {
    "mulheres_idade_fertil": 4284,
    "cobertura_metodo_contraceptivo_pct": 62.4,
    "meta_cobertura_pct": 80.0,
    "gestantes_acompanhadas": 148,
    "prenatal_adequado_pct": 71.3,
    "meta_prenatal_pct": 90.0,
    "testes_ist_realizados_mes": 284,
    "positivos_sifilis_mes": 8,
    "positivos_hiv_mes": 1,
    "adolescentes_gravidez_pct": 22.4,
    "meta_adolescentes_pct": 15.0,
    "status": "atencao",
}

METODOS = [
    {"metodo": "Anticoncepcional oral combinado", "usuarios": 1284, "pct_fertil": 30.0, "disponibilidade": "regular"},
    {"metodo": "Preservativo masculino",          "usuarios": 840,  "pct_fertil": 19.6, "disponibilidade": "ok"},
    {"metodo": "Injetável trimestral",            "usuarios": 524,  "pct_fertil": 12.2, "disponibilidade": "ok"},
    {"metodo": "DIU de cobre",                    "usuarios": 184,  "pct_fertil": 4.3,  "disponibilidade": "atencao"},
    {"metodo": "Implante subdérmico",             "usuarios": 48,   "pct_fertil": 1.1,  "disponibilidade": "critico"},
    {"metodo": "Laqueadura tubária",              "usuarios": 284,  "pct_fertil": 6.6,  "disponibilidade": "ok"},
    {"metodo": "Vasectomia",                      "usuarios": 28,   "pct_fertil": 0.7,  "disponibilidade": "atencao"},
    {"metodo": "Nenhum método",                   "usuarios": 1092, "pct_fertil": 25.5, "disponibilidade": "—"},
]

GRAVIDEZ_ADOLESCENTE = [
    {"faixa": "10-14 anos", "gestantes_2025": 4,  "gestantes_2024": 6,  "variacao_pct": -33.3},
    {"faixa": "15-17 anos", "gestantes_2025": 18, "gestantes_2024": 22, "variacao_pct": -18.2},
    {"faixa": "18-19 anos", "gestantes_2025": 11, "gestantes_2024": 14, "variacao_pct": -21.4},
]

HISTORICO = [
    {"mes": "Jan/25", "testes_ist": 228, "sifilis_pos": 6,  "hiv_pos": 1, "prenatal_adeq_pct": 68.4, "metodo_pct": 59.8},
    {"mes": "Fev/25", "testes_ist": 242, "sifilis_pos": 7,  "hiv_pos": 0, "prenatal_adeq_pct": 69.2, "metodo_pct": 60.4},
    {"mes": "Mar/25", "testes_ist": 256, "sifilis_pos": 9,  "hiv_pos": 1, "prenatal_adeq_pct": 70.1, "metodo_pct": 61.2},
    {"mes": "Abr/25", "testes_ist": 268, "sifilis_pos": 7,  "hiv_pos": 0, "prenatal_adeq_pct": 70.8, "metodo_pct": 61.8},
    {"mes": "Mai/25", "testes_ist": 274, "sifilis_pos": 8,  "hiv_pos": 1, "prenatal_adeq_pct": 71.0, "metodo_pct": 62.1},
    {"mes": "Jun/25", "testes_ist": 284, "sifilis_pos": 8,  "hiv_pos": 1, "prenatal_adeq_pct": 71.3, "metodo_pct": 62.4},
]

INDICADORES = [
    {"indicador": "Cobertura contraceptiva",       "valor": "62.4%", "meta": "80%",  "status": "atencao"},
    {"indicador": "Pré-natal adequado (7+ cons.)", "valor": "71.3%", "meta": "90%",  "status": "atencao"},
    {"indicador": "Gravidez na adolescência",      "valor": "22.4%", "meta": "15%",  "status": "critico"},
    {"indicador": "Detecção sífilis gestante",     "valor": "100%",  "meta": "100%", "status": "ok"},
    {"indicador": "Testagem HIV pré-natal",        "valor": "97.3%", "meta": "100%", "status": "ok"},
    {"indicador": "Implante subdérmico disponível","valor": "Crítico","meta": "Regular","status": "critico"},
]

@router.get("/dashboard")
def dashboard():          return DASHBOARD
@router.get("/metodos")
def metodos():            return METODOS
@router.get("/gravidez-adolescente")
def gravidez_adolescente():return GRAVIDEZ_ADOLESCENTE
@router.get("/historico")
def historico():          return HISTORICO
@router.get("/indicadores")
def indicadores():        return INDICADORES
