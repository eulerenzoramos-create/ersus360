from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-mental", tags=["saude_mental"])

@lru_cache(maxsize=1)
def _SERVICOS_RAPS():
    return [
        {"servico": "CAPS II (Adulto)", "pacientes_ativos": 214, "capacidade": 240, "ocupacao_pct": 89.2,
         "lista_espera": 18, "tempo_espera_dias": 22, "profissionais": 8, "status": "atencao"},
        {"servico": "CAPS AD (Álcool e Drogas)", "pacientes_ativos": 282, "capacidade": 240, "ocupacao_pct": 117.5,
         "lista_espera": 34, "tempo_espera_dias": 38, "profissionais": 7, "status": "critico"},
        {"servico": "CAPS Infantojuvenil", "pacientes_ativos": 191, "capacidade": 180, "ocupacao_pct": 106.1,
         "lista_espera": 28, "tempo_espera_dias": 34, "profissionais": 6, "status": "critico"},
        {"servico": "Residência Terapêutica (SRT)", "pacientes_ativos": 12, "capacidade": 12, "ocupacao_pct": 100.0,
         "lista_espera": 4, "tempo_espera_dias": 90, "profissionais": 5, "status": "critico"},
        {"servico": "Leitos Psiquiátricos (Hospital)", "pacientes_ativos": 0, "capacidade": 0, "ocupacao_pct": 0,
         "lista_espera": 0, "tempo_espera_dias": 0, "profissionais": 0, "status": "critico"},
    ]


@lru_cache(maxsize=1)
def _TRANSTORNOS():
    return [
        {"transtorno": "Transtornos de Humor (Depressão/Bipolar)", "casos": 248, "novos_mes": 18, "internacoes_ano": 8, "status": "critico"},
        {"transtorno": "Transtornos por Uso de Substâncias", "casos": 312, "novos_mes": 24, "internacoes_ano": 14, "status": "critico"},
        {"transtorno": "Esquizofrenia / Psicoses", "casos": 104, "novos_mes": 4, "internacoes_ano": 12, "status": "critico"},
        {"transtorno": "Transtornos de Ansiedade", "casos": 186, "novos_mes": 21, "internacoes_ano": 0, "status": "atencao"},
        {"transtorno": "TDAH", "casos": 142, "novos_mes": 9, "internacoes_ano": 0, "status": "atencao"},
        {"transtorno": "TEA (Autismo)", "casos": 68, "novos_mes": 3, "internacoes_ano": 0, "status": "atencao"},
        {"transtorno": "Tentativa de Suicídio / Autolesão", "casos": 34, "novos_mes": 4, "internacoes_ano": 34, "status": "critico"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"mes": "Jan", "atendimentos": 1124, "internacoes": 6, "tentativas_suicidio": 4, "alta_reinternacao_pct": 28.4},
        {"mes": "Fev", "atendimentos": 1082, "internacoes": 8, "tentativas_suicidio": 3, "alta_reinternacao_pct": 31.2},
        {"mes": "Mar", "atendimentos": 1198, "internacoes": 9, "tentativas_suicidio": 5, "alta_reinternacao_pct": 29.8},
        {"mes": "Abr", "atendimentos": 1214, "internacoes": 7, "tentativas_suicidio": 4, "alta_reinternacao_pct": 27.6},
        {"mes": "Mai", "atendimentos": 1242, "internacoes": 11, "tentativas_suicidio": 6, "alta_reinternacao_pct": 33.1},
        {"mes": "Jun", "atendimentos": 1268, "internacoes": 10, "tentativas_suicidio": 7, "alta_reinternacao_pct": 30.4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "CAPS AD acima da capacidade", "valor": 117.5, "meta": 100.0, "unidade": "%",
         "status": "critico", "observacao": "Superlotação — 282 pacientes para 240 vagas"},
        {"indicador": "Leitos psiquiátricos SUS", "valor": 0, "meta": None, "unidade": "leitos",
         "status": "critico", "observacao": "Município sem leitos — internações dependem de regulação regional"},
        {"indicador": "Tentativas de suicídio (mês)", "valor": 7, "meta": None, "unidade": "casos",
         "status": "critico", "observacao": "Tendência crescente — junho registra maior número do ano"},
        {"indicador": "Taxa de reinternação", "valor": 30.4, "meta": 15.0, "unidade": "%",
         "status": "critico", "observacao": "Alta taxa sugere desinstitucionalização insuficiente"},
        {"indicador": "Cobertura RAPS (ativos/hab)", "valor": 699, "meta": None, "unidade": "pacientes RAPS",
         "status": "atencao", "observacao": "699 pacientes em 5 pontos da RAPS — capacidade no limite"},
        {"indicador": "SRT com lista de espera", "valor": 4, "meta": 0, "unidade": "pessoas",
         "status": "critico", "observacao": "4 pessoas aguardando vaga em Residência Terapêutica"},
    ]



@router.get("/dashboard")
def dashboard():
    return {
        "pacientes_raps_total": 699,
        "caps_ii_pacientes": 214,
        "caps_ad_pacientes": 282,
        "caps_infanto_pacientes": 191,
        "srt_pacientes": 12,
        "leitos_psiq_sus": 0,
        "lista_espera_total": 84,
        "tentativas_suicidio_mes": 7,
        "internacoes_mes": 10,
        "reinternacao_pct": 30.4,
        "atendimentos_mes": 1268,
        "servicos_superlotados": 3,
    }


@router.get("/servicos-raps")
def servicos_raps():
    return _SERVICOS_RAPS()


@router.get("/transtornos")
def transtornos():
    return _TRANSTORNOS()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()