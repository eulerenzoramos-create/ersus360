from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-familia-apui", tags=["saude_familia_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "equipes_esf_implantadas": 8,
        "equipes_esf_necessarias": 10,
        "cobertura_esf_pct": 84.2,
        "meta_cobertura_pct": 100.0,
        "populacao_coberta": 20840,
        "populacao_descoberta": 3908,
        "acs_total": 48,
        "acs_necessarios": 58,
        "familias_cadastradas": 6284,
        "familias_acompanhadas_pct": 78.4,
        "visitas_domiciliares_mes": 8420,
        "media_visita_familia_mes": 1.34,
        "meta_visita_familia_mes": 1.0,
        "consultas_medicas_esf_mes": 2840,
        "consultas_enfermagem_mes": 1484,
        "procedimentos_odontologicos_mes": 684,
        "previne_nota_geral": 6.4,
        "previne_meta_nota": 7.0,
        "status_cobertura": "atencao",
        "status_previne": "atencao",
        "equipes_com_saude_bucal": 5,
        "equipes_sem_saude_bucal": 3,
    }


@lru_cache(maxsize=1)
def _EQUIPES():
    return [
        {"equipe": "ESF Vila Nova",        "ubs": "UBS Vila Nova",         "medico": True,  "enfermeiro": True,  "acs": 6, "populacao": 2684, "cobertura_pct": 100, "previne_nota": 7.2, "status": "ok"},
        {"equipe": "ESF Centro",           "ubs": "UBS Centro",            "medico": True,  "enfermeiro": True,  "acs": 7, "populacao": 2840, "cobertura_pct": 100, "previne_nota": 7.0, "status": "ok"},
        {"equipe": "ESF Jardim Apuí",      "ubs": "UBS Jd. Apuí",          "medico": True,  "enfermeiro": True,  "acs": 5, "populacao": 2484, "cobertura_pct": 100, "previne_nota": 6.8, "status": "ok"},
        {"equipe": "ESF Setor Industrial", "ubs": "UBS Set. Industrial",   "medico": True,  "enfermeiro": True,  "acs": 6, "populacao": 2384, "cobertura_pct": 100, "previne_nota": 6.4, "status": "atencao"},
        {"equipe": "ESF Castanheira",      "ubs": "UBS Castanheira",       "medico": False, "enfermeiro": True,  "acs": 5, "populacao": 2284, "cobertura_pct": 100, "previne_nota": 5.8, "status": "atencao"},
        {"equipe": "ESF Nova Fronteira",   "ubs": "UBS Nova Fronteira",    "medico": True,  "enfermeiro": True,  "acs": 6, "populacao": 2584, "cobertura_pct": 100, "previne_nota": 6.2, "status": "atencao"},
        {"equipe": "ESF Ramal do Acará",   "ubs": "UBS Ramal Acará",       "medico": False, "enfermeiro": True,  "acs": 7, "populacao": 2684, "cobertura_pct": 84.2, "previne_nota": 5.2, "status": "critico"},
        {"equipe": "ESF Área Rural",       "ubs": "UBS Rural",             "medico": False, "enfermeiro": True,  "acs": 6, "populacao": 2880, "cobertura_pct": 72.4, "previne_nota": 4.8, "status": "critico"},
    ]


@lru_cache(maxsize=1)
def _INDICADORES_PREVINE():
    return [
        {"indicador": "Pré-natal (≥6 consultas)",          "resultado_pct": 72.4, "meta_pct": 60.0, "parametro": "≥ 60%",  "status": "ok",      "pontuacao": 10},
        {"indicador": "Pré-natal c/ sífilis + HIV 1ºtrim.","resultado_pct": 64.8, "meta_pct": 60.0, "parametro": "≥ 60%",  "status": "ok",      "pontuacao": 10},
        {"indicador": "Gestantes c/ odonto",               "resultado_pct": 48.4, "meta_pct": 60.0, "parametro": "≥ 60%",  "status": "atencao", "pontuacao": 6},
        {"indicador": "Cobertura vacinal poliomielite",     "resultado_pct": 84.2, "meta_pct": 95.0, "parametro": "≥ 95%",  "status": "atencao", "pontuacao": 7},
        {"indicador": "Hipertensos acompanhados",           "resultado_pct": 68.4, "meta_pct": 50.0, "parametro": "≥ 50%",  "status": "ok",      "pontuacao": 10},
        {"indicador": "Diabéticos acompanhados",            "resultado_pct": 62.4, "meta_pct": 50.0, "parametro": "≥ 50%",  "status": "ok",      "pontuacao": 10},
        {"indicador": "Citopatológico colo (25-64a)",       "resultado_pct": 44.8, "meta_pct": 40.0, "parametro": "≥ 40%",  "status": "ok",      "pontuacao": 10},
        {"indicador": "Crianças < 2a c/ peso monitorado",  "resultado_pct": 72.4, "meta_pct": 55.0, "parametro": "≥ 55%",  "status": "ok",      "pontuacao": 10},
        {"indicador": "Pessoas c/ TB acompanhadas",        "resultado_pct": 64.2, "meta_pct": 60.0, "parametro": "≥ 60%",  "status": "ok",      "pontuacao": 10},
        {"indicador": "Gestantes c/ odontológico",         "resultado_pct": 38.4, "meta_pct": 60.0, "parametro": "≥ 60%",  "status": "critico", "pontuacao": 4},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"mes": "Jan/25", "consultas_medicas": 2484, "visitas_acs": 7840, "cobertura_pct": 82.4, "previne_nota": 6.0},
        {"mes": "Fev/25", "consultas_medicas": 2584, "visitas_acs": 8012, "cobertura_pct": 82.8, "previne_nota": 6.1},
        {"mes": "Mar/25", "consultas_medicas": 2684, "visitas_acs": 8124, "cobertura_pct": 83.2, "previne_nota": 6.2},
        {"mes": "Abr/25", "consultas_medicas": 2740, "visitas_acs": 8284, "cobertura_pct": 83.8, "previne_nota": 6.3},
        {"mes": "Mai/25", "consultas_medicas": 2784, "visitas_acs": 8384, "cobertura_pct": 84.0, "previne_nota": 6.4},
        {"mes": "Jun/25", "consultas_medicas": 2840, "visitas_acs": 8420, "cobertura_pct": 84.2, "previne_nota": 6.4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Cobertura ESF",                   "valor": 84.2,  "meta": 100.0, "unidade": "%",         "status": "atencao", "observacao": "2 equipes sem médico — 3.908 pessoas em área descoberta ou sem cobertura ESF plena. Médicos ausentes em Ramal do Acará e Área Rural"},
        {"indicador": "ACS / 1.000 habitantes",          "valor": 1.9,   "meta": 2.3,   "unidade": "/1k hab.",  "status": "atencao", "observacao": "48 ACS para 24.748 hab. — 10 ACS a menos do necessário. Cada ACS acima de 750 famílias perde qualidade das visitas domiciliares"},
        {"indicador": "Nota Novo Financiamento APS",             "valor": 6.4,   "meta": 7.0,   "unidade": "pontos",    "status": "atencao", "observacao": "6,4/10 — abaixo da meta 7,0. Pior indicador: pré-natal com odontológico (38,4% vs meta 60%). Impacto no financiamento federal"},
        {"indicador": "Famílias acompanhadas",           "valor": 78.4,  "meta": 100.0, "unidade": "%",         "status": "atencao", "observacao": "21,6% das famílias cadastradas sem acompanhamento regular — área rural e ribeirinha principal gargalo"},
        {"indicador": "Equipes c/ saúde bucal",          "valor": 62.5,  "meta": 100.0, "unidade": "%",         "status": "atencao", "observacao": "5 de 8 equipes têm ESB. 3 UBS sem dentista → gestantes sem odonto é o pior indicador Novo Financiamento APS da SMS"},
        {"indicador": "Visitas domiciliares/família/mês","valor": 1.34,  "meta": 1.0,   "unidade": "visitas",   "status": "ok",      "observacao": "Meta cumprida — 8.420 visitas/mês. Risco: ACS sobrecaminhados, qualidade pode cair com ampliação de famílias cadastradas"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/equipes")
def equipes():
    return _EQUIPES()


@router.get("/previne")
def previne():
    return _INDICADORES_PREVINE()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()