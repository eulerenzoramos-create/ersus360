from fastapi import APIRouter

router = APIRouter(prefix="/api/doacao-orgaos-apui", tags=["Doação de Órgãos Apuí"])

@router.get("/dashboard")
def dashboard():
    return {
        "potenciais_doadores_ano": 8,
        "doadores_efetivos": 0,
        "taxa_efetivacao_pct": 0.0,
        "familias_abordadas": 3,
        "familias_autorizaram_pct": 0.0,
        "orgaos_transplantados_residentes": 4,
        "pacientes_fila_transplante_residentes": 28,
        "rim_fila": 18,
        "figado_fila": 6,
        "coracao_fila": 2,
        "cornea_fila": 2,
        "tempo_espera_medio_anos": 4.2,
        "opa_implantada": False,
        "cncdo_referencia": "CNCDO-AM Manaus",
        "status_doacao": "critico",
        "obitos_fila_espera_ano": 3,
    }

@router.get("/potenciais-doadores")
def potenciais_doadores():
    return [
        {"situacao": "Morte encefálica diagnosticada",  "casos": 8, "notificados_cncdo": 5, "abordagem_familiar": 3,
         "autorizaram": 0, "status": "critico",
         "obs": "5 não notificados ao CNCDO por falha de protocolo. Treinamento de equipe pendente."},
        {"situacao": "Parada cardíaca irreversível (DCD)", "casos": 12, "notificados_cncdo": 0, "abordagem_familiar": 0,
         "autorizaram": 0, "status": "critico",
         "obs": "Protocolo DCD não implantado. Doação após parada cardíaca não realizada no município."},
        {"situacao": "Doação em vida (rim/fígado parcial)", "casos": 0, "notificados_cncdo": 0, "abordagem_familiar": 0,
         "autorizaram": 0, "status": "critico",
         "obs": "Sem cirurgia de doação em vida disponível localmente. Referência: HUGV Manaus."},
        {"situacao": "Doação de córneas (pós-morte)",       "casos": 8, "notificados_cncdo": 1, "abordagem_familiar": 1,
         "autorizaram": 0, "status": "critico",
         "obs": "Banco de Olhos do AM sem parceria formalizada com UPA Apuí."},
    ]

@router.get("/fila-transplante")
def fila_transplante():
    return [
        {"orgao": "Rim",    "pacientes_fila": 18, "tempo_medio_anos": 5.2, "transplantes_realizados_ano": 0,
         "status": "critico", "obs": "18 pacientes em hemodiálise aguardando rim. Clínica de diálise em Apuí com capacidade saturada."},
        {"orgao": "Fígado", "pacientes_fila": 6,  "tempo_medio_anos": 3.8, "transplantes_realizados_ano": 0,
         "status": "critico", "obs": "6 pacientes com cirrose avançada. Todos encaminhados ao HUGV Manaus."},
        {"orgao": "Coração","pacientes_fila": 2,  "tempo_medio_anos": 2.4, "transplantes_realizados_ano": 0,
         "status": "critico", "obs": "2 pacientes com IC avançada. Sem cardiologista no município para acompanhamento."},
        {"orgao": "Córnea", "pacientes_fila": 2,  "tempo_medio_anos": 1.8, "transplantes_realizados_ano": 1,
         "status": "atencao","obs": "1 transplante de córnea realizado em residente (via CNCDO-AM). Fila reduzida."},
    ]

@router.get("/historico")
def historico():
    return [
        {"ano": 2022, "potenciais": 6, "efetivos": 0, "notificados": 2, "residentes_fila": 18},
        {"ano": 2023, "potenciais": 7, "efetivos": 0, "notificados": 3, "residentes_fila": 22},
        {"ano": 2024, "potenciais": 8, "efetivos": 0, "notificados": 4, "residentes_fila": 26},
        {"ano": 2025, "potenciais": 8, "efetivos": 0, "notificados": 5, "residentes_fila": 28},
    ]

@router.get("/indicadores")
def indicadores():
    return [
        {"indicador": "Taxa de efetivação de doadores",      "valor": 0.0,  "unidade": "%",       "meta": 20, "status": "critico",
         "observacao": "Nenhum doador efetivado em 4 anos. Falha de notificação e protocolo de abordagem familiar."},
        {"indicador": "OPO implantada no município",         "valor": 0,    "unidade": "unid.",   "meta": 1,  "status": "critico",
         "observacao": "Organização de Procurement de Órgãos (OPO) inexistente. Referência: CNCDO-AM Manaus."},
        {"indicador": "Pacientes residentes em fila",        "valor": 28,   "unidade": "pacientes","meta": None,"status": "critico",
         "observacao": "28 residentes aguardando transplante. 3 óbitos na fila em 2025."},
        {"indicador": "Tempo médio de espera na fila",       "valor": 4.2,  "unidade": "anos",    "meta": 2,  "status": "critico",
         "observacao": "4,2 anos de espera média — impacto direto na mortalidade de pacientes renais crônicos."},
        {"indicador": "Notificação de ME ao CNCDO",          "valor": 62.5, "unidade": "%",       "meta": 100,"status": "atencao",
         "observacao": "5 de 8 casos de ME notificados. 37,5% sem notificação por desconhecimento de protocolo."},
    ]
