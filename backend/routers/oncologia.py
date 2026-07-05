from fastapi import APIRouter

router = APIRouter(prefix="/api/oncologia", tags=["oncologia"])

_TIPOS_CANCER = [
    {"tipo": "Colo do Útero", "casos_ano": 18, "estadio_avancado_pct": 66.7,
     "rastreio_realizado_pct": 52.4, "meta_rastreio_pct": 80.0,
     "obitos_ano": 4, "tratamento_oportuno_pct": 61.1, "status": "critico"},
    {"tipo": "Mama", "casos_ano": 14, "estadio_avancado_pct": 57.1,
     "rastreio_realizado_pct": 41.8, "meta_rastreio_pct": 70.0,
     "obitos_ano": 3, "tratamento_oportuno_pct": 71.4, "status": "critico"},
    {"tipo": "Próstata", "casos_ano": 12, "estadio_avancado_pct": 41.7,
     "rastreio_realizado_pct": None, "meta_rastreio_pct": None,
     "obitos_ano": 2, "tratamento_oportuno_pct": 83.3, "status": "atencao"},
    {"tipo": "Pulmão", "casos_ano": 8, "estadio_avancado_pct": 87.5,
     "rastreio_realizado_pct": None, "meta_rastreio_pct": None,
     "obitos_ano": 6, "tratamento_oportuno_pct": 37.5, "status": "critico"},
    {"tipo": "Colorretal", "casos_ano": 9, "estadio_avancado_pct": 55.6,
     "rastreio_realizado_pct": 18.2, "meta_rastreio_pct": 40.0,
     "obitos_ano": 3, "tratamento_oportuno_pct": 66.7, "status": "critico"},
    {"tipo": "Pele Melanoma", "casos_ano": 6, "estadio_avancado_pct": 33.3,
     "rastreio_realizado_pct": None, "meta_rastreio_pct": None,
     "obitos_ano": 1, "tratamento_oportuno_pct": 83.3, "status": "atencao"},
]

_RASTREIO = [
    {"exame": "Papanicolau (colo útero)", "publico_alvo": "Mulheres 25–64 anos",
     "realizados_ano": 1842, "meta_ano": 3520, "cobertura_pct": 52.3,
     "alterados_pct": 4.8, "encaminhados_colposcopia": 42, "status": "critico"},
    {"exame": "Mamografia (mama)", "publico_alvo": "Mulheres 50–69 anos",
     "realizados_ano": 284, "meta_ano": 680, "cobertura_pct": 41.8,
     "bi_rads_4_5_pct": 3.2, "encaminhados_biopsia": 9, "status": "critico"},
    {"exame": "PSA (próstata)", "publico_alvo": "Homens 50–70 anos c/ risco",
     "realizados_ano": 312, "meta_ano": None, "cobertura_pct": None,
     "alterados_pct": 8.3, "encaminhados_uro": 26, "status": "atencao"},
    {"exame": "Sangue Oculto Fezes (colorretal)", "publico_alvo": "50–75 anos",
     "realizados_ano": 124, "meta_ano": 682, "cobertura_pct": 18.2,
     "positivos_pct": 6.5, "encaminhados_colonoscopia": 8, "status": "critico"},
]

_HISTORICO = [
    {"mes": "Jan", "novos_casos": 6, "papanicolau": 148, "mamografia": 22, "obitos": 2, "encaminhamentos_cap": 18},
    {"mes": "Fev", "novos_casos": 4, "papanicolau": 136, "mamografia": 18, "obitos": 1, "encaminhamentos_cap": 14},
    {"mes": "Mar", "novos_casos": 8, "papanicolau": 168, "mamografia": 26, "obitos": 3, "encaminhamentos_cap": 22},
    {"mes": "Abr", "novos_casos": 7, "papanicolau": 158, "mamografia": 24, "obitos": 2, "encaminhamentos_cap": 20},
    {"mes": "Mai", "novos_casos": 9, "papanicolau": 172, "mamografia": 28, "obitos": 3, "encaminhamentos_cap": 24},
    {"mes": "Jun", "novos_casos": 5, "papanicolau": 162, "mamografia": 21, "obitos": 2, "encaminhamentos_cap": 19},
]

_INDICADORES = [
    {"indicador": "Cobertura Papanicolau", "valor": 52.3, "meta": 80.0, "unidade": "%",
     "status": "critico", "observacao": "27,7 pp abaixo da meta — diagnóstico tardio de câncer de colo"},
    {"indicador": "Cobertura Mamografia (50–69)", "valor": 41.8, "meta": 70.0, "unidade": "%",
     "status": "critico", "observacao": "28,2 pp abaixo da meta — maioria dos casos diagnosticados em estádio avançado"},
    {"indicador": "Casos diagnosticados em estádio avançado", "valor": 58.4, "meta": 30.0, "unidade": "%",
     "status": "critico", "observacao": "58% em III/IV — resultado direto do rastreamento insuficiente"},
    {"indicador": "Tratamento oportuno (≤60 dias lei 12.732)", "valor": 63.8, "meta": 100.0, "unidade": "%",
     "status": "critico", "observacao": "36% dos pacientes aguardam >60 dias — risco legal e clínico"},
    {"indicador": "Cobertura rastreio colorretal", "valor": 18.2, "meta": 40.0, "unidade": "%",
     "status": "critico", "observacao": "Exame pouco solicitado — baixa adesão e estrutura insuficiente"},
    {"indicador": "Óbitos por câncer/ano", "valor": 19, "meta": None, "unidade": "óbitos",
     "status": "critico", "observacao": "19 óbitos — maioria evitáveis com diagnóstico precoce"},
]


@router.get("/dashboard")
def dashboard():
    return {
        "novos_casos_ano": 67,
        "tipos_monitorados": 6,
        "obitos_ano": 19,
        "estadio_avancado_pct": 58.4,
        "tratamento_oportuno_lei_pct": 63.8,
        "cobertura_papanicolau_pct": 52.3,
        "cobertura_mamografia_pct": 41.8,
        "encaminhamentos_cap_mes": 19,
        "rastreio_colorretal_pct": 18.2,
        "sem_acesso_quimioterapia_local": True,
        "referencia_manaus_dias": 14,
    }


@router.get("/tipos-cancer")
def tipos_cancer():
    return _TIPOS_CANCER


@router.get("/rastreio")
def rastreio():
    return _RASTREIO


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
