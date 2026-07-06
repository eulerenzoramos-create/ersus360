from fastapi import APIRouter

router = APIRouter(prefix="/api/hanseniase-apui", tags=["hanseniase_apui"])

_DASHBOARD = {
    "casos_novos_ano": 28,
    "coeficiente_deteccao_100k": 113.3,
    "classificacao_endemicidade": "Hiperendêmico",
    "meta_coef_deteccao_100k": 10.0,
    "casos_menores_15a_ano": 4,
    "pct_menores_15a": 14.3,
    "grau2_incapacidade_diagnostico_pct": 22.4,
    "meta_grau2_pct": 10.0,
    "cura_pct": 68.4,
    "meta_cura_pct": 75.0,
    "abandono_pct": 18.4,
    "meta_abandono_pct": 10.0,
    "contatos_examinados_pct": 48.4,
    "meta_contatos_pct": 80.0,
    "multibacilar_pct": 64.3,
    "paucibacilar_pct": 35.7,
    "casos_recidiva": 3,
    "casos_reacao_hanseniase": 8,
    "neurite_incapacitante": 4,
    "status_deteccao": "critico",
    "status_grau2": "critico",
    "status_contatos": "critico",
}

_CLASSIFICACAO = [
    {"forma": "Multibacilar — Virchowiana (VV)",   "casos": 8,  "pct": 28.6, "grau2_pct": 37.5, "cura_pct": 60.0, "status": "critico"},
    {"forma": "Multibacilar — Dimorfa (DD/DV/DT)", "casos": 10, "pct": 35.7, "grau2_pct": 20.0, "cura_pct": 70.0, "status": "atencao"},
    {"forma": "Paucibacilar — Tuberculoide (TT)",  "casos": 7,  "pct": 25.0, "grau2_pct": 14.3, "cura_pct": 85.7, "status": "ok"},
    {"forma": "Paucibacilar — Indeterminada (I)",  "casos": 3,  "pct": 10.7, "grau2_pct": 0.0,  "cura_pct": 100.0,"status": "ok"},
]

_INCAPACIDADES = [
    {"grau": "Grau 0 — sem incapacidade",           "casos_diagnostico": 16, "casos_alta": 14, "melhora_pct": 87.5,  "status": "ok"},
    {"grau": "Grau 1 — perda sensibilidade",        "casos_diagnostico": 6,  "casos_alta": 4,  "melhora_pct": 66.7,  "status": "atencao"},
    {"grau": "Grau 2 — incapacidade visível",       "casos_diagnostico": 6,  "casos_alta": 2,  "melhora_pct": 33.3,  "status": "critico"},
]

_HISTORICO = [
    {"ano": "2022", "casos_novos": 22, "coef_100k": 89.1,  "menores_15a": 3, "grau2_pct": 18.2, "cura_pct": 63.6, "abandono_pct": 22.7},
    {"ano": "2023", "casos_novos": 24, "coef_100k": 97.2,  "menores_15a": 3, "grau2_pct": 20.8, "cura_pct": 66.7, "abandono_pct": 20.8},
    {"ano": "2024", "casos_novos": 26, "coef_100k": 105.3, "menores_15a": 4, "grau2_pct": 21.6, "cura_pct": 67.8, "abandono_pct": 19.2},
    {"ano": "2025", "casos_novos": 28, "coef_100k": 113.3, "menores_15a": 4, "grau2_pct": 22.4, "cura_pct": 68.4, "abandono_pct": 18.4},
]

_INDICADORES = [
    {"indicador": "Coeficiente de detecção geral",           "valor": 113.3, "meta": 10.0, "unidade": "/100k", "status": "critico", "observacao": "11,3× acima da meta — Apuí é hiperendêmico (> 40/100k). A Amazônia concentra 40% dos casos do Brasil. Garimpeiros, ribeirinhos e indígenas são grupos de maior risco por condições de moradia e acesso precário"},
    {"indicador": "Casos em menores de 15 anos",             "valor": 14.3,  "meta": 0.0,  "unidade": "%",     "status": "critico", "observacao": "4 casos (14,3%) em menores de 15a — indicador de transmissão ativa recente na comunidade. Crianças só adoecem se convivem com casos não detectados. Sinaliza subnotificação e falha na busca ativa de contatos"},
    {"indicador": "Grau 2 de incapacidade no diagnóstico",   "valor": 22.4,  "meta": 10.0, "unidade": "%",     "status": "critico", "observacao": "22,4% vs meta 10% — diagnóstico tardio com incapacidade instalada. Paralisia de membros, úlceras e cegueira são consequências evitáveis com diagnóstico precoce. Impacto social e econômico severo"},
    {"indicador": "Taxa de cura",                            "valor": 68.4,  "meta": 75.0, "unidade": "%",     "status": "atencao", "observacao": "6,6 pp abaixo da meta — abandono de 18,4% (meta < 10%). Tratamento PQT-MB dura 12 meses, PQT-PB 6 meses. Reações hansênicas durante o tratamento são causa de abandono e exigem corticoide"},
    {"indicador": "Contatos examinados",                     "valor": 48.4,  "meta": 80.0, "unidade": "%",     "status": "critico", "observacao": "51,6% dos contatos domiciliares sem exame — cada MB tem em média 10-12 contatos. Vacinação BCG (dose adicional) dos contatos saudáveis sem registro compulsório na UBS"},
    {"indicador": "Taxa de abandono",                        "valor": 18.4,  "meta": 10.0, "unidade": "%",     "status": "critico", "observacao": "18,4% vs meta < 10% — abandono gera recidiva (3 casos em 2025) e risco de resistência. PQT disponível mas supervisão mensal das doses não estruturada nas UBS rurais"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/classificacao")
def classificacao():
    return _CLASSIFICACAO


@router.get("/incapacidades")
def incapacidades():
    return _INCAPACIDADES


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
