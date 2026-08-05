from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/hiperdia-apui", tags=["hiperdia_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "hipertensos_cadastrados": 2840,
        "hipertensos_estimativa_pop": 4960,
        "hipertensos_cobertura_pct": 57.3,
        "hipertensos_controlados_pct": 48.4,
        "meta_controlados_pct": 70.0,
        "diabeticos_cadastrados": 984,
        "diabeticos_estimativa_pop": 1732,
        "diabeticos_cobertura_pct": 56.8,
        "diabeticos_controlados_pct": 42.4,
        "meta_diabeticos_controlados_pct": 60.0,
        "hba1c_media_pct": 8.4,
        "meta_hba1c_pct": 7.0,
        "consultas_hiperdia_mes": 1284,
        "renovacoes_receita_mes": 2840,
        "abandono_tratamento_pct": 22.4,
        "meta_abandono_pct": 10.0,
        "internacoes_icsap_has_dm_ano": 184,
        "amputacoes_dm_ano": 8,
        "avc_associado_has_ano": 28,
        "status_controle_has": "critico",
        "status_controle_dm": "critico",
        "status_abandono": "critico",
    }


@lru_cache(maxsize=1)
def _CONTROLE_HAS():
    return [
        {"faixa": "< 130/80 mmHg (controlado)",       "pacientes": 1375, "pct": 48.4, "status": "atencao"},
        {"faixa": "130-139/80-89 (limítrofe)",         "pacientes": 682,  "pct": 24.0, "status": "atencao"},
        {"faixa": "140-159/90-99 (HAS 1)",             "pacientes": 512,  "pct": 18.0, "status": "critico"},
        {"faixa": "160-179/100-109 (HAS 2)",           "pacientes": 199,  "pct": 7.0,  "status": "critico"},
        {"faixa": "≥ 180/110 mmHg (HAS 3 / urgência)","pacientes": 72,   "pct": 2.5,  "status": "critico"},
    ]


@lru_cache(maxsize=1)
def _CONTROLE_DM():
    return [
        {"faixa": "HbA1c < 7% (controlado)",           "pacientes": 417,  "pct": 42.4, "status": "atencao"},
        {"faixa": "HbA1c 7-7,9% (adequado)",           "pacientes": 246,  "pct": 25.0, "status": "atencao"},
        {"faixa": "HbA1c 8-8,9% (inadequado)",         "pacientes": 197,  "pct": 20.0, "status": "critico"},
        {"faixa": "HbA1c ≥ 9% (descontrolado)",        "pacientes": 124,  "pct": 12.6, "status": "critico"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"mes": "Jan/25", "consultas": 1104, "controlados_has_pct": 44.8, "controlados_dm_pct": 38.4, "abandono": 58, "internacoes_icsap": 14},
        {"mes": "Fev/25", "consultas": 1148, "controlados_has_pct": 45.8, "controlados_dm_pct": 39.6, "abandono": 52, "internacoes_icsap": 16},
        {"mes": "Mar/25", "consultas": 1184, "controlados_has_pct": 46.4, "controlados_dm_pct": 40.4, "abandono": 56, "internacoes_icsap": 15},
        {"mes": "Abr/25", "consultas": 1224, "controlados_has_pct": 47.2, "controlados_dm_pct": 41.2, "abandono": 50, "internacoes_icsap": 16},
        {"mes": "Mai/25", "consultas": 1264, "controlados_has_pct": 47.8, "controlados_dm_pct": 41.8, "abandono": 48, "internacoes_icsap": 15},
        {"mes": "Jun/25", "consultas": 1284, "controlados_has_pct": 48.4, "controlados_dm_pct": 42.4, "abandono": 54, "internacoes_icsap": 16},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Hipertensos com PA controlada",    "valor": 48.4, "meta": 70.0, "unidade": "%",         "status": "critico", "observacao": "51,6% dos hipertensos cadastrados sem controle adequado — falta de adesão ao tratamento, sobrecarga das UBS e rotatividade de médicos contribuem"},
        {"indicador": "Diabéticos com HbA1c < 7%",       "valor": 42.4, "meta": 60.0, "unidade": "%",         "status": "critico", "observacao": "HbA1c média 8,4% — 2,4 pp acima da meta. Dieta inadequada, sedentarismo e falta de educação em saúde são os principais determinantes"},
        {"indicador": "Abandono de tratamento",           "valor": 22.4, "meta": 10.0, "unidade": "%",         "status": "critico", "observacao": "22,4% vs meta 10% — distância à UBS (zona rural/ribeirinha), dificuldade de acesso a medicamentos e falta de acompanhamento domiciliar"},
        {"indicador": "Internações ICSAP (HAS + DM)",    "valor": 184,  "meta": None,  "unidade": "intern./ano","status": "critico", "observacao": "184 internações evitáveis/ano por complicações de HAS e DM — custo médio R$ 2.800/internação. R$ 515.200/ano em internações evitáveis"},
        {"indicador": "Amputações por DM",               "valor": 8,    "meta": 0,     "unidade": "casos/ano", "status": "critico", "observacao": "8 amputações/ano — todas de membros inferiores por pé diabético não tratado. Programa de pé diabético não estruturado na SMS"},
        {"indicador": "AVC associado à HAS",             "valor": 28,   "meta": None,  "unidade": "casos/ano", "status": "critico", "observacao": "28 AVCs/ano em hipertensos — 72% com PA > 140/90 antes do evento. Controle adequado da PA reduz risco de AVC em até 40%"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/controle-has")
def controle_has():
    return _CONTROLE_HAS


@router.get("/controle-dm")
def controle_dm():
    return _CONTROLE_DM


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
