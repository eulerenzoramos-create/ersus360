from fastapi import APIRouter

router = APIRouter(prefix="/api/dcnt-cronicas", tags=["dcnt_cronicas"])

_DASHBOARD = {
    "hipertensao_cadastrados": 3284,
    "hipertensao_controlados_pct": 58.4,
    "diabetes_cadastrados": 1842,
    "diabetes_controlados_pct": 44.2,
    "obesidade_adultos_pct": 24.8,
    "sobrepeso_adultos_pct": 36.4,
    "dpoc_acompanhados": 184,
    "risco_cv_alto_pct": 18.6,
    "internacoes_dcnt_mes": 42,
    "obitos_dcnt_ano": 38,
    "status_has": "atencao",
    "status_dm": "critico",
}

_DOENCAS = [
    {
        "doenca": "Hipertensão Arterial Sistêmica (HAS)",
        "cid": "I10",
        "cadastrados": 3284,
        "controlados": 1918,
        "controlados_pct": 58.4,
        "meta_controle_pct": 70.0,
        "medicamentos_basicos": ["Losartana", "Atenolol", "Hidroclorotiazida", "Anlodipino"],
        "consultas_ano": 8.4,
        "meta_consultas": 12.0,
        "status": "atencao",
    },
    {
        "doenca": "Diabetes Mellitus (DM)",
        "cid": "E11",
        "cadastrados": 1842,
        "controlados": 814,
        "controlados_pct": 44.2,
        "meta_controle_pct": 60.0,
        "medicamentos_basicos": ["Metformina", "Glibenclamida", "Insulina NPH", "Insulina Regular"],
        "consultas_ano": 6.8,
        "meta_consultas": 12.0,
        "status": "critico",
    },
    {
        "doenca": "DPOC / Asma",
        "cid": "J44/J45",
        "cadastrados": 184,
        "controlados": 102,
        "controlados_pct": 55.4,
        "meta_controle_pct": 70.0,
        "medicamentos_basicos": ["Salbutamol", "Ipratrópio", "Budesonida", "Fluticasona"],
        "consultas_ano": 5.2,
        "meta_consultas": 8.0,
        "status": "atencao",
    },
    {
        "doenca": "Dislipidemia",
        "cid": "E78",
        "cadastrados": 984,
        "controlados": 512,
        "controlados_pct": 52.0,
        "meta_controle_pct": 65.0,
        "medicamentos_basicos": ["Sinvastatina", "Atorvastatina"],
        "consultas_ano": 4.8,
        "meta_consultas": 8.0,
        "status": "atencao",
    },
    {
        "doenca": "Obesidade (adultos)",
        "cid": "E66",
        "cadastrados": 1486,
        "controlados": 248,
        "controlados_pct": 16.7,
        "meta_controle_pct": 30.0,
        "medicamentos_basicos": [],
        "consultas_ano": 3.2,
        "meta_consultas": 6.0,
        "status": "critico",
    },
]

_RISCO_CV = [
    {"faixa": "Baixo (<10%)",     "pct": 42.8, "n": 1406},
    {"faixa": "Moderado (10-20%)", "pct": 38.6, "n": 1268},
    {"faixa": "Alto (>20%)",       "pct": 18.6, "n": 611},
]

_HISTORICO = [
    {"mes": "Jan/25", "has_controlados_pct": 54.2, "dm_controlados_pct": 40.8, "internacoes_dcnt": 38, "obitos_dcnt": 3},
    {"mes": "Fev/25", "has_controlados_pct": 55.1, "dm_controlados_pct": 41.4, "internacoes_dcnt": 40, "obitos_dcnt": 2},
    {"mes": "Mar/25", "has_controlados_pct": 56.4, "dm_controlados_pct": 42.0, "internacoes_dcnt": 44, "obitos_dcnt": 4},
    {"mes": "Abr/25", "has_controlados_pct": 57.2, "dm_controlados_pct": 42.8, "internacoes_dcnt": 41, "obitos_dcnt": 3},
    {"mes": "Mai/25", "has_controlados_pct": 57.8, "dm_controlados_pct": 43.4, "internacoes_dcnt": 45, "obitos_dcnt": 4},
    {"mes": "Jun/25", "has_controlados_pct": 58.4, "dm_controlados_pct": 44.2, "internacoes_dcnt": 42, "obitos_dcnt": 3},
]

_INDICADORES = [
    {"indicador": "HAS com PA controlada",          "valor": 58.4, "meta": 70.0,  "unidade": "%",        "status": "atencao", "observacao": "41,6% dos hipertensos sem controle adequado — principal causa de AVC e IAM"},
    {"indicador": "DM com glicemia controlada",     "valor": 44.2, "meta": 60.0,  "unidade": "%",        "status": "critico", "observacao": "55,8% sem controle — risco elevado de complicações micro e macrovasculares"},
    {"indicador": "Usuários com risco CV alto",     "valor": 18.6, "meta": None,   "unidade": "% carteira","status": "atencao","observacao": "611 usuários com risco cardiovascular >20% — precisam de acompanhamento intensivo"},
    {"indicador": "Internações por DCNT/mês",       "valor": 42,   "meta": 30,    "unidade": "internações","status": "atencao","observacao": "Internações acima do esperado — reflexo do baixo controle ambulatorial"},
    {"indicador": "Óbitos por DCNT (2025)",         "valor": 38,   "meta": None,  "unidade": "óbitos",   "status": "atencao", "observacao": "Principal causa de morte evitável — HAS e DM respondem por 68% dos óbitos"},
    {"indicador": "Obesidade em adultos",           "valor": 24.8, "meta": 20.0,  "unidade": "%",        "status": "atencao", "observacao": "Fator de risco principal para DM2, HAS e dislipidemia"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/doencas")
def doencas():
    return _DOENCAS


@router.get("/risco-cv")
def risco_cv():
    return _RISCO_CV


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
