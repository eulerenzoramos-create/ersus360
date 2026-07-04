"""Router: /api/rh — Recursos Humanos (Fase 4)"""
from __future__ import annotations
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

from routers.auth import get_current_user, UserOut
from config import settings

router = APIRouter(prefix="/api/rh", tags=["Recursos Humanos"])


# ─── Schemas ──────────────────────────────────────────────────────────────────

class ServidorOut(BaseModel):
    id: int
    nome: str
    matricula: str
    cargo: str
    vinculo: str
    carga_horaria: int
    unidade_nome: str
    fonte_pagamento: str
    admissao: str
    ativo: bool

class FeriasOut(BaseModel):
    id: int
    servidor_nome: str
    periodo_aquisitivo: str
    inicio_gozo: str
    fim_gozo: str
    dias: int
    status: str
    alerta: Optional[str] = None

class MovimentacaoOut(BaseModel):
    id: int
    servidor_nome: str
    tipo: str
    descricao: str
    data_inicio: str
    data_fim: Optional[str]
    documento: Optional[str]
    ativo: bool

class ContratoOut(BaseModel):
    id: int
    servidor_nome: str
    tipo: str
    empresa: Optional[str]
    inicio: str
    fim: str
    valor_mensal: float
    dias_restantes: int
    status: str

class PainelRHOut(BaseModel):
    headcount_total: int
    por_vinculo: dict
    por_unidade: dict
    ferias_vencidas: int
    afastamentos_ativos: int
    contratos_vencendo_30d: int
    taxa_absenteismo: float
    municipio: str
    fonte: str


# ─── Dados de referência Apuí/AM ──────────────────────────────────────────────

SERVIDORES_REF = [
    {"id": 1,  "nome": "Dr. Paulo Henrique Costa",    "matricula": "SMS-001", "cargo": "Médico Clínico Geral",     "vinculo": "estatutario",  "carga_horaria": 40, "unidade_nome": "UBS Central",     "fonte_pagamento": "pab_fixo",         "admissao": "2018-03-01", "ativo": True},
    {"id": 2,  "nome": "Enf. Ana Clara Souza",        "matricula": "SMS-002", "cargo": "Enfermeiro",               "vinculo": "estatutario",  "carga_horaria": 40, "unidade_nome": "UBS Central",     "fonte_pagamento": "esf",              "admissao": "2019-06-01", "ativo": True},
    {"id": 3,  "nome": "Dr. Marcos Figueiredo",       "matricula": "SMS-003", "cargo": "Médico ESF",               "vinculo": "temporario",   "carga_horaria": 40, "unidade_nome": "UBS Zona Rural",  "fonte_pagamento": "esf",              "admissao": "2024-01-15", "ativo": True},
    {"id": 4,  "nome": "Enf. Rita de Cássia Lima",    "matricula": "SMS-004", "cargo": "Enfermeiro ESF",           "vinculo": "estatutario",  "carga_horaria": 40, "unidade_nome": "UBS Zona Rural",  "fonte_pagamento": "esf",              "admissao": "2020-02-01", "ativo": True},
    {"id": 5,  "nome": "CD. Juliana Torres",          "matricula": "SMS-005", "cargo": "Cirurgião Dentista",       "vinculo": "estatutario",  "carga_horaria": 40, "unidade_nome": "UBS Central",     "fonte_pagamento": "saude_bucal",      "admissao": "2017-09-01", "ativo": True},
    {"id": 6,  "nome": "Farm. Carla Dias",            "matricula": "SMS-006", "cargo": "Farmacêutico",             "vinculo": "clt",          "carga_horaria": 40, "unidade_nome": "Farmácia Central", "fonte_pagamento": "recurso_proprio",  "admissao": "2021-05-10", "ativo": True},
    {"id": 7,  "nome": "Fisio. Roberto Alves",        "matricula": "SMS-007", "cargo": "Fisioterapeuta",           "vinculo": "terceirizado", "carga_horaria": 20, "unidade_nome": "UBS Central",     "fonte_pagamento": "recurso_proprio",  "admissao": "2023-08-01", "ativo": True},
    {"id": 8,  "nome": "Maria das Graças Lima",       "matricula": "SMS-008", "cargo": "Agente Comunitário Saúde", "vinculo": "estatutario",  "carga_horaria": 40, "unidade_nome": "UBS Central",     "fonte_pagamento": "agentes_comunitarios","admissao": "2015-04-01","ativo": True},
    {"id": 9,  "nome": "José Raimundo Pereira",       "matricula": "SMS-009", "cargo": "Agente Comunitário Saúde", "vinculo": "estatutario",  "carga_horaria": 40, "unidade_nome": "UBS Central",     "fonte_pagamento": "agentes_comunitarios","admissao": "2016-07-01","ativo": True},
    {"id": 10, "nome": "Ana Beatriz Santos",          "matricula": "SMS-010", "cargo": "Técnico de Enfermagem",    "vinculo": "estatutario",  "carga_horaria": 40, "unidade_nome": "UBS Central",     "fonte_pagamento": "pab_fixo",         "admissao": "2020-11-01", "ativo": True},
    {"id": 11, "nome": "Carlos Eduardo Silva",        "matricula": "SMS-011", "cargo": "Agente Comunitário Saúde", "vinculo": "estatutario",  "carga_horaria": 40, "unidade_nome": "UBS Central",     "fonte_pagamento": "agentes_comunitarios","admissao": "2017-03-01","ativo": True},
    {"id": 12, "nome": "Psic. Fernanda Matos",        "matricula": "SMS-012", "cargo": "Psicólogo",                "vinculo": "clt",          "carga_horaria": 20, "unidade_nome": "CAPS",            "fonte_pagamento": "recurso_proprio",  "admissao": "2022-01-10", "ativo": True},
]

FERIAS_REF = [
    {"id": 1, "servidor_nome": "Dr. Paulo Henrique Costa", "periodo_aquisitivo": "2024/2025", "inicio_gozo": "2026-07-14", "fim_gozo": "2026-08-12", "dias": 30, "status": "programada", "alerta": None},
    {"id": 2, "servidor_nome": "Enf. Ana Clara Souza",     "periodo_aquisitivo": "2024/2025", "inicio_gozo": "2026-08-01", "fim_gozo": "2026-08-30", "dias": 30, "status": "programada", "alerta": None},
    {"id": 3, "servidor_nome": "CD. Juliana Torres",       "periodo_aquisitivo": "2023/2024", "inicio_gozo": "2025-12-01", "fim_gozo": "2025-12-30", "dias": 30, "status": "vencida",    "alerta": "⚠️ Férias vencidas — período 2023/2024 expirou. Risco trabalhista."},
    {"id": 4, "servidor_nome": "Farm. Carla Dias",         "periodo_aquisitivo": "2024/2025", "inicio_gozo": "2026-09-01", "fim_gozo": "2026-09-30", "dias": 30, "status": "programada", "alerta": None},
]

MOVIMENTACOES_REF = [
    {"id": 1, "servidor_nome": "Dr. Marcos Figueiredo",  "tipo": "afastamento_saude",     "descricao": "Licença médica — CID M54.5",   "data_inicio": "2026-06-10", "data_fim": "2026-07-10", "documento": "Atestado 2026-0610", "ativo": False},
    {"id": 2, "servidor_nome": "Ana Beatriz Santos",     "tipo": "afastamento_gestante",  "descricao": "Licença maternidade 180 dias", "data_inicio": "2026-04-15", "data_fim": "2026-10-12", "documento": "DN 2026-00123",      "ativo": True},
    {"id": 3, "servidor_nome": "Carlos Eduardo Silva",   "tipo": "transferencia",         "descricao": "Transferido para UBS Zona Rural","data_inicio": "2026-05-01","data_fim": None,         "documento": "Portaria SMS 042/2026","ativo": True},
]

CONTRATOS_REF = [
    {"id": 1, "servidor_nome": "Dr. Marcos Figueiredo", "tipo": "temporario",   "empresa": None,          "inicio": "2024-01-15", "fim": "2026-07-31", "valor_mensal": 8500.0,  "dias_restantes": 28, "status": "vencendo"},
    {"id": 2, "servidor_nome": "Fisio. Roberto Alves",  "tipo": "terceirizado", "empresa": "Saúde Total", "inicio": "2023-08-01", "fim": "2026-12-31", "valor_mensal": 4200.0,  "dias_restantes": 181,"status": "vigente"},
]


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/servidores", response_model=list[ServidorOut])
async def listar_servidores(
    vinculo: Optional[str] = Query(None),
    ativo: Optional[bool] = Query(None),
    usuario: UserOut = Depends(get_current_user),
):
    dados = SERVIDORES_REF
    if vinculo:
        dados = [s for s in dados if s["vinculo"] == vinculo]
    if ativo is not None:
        dados = [s for s in dados if s["ativo"] == ativo]
    return [ServidorOut(**s) for s in dados]


@router.get("/ferias", response_model=list[FeriasOut])
async def listar_ferias(
    status: Optional[str] = Query(None),
    usuario: UserOut = Depends(get_current_user),
):
    dados = FERIAS_REF
    if status:
        dados = [f for f in dados if f["status"] == status]
    return [FeriasOut(**f) for f in dados]


@router.get("/ferias/vencidas", response_model=list[FeriasOut])
async def ferias_vencidas(usuario: UserOut = Depends(get_current_user)):
    return [FeriasOut(**f) for f in FERIAS_REF if f["status"] == "vencida"]


@router.get("/movimentacoes", response_model=list[MovimentacaoOut])
async def listar_movimentacoes(
    ativo: Optional[bool] = Query(None),
    usuario: UserOut = Depends(get_current_user),
):
    dados = MOVIMENTACOES_REF
    if ativo is not None:
        dados = [m for m in dados if m["ativo"] == ativo]
    return [MovimentacaoOut(**m) for m in dados]


@router.get("/contratos", response_model=list[ContratoOut])
async def listar_contratos(usuario: UserOut = Depends(get_current_user)):
    return [ContratoOut(**c) for c in CONTRATOS_REF]


@router.get("/contratos/vencendo", response_model=list[ContratoOut])
async def contratos_vencendo(usuario: UserOut = Depends(get_current_user)):
    return [ContratoOut(**c) for c in CONTRATOS_REF if c["dias_restantes"] <= 30]


@router.get("/painel", response_model=PainelRHOut)
async def painel_rh(usuario: UserOut = Depends(get_current_user)):
    ativos = [s for s in SERVIDORES_REF if s["ativo"]]
    por_vinculo: dict = {}
    for s in ativos:
        por_vinculo[s["vinculo"]] = por_vinculo.get(s["vinculo"], 0) + 1
    por_unidade: dict = {}
    for s in ativos:
        por_unidade[s["unidade_nome"]] = por_unidade.get(s["unidade_nome"], 0) + 1

    return PainelRHOut(
        headcount_total=len(ativos),
        por_vinculo=por_vinculo,
        por_unidade=por_unidade,
        ferias_vencidas=sum(1 for f in FERIAS_REF if f["status"] == "vencida"),
        afastamentos_ativos=sum(1 for m in MOVIMENTACOES_REF if m["ativo"]),
        contratos_vencendo_30d=sum(1 for c in CONTRATOS_REF if c["dias_restantes"] <= 30),
        taxa_absenteismo=round(sum(1 for m in MOVIMENTACOES_REF if m["ativo"]) / len(ativos) * 100, 1),
        municipio=settings.MUNICIPIO_NOME,
        fonte="referencia",
    )


@router.get("/alertas")
async def alertas_rh(usuario: UserOut = Depends(get_current_user)):
    alertas = []
    ferias_v = [f for f in FERIAS_REF if f["status"] == "vencida"]
    if ferias_v:
        alertas.append({"nivel": "critico", "mensagem": f"{len(ferias_v)} servidor(es) com férias vencidas — risco trabalhista", "modulo": "ferias"})
    contratos_v = [c for c in CONTRATOS_REF if c["dias_restantes"] <= 30]
    if contratos_v:
        alertas.append({"nivel": "atencao", "mensagem": f"{len(contratos_v)} contrato(s) vencendo nos próximos 30 dias", "modulo": "contratos"})
    afastamentos = [m for m in MOVIMENTACOES_REF if m["ativo"]]
    if afastamentos:
        alertas.append({"nivel": "info", "mensagem": f"{len(afastamentos)} servidor(es) com afastamento ativo", "modulo": "movimentacoes"})
    return {"alertas": alertas, "total": len(alertas)}
