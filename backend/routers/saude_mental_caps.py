from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-mental-caps", tags=["saude_mental_caps"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "caps_i_ativo": True,
        "caps_ad_ativo": True,
        "total_usuarios_ativos": 284,
        "novos_acolhimentos_mes": 18,
        "altas_mes": 9,
        "internacoes_psiquiatricas_mes": 3,
        "leitos_referencia_manaus": 12,
        "tentativas_suicidio_mes": 2,
        "crise_atendidas_mes": 24,
        "encaminhamentos_manaus_mes": 5,
        "status_caps_i": "atencao",
        "status_caps_ad": "atencao",
    }


@lru_cache(maxsize=1)
def _SERVICOS():
    return [
        {
            "servico": "CAPS I — Centro de Atenção Psicossocial Geral",
            "tipo": "CAPS I",
            "usuarios_ativos": 187,
            "capacidade_referencia": 240,
            "modalidades": ["acolhimento", "atendimento_individual", "atendimento_grupo", "visita_domiciliar"],
            "equipe": {"medico_psiquiatra": 0.5, "psicologo": 2, "assistente_social": 1, "enfermeiro": 1, "terapeuta_ocupacional": 1, "tecnico_enfermagem": 2},
            "funcionamento": "Seg-Sex 8h-17h",
            "status": "atencao",
            "obs": "Psiquiatra apenas 2x/mês — cobertura insuficiente para demanda",
        },
        {
            "servico": "CAPS AD — Centro de Atenção Psicossocial Álcool e Drogas",
            "tipo": "CAPS AD",
            "usuarios_ativos": 97,
            "capacidade_referencia": 120,
            "modalidades": ["acolhimento", "intensivo", "semi_intensivo", "nao_intensivo", "grupo_familiar"],
            "equipe": {"medico_clinico": 1, "psicologo": 1, "assistente_social": 1, "enfermeiro": 1, "tecnico_enfermagem": 1},
            "funcionamento": "Seg-Sex 8h-17h",
            "status": "atencao",
            "obs": "Sem médico psiquiatra dedicado — pacientes graves encaminhados a Manaus",
        },
    ]


@lru_cache(maxsize=1)
def _AGRAVOS():
    return [
        {"agravo": "Transtornos de humor (depressão/bipolar)", "usuarios": 98, "pct": 34.5, "tendencia": "estavel"},
        {"agravo": "Transtornos ansiosos",                     "usuarios": 71, "pct": 25.0, "tendencia": "aumento"},
        {"agravo": "Álcool e crack (CID F10–F19)",             "usuarios": 97, "pct": 34.2, "tendencia": "aumento"},
        {"agravo": "Esquizofrenia e psicoses",                  "usuarios": 52, "pct": 18.3, "tendencia": "aumento"},
        {"agravo": "Transtornos infanto-juvenis",               "usuarios": 34, "pct": 12.0, "tendencia": "aumento"},
        {"agravo": "Demências (idosos)",                        "usuarios": 24, "pct": 8.5,  "tendencia": "estavel"},
        {"agravo": "Tentativa de suicídio / autolesão",         "usuarios": 18, "pct": 6.3,  "tendencia": "aumento"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"mes": "Jan/25", "usuarios_ativos": 248, "acolhimentos": 14, "internacoes": 2, "crises": 18, "suicidio_tent": 1},
        {"mes": "Fev/25", "usuarios_ativos": 252, "acolhimentos": 16, "internacoes": 3, "crises": 21, "suicidio_tent": 2},
        {"mes": "Mar/25", "usuarios_ativos": 258, "acolhimentos": 15, "internacoes": 2, "crises": 22, "suicidio_tent": 1},
        {"mes": "Abr/25", "usuarios_ativos": 263, "acolhimentos": 17, "internacoes": 4, "crises": 20, "suicidio_tent": 2},
        {"mes": "Mai/25", "usuarios_ativos": 270, "acolhimentos": 19, "internacoes": 3, "crises": 23, "suicidio_tent": 3},
        {"mes": "Jun/25", "usuarios_ativos": 284, "acolhimentos": 18, "internacoes": 3, "crises": 24, "suicidio_tent": 2},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Cobertura CAPS (usuários/100 mil hab)", "valor": 123.5, "meta": 100.0, "unidade": "por 100k hab",
         "status": "ok", "observacao": "Acima da meta nacional — demanda crescente por saúde mental pós-pandemia"},
        {"indicador": "Taxa de internação psiquiátrica",       "valor": 14.4,  "meta": 10.0,  "unidade": "por 10k hab",
         "status": "atencao", "observacao": "Acima do ideal — reflexo da falta de psiquiatra local"},
        {"indicador": "Tempo médio espera acolhimento",        "valor": 8,     "meta": 3,     "unidade": "dias",
         "status": "critico", "observacao": "Fila de espera de 8 dias para acolhimento no CAPS I"},
        {"indicador": "Tentativas de suicídio notificadas",    "valor": 2,     "meta": None,  "unidade": "casos/mês",
         "status": "atencao", "observacao": "Monitoramento mensal — protocolo CEVS ativado para os 2 casos"},
        {"indicador": "Usuários com PTS elaborado",            "valor": 68.4,  "meta": 100.0, "unidade": "%",
         "status": "atencao", "observacao": "31,6% dos usuários sem Projeto Terapêutico Singular atualizado"},
        {"indicador": "Consultas psiquiátricas/usuário/ano",   "valor": 4.2,   "meta": 12.0,  "unidade": "consultas",
         "status": "critico", "observacao": "Psiquiatra presente apenas 2x/mês — meta de 12 consultas/ano inatingível"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/servicos")
def servicos():
    return _SERVICOS


@router.get("/agravos")
def agravos():
    return _AGRAVOS


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
