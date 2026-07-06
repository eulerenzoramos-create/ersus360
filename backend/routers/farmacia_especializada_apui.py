from fastapi import APIRouter

router = APIRouter(prefix="/api/farmacia-especializada", tags=["farmacia_especializada"])

_DASHBOARD = {
    "pacientes_ceaf_ativos": 284,
    "medicamentos_dispensados_mes": 1248,
    "medicamentos_componente_basico": 642,
    "medicamentos_componente_especializado": 484,
    "medicamentos_componente_estrategico": 122,
    "solicitacoes_ceaf_mes": 64,
    "aprovadas_pct": 84.2,
    "negadas_pct": 8.4,
    "em_analise_pct": 7.4,
    "medicamentos_falta_itens": 6,
    "custo_medio_paciente_r": 284.0,
    "judicializacoes_medic_ano": 28,
    "pacientes_novos_mes": 18,
    "renovacoes_mes": 46,
    "dispensacao_media_dias_estoque": 28,
    "status_abastecimento": "atencao",
    "status_ceaf": "atencao",
}

_MEDICAMENTOS_PRINCIPAIS = [
    {"medicamento": "Insulina NPH / Regular",             "cid": "E10–E14", "pacientes": 84, "componente": "Básico",       "estoque_dias": 42, "situacao": "ok"},
    {"medicamento": "Metformina 500/850 mg",               "cid": "E11",     "pacientes": 76, "componente": "Básico",       "estoque_dias": 38, "situacao": "ok"},
    {"medicamento": "Risperidona / Olanzapina",            "cid": "F20–F29", "pacientes": 42, "componente": "Especializado","estoque_dias": 22, "situacao": "atencao"},
    {"medicamento": "Metilfenidato",                       "cid": "F90",     "pacientes": 28, "componente": "Especializado","estoque_dias": 18, "situacao": "atencao"},
    {"medicamento": "Levotiroxina 50/100 mcg",             "cid": "E03",     "pacientes": 64, "componente": "Básico",       "estoque_dias": 35, "situacao": "ok"},
    {"medicamento": "Anlodipino / Losartana",              "cid": "I10",     "pacientes": 92, "componente": "Básico",       "estoque_dias": 40, "situacao": "ok"},
    {"medicamento": "Adalimumabe (Humira) — biológico",   "cid": "M05–M06", "pacientes": 4,  "componente": "Especializado","estoque_dias": 0,  "situacao": "critico"},
    {"medicamento": "Interferon peguilado + Ribavirina",   "cid": "B17–B18", "pacientes": 6,  "componente": "Especializado","estoque_dias": 14, "situacao": "atencao"},
    {"medicamento": "Imatinibe (Glivec) — oncológico",    "cid": "C91–C95", "pacientes": 3,  "componente": "Especializado","estoque_dias": 28, "situacao": "ok"},
    {"medicamento": "Tacrolimo (pós-transplante)",         "cid": "Z94",     "pacientes": 2,  "componente": "Especializado","estoque_dias": 21, "situacao": "ok"},
    {"medicamento": "Coartem / Primaquina (malária)",      "cid": "B50–B54", "pacientes": 124,"componente": "Estratégico",  "estoque_dias": 38, "situacao": "ok"},
    {"medicamento": "Rifampicina + INH + Pirazinamida (TB)","cid": "A15–A19","pacientes": 14,"componente": "Estratégico",  "estoque_dias": 42, "situacao": "ok"},
]

_JUDICIALIZACOES = [
    {"medicamento": "Adalimumabe biológico",           "cid": "M05", "valor_r": 8400.0, "status": "deferido",   "via": "Judicial"},
    {"medicamento": "Trastuzumabe (Herceptin)",        "cid": "C50", "valor_r": 12800.0,"status": "deferido",   "via": "Judicial"},
    {"medicamento": "Bevacizumabe (Avastin)",          "cid": "C18", "valor_r": 9600.0, "status": "em_andamento","via": "Judicial"},
    {"medicamento": "Eculizumabe (hemoglobinúria)",    "cid": "D59", "valor_r": 48000.0,"status": "deferido",   "via": "Judicial"},
    {"medicamento": "Enzima p/ doença de Gaucher",     "cid": "E75", "valor_r": 84000.0,"status": "deferido",   "via": "Judicial"},
    {"medicamento": "Canabidiol (epilepsia refratária)","cid": "G40", "valor_r": 2400.0, "status": "em_andamento","via": "Administrativa"},
]

_HISTORICO = [
    {"mes": "Jan/25", "dispensacoes": 1124, "pacientes_ativos": 262, "judicializ": 3, "falta_itens": 5, "novos": 14},
    {"mes": "Fev/25", "dispensacoes": 1164, "pacientes_ativos": 268, "judicializ": 4, "falta_itens": 5, "novos": 15},
    {"mes": "Mar/25", "dispensacoes": 1192, "pacientes_ativos": 272, "judicializ": 4, "falta_itens": 6, "novos": 16},
    {"mes": "Abr/25", "dispensacoes": 1212, "pacientes_ativos": 276, "judicializ": 5, "falta_itens": 6, "novos": 17},
    {"mes": "Mai/25", "dispensacoes": 1228, "pacientes_ativos": 280, "judicializ": 6, "falta_itens": 6, "novos": 17},
    {"mes": "Jun/25", "dispensacoes": 1248, "pacientes_ativos": 284, "judicializ": 6, "falta_itens": 6, "novos": 18},
]

_INDICADORES = [
    {"indicador": "Pacientes CEAF ativos",              "valor": 284,  "meta": None,  "unidade": "pacientes","status": "ok",      "observacao": "284 pacientes com dispensação regular — crescimento de 8% em 6 meses (envelhecimento e diagnósticos tardios)"},
    {"indicador": "Medicamentos em falta",              "valor": 6,    "meta": 0,     "unidade": "itens",    "status": "atencao", "observacao": "6 itens em desabastecimento — Adalimumabe biológico crítico: 4 pacientes sem medicamento; estoque zero"},
    {"indicador": "Taxa de aprovação CEAF",             "valor": 84.2, "meta": 95.0,  "unidade": "%",        "status": "atencao", "observacao": "15,8% com dificuldade — documentação incompleta é a principal causa de negativa ou análise prolongada"},
    {"indicador": "Judicializações por medicamento",    "valor": 28,   "meta": 0,     "unidade": "ações",    "status": "atencao", "observacao": "28 ações judiciais em 2025 — custo médio R$ 29 mil por paciente. Eculizumabe representa R$ 48k/mês"},
    {"indicador": "Estoque médio (dias)",               "valor": 28,   "meta": 60,    "unidade": "dias",     "status": "atencao", "observacao": "28 dias de estoque médio — abaixo dos 60 dias recomendados. Logística de reposição via Manaus sujeita a atrasos"},
    {"indicador": "Medicamentos biológicos desabastec.","valor": 1,    "meta": 0,     "unidade": "itens",    "status": "critico", "observacao": "Adalimumabe com estoque zero — pacientes com artrite reumatoide grave sem tratamento, risco de dano permanente"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/medicamentos")
def medicamentos():
    return _MEDICAMENTOS_PRINCIPAIS


@router.get("/judicializacoes")
def judicializacoes():
    return _JUDICIALIZACOES


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
