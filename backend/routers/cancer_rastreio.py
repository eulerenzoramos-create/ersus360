from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/cancer-rastreio", tags=["cancer_rastreio"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "colpocitologia_cobertura_pct": 64.8,
        "mamografia_cobertura_pct": 42.4,
        "cancer_colo_casos_ano": 3,
        "cancer_mama_casos_ano": 2,
        "cancer_pele_casos_ano": 8,
        "cancer_prostata_casos_ano": 4,
        "cancer_pulmao_casos_ano": 2,
        "total_casos_novos_ano": 22,
        "estadio_avancado_pct": 68.2,
        "referenciados_manaus": 22,
        "status_colo": "atencao",
        "status_mama": "critico",
    }


@lru_cache(maxsize=1)
def _RASTREIO():
    return [
        {
            "cancer": "Colo do Útero",
            "publico_alvo": "Mulheres 25–64 anos",
            "n_alvo": 4284,
            "exame": "Colpocitologia oncótica (Papanicolau)",
            "cobertura_pct": 64.8,
            "meta_pct": 80.0,
            "exames_realizados_ano": 2776,
            "alterados": 84,
            "alterados_pct": 3.0,
            "encaminhadas_colposcopia": 42,
            "casos_confirmados_ano": 3,
            "estadio_avancado_pct": 66.7,
            "status": "atencao",
        },
        {
            "cancer": "Mama",
            "publico_alvo": "Mulheres 50–69 anos",
            "n_alvo": 1284,
            "exame": "Mamografia",
            "cobertura_pct": 42.4,
            "meta_pct": 70.0,
            "exames_realizados_ano": 544,
            "alterados": 28,
            "alterados_pct": 5.1,
            "encaminhadas_colposcopia": 14,
            "casos_confirmados_ano": 2,
            "estadio_avancado_pct": 100.0,
            "status": "critico",
            "obs": "Mamografia não disponível em Apuí — todas as mulheres referenciadas a Manaus. Baixa cobertura por dificuldade logística.",
        },
        {
            "cancer": "Próstata",
            "publico_alvo": "Homens ≥50 anos",
            "n_alvo": 1842,
            "exame": "PSA + Toque retal",
            "cobertura_pct": 52.8,
            "meta_pct": 65.0,
            "exames_realizados_ano": 972,
            "alterados": 64,
            "alterados_pct": 6.6,
            "encaminhadas_colposcopia": 18,
            "casos_confirmados_ano": 4,
            "estadio_avancado_pct": 75.0,
            "status": "atencao",
        },
        {
            "cancer": "Pele",
            "publico_alvo": "Adultos em geral (rural/garimpo)",
            "n_alvo": 18000,
            "exame": "Exame dermatológico",
            "cobertura_pct": 28.4,
            "meta_pct": 50.0,
            "exames_realizados_ano": 5112,
            "alterados": 148,
            "alterados_pct": 2.9,
            "encaminhadas_colposcopia": 48,
            "casos_confirmados_ano": 8,
            "estadio_avancado_pct": 37.5,
            "status": "atencao",
            "obs": "Alta exposição solar na zona rural e garimpo. Melanoma e carcinoma basocelular são os mais frequentes.",
        },
    ]


@lru_cache(maxsize=1)
def _ESTADIAMENTO():
    return [
        {"estadio": "I — Localizado",    "casos": 4,  "pct": 18.2},
        {"estadio": "II — Regional",     "casos": 3,  "pct": 13.6},
        {"estadio": "III — Regional av.", "casos": 8, "pct": 36.4},
        {"estadio": "IV — Metastático",  "casos": 7,  "pct": 31.8},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "casos_novos": 18, "estadio_avancado_pct": 72.2, "colpocito_cobertura": 58.4, "mamografia_cobertura": 34.2},
        {"ano": "2023", "casos_novos": 19, "estadio_avancado_pct": 73.7, "colpocito_cobertura": 60.8, "mamografia_cobertura": 36.4},
        {"ano": "2024", "casos_novos": 21, "estadio_avancado_pct": 71.4, "colpocito_cobertura": 62.4, "mamografia_cobertura": 39.8},
        {"ano": "2025", "casos_novos": 22, "estadio_avancado_pct": 68.2, "colpocito_cobertura": 64.8, "mamografia_cobertura": 42.4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Cobertura Papanicolau (25–64a)",   "valor": 64.8, "meta": 80.0, "unidade": "%",     "status": "atencao", "observacao": "35,2% das mulheres sem colpocitologia nos últimos 3 anos"},
        {"indicador": "Cobertura Mamografia (50–69a)",    "valor": 42.4, "meta": 70.0, "unidade": "%",     "status": "critico", "observacao": "Mamografia ausente em Apuí — todas referenciadas a Manaus, causando baixa adesão"},
        {"indicador": "Diagnóstico em estádio avançado",  "valor": 68.2, "meta": 40.0, "unidade": "%",     "status": "critico", "observacao": "68,2% dos casos diagnosticados em estádio III/IV — indica falha no rastreio precoce"},
        {"indicador": "Casos novos de câncer/ano",        "valor": 22,   "meta": None, "unidade": "casos", "status": "atencao", "observacao": "Incidência crescente — principais: pele (8), próstata (4), colo útero (3), mama (2)"},
        {"indicador": "PSA + toque retal (≥50a)",         "valor": 52.8, "meta": 65.0, "unidade": "%",     "status": "atencao", "observacao": "Alta taxa de diagnóstico tardio de próstata (75% estádio III/IV)"},
        {"indicador": "Rastreio câncer de pele",          "valor": 28.4, "meta": 50.0, "unidade": "%",     "status": "critico", "observacao": "Exposição crônica ao sol em trabalho rural e garimpo — alto risco de melanoma"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/rastreio")
def rastreio():
    return _RASTREIO()


@router.get("/estadiamento")
def estadiamento():
    return _ESTADIAMENTO()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()