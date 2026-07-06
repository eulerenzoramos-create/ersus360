from fastapi import APIRouter

router = APIRouter(prefix="/api/regulacao-especializada-apui", tags=["regulacao_especializada_apui"])

_DASHBOARD = {
    "pacientes_fila_especialidades": 1284,
    "tempo_medio_espera_dias": 128,
    "meta_espera_dias": 60,
    "tfd_pacientes_mes": 184,
    "tfd_custo_mensal_R": 284000,
    "encaminhamentos_nao_respondidos_pct": 38.4,
    "consultas_especializadas_sus_mes": 284,
    "procedimentos_alto_custo_mes": 48,
    "leitos_referencia_manaus": 784,
    "sisreg_regulados_pct": 68.4,
    "meta_sisreg_pct": 90.0,
    "retorno_tfd_sem_resolucao_pct": 28.4,
    "especialidades_disponiveis_municipio": 3,
    "especialidades_necessarias_municipio": 18,
    "status_fila": "critico",
    "status_tfd": "critico",
    "status_sisreg": "atencao",
}

_FILA_ESPECIALIDADES = [
    {"especialidade": "Ortopedia",           "fila": 284, "tempo_espera_dias": 168, "meta_dias": 60, "disponivel_municipio": False, "referencia": "Manaus", "status": "critico"},
    {"especialidade": "Oftalmologia",        "fila": 212, "tempo_espera_dias": 142, "meta_dias": 60, "disponivel_municipio": False, "referencia": "Manaus", "status": "critico"},
    {"especialidade": "Cardiologia",         "fila": 184, "tempo_espera_dias": 156, "meta_dias": 60, "disponivel_municipio": False, "referencia": "Manaus", "status": "critico"},
    {"especialidade": "Neurologia",          "fila": 124, "tempo_espera_dias": 184, "meta_dias": 60, "disponivel_municipio": False, "referencia": "Manaus", "status": "critico"},
    {"especialidade": "Oncologia",           "fila": 84,  "tempo_espera_dias": 128, "meta_dias": 30, "disponivel_municipio": False, "referencia": "Manaus", "status": "critico"},
    {"especialidade": "Dermatologia",        "fila": 98,  "tempo_espera_dias": 112, "meta_dias": 60, "disponivel_municipio": False, "referencia": "Manaus", "status": "critico"},
    {"especialidade": "Endocrinologia",      "fila": 112, "tempo_espera_dias": 138, "meta_dias": 60, "disponivel_municipio": False, "referencia": "Manaus", "status": "critico"},
    {"especialidade": "Urologia",            "fila": 72,  "tempo_espera_dias": 124, "meta_dias": 60, "disponivel_municipio": False, "referencia": "Manaus", "status": "critico"},
    {"especialidade": "Psiquiatria",         "fila": 48,  "tempo_espera_dias": 96,  "meta_dias": 30, "disponivel_municipio": False, "referencia": "Manaus", "status": "critico"},
    {"especialidade": "Cirurgia geral",      "fila": 66,  "tempo_espera_dias": 84,  "meta_dias": 45, "disponivel_municipio": True,  "referencia": "Municipal", "status": "atencao"},
    {"especialidade": "Ginecologia",         "fila": 0,   "tempo_espera_dias": 28,  "meta_dias": 30, "disponivel_municipio": True,  "referencia": "Municipal", "status": "ok"},
    {"especialidade": "Pediatria",           "fila": 0,   "tempo_espera_dias": 18,  "meta_dias": 30, "disponivel_municipio": True,  "referencia": "Municipal", "status": "ok"},
]

_TFD = [
    {"motivo": "Cirurgia cardíaca / cardiologia intervencionista", "pacientes_mes": 28, "custo_medio_R": 4800, "dias_deslocamento": 5, "retorno_resolvido_pct": 84.2, "status": "critico"},
    {"motivo": "Oncologia — quimio/radioterapia/cirurgia",         "pacientes_mes": 38, "custo_medio_R": 3200, "dias_deslocamento": 7, "retorno_resolvido_pct": 68.4, "status": "critico"},
    {"motivo": "Ortopedia — cirurgia eletiva/trauma",              "pacientes_mes": 32, "custo_medio_R": 2800, "dias_deslocamento": 4, "retorno_resolvido_pct": 72.4, "status": "critico"},
    {"motivo": "Oftalmologia — cirurgia (catarata/glaucoma)",      "pacientes_mes": 24, "custo_medio_R": 2400, "dias_deslocamento": 3, "retorno_resolvido_pct": 78.4, "status": "atencao"},
    {"motivo": "Neurologia / neurocirurgia",                        "pacientes_mes": 18, "custo_medio_R": 4200, "dias_deslocamento": 5, "retorno_resolvido_pct": 62.4, "status": "critico"},
    {"motivo": "Outros (endocrinologia/urol./dermato.)",            "pacientes_mes": 44, "custo_medio_R": 2200, "dias_deslocamento": 3, "retorno_resolvido_pct": 58.4, "status": "critico"},
]

_HISTORICO = [
    {"mes": "Jan/25", "fila_total": 1148, "tempo_espera_dias": 118, "tfd_pacientes": 168, "tfd_custo_R": 258000, "sisreg_pct": 62.4},
    {"mes": "Fev/25", "fila_total": 1184, "tempo_espera_dias": 120, "tfd_pacientes": 172, "tfd_custo_R": 264000, "sisreg_pct": 64.2},
    {"mes": "Mar/25", "fila_total": 1212, "tempo_espera_dias": 122, "tfd_pacientes": 176, "tfd_custo_R": 268000, "sisreg_pct": 65.8},
    {"mes": "Abr/25", "fila_total": 1238, "tempo_espera_dias": 124, "tfd_pacientes": 178, "tfd_custo_R": 274000, "sisreg_pct": 66.4},
    {"mes": "Mai/25", "fila_total": 1262, "tempo_espera_dias": 126, "tfd_pacientes": 182, "tfd_custo_R": 280000, "sisreg_pct": 67.2},
    {"mes": "Jun/25", "fila_total": 1284, "tempo_espera_dias": 128, "tfd_pacientes": 184, "tfd_custo_R": 284000, "sisreg_pct": 68.4},
]

_INDICADORES = [
    {"indicador": "Fila total especialidades",             "valor": 1284, "meta": None,  "unidade": "pcts",    "status": "critico", "observacao": "1.284 pacientes aguardando consulta especializada — fila crescendo 12% ao semestre. 15 das 18 especialidades necessarias nao disponiveis no municipio. Manaus e o unico destino para 90% das referencias"},
    {"indicador": "Tempo medio de espera",                 "valor": 128,  "meta": 60,   "unidade": "dias",    "status": "critico", "observacao": "128 dias vs meta 60 — mais que o dobro. Oncologia 128 dias (Lei 12.732 exige 60). Ortopedia 168 dias. Neurologia 184 dias. Pacientes perdem emprego, pioram clinicamente, abandonam o tratamento"},
    {"indicador": "Custo TFD mensal",                      "valor": 284000,"meta": None, "unidade": "R$/mes",  "status": "critico", "observacao": "R$ 284k/mes so em TFD — maior item de despesa da SMS apos folha de pagamento. Inclui passagem, diaria e auxilio alimentacao. Sem politica de telemedicina/telediagnostico para reduzir deslocamentos evitaveis"},
    {"indicador": "Especialidades disponiveis municipio",  "valor": 3,    "meta": 18,   "unidade": "esp.",    "status": "critico", "observacao": "3 de 18 especialidades necessarias (cirurgia geral, ginecologia, pediatria) — 83,3% da atencao especializada depende de Manaus (784 km). Consorcio intermunicipal poderia viabilizar polo regional em Humaitá"},
    {"indicador": "SISREG regulados",                      "valor": 68.4, "meta": 90.0, "unidade": "%",       "status": "atencao", "observacao": "31,6% das solicitacoes fora do SISREG — regulacao informal por telefone, perda de rastreabilidade, impossibilidade de auditoria. Favorece privilegios e dificulta planejamento da SMS"},
    {"indicador": "TFD sem resolucao no retorno",          "valor": 28.4, "meta": 10.0, "unidade": "%",       "status": "critico", "observacao": "28,4% retornam sem resolucao do problema — custo TFD despendido sem beneficio clinico. Principal causa: consulta marcada mas exame pre-requisito nao realizado. Contrarreferencia inexistente na pratica"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/fila")
def fila():
    return _FILA_ESPECIALIDADES


@router.get("/tfd")
def tfd():
    return _TFD


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
