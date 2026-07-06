from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-mulher-apui", tags=["saude_mulher_apui"])

_DASHBOARD = {
    "gestantes_ativas": 284,
    "prenatal_inicio_1tri_pct": 62.4,
    "meta_inicio_1tri_pct": 100.0,
    "consultas_prenatal_media": 5.8,
    "meta_consultas_prenatal": 6.0,
    "partos_normais_pct": 68.4,
    "partos_cesareos_pct": 31.6,
    "meta_cesareo_pct": 15.0,
    "sifilis_gestacional_taxa": 18.4,
    "sifilis_congenita_casos_ano": 18,
    "meta_sifilis_congenita": 0,
    "mortalidade_materna_100k_NV": 84.2,
    "meta_mortalidade_materna": 30.0,
    "obitos_maternos_ano": 2,
    "cobertura_citopato_pct": 44.8,
    "meta_citopato_pct": 80.0,
    "mamografia_pct": 38.4,
    "meta_mamografia_pct": 70.0,
    "status_prenatal": "atencao",
    "status_sifilis": "critico",
    "status_mortalidade": "critico",
}

_PRENATAL = [
    {"indicador": "Início no 1º trimestre",           "resultado_pct": 62.4, "meta_pct": 100.0, "status": "atencao"},
    {"indicador": "≥ 6 consultas de pré-natal",       "resultado_pct": 72.4, "meta_pct": 60.0,  "status": "ok"},
    {"indicador": "Sorologia sífilis 1º trimestre",   "resultado_pct": 64.8, "meta_pct": 95.0,  "status": "critico"},
    {"indicador": "Sorologia HIV 1º trimestre",        "resultado_pct": 68.4, "meta_pct": 95.0,  "status": "critico"},
    {"indicador": "Consulta odontológica pré-natal",  "resultado_pct": 38.4, "meta_pct": 60.0,  "status": "critico"},
    {"indicador": "Parto em maternidade de risco",     "resultado_pct": 92.4, "meta_pct": 95.0,  "status": "atencao"},
    {"indicador": "Puerpério c/ consulta 42 dias",    "resultado_pct": 56.4, "meta_pct": 100.0, "status": "atencao"},
    {"indicador": "Gestantes c/ sulfato ferroso",     "resultado_pct": 84.2, "meta_pct": 100.0, "status": "atencao"},
]

_CANCER = [
    {"exame": "Citopatológico colo uterino (25-64a)", "realizados_ano": 1284, "populacao_alvo": 2868, "cobertura_pct": 44.8, "meta_pct": 80.0, "alterados_pct": 3.4, "status": "critico"},
    {"exame": "Mamografia (50-69a)",                  "realizados_ano": 284,  "populacao_alvo": 740,  "cobertura_pct": 38.4, "meta_pct": 70.0, "alterados_pct": 2.8, "status": "critico"},
    {"exame": "HPV-DNA (30-64a)",                     "realizados_ano": 48,   "populacao_alvo": 2100, "cobertura_pct": 2.3,  "meta_pct": 70.0, "alterados_pct": 4.2, "status": "critico"},
]

_HISTORICO = [
    {"mes": "Jan/25", "gestantes": 268, "prenatal_1tri_pct": 60.4, "sifilis_gest": 4, "obitos_mat": 0, "partos": 42},
    {"mes": "Fev/25", "gestantes": 272, "prenatal_1tri_pct": 61.2, "sifilis_gest": 3, "obitos_mat": 0, "partos": 38},
    {"mes": "Mar/25", "gestantes": 276, "prenatal_1tri_pct": 61.8, "sifilis_gest": 4, "obitos_mat": 1, "partos": 44},
    {"mes": "Abr/25", "gestantes": 280, "prenatal_1tri_pct": 62.0, "sifilis_gest": 3, "obitos_mat": 0, "partos": 40},
    {"mes": "Mai/25", "gestantes": 282, "prenatal_1tri_pct": 62.2, "sifilis_gest": 2, "obitos_mat": 0, "partos": 46},
    {"mes": "Jun/25", "gestantes": 284, "prenatal_1tri_pct": 62.4, "sifilis_gest": 2, "obitos_mat": 1, "partos": 42},
]

_INDICADORES = [
    {"indicador": "Início pré-natal 1º trimestre",    "valor": 62.4, "meta": 100.0, "unidade": "%",       "status": "atencao", "observacao": "37,6% das gestantes iniciam o pré-natal tardiamente — perda de rastreio de sífilis, HIV e anemia no período mais crítico"},
    {"indicador": "Sífilis congênita (casos/ano)",    "valor": 18,   "meta": 0,     "unidade": "casos",   "status": "critico", "observacao": "18 casos em 2025 — meta é ZERO. Sífilis congênita é evitável com pré-natal adequado. Taxa municipal 18,4/1k NV vs meta 0,5"},
    {"indicador": "Mortalidade materna",              "valor": 84.2, "meta": 30.0,  "unidade": "/100k NV","status": "critico", "observacao": "2 óbitos maternos — 84,2/100k NV vs meta nacional 30. Causas: hemorragia pós-parto e hipertensão. Ambos evitáveis"},
    {"indicador": "Cesariana",                        "valor": 31.6, "meta": 15.0,  "unidade": "%",       "status": "critico", "observacao": "31,6% vs meta 15% — cesariana a pedido e por conveniência são práticas frequentes no único hospital do município"},
    {"indicador": "Citologia oncótica (cobertura)",   "valor": 44.8, "meta": 80.0,  "unidade": "%",       "status": "critico", "observacao": "55,2% das mulheres sem citologia no prazo — câncer de colo é a 2ª neoplasia feminina, e diagnóstico tardio é a regra"},
    {"indicador": "Mamografia (50-69a)",              "valor": 38.4, "meta": 70.0,  "unidade": "%",       "status": "critico", "observacao": "61,6% das mulheres sem mamografia — equipamento só em Humaitá (284 km). Encaminhamento MAC com fila de 8-12 meses"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/prenatal")
def prenatal():
    return _PRENATAL


@router.get("/cancer")
def cancer():
    return _CANCER


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
