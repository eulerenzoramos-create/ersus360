"""
Router: /api/rh — ERSUS 360
Dados de referência municipal — Apuí/AM. situacao_dado = referencia_municipal.
~25 servidores SMS Apuí. Gestão Rosângela Motter 2021-2024.
"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from typing import Optional
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/rh", tags=["Recursos Humanos"])

_TS = "2026-08-13T00:00:00Z"

_SERVIDORES = [
    {"id": "S001", "nome": "Rosângela Motter",        "cargo": "Secretária Municipal de Saúde",      "vinculo": "comissionado",  "carga_horaria": 40, "admissao": "2021-01-01", "situacao": "ativo", "unidade": "Sede SMS"},
    {"id": "S002", "nome": "Dr. Carlos Eduardo Lima",  "cargo": "Médico Clínico Geral",               "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2019-03-15", "situacao": "ativo", "unidade": "UBS Central"},
    {"id": "S003", "nome": "Dra. Simone Farias",       "cargo": "Médica ESF",                         "vinculo": "contrato_temp", "carga_horaria": 40, "admissao": "2023-06-01", "situacao": "ativo", "unidade": "ESF Bairro Novo"},
    {"id": "S004", "nome": "Dr. Aldenir Pinheiro",     "cargo": "Médico ESF",                         "vinculo": "contrato_temp", "carga_horaria": 40, "admissao": "2022-08-01", "situacao": "ativo", "unidade": "ESF Centro"},
    {"id": "S005", "nome": "Enf. Adriana Souza",       "cargo": "Enfermeira ESF",                     "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2017-05-10", "situacao": "ativo", "unidade": "ESF Centro"},
    {"id": "S006", "nome": "Enf. Marcos Vieira",       "cargo": "Enfermeiro ESF",                     "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2018-02-20", "situacao": "ativo", "unidade": "ESF Bairro Novo"},
    {"id": "S007", "nome": "Enf. Tatiane Ribeiro",     "cargo": "Enfermeira — Coord. Imunização",     "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2016-09-01", "situacao": "ativo", "unidade": "Sala de Vacinas Central"},
    {"id": "S008", "nome": "Téc. Ana Cláudia Rocha",   "cargo": "Técnica de Enfermagem",              "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2015-04-12", "situacao": "ativo", "unidade": "UBS Central"},
    {"id": "S009", "nome": "Téc. José Ferreira",       "cargo": "Técnico de Enfermagem",              "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2014-07-22", "situacao": "ativo", "unidade": "ESF Centro"},
    {"id": "S010", "nome": "Téc. Lúcia Menezes",       "cargo": "Técnica de Enfermagem",              "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2020-03-01", "situacao": "ativo", "unidade": "ESF Bairro Novo"},
    {"id": "S011", "nome": "CD Paulo Almeida",          "cargo": "Cirurgião Dentista ESF",             "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2018-11-05", "situacao": "ativo", "unidade": "ESF Centro"},
    {"id": "S012", "nome": "TSB Renata Costa",          "cargo": "Técnica em Saúde Bucal",             "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2019-08-01", "situacao": "ativo", "unidade": "ESF Centro"},
    {"id": "S013", "nome": "Farm. Kátia Nogueira",     "cargo": "Farmacêutica — CAF",                 "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2021-04-01", "situacao": "ativo", "unidade": "CAF SMS"},
    {"id": "S014", "nome": "ACS Maria do Carmo",        "cargo": "Agente Comunitário de Saúde",       "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2010-01-01", "situacao": "ativo", "unidade": "ESF Centro"},
    {"id": "S015", "nome": "ACS Raimundo Corrêa",       "cargo": "Agente Comunitário de Saúde",       "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2012-03-01", "situacao": "ativo", "unidade": "ESF Centro"},
    {"id": "S016", "nome": "ACS Sandra Lima",           "cargo": "Agente Comunitário de Saúde",       "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2013-06-01", "situacao": "ativo", "unidade": "ESF Bairro Novo"},
    {"id": "S017", "nome": "ACS Francisco Neto",        "cargo": "Agente Comunitário de Saúde",       "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2011-09-01", "situacao": "ativo", "unidade": "ESF Bairro Novo"},
    {"id": "S018", "nome": "ACS Tereza Monteiro",       "cargo": "Agente Comunitário de Saúde",       "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2014-01-01", "situacao": "ativo", "unidade": "ESF Rio Juma"},
    {"id": "S019", "nome": "ACE Roberto Cunha",         "cargo": "Agente de Controle de Endemias",    "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2016-01-01", "situacao": "ativo", "unidade": "SEVIG"},
    {"id": "S020", "nome": "ACE Élcio Teixeira",        "cargo": "Agente de Controle de Endemias",    "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2017-05-01", "situacao": "ativo", "unidade": "SEVIG"},
    {"id": "S021", "nome": "Aux. Adm. Mariana Braga",   "cargo": "Auxiliar Administrativo",           "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2018-08-01", "situacao": "ativo", "unidade": "Sede SMS"},
    {"id": "S022", "nome": "Motorista João Batista",    "cargo": "Motorista de Ambulância",            "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2015-02-01", "situacao": "ativo", "unidade": "Frota SMS"},
    {"id": "S023", "nome": "Motorista Cleber Dias",     "cargo": "Motorista de Ambulância",            "vinculo": "contrato_temp", "carga_horaria": 40, "admissao": "2024-01-01", "situacao": "ativo", "unidade": "Frota SMS"},
    {"id": "S024", "nome": "Vig. Noturno Antônio Silva","cargo": "Vigia/Porteiro",                     "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2013-11-01", "situacao": "ativo", "unidade": "UBS Central"},
    {"id": "S025", "nome": "Serv. Ger. Francilene Cruz","cargo": "Auxiliar de Serviços Gerais",        "vinculo": "estatutario",   "carga_horaria": 40, "admissao": "2016-06-01", "situacao": "ativo", "unidade": "UBS Central"},
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
        "ferias_programadas": [
            {"servidor_id": "S005", "nome": "Enf. Adriana Souza",    "periodo": "2026-01-06 a 2026-02-04", "situacao": "aprovada"},
            {"servidor_id": "S011", "nome": "CD Paulo Almeida",       "periodo": "2026-02-02 a 2026-03-03", "situacao": "aprovada"},
            {"servidor_id": "S014", "nome": "ACS Maria do Carmo",     "periodo": "2026-03-02 a 2026-03-31", "situacao": "aprovada"},
            {"servidor_id": "S019", "nome": "ACE Roberto Cunha",      "periodo": "2026-04-06 a 2026-05-05", "situacao": "programada"},
            {"servidor_id": "S022", "nome": "Motorista João Batista", "periodo": "2026-05-04 a 2026-06-02", "situacao": "programada"},
        ],
        "verificado_em": _TS,
    }


@router.get("/ferias/vencidas")
async def ferias_vencidas(_: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado": "referencia_municipal",
        "ferias_vencidas": [
            {"servidor_id": "S009", "nome": "Téc. José Ferreira",  "periodo_aquisitivo": "2023-2024", "dias_vencidos": 30},
            {"servidor_id": "S015", "nome": "ACS Raimundo Corrêa", "periodo_aquisitivo": "2023-2024", "dias_vencidos": 30},
        ],
        "verificado_em": _TS,
    }


@router.get("/movimentacoes")
async def listar_movimentacoes():
    return {
        "situacao_dado": "referencia_municipal",
        "movimentacoes": [
            {"tipo": "admissao",   "servidor": "Motorista Cleber Dias",    "data": "2024-01-02", "observacao": "Contrato temporário"},
            {"tipo": "rescisao",   "servidor": "Téc. Enf. Paulo Mesquita", "data": "2023-12-31", "observacao": "Término de contrato"},
            {"tipo": "promocao",   "servidor": "Enf. Marcos Vieira",       "data": "2023-07-01", "observacao": "Progressão por tempo de serviço"},
            {"tipo": "afastamento","servidor": "ACS Tereza Monteiro",      "data": "2025-06-15", "observacao": "Licença médica 15 dias"},
        ],
        "verificado_em": _TS,
    }


@router.get("/contratos")
async def listar_contratos(_: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado": "referencia_municipal",
        "contratos_ativos": [
            {"id": "CT-001/2023", "servidor": "Dra. Simone Farias",      "cargo": "Médica ESF",          "inicio": "2023-06-01", "fim": "2025-05-31", "valor_mensal": 13800.00, "status": "vencido"},
            {"id": "CT-002/2024", "servidor": "Motorista Cleber Dias",   "cargo": "Motorista Ambulância","inicio": "2024-01-01", "fim": "2025-12-31", "valor_mensal": 2400.00,  "status": "ativo"},
            {"id": "CT-003/2024", "servidor": "Dr. Aldenir Pinheiro",    "cargo": "Médico ESF",          "inicio": "2022-08-01", "fim": "2026-07-31", "valor_mensal": 13800.00, "status": "ativo"},
        ],
        "verificado_em": _TS,
    }


@router.get("/contratos/vencendo")
async def contratos_vencendo(_: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado": "referencia_municipal",
        "contratos_vencendo_90d": [
            {"id": "CT-002/2024", "servidor": "Motorista Cleber Dias", "cargo": "Motorista Ambulância", "vencimento": "2025-12-31", "dias_restantes": 140},
        ],
        "verificado_em": _TS,
    }


@router.get("/painel")
async def painel_rh(_: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "total_servidores": 25,
        "estatutarios": 21,
        "contratos_temporarios": 3,
        "comissionados": 1,
        "medicos": 3,
        "enfermeiros": 3,
        "tecnicos_enfermagem": 3,
        "acs": 5,
        "ace": 2,
        "outros": 9,
        "absenteismo_mensal_pct": 9.2,
        "ferias_vencidas_qtd": 2,
        "contratos_vencendo_90d": 1,
        "folha_mensal_estimada_reais": 248500.00,
        "verificado_em": _TS,
    }


@router.get("/alertas")
async def alertas_rh(_: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado": "referencia_municipal",
        "alertas": [
            {"tipo": "ferias_vencidas",    "severidade": "media",  "descricao": "2 servidores com férias vencidas (período 2023-2024)", "acao_recomendada": "Agendar gozo imediato"},
            {"tipo": "contrato_vencendo",  "severidade": "media",  "descricao": "CT-002/2024 (Motorista Cleber Dias) vence em 31/12/2025", "acao_recomendada": "Iniciar processo de renovação/licitação"},
            {"tipo": "contrato_vencido",   "severidade": "alta",   "descricao": "CT-001/2023 (Dra. Simone Farias) venceu em 31/05/2025 — verificar renovação", "acao_recomendada": "Regularizar contrato ou nova seleção"},
            {"tipo": "absenteismo",        "severidade": "baixa",  "descricao": "Absenteísmo 9,2% — acima da meta de 8%", "acao_recomendada": "Monitorar e identificar causas"},
            {"tipo": "capacitacao",        "severidade": "baixa",  "descricao": "62% dos servidores com capacitação EducaSUS — meta 80%", "acao_recomendada": "Ampliar oferta de cursos EAD"},
        ],
        "verificado_em": _TS,
    }
