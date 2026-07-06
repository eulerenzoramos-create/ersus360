from fastapi import APIRouter

router = APIRouter(prefix="/api/urgencia-emergencia", tags=["urgencia_emergencia"])

_DASHBOARD = {
    "upa_24h_ativa": True,
    "atendimentos_upa_mes": 2284,
    "atendimentos_samu_mes": 184,
    "tempo_medio_espera_upa_min": 42,
    "meta_tempo_espera_min": 30,
    "classificacao_vermelha_pct": 8.4,
    "classificacao_laranja_pct": 18.2,
    "classificacao_amarela_pct": 38.4,
    "classificacao_verde_pct": 35.0,
    "internacoes_upa_mes": 148,
    "transferencias_manaus_mes": 42,
    "obitos_upa_mes": 2,
    "samu_tempo_resposta_min": 18,
    "meta_samu_min": 15,
    "status_upa": "atencao",
    "status_samu": "atencao",
}

_ATENDIMENTOS = [
    {"mes": "Jan/25", "upa": 2084, "samu": 164, "internacoes": 128, "transferencias": 36, "obitos": 1},
    {"mes": "Fev/25", "upa": 2124, "samu": 168, "internacoes": 132, "transferencias": 38, "obitos": 2},
    {"mes": "Mar/25", "upa": 2184, "samu": 172, "internacoes": 138, "transferencias": 40, "obitos": 1},
    {"mes": "Abr/25", "upa": 2224, "samu": 176, "internacoes": 140, "transferencias": 42, "obitos": 2},
    {"mes": "Mai/25", "upa": 2248, "samu": 180, "internacoes": 144, "transferencias": 41, "obitos": 2},
    {"mes": "Jun/25", "upa": 2284, "samu": 184, "internacoes": 148, "transferencias": 42, "obitos": 2},
]

_CLASSIFICACAO_RISCO = [
    {"nivel": "Vermelho (emergência)",     "cor": "#dc2626", "atend_mes": 192, "pct": 8.4,  "tempo_meta_min": 0,  "tempo_real_min": 4},
    {"nivel": "Laranja (muito urgente)",   "cor": "#f97316", "atend_mes": 416, "pct": 18.2, "tempo_meta_min": 15, "tempo_real_min": 22},
    {"nivel": "Amarelo (urgente)",         "cor": "#d97706", "atend_mes": 877, "pct": 38.4, "tempo_meta_min": 30, "tempo_real_min": 48},
    {"nivel": "Verde (pouco urgente)",     "cor": "#16a34a", "atend_mes": 799, "pct": 35.0, "tempo_meta_min": 60, "tempo_real_min": 84},
]

_CAUSAS = [
    {"causa": "Doenças respiratórias",      "atend": 412, "pct": 18.0, "internacao_pct": 12.4},
    {"causa": "Traumatismos/acidentes",     "atend": 364, "pct": 15.9, "internacao_pct": 18.4},
    {"causa": "Dor abdominal/GI",           "atend": 342, "pct": 15.0, "internacao_pct": 6.8},
    {"causa": "Doenças cardiovasculares",   "atend": 284, "pct": 12.4, "internacao_pct": 24.6},
    {"causa": "Febre / infecções",          "atend": 264, "pct": 11.6, "internacao_pct": 8.4},
    {"causa": "Intoxicação/envenenamento",  "atend": 148, "pct": 6.5,  "internacao_pct": 14.2},
    {"causa": "Crise hipertensiva",         "atend": 184, "pct": 8.1,  "internacao_pct": 10.4},
    {"causa": "Saúde mental / crise",       "atend": 124, "pct": 5.4,  "internacao_pct": 22.6},
    {"causa": "Outras",                     "atend": 162, "pct": 7.1,  "internacao_pct": 4.8},
]

_INDICADORES = [
    {"indicador": "Tempo médio espera UPA",         "valor": 42,   "meta": 30,   "unidade": "min",      "status": "atencao", "observacao": "40% acima da meta — superlotação em horários de pico; plantão médico insuficiente à noite"},
    {"indicador": "Transferências p/ Manaus/mês",   "valor": 42,   "meta": 20,   "unidade": "pacientes","status": "atencao", "observacao": "42 transferências/mês — UTI, neurocirurgia e cardiologia como principais motivos"},
    {"indicador": "Taxa de internação na UPA",      "valor": 6.5,  "meta": 5.0,  "unidade": "%",        "status": "atencao", "observacao": "148/2284 atendimentos resultam em internação — acima do padrão esperado (5%)"},
    {"indicador": "SAMU — tempo resposta",          "valor": 18,   "meta": 15,   "unidade": "min",      "status": "atencao", "observacao": "18 min vs meta 15 — zona rural com tempo até 40 min por distância e estradas"},
    {"indicador": "Óbitos na UPA/mês",              "valor": 2,    "meta": None, "unidade": "óbitos",   "status": "atencao", "observacao": "Monitoramento contínuo — principais causas: IAM, TCE grave e sepse"},
    {"indicador": "Atendimentos vermelhos no prazo","valor": 100.0,"meta": 100.0,"unidade": "%",        "status": "ok",      "observacao": "100% dos casos vermelhos atendidos imediatamente — protocolo Manchester funcionando"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/atendimentos")
def atendimentos():
    return _ATENDIMENTOS


@router.get("/classificacao-risco")
def classificacao_risco():
    return _CLASSIFICACAO_RISCO


@router.get("/causas")
def causas():
    return _CAUSAS


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
