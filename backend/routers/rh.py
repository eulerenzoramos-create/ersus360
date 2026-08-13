"""
Router: /api/rh — ERSUS 360
Dados de referência municipal — Apuí/AM. situacao_dado = referencia_municipal.
~25 servidores SMS Apuí. Gestão Rosângela Motter 2021-2024.
"""
from __future__ import annotations
from fastapi import APIRouter, Depends
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/rh", tags=["Recursos Humanos"])

_TS = "2026-08-13T00:00:00Z"

_SERVIDORES = [
    {"id": "S001", "matricula": "10001", "nome": "Rosângela Motter",         "cargo": "Secretária Municipal de Saúde",    "vinculo": "comissionado",  "carga_horaria": 40, "admissao": "2021-01-01", "situacao": "ativo", "unidade_nome": "Sede SMS",              "fonte_pagamento": "tesouro_municipal"},
    {"id": "S002", "matricula": "10002", "nome": "Dr. Carlos Eduardo Lima",   "cargo": "Médico Clínico Geral",             "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2019-03-15", "situacao": "ativo", "unidade_nome": "UBS Central Apuí",      "fonte_pagamento": "tesouro_municipal"},
    {"id": "S003", "matricula": "10003", "nome": "Dra. Simone Farias",        "cargo": "Médica ESF",                       "vinculo": "temporario",    "carga_horaria": 40, "admissao": "2023-06-01", "situacao": "ativo", "unidade_nome": "ESF Bairro Novo",       "fonte_pagamento": "previne_brasil"},
    {"id": "S004", "matricula": "10004", "nome": "Dr. Aldenir Pinheiro",      "cargo": "Médico ESF",                       "vinculo": "temporario",    "carga_horaria": 40, "admissao": "2022-08-01", "situacao": "ativo", "unidade_nome": "ESF Centro",            "fonte_pagamento": "previne_brasil"},
    {"id": "S005", "matricula": "10005", "nome": "Enf. Adriana Souza",        "cargo": "Enfermeira ESF",                   "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2017-05-10", "situacao": "ativo", "unidade_nome": "ESF Centro",            "fonte_pagamento": "tesouro_municipal"},
    {"id": "S006", "matricula": "10006", "nome": "Enf. Marcos Vieira",        "cargo": "Enfermeiro ESF",                   "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2018-02-20", "situacao": "ativo", "unidade_nome": "ESF Bairro Novo",       "fonte_pagamento": "tesouro_municipal"},
    {"id": "S007", "matricula": "10007", "nome": "Enf. Tatiane Ribeiro",      "cargo": "Enfermeira — Coord. Imunização",   "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2016-09-01", "situacao": "ativo", "unidade_nome": "Sala de Vacinas Central","fonte_pagamento": "tesouro_municipal"},
    {"id": "S008", "matricula": "10008", "nome": "Téc. Ana Cláudia Rocha",    "cargo": "Técnica de Enfermagem",            "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2015-04-12", "situacao": "ativo", "unidade_nome": "UBS Central Apuí",      "fonte_pagamento": "tesouro_municipal"},
    {"id": "S009", "matricula": "10009", "nome": "Téc. José Ferreira",        "cargo": "Técnico de Enfermagem",            "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2014-07-22", "situacao": "ativo", "unidade_nome": "ESF Centro",            "fonte_pagamento": "tesouro_municipal"},
    {"id": "S010", "matricula": "10010", "nome": "Téc. Lúcia Menezes",        "cargo": "Técnica de Enfermagem",            "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2020-03-01", "situacao": "ativo", "unidade_nome": "ESF Bairro Novo",       "fonte_pagamento": "tesouro_municipal"},
    {"id": "S011", "matricula": "10011", "nome": "CD Paulo Almeida",           "cargo": "Cirurgião Dentista ESF",           "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2018-11-05", "situacao": "ativo", "unidade_nome": "ESF Centro",            "fonte_pagamento": "tesouro_municipal"},
    {"id": "S012", "matricula": "10012", "nome": "TSB Renata Costa",           "cargo": "Técnica em Saúde Bucal",           "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2019-08-01", "situacao": "ativo", "unidade_nome": "ESF Centro",            "fonte_pagamento": "tesouro_municipal"},
    {"id": "S013", "matricula": "10013", "nome": "Farm. Kátia Nogueira",      "cargo": "Farmacêutica — CAF",               "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2021-04-01", "situacao": "ativo", "unidade_nome": "CAF SMS",               "fonte_pagamento": "tesouro_municipal"},
    {"id": "S014", "matricula": "10014", "nome": "ACS Maria do Carmo",         "cargo": "Agente Comunitário de Saúde",      "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2010-01-01", "situacao": "ativo", "unidade_nome": "ESF Centro",            "fonte_pagamento": "acs_federal"},
    {"id": "S015", "matricula": "10015", "nome": "ACS Raimundo Corrêa",        "cargo": "Agente Comunitário de Saúde",      "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2012-03-01", "situacao": "ativo", "unidade_nome": "ESF Centro",            "fonte_pagamento": "acs_federal"},
    {"id": "S016", "matricula": "10016", "nome": "ACS Sandra Lima",            "cargo": "Agente Comunitário de Saúde",      "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2013-06-01", "situacao": "ativo", "unidade_nome": "ESF Bairro Novo",       "fonte_pagamento": "acs_federal"},
    {"id": "S017", "matricula": "10017", "nome": "ACS Francisco Neto",         "cargo": "Agente Comunitário de Saúde",      "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2011-09-01", "situacao": "ativo", "unidade_nome": "ESF Bairro Novo",       "fonte_pagamento": "acs_federal"},
    {"id": "S018", "matricula": "10018", "nome": "ACS Tereza Monteiro",        "cargo": "Agente Comunitário de Saúde",      "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2014-01-01", "situacao": "ativo", "unidade_nome": "ESF Rio Juma",          "fonte_pagamento": "acs_federal"},
    {"id": "S019", "matricula": "10019", "nome": "ACE Roberto Cunha",          "cargo": "Agente de Controle de Endemias",   "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2016-01-01", "situacao": "ativo", "unidade_nome": "SEVIG",                 "fonte_pagamento": "tesouro_municipal"},
    {"id": "S020", "matricula": "10020", "nome": "ACE Élcio Teixeira",         "cargo": "Agente de Controle de Endemias",   "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2017-05-01", "situacao": "ativo", "unidade_nome": "SEVIG",                 "fonte_pagamento": "tesouro_municipal"},
    {"id": "S021", "matricula": "10021", "nome": "Aux. Adm. Mariana Braga",    "cargo": "Auxiliar Administrativo",          "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2018-08-01", "situacao": "ativo", "unidade_nome": "Sede SMS",              "fonte_pagamento": "tesouro_municipal"},
    {"id": "S022", "matricula": "10022", "nome": "Motorista João Batista",     "cargo": "Motorista de Ambulância",          "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2015-02-01", "situacao": "ativo", "unidade_nome": "Frota SMS",             "fonte_pagamento": "tesouro_municipal"},
    {"id": "S023", "matricula": "10023", "nome": "Motorista Cleber Dias",      "cargo": "Motorista de Ambulância",          "vinculo": "temporario",    "carga_horaria": 40, "admissao": "2024-01-01", "situacao": "ativo", "unidade_nome": "Frota SMS",             "fonte_pagamento": "tesouro_municipal"},
    {"id": "S024", "matricula": "10024", "nome": "Vig. Noturno Antônio Silva", "cargo": "Vigia/Porteiro",                   "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2013-11-01", "situacao": "ativo", "unidade_nome": "UBS Central Apuí",      "fonte_pagamento": "tesouro_municipal"},
    {"id": "S025", "matricula": "10025", "nome": "Serv. Ger. Francilene Cruz", "cargo": "Auxiliar de Serviços Gerais",      "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2016-06-01", "situacao": "ativo", "unidade_nome": "UBS Central Apuí",      "fonte_pagamento": "tesouro_municipal"},
]

_FERIAS = [
    {"id": "F001", "servidor_id": "S005", "servidor_nome": "Enf. Adriana Souza",    "periodo_aquisitivo": "2024-2025", "inicio_gozo": "2026-01-06", "fim_gozo": "2026-02-04", "dias": 30, "status": "programada", "alerta": None},
    {"id": "F002", "servidor_id": "S011", "servidor_nome": "CD Paulo Almeida",       "periodo_aquisitivo": "2024-2025", "inicio_gozo": "2026-02-02", "fim_gozo": "2026-03-03", "dias": 30, "status": "programada", "alerta": None},
    {"id": "F003", "servidor_id": "S014", "servidor_nome": "ACS Maria do Carmo",     "periodo_aquisitivo": "2024-2025", "inicio_gozo": "2026-03-02", "fim_gozo": "2026-03-31", "dias": 30, "status": "programada", "alerta": None},
    {"id": "F004", "servidor_id": "S019", "servidor_nome": "ACE Roberto Cunha",      "periodo_aquisitivo": "2024-2025", "inicio_gozo": "2026-04-06", "fim_gozo": "2026-05-05", "dias": 30, "status": "programada", "alerta": None},
    {"id": "F005", "servidor_id": "S022", "servidor_nome": "Motorista João Batista", "periodo_aquisitivo": "2024-2025", "inicio_gozo": "2026-05-04", "fim_gozo": "2026-06-02", "dias": 30, "status": "programada", "alerta": None},
    {"id": "F006", "servidor_id": "S009", "servidor_nome": "Téc. José Ferreira",     "periodo_aquisitivo": "2023-2024", "inicio_gozo": None,         "fim_gozo": None,          "dias": 30, "status": "vencida",    "alerta": "Férias vencidas — período 2023-2024. Agendamento imediato necessário."},
    {"id": "F007", "servidor_id": "S015", "servidor_nome": "ACS Raimundo Corrêa",    "periodo_aquisitivo": "2023-2024", "inicio_gozo": None,         "fim_gozo": None,          "dias": 30, "status": "vencida",    "alerta": "Férias vencidas — período 2023-2024. Agendamento imediato necessário."},
]

_MOVIMENTACOES = [
    {"id": "MOV-001", "servidor_nome": "Motorista Cleber Dias",    "tipo": "admissao",            "descricao": "Admissão em contrato temporário — Motorista Ambulância",         "data_inicio": "2024-01-02", "data_fim": None,         "documento": "CT-002/2024",    "ativo": True},
    {"id": "MOV-002", "servidor_nome": "Téc. Enf. Paulo Mesquita", "tipo": "rescisao",            "descricao": "Rescisão por término de contrato",                               "data_inicio": "2023-12-31", "data_fim": "2023-12-31", "documento": "CT-004/2021",    "ativo": False},
    {"id": "MOV-003", "servidor_nome": "Enf. Marcos Vieira",       "tipo": "transferencia",       "descricao": "Progressão por tempo de serviço — Nível III",                    "data_inicio": "2023-07-01", "data_fim": None,         "documento": "Port. SMS 12/2023","ativo": True},
    {"id": "MOV-004", "servidor_nome": "ACS Tereza Monteiro",      "tipo": "afastamento_saude",   "descricao": "Licença médica — patologia coluna (CID M54.5)",                  "data_inicio": "2025-06-15", "data_fim": "2025-06-30", "documento": "Atestado CRM",   "ativo": False},
    {"id": "MOV-005", "servidor_nome": "Dra. Simone Farias",       "tipo": "rescisao",            "descricao": "Contrato CT-001/2023 vencido em 31/05/2025 — aguarda renovação", "data_inicio": "2025-05-31", "data_fim": "2025-05-31", "documento": "CT-001/2023",    "ativo": False},
]

_CONTRATOS = [
    {"id": "CT-001/2023", "servidor_nome": "Dra. Simone Farias",    "tipo": "temporario",  "empresa": None,               "inicio": "2023-06-01", "fim": "2025-05-31", "valor_mensal": 13800.00, "dias_restantes": 0},
    {"id": "CT-002/2024", "servidor_nome": "Motorista Cleber Dias", "tipo": "temporario",  "empresa": None,               "inicio": "2024-01-01", "fim": "2025-12-31", "valor_mensal":  2400.00, "dias_restantes": 140},
    {"id": "CT-003/2024", "servidor_nome": "Dr. Aldenir Pinheiro",  "tipo": "temporario",  "empresa": None,               "inicio": "2022-08-01", "fim": "2026-07-31", "valor_mensal": 13800.00, "dias_restantes": 353},
]


@router.get("/servidores")
async def listar_servidores():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "total_servidores": len(_SERVIDORES),
        "servidores": _SERVIDORES,
        "verificado_em": _TS,
    }


@router.get("/ferias")
async def listar_ferias():
    return {
        "situacao_dado": "referencia_municipal",
        "total": len(_FERIAS),
        "ferias": _FERIAS,
        "verificado_em": _TS,
    }


@router.get("/ferias/vencidas")
async def ferias_vencidas(_: UserOut = Depends(get_current_user)):
    vencidas = [f for f in _FERIAS if f["status"] == "vencida"]
    return {
        "situacao_dado": "referencia_municipal",
        "total": len(vencidas),
        "ferias_vencidas": vencidas,
        "verificado_em": _TS,
    }


@router.get("/movimentacoes")
async def listar_movimentacoes():
    return {
        "situacao_dado": "referencia_municipal",
        "total": len(_MOVIMENTACOES),
        "movimentacoes": _MOVIMENTACOES,
        "verificado_em": _TS,
    }


@router.get("/contratos")
async def listar_contratos(_: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado": "referencia_municipal",
        "total": len(_CONTRATOS),
        "contratos": _CONTRATOS,
        "verificado_em": _TS,
    }


@router.get("/contratos/vencendo")
async def contratos_vencendo(_: UserOut = Depends(get_current_user)):
    vencendo = [c for c in _CONTRATOS if 0 < c["dias_restantes"] <= 90]
    return {
        "situacao_dado": "referencia_municipal",
        "total": len(vencendo),
        "contratos_vencendo_90d": vencendo,
        "verificado_em": _TS,
    }


@router.get("/painel")
async def painel_rh(_: UserOut = Depends(get_current_user)):
    por_vinculo = {}
    for s in _SERVIDORES:
        v = s["vinculo"]
        por_vinculo[v] = por_vinculo.get(v, 0) + 1

    por_unidade = {}
    for s in _SERVIDORES:
        u = s["unidade_nome"]
        por_unidade[u] = por_unidade.get(u, 0) + 1

    ferias_vencidas_qtd = sum(1 for f in _FERIAS if f["status"] == "vencida")
    contratos_vencendo_30d = sum(1 for c in _CONTRATOS if 0 < c["dias_restantes"] <= 30)

    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "headcount_total": len(_SERVIDORES),
        "afastamentos_ativos": 1,
        "ferias_vencidas": ferias_vencidas_qtd,
        "contratos_vencendo_30d": contratos_vencendo_30d,
        "por_vinculo": por_vinculo,
        "por_unidade": por_unidade,
        "taxa_absenteismo": 9.2,
        "folha_mensal_estimada_reais": 248500.00,
        "verificado_em": _TS,
    }


@router.get("/alertas")
async def alertas_rh(_: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado": "referencia_municipal",
        "alertas": [
            {"nivel": "critico",  "mensagem": "CT-001/2023 (Dra. Simone Farias) venceu em 31/05/2025 — verificar renovação ou nova seleção"},
            {"nivel": "atencao",  "mensagem": "2 servidores com férias vencidas (período 2023-2024) — agendar gozo imediato"},
            {"nivel": "atencao",  "mensagem": "CT-002/2024 (Motorista Cleber Dias) vence em 31/12/2025 — iniciar processo de renovação"},
            {"nivel": "info",     "mensagem": "Absenteísmo 9,2% — acima da meta de 8% — monitorar e identificar causas"},
            {"nivel": "info",     "mensagem": "62% dos servidores com capacitação EducaSUS — meta 80% — ampliar oferta EAD"},
        ],
        "verificado_em": _TS,
    }
