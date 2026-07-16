from fastapi import APIRouter
router = APIRouter(prefix="/api/ceac-ambulatorial-apui", tags=["CEAC Ambulatorial Apuí"])

_DASHBOARD = {
    "procedimentos_ambulatoriais_mes": 3840,
    "procedimentos_media_mensal_2025": 3724,
    "consultas_especializadas_mes": 284,
    "consultas_aps_mes": 2648,
    "exames_solicitados_mes": 1484,
    "exames_realizados_mes": 1124,
    "exames_represados": 1248,
    "cirurgias_eletivas_mes": 14,
    "cirurgias_urgencia_mes": 22,
    "fila_cirurgica_total": 284,
    "tempo_espera_consulta_especializada_dias": 184,
    "tempo_espera_cirurgia_eletiva_dias": 248,
    "taxa_absenteismo_consultas_pct": 22.4,
    "resolubilidade_aps_pct": 78.4,
    "producao_sisab_completude_pct": 84.2,
    "despesa_mac_mensal_r": 284000,
    "teto_mac_mensal_r": 312000,
    "status_producao": "ok",
    "status_filas": "critico",
    "status_absenteismo": "atencao",
}

_ESPECIALIDADES = [
    {"especialidade":"Clínica Médica",        "consultas_mes":84, "fila":48,  "espera_dias":42,  "resolve_aps_pct":62.4,"medicos_disponíveis":2,"status":"ok"},
    {"especialidade":"Ginecologia/Obstetrícia","consultas_mes":62, "fila":72,  "espera_dias":96,  "resolve_aps_pct":48.4,"medicos_disponíveis":1,"status":"atencao"},
    {"especialidade":"Pediatria",             "consultas_mes":48, "fila":38,  "espera_dias":64,  "resolve_aps_pct":72.4,"medicos_disponíveis":1,"status":"ok"},
    {"especialidade":"Cirurgia Geral",        "consultas_mes":22, "fila":84,  "espera_dias":168, "resolve_aps_pct":12.4,"medicos_disponíveis":1,"status":"atencao"},
    {"especialidade":"Ortopedia/Traumatologia","consultas_mes":18,"fila":128, "espera_dias":284, "resolve_aps_pct":8.4, "medicos_disponíveis":0,"status":"critico"},
    {"especialidade":"Cardiologia",           "consultas_mes":12, "fila":96,  "espera_dias":312, "resolve_aps_pct":18.4,"medicos_disponíveis":0,"status":"critico"},
    {"especialidade":"Neurologia",            "consultas_mes":8,  "fila":112, "espera_dias":348, "resolve_aps_pct":12.4,"medicos_disponíveis":0,"status":"critico"},
    {"especialidade":"Dermatologia",          "consultas_mes":6,  "fila":88,  "espera_dias":284, "resolve_aps_pct":28.4,"medicos_disponíveis":0,"status":"critico"},
    {"especialidade":"Urologia",              "consultas_mes":4,  "fila":64,  "espera_dias":364, "resolve_aps_pct":14.2,"medicos_disponíveis":0,"status":"critico"},
    {"especialidade":"Oftalmologia",          "consultas_mes":12, "fila":48,  "espera_dias":148, "resolve_aps_pct":22.4,"medicos_disponíveis":0,"status":"atencao"},
    {"especialidade":"Psiquiatria",           "consultas_mes":8,  "fila":58,  "espera_dias":168, "resolve_aps_pct":38.4,"medicos_disponíveis":0,"status":"atencao"},
    {"especialidade":"Endocrinologia",        "consultas_mes":4,  "fila":72,  "espera_dias":384, "resolve_aps_pct":24.2,"medicos_disponíveis":0,"status":"critico"},
]

_EXAMES = [
    {"grupo":"Laboratório clínico básico",  "solicitados_mes":624,"realizados_mes":598,"represados":48,  "tempo_resultado_dias":3, "status":"ok"},
    {"grupo":"Imagem — Raio X",             "solicitados_mes":184,"realizados_mes":168,"represados":84,  "tempo_resultado_dias":5, "status":"ok"},
    {"grupo":"Imagem — Ecografia",          "solicitados_mes":148,"realizados_mes":98, "represados":248, "tempo_resultado_dias":28,"status":"atencao"},
    {"grupo":"Eletrocardiograma",           "solicitados_mes":84, "realizados_mes":82, "represados":12,  "tempo_resultado_dias":2, "status":"ok"},
    {"grupo":"Anatomia Patológica / Biopsia","solicitados_mes":28,"realizados_mes":14, "represados":184, "tempo_resultado_dias":42,"status":"critico"},
    {"grupo":"Tomografia Computadorizada",  "solicitados_mes":48, "realizados_mes":0,  "represados":284, "tempo_resultado_dias":None,"status":"critico"},
    {"grupo":"Ressonância Magnética",       "solicitados_mes":22, "realizados_mes":0,  "represados":348, "tempo_resultado_dias":None,"status":"critico"},
    {"grupo":"Espirometria",               "solicitados_mes":18, "realizados_mes":8,  "represados":84,  "tempo_resultado_dias":14,"status":"atencao"},
    {"grupo":"Endoscopia Digestiva",        "solicitados_mes":12, "realizados_mes":4,  "represados":96,  "tempo_resultado_dias":None,"status":"critico"},
]

_HISTORICO = [
    {"mes":"Jan/2025","producao_amb":3484,"consultas_espec":248,"exames_realizados":984,"cirurgias":32,"absenteismo_pct":24.4},
    {"mes":"Fev/2025","producao_amb":3548,"consultas_espec":258,"exames_realizados":1024,"cirurgias":34,"absenteismo_pct":23.8},
    {"mes":"Mar/2025","producao_amb":3624,"consultas_espec":264,"exames_realizados":1048,"cirurgias":36,"absenteismo_pct":23.2},
    {"mes":"Abr/2025","producao_amb":3698,"consultas_espec":272,"exames_realizados":1084,"cirurgias":38,"absenteismo_pct":22.8},
    {"mes":"Mai/2025","producao_amb":3748,"consultas_espec":278,"exames_realizados":1108,"cirurgias":36,"absenteismo_pct":22.6},
    {"mes":"Jun/2025","producao_amb":3840,"consultas_espec":284,"exames_realizados":1124,"cirurgias":36,"absenteismo_pct":22.4},
]

_INDICADORES = [
    {"indicador":"Tempo Espera Consulta Especializada","valor":"184 dias","meta":"≤ 60 dias","status":"critico","obs":"7 especialidades sem médico no município — toda demanda via TFD/regional. Ortopedia 284d, Neurologia 348d, Endocrinologia 384d. SISREG sem oferta suficiente para Apuí"},
    {"indicador":"Exames Represados (TC+RM)",          "valor":"632 exames","meta":"0",      "status":"critico","obs":"TC e RM zero realizados em Apuí — equipamento em Humaitá (200 km) ou Manaus (784 km). Pacientes com suspeita de AVC, neoplasia ou trauma aguardam meses"},
    {"indicador":"Taxa de Absenteismo",                "valor":"22,4%",    "meta":"≤ 10%",  "status":"atencao","obs":"1 em cada 5 consultas não comparece. Causas: distância (rural), transporte (sem vale-transporte), falta de comunicação (agendamento só por telefone fixo)"},
    {"indicador":"Resolubilidade APS",                 "valor":"78,4%",    "meta":"≥ 85%",  "status":"atencao","obs":"21,6% dos atendimentos APS resultam em encaminhamento — acima do aceitável. Treinamento e protocolos clínicos insuficientes para médicos generalistas recém-formados"},
    {"indicador":"Execução MAC/Teto Financeiro",       "valor":"91,0%",    "meta":"≥ 95%",  "status":"atencao","obs":"R$ 284k executados de R$ 312k teto. Subexecução por falta de prestadores credenciados locais, não por falta de demanda"},
    {"indicador":"Completude SISAB",                   "valor":"84,2%",    "meta":"≥ 95%",  "status":"atencao","obs":"15,8% dos atendimentos sem registro adequado no SISAB — impacta Novo Financiamento APS e programação orçamentária"},
]

@router.get("/dashboard")
def dashboard(): return _DASHBOARD

@router.get("/especialidades")
def especialidades(): return _ESPECIALIDADES

@router.get("/exames")
def exames(): return _EXAMES

@router.get("/historico")
def historico(): return _HISTORICO

@router.get("/indicadores")
def indicadores(): return _INDICADORES
