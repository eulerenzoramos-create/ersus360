from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-idoso-apui", tags=["saude_idoso_apui"])

_DASHBOARD = {
    "populacao_idosa_estimada": 2484,
    "pct_populacao_total": 10.0,
    "idosos_cadastrados_esf": 1984,
    "cobertura_cadastro_pct": 79.9,
    "caderneta_idoso_atualizada_pct": 42.4,
    "meta_caderneta_pct": 100.0,
    "avaliacao_funcional_realizada_pct": 28.4,
    "meta_avaliacao_pct": 80.0,
    "idosos_vulneraveis_estimativa": 748,
    "idosos_vulneraveis_acompanhados_pct": 34.2,
    "ilpi_municipal": False,
    "ilpi_referencia": "Humaitá/AM",
    "ilpi_distancia_km": 284,
    "quedas_internacao_ano": 28,
    "fraturas_quadril_ano": 12,
    "polifarmacia_pct": 38.4,
    "meta_polifarmacia_pct": 20.0,
    "internacoes_icsap_idoso_ano": 84,
    "mortalidade_idosa_60mais_pct": 48.4,
    "status_cobertura": "atencao",
    "status_avaliacao": "critico",
    "status_vulnerabilidade": "critico",
}

_CONDICOES = [
    {"condicao": "Hipertensão arterial sistêmica",   "prevalencia_pct": 68.4, "acompanhados_pct": 62.4, "status": "atencao"},
    {"condicao": "Diabetes mellitus tipo 2",          "prevalencia_pct": 28.4, "acompanhados_pct": 54.2, "status": "atencao"},
    {"condicao": "Doença articular degenerativa",    "prevalencia_pct": 42.4, "acompanhados_pct": 28.4, "status": "critico"},
    {"condicao": "Depressão / ansiedade",            "prevalencia_pct": 22.4, "acompanhados_pct": 38.4, "status": "critico"},
    {"condicao": "Demência (qualquer tipo)",          "prevalencia_pct": 8.4,  "acompanhados_pct": 18.4, "status": "critico"},
    {"condicao": "DPOC",                             "prevalencia_pct": 12.4, "acompanhados_pct": 42.4, "status": "atencao"},
    {"condicao": "Insuficiência cardíaca",           "prevalencia_pct": 9.4,  "acompanhados_pct": 48.4, "status": "atencao"},
    {"condicao": "Incontinência urinária",           "prevalencia_pct": 18.4, "acompanhados_pct": 12.4, "status": "critico"},
]

_RISCOS = [
    {"risco": "Polifarmácia (≥ 5 medicamentos)",     "afetados_pct": 38.4, "meta_pct": 20.0, "status": "critico"},
    {"risco": "Risco de queda (MUST ≥ 2)",           "afetados_pct": 48.4, "meta_pct": 20.0, "status": "critico"},
    {"risco": "Desnutrição / risco nutricional",     "afetados_pct": 22.4, "meta_pct": 10.0, "status": "critico"},
    {"risco": "Isolamento social / solidão",          "afetados_pct": 34.2, "meta_pct": 15.0, "status": "critico"},
    {"risco": "Dependência funcional leve",           "afetados_pct": 28.4, "meta_pct": None, "status": "atencao"},
    {"risco": "Dependência funcional grave",          "afetados_pct": 12.4, "meta_pct": None, "status": "critico"},
]

_HISTORICO = [
    {"ano": "2022", "cadastrados": 1784, "cobertura_pct": 71.8, "caderneta_pct": 32.4, "internacoes_icsap": 88, "quedas_intern": 24},
    {"ano": "2023", "cadastrados": 1848, "cobertura_pct": 74.4, "caderneta_pct": 36.2, "internacoes_icsap": 86, "quedas_intern": 26},
    {"ano": "2024", "cadastrados": 1924, "cobertura_pct": 77.5, "caderneta_pct": 39.4, "internacoes_icsap": 85, "quedas_intern": 27},
    {"ano": "2025", "cadastrados": 1984, "cobertura_pct": 79.9, "caderneta_pct": 42.4, "internacoes_icsap": 84, "quedas_intern": 28},
]

_INDICADORES = [
    {"indicador": "Avaliação funcional realizada",     "valor": 28.4, "meta": 80.0,  "unidade": "%",         "status": "critico", "observacao": "71,6% dos idosos sem avaliação funcional — sem identificação de síndrome geriátrica, declínio funcional passa despercebido até internação"},
    {"indicador": "Caderneta do idoso atualizada",    "valor": 42.4, "meta": 100.0, "unidade": "%",         "status": "critico", "observacao": "57,6% dos idosos sem caderneta em dia — instrumento de vigilância e seguimento longitudinal subutilizado na rede"},
    {"indicador": "Polifarmácia (≥ 5 medicamentos)",  "valor": 38.4, "meta": 20.0,  "unidade": "%",         "status": "critico", "observacao": "38,4% em polifarmácia — risco de interação medicamentosa e queda. Sem revisão farmacoterapêutica sistematizada na SMS"},
    {"indicador": "ILPI municipal",                   "valor": 0,    "meta": 1,     "unidade": "serv.",     "status": "critico", "observacao": "Sem ILPI em Apuí — idosos dependentes ficam com família ou são encaminhados para Humaitá (284 km). Muitos ficam em casa sem suporte"},
    {"indicador": "Internações por queda",            "valor": 28,   "meta": None,  "unidade": "casos/ano", "status": "critico", "observacao": "28 internações/ano por queda — 12 fraturas de quadril (mortalidade 25% em 1 ano). Adaptação domiciliar não é ofertada pela SMS"},
    {"indicador": "Vulneráveis acompanhados",         "valor": 34.2, "meta": 100.0, "unidade": "%",         "status": "critico", "observacao": "65,8% dos idosos vulneráveis sem acompanhamento estruturado — isolamento social + dependência funcional formam o principal cluster de risco"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/condicoes")
def condicoes():
    return _CONDICOES


@router.get("/riscos")
def riscos():
    return _RISCOS


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
