from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-mental-apui", tags=["saude_mental_apui2"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "caps_tipo_i": 1,
        "caps_ad": 0,
        "caps_infanto_juvenil": 0,
        "leitos_psiquiatricos_municipio": 0,
        "psiquiatras_municipio": 0,
        "psicologos_municipio": 2,
        "meta_psicologos_por_10k": 1.0,
        "caps_pacientes_acompanhados": 184,
        "caps_capacidade_maxima": 120,
        "caps_superlotacao_pct": 153.3,
        "taxa_suicidio_por_100k": 18.4,
        "media_nacional_suicidio_por_100k": 6.5,
        "tentativas_suicidio_ano": 28,
        "internacoes_psiquiatricas_ano": 28,
        "internacoes_fora_municipio_pct": 100.0,
        "referencia_internacao": "HPS Manaus / Humaitá",
        "distancia_referencia_km": 784,
        "alcool_drogas_caps_pct": 38.4,
        "violencia_domestica_caps_pct": 22.4,
        "nasf_psicologo_equipes_pct": 50.0,
        "tempo_espera_consulta_psiquiatria_dias": 128,
        "reinternacoes_30dias_pct": 28.4,
        "status_caps": "critico",
        "status_suicidio": "critico",
        "status_acesso": "critico",
    }


@lru_cache(maxsize=1)
def _AGRAVOS():
    return [
        {"agravo": "Transtornos depressivos",             "prevalencia_estimada": 2470, "em_tratamento": 380, "cobertura_pct": 15.4, "status": "critico", "observacao": "Prevalência estimada 10% da população — diagnóstico e tratamento na APS precário. Antidepressivos básicos disponíveis (fluoxetina/amitriptilina) mas sem psicólogo em 50% das equipes NASF para psicoterapia de suporte"},
        {"agravo": "Transtornos de ansiedade",            "prevalencia_estimada": 1976, "em_tratamento": 284, "cobertura_pct": 14.4, "status": "critico", "observacao": "Diagnóstico subidentificado na APS — médico de família sem suporte de saúde mental. Benzodiazepínicos amplamente prescritos sem controle de dependência: 38,4% de uso prolongado > 90 dias"},
        {"agravo": "Transt. pelo uso de álcool/drogas",   "prevalencia_estimada": 1235, "em_tratamento": 71,  "cobertura_pct": 5.7,  "status": "critico", "observacao": "CAPS AD não existe — CAPS I aberto absorve 38,4% de demanda álcool/drogas sem estrutura para desintoxicação. Crack/pasta base presente na sede; garimpo ilegal é vetor de distribuição de entorpecentes"},
        {"agravo": "Psicose / esquizofrenia",             "prevalencia_estimada": 247,  "em_tratamento": 184, "cobertura_pct": 74.5, "status": "atencao", "observacao": "Melhor cobertura — CAPS I faz acompanhamento. Antipsicóticos (haloperidol, risperidona, clozapina) com disponibilidade irregular na farmácia básica. Crise psicótica aguda = internação 784 km sem leito de observação local"},
        {"agravo": "Suicídio / tentativas",               "prevalencia_estimada": None, "em_tratamento": 28,  "cobertura_pct": None, "status": "critico", "observacao": "Taxa 18,4/100k — 2,8x a média nacional. Homens 15-44 anos são o grupo de maior risco. Garimpo ilegal (isolamento, dívida, droga, violência) é fator determinante. CVV não tem cobertura local. CAPS sem protocolo de crise 24h"},
        {"agravo": "Violência doméstica / PTSD",          "prevalencia_estimada": None, "em_tratamento": 41,  "cobertura_pct": None, "status": "critico", "observacao": "22,4% da demanda CAPS relacionada a violência doméstica. CREAS sem psicólogo especializado em trauma. Mulher vítima de violência com saúde mental comprometida não tem rede de cuidado integrada fora do CAPS"},
    ]


@lru_cache(maxsize=1)
def _CAPS_PRODUCAO():
    return [
        {"mes": "Jan", "atendimentos": 228, "novos": 18, "altas": 4,  "crises": 3, "internacoes": 2},
        {"mes": "Fev", "atendimentos": 214, "novos": 14, "altas": 3,  "crises": 2, "internacoes": 2},
        {"mes": "Mar", "atendimentos": 238, "novos": 22, "altas": 6,  "crises": 4, "internacoes": 3},
        {"mes": "Abr", "atendimentos": 224, "novos": 16, "altas": 5,  "crises": 3, "internacoes": 2},
        {"mes": "Mai", "atendimentos": 248, "novos": 24, "altas": 4,  "crises": 5, "internacoes": 3},
        {"mes": "Jun", "atendimentos": 232, "novos": 18, "altas": 6,  "crises": 2, "internacoes": 2},
        {"mes": "Jul", "atendimentos": 258, "novos": 28, "altas": 8,  "crises": 6, "internacoes": 4},
        {"mes": "Ago", "atendimentos": 244, "novos": 20, "altas": 5,  "crises": 4, "internacoes": 3},
        {"mes": "Set", "atendimentos": 268, "novos": 26, "altas": 7,  "crises": 5, "internacoes": 4},
        {"mes": "Out", "atendimentos": 252, "novos": 22, "altas": 6,  "crises": 3, "internacoes": 2},
        {"mes": "Nov", "atendimentos": 278, "novos": 30, "altas": 9,  "crises": 7, "internacoes": 5},
        {"mes": "Dez", "atendimentos": 284, "novos": 32, "altas": 10, "crises": 8, "internacoes": 5},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "pacientes_caps": 148, "suicidios_tentativas": 18, "internacoes": 22, "taxa_suicidio_100k": 22.4, "psicologos": 1},
        {"ano": "2023", "pacientes_caps": 158, "suicidios_tentativas": 22, "internacoes": 24, "taxa_suicidio_100k": 20.8, "psicologos": 1},
        {"ano": "2024", "pacientes_caps": 172, "suicidios_tentativas": 24, "internacoes": 26, "taxa_suicidio_100k": 19.6, "psicologos": 2},
        {"ano": "2025", "pacientes_caps": 184, "suicidios_tentativas": 28, "internacoes": 28, "taxa_suicidio_100k": 18.4, "psicologos": 2},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Taxa de suicídio",                         "valor": 18.4, "meta": 6.5,  "unidade": "/100k hab", "status": "critico", "observacao": "2,8x a média nacional — garimpo ilegal é vetor (isolamento, dívida, drogas, violência). CAPS sem protocolo de crise 24h. CVV sem linha local. Tentativas de suicídio subnotificadas: estimativa de 4-6 tentativas para cada óbito"},
        {"indicador": "CAPS superlotação",                        "valor": 153.3,"meta": 100.0,"unidade": "% capacidade","status": "critico","observacao": "184 pacientes / capacidade 120. CAPS I inadequado para município de 24.700 hab — necessita CAPS II. CAPS AD inexistente apesar de demanda significativa (38,4% alcool/drogas). Sem leito de crise para observação de 24-72h"},
        {"indicador": "Tempo de espera para psiquiatria",         "valor": 128,  "meta": 30,   "unidade": "dias",       "status": "critico", "observacao": "Zero psiquiatra no município — TFD para Humaitá/Manaus. Espera de 128 dias para doente mental agudo é abandono de tratamento garantido. Crise aguda = polícia + viatura + UPA sem protocolo psiquiátrico"},
        {"indicador": "Reinternação em 30 dias",                  "valor": 28.4, "meta": 15.0, "unidade": "%",          "status": "critico", "observacao": "Alta hospitalar sem seguimento CAPS estruturado = recaída. Paciente retorna a Manaus em crise 30 dias depois. Contrarreferência hospitalar não existe: paciente chega sem resumo, CAPS recomeça do zero"},
        {"indicador": "Cobertura NASF psicólogo nas equipes",     "valor": 50.0, "meta": 100.0,"unidade": "%",          "status": "atencao", "observacao": "4/8 equipes ESF sem psicólogo do NASF. Zona rural e ribeirinha são as mais descobertas — populações com maior exposição a violência, isolamento e substâncias. Único ponto de saúde mental além do CAPS"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/agravos")
def agravos():
    return _AGRAVOS()


@router.get("/caps-producao")
def caps_producao():
    return _CAPS_PRODUCAO()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()