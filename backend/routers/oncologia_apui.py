from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/oncologia-apui", tags=["oncologia_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "casos_cancer_novos_ano": 84,
        "incidencia_100k": 340,
        "casos_estagio_avancado_pct": 68.4,
        "meta_estagio_avancado_pct": 30.0,
        "tempo_medio_diagnostico_dias": 128,
        "meta_diagnostico_dias": 60,
        "encaminhamentos_oncologia_ano": 148,
        "centro_oncologia_referencia": "Manaus/AM",
        "distancia_referencia_km": 784,
        "quimioterapia_municipal": False,
        "radioterapia_municipal": False,
        "oncologista_municipal": False,
        "mamografias_alteradas_ano": 8,
        "citologias_alteradas_alto_grau_ano": 28,
        "obitos_cancer_ano": 38,
        "mortalidade_prematura_pct": 48.4,
        "abandono_tratamento_pct": 32.4,
        "status_diagnostico": "critico",
        "status_estagio": "critico",
        "status_acesso": "critico",
    }


@lru_cache(maxsize=1)
def _TOPOGRAFIAS():
    return [
        {"topografia": "Colo do útero",               "casos_ano": 16, "pct": 19.0, "estagio_avancado_pct": 75.0, "sobrevida_5a_pct": 42.0, "status": "critico"},
        {"topografia": "Mama feminina",               "casos_ano": 14, "pct": 16.7, "estagio_avancado_pct": 71.4, "sobrevida_5a_pct": 48.0, "status": "critico"},
        {"topografia": "Próstata",                    "casos_ano": 12, "pct": 14.3, "estagio_avancado_pct": 58.3, "sobrevida_5a_pct": 62.0, "status": "critico"},
        {"topografia": "Pele não melanoma",           "casos_ano": 10, "pct": 11.9, "estagio_avancado_pct": 20.0, "sobrevida_5a_pct": 92.0, "status": "atencao"},
        {"topografia": "Pulmão",                      "casos_ano": 8,  "pct": 9.5,  "estagio_avancado_pct": 87.5, "sobrevida_5a_pct": 18.0, "status": "critico"},
        {"topografia": "Estômago",                    "casos_ano": 7,  "pct": 8.3,  "estagio_avancado_pct": 85.7, "sobrevida_5a_pct": 22.0, "status": "critico"},
        {"topografia": "Colorrretal",                 "casos_ano": 6,  "pct": 7.1,  "estagio_avancado_pct": 66.7, "sobrevida_5a_pct": 44.0, "status": "critico"},
        {"topografia": "Leucemia / linfoma",          "casos_ano": 6,  "pct": 7.1,  "estagio_avancado_pct": 50.0, "sobrevida_5a_pct": 54.0, "status": "atencao"},
        {"topografia": "Outros",                      "casos_ano": 5,  "pct": 6.0,  "estagio_avancado_pct": 60.0, "sobrevida_5a_pct": 38.0, "status": "critico"},
    ]


@lru_cache(maxsize=1)
def _FLUXO():
    return [
        {"etapa": "Suspeita clínica / rastreio",       "tempo_medio_dias": 18,  "meta_dias": 14,  "status": "atencao"},
        {"etapa": "Solicitação de biópsia/imagem",     "tempo_medio_dias": 28,  "meta_dias": 14,  "status": "critico"},
        {"etapa": "Resultado anatomopatológico",       "tempo_medio_dias": 42,  "meta_dias": 30,  "status": "atencao"},
        {"etapa": "Encaminhamento para oncologia",     "tempo_medio_dias": 18,  "meta_dias": 7,   "status": "critico"},
        {"etapa": "Primeira consulta oncologia (ref.)", "tempo_medio_dias": 22,  "meta_dias": 30,  "status": "ok"},
        {"etapa": "Total: suspeita → 1ª consulta onco","tempo_medio_dias": 128, "meta_dias": 60,  "status": "critico"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "casos_novos": 72,  "estagio_av_pct": 72.2, "obitos": 42, "encaminhamentos": 124},
        {"ano": "2023", "casos_novos": 76,  "estagio_av_pct": 71.0, "obitos": 40, "encaminhamentos": 132},
        {"ano": "2024", "casos_novos": 80,  "estagio_av_pct": 69.8, "obitos": 39, "encaminhamentos": 140},
        {"ano": "2025", "casos_novos": 84,  "estagio_av_pct": 68.4, "obitos": 38, "encaminhamentos": 148},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Diagnóstico em estágio avançado",  "valor": 68.4, "meta": 30.0, "unidade": "%",         "status": "critico", "observacao": "68,4% dos cânceres diagnosticados em estágio III/IV — mamografia a 284 km, citologia com cobertura 44,8%, sem oncologista municipal"},
        {"indicador": "Tempo suspeita → 1ª consulta onco","valor": 128,  "meta": 60,   "unidade": "dias",      "status": "critico", "observacao": "128 dias vs meta 60 (Lei 12.732/12) — gargalo em biópsia (+42 dias) e logística de encaminhamento para Manaus (784 km)"},
        {"indicador": "Sem oncologista no município",     "valor": 0,    "meta": 1,    "unidade": "profissional","status": "critico", "observacao": "Único serviço de referência em Manaus. Sem oncologista, quimioterapia e radioterapia — mesmo paliativo oncológico depende de encaminhamento"},
        {"indicador": "Abandono de tratamento",           "valor": 32.4, "meta": 5.0,  "unidade": "%",          "status": "critico", "observacao": "32,4% abandono — custo de deslocamento para Manaus (R$ 800-2.000/viagem), impacto no emprego e falta de suporte social são as causas"},
        {"indicador": "Colo do útero — estágio avançado", "valor": 75.0, "meta": 20.0, "unidade": "%",          "status": "critico", "observacao": "75% dos casos de colo em estágio III/IV — cobertura HPV 53,3%, citologia 44,8%. Câncer completamente evitável com rastreio adequado"},
        {"indicador": "Mortalidade prematura por câncer","valor": 48.4, "meta": 20.0, "unidade": "%",          "status": "critico", "observacao": "48,4% dos óbitos por câncer em menores de 70 anos — diagnóstico tardio por falta de acesso a rastreio e demora no fluxo assistencial"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/topografias")
def topografias():
    return _TOPOGRAFIAS()


@router.get("/fluxo")
def fluxo():
    return _FLUXO()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()