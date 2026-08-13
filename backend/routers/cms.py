"""
Router: /api/cms — Conselho Municipal de Saúde — ERSUS 360
Dados de referência municipal — Apuí/AM. situacao_dado = referencia_municipal.
"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from typing import Optional
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/cms", tags=["cms"])

_TS = "2026-08-13T00:00:00Z"

_CONSELHEIROS = [
    {"id": "CS01", "nome": "Maria de Fátima Pereira",   "segmento": "usuarios",       "entidade": "Associação de Moradores Bairro Novo",  "cargo": "Presidente",         "gestao": "2024-2026"},
    {"id": "CS02", "nome": "Antônio Carlos Matos",       "segmento": "usuarios",       "entidade": "Sindicato dos Trabalhadores Rurais",    "cargo": "Vice-presidente",    "gestao": "2024-2026"},
    {"id": "CS03", "nome": "Eliana Borges",               "segmento": "trabalhadores",  "entidade": "Conselho de Enfermagem (COREN-AM)",     "cargo": "Secretária",         "gestao": "2024-2026"},
    {"id": "CS04", "nome": "Dr. Carlos Eduardo Lima",    "segmento": "trabalhadores",  "entidade": "SMS Apuí — Área Médica",               "cargo": "Conselheiro",        "gestao": "2024-2026"},
    {"id": "CS05", "nome": "Rosângela Motter",           "segmento": "gestores",       "entidade": "Secretaria Municipal de Saúde",         "cargo": "Conselheira",        "gestao": "2024-2026"},
    {"id": "CS06", "nome": "Marcos Aurelio Dias",        "segmento": "gestores",       "entidade": "Prefeitura Municipal de Apuí",          "cargo": "Conselheiro",        "gestao": "2024-2026"},
    {"id": "CS07", "nome": "Tereza Cristina Fonseca",    "segmento": "prestadores",    "entidade": "Santa Casa de Misericórdia (referência)","cargo": "Conselheira",       "gestao": "2024-2026"},
    {"id": "CS08", "nome": "João Paulo Ribeiro",         "segmento": "usuarios",       "entidade": "Associação Ind. Apuí",                 "cargo": "Conselheiro",        "gestao": "2024-2026"},
    {"id": "CS09", "nome": "Sandra Mara Luz",            "segmento": "usuarios",       "entidade": "Grupo de Mulheres — Zona Rural",        "cargo": "Conselheira",        "gestao": "2024-2026"},
    {"id": "CS10", "nome": "Cícero Alves da Costa",      "segmento": "trabalhadores",  "entidade": "Sindicato dos Servidores Municipais",   "cargo": "Conselheiro",        "gestao": "2024-2026"},
]

_REUNIOES = [
    {"id": "RO-01/2025", "data": "2025-01-28", "tipo": "ordinaria",    "pauta": ["Aprovação ata anterior", "PAS 2025", "Prestação contas Q3/2024"], "quorum": True, "aprovacoes": ["PAS 2025 — Resolução CMS 01/2025"]},
    {"id": "RO-02/2025", "data": "2025-03-18", "tipo": "ordinaria",    "pauta": ["RAG 2024", "Programação vacinal 2025"],                           "quorum": True, "aprovacoes": ["RAG 2024 — Resolução CMS 02/2025"]},
    {"id": "RO-03/2025", "data": "2025-05-12", "tipo": "ordinaria",    "pauta": ["RDQA Q1/2025", "Situação ESF Rio Juma"],                          "quorum": True, "aprovacoes": ["RDQA Q1/2025 — Resolução CMS 03/2025"]},
    {"id": "RE-01/2025", "data": "2025-06-25", "tipo": "extraordinaria","pauta": ["Emenda parlamentar — aquisição ambulância"],                     "quorum": True, "aprovacoes": ["Parecer favorável aquisição PAT-001"]},
    {"id": "RO-04/2025", "data": "2025-07-22", "tipo": "ordinaria",    "pauta": ["Prestação contas Q1-Q2/2025", "Plano municipal vacinação"],       "quorum": True, "aprovacoes": []},
    {"id": "RO-05/2025", "data": "2025-09-10", "tipo": "ordinaria",    "pauta": ["RDQA Q2/2025", "Situação malária zona rural"],                   "quorum": True, "aprovacoes": ["RDQA Q2/2025 — Resolução CMS 05/2025"]},
]


@router.get("/resumo")
async def resumo():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "composicao": "10 conselheiros titulares",
        "presidente": "Maria de Fátima Pereira",
        "gestao_cms": "2024-2026",
        "reunioes_realizadas_2025": len(_REUNIOES),
        "resolucoes_emitidas_2025": 5,
        "segmentos": {"usuarios": 4, "trabalhadores": 3, "gestores": 2, "prestadores": 1},
        "verificado_em": _TS,
    }


@router.get("/reunioes")
async def reunioes():
    return {
        "situacao_dado": "referencia_municipal",
        "total": len(_REUNIOES),
        "reunioes": _REUNIOES,
        "verificado_em": _TS,
    }


@router.get("/conselheiros")
async def conselheiros():
    return {
        "situacao_dado": "referencia_municipal",
        "total": len(_CONSELHEIROS),
        "gestao": "2024-2026",
        "conselheiros": _CONSELHEIROS,
        "verificado_em": _TS,
    }
