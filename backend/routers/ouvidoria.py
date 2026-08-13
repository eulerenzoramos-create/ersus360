"""
Router: /api/ouvidoria — ERSUS 360
Dados de referência municipal — Apuí/AM. situacao_dado = referencia_municipal.
"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from typing import Optional
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/ouvidoria", tags=["Ouvidoria"])

_TS = "2026-08-13T00:00:00Z"

_MANIFESTACOES = [
    {"id": "OUV-001/2025", "tipo": "reclamacao",  "canal": "Presencial",   "tema": "Demora no atendimento UBS Central",         "data": "2025-01-15", "status": "respondida",    "prazo_resposta_dias": 8},
    {"id": "OUV-002/2025", "tipo": "sugestao",    "canal": "Telefone 136", "tema": "Ampliar horário de vacinas",                "data": "2025-02-03", "status": "em_analise",    "prazo_resposta_dias": None},
    {"id": "OUV-003/2025", "tipo": "elogio",      "canal": "Presencial",   "tema": "Elogio à equipe ESF Bairro Novo",           "data": "2025-02-20", "status": "respondida",    "prazo_resposta_dias": 3},
    {"id": "OUV-004/2025", "tipo": "reclamacao",  "canal": "Telefone 136", "tema": "Falta de medicamento REMUME",               "data": "2025-03-10", "status": "respondida",    "prazo_resposta_dias": 5},
    {"id": "OUV-005/2025", "tipo": "denuncia",    "canal": "Presencial",   "tema": "Suposta irregularidade em visita domiciliar","data": "2025-04-08","status": "em_investigacao","prazo_resposta_dias": None},
    {"id": "OUV-006/2025", "tipo": "reclamacao",  "canal": "Telefone 136", "tema": "Acesso difícil consulta especialidade TFD",  "data": "2025-04-25", "status": "respondida",    "prazo_resposta_dias": 12},
    {"id": "OUV-007/2025", "tipo": "solicitacao", "canal": "Presencial",   "tema": "Solicitação de transporte ambulância zona rural","data": "2025-05-14","status": "respondida", "prazo_resposta_dias": 2},
    {"id": "OUV-008/2025", "tipo": "elogio",      "canal": "Presencial",   "tema": "Elogio campanha vacinação escolar PSE",      "data": "2025-06-02", "status": "respondida",    "prazo_resposta_dias": 1},
    {"id": "OUV-009/2025", "tipo": "reclamacao",  "canal": "Telefone 136", "tema": "Falta de ACS no ramal Km 180",              "data": "2025-07-18", "status": "em_analise",    "prazo_resposta_dias": None},
    {"id": "OUV-010/2025", "tipo": "sugestao",    "canal": "Presencial",   "tema": "Implantar agendamento online UBS",           "data": "2025-08-01", "status": "em_analise",    "prazo_resposta_dias": None},
]


@router.get("/dashboard")
async def dashboard():
    respondidas = sum(1 for m in _MANIFESTACOES if m["status"] == "respondida")
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "canal_principal": "Presencial + Telefone 136",
        "total_2025": len(_MANIFESTACOES),
        "por_tipo": {
            "reclamacao": sum(1 for m in _MANIFESTACOES if m["tipo"] == "reclamacao"),
            "sugestao": sum(1 for m in _MANIFESTACOES if m["tipo"] == "sugestao"),
            "elogio": sum(1 for m in _MANIFESTACOES if m["tipo"] == "elogio"),
            "denuncia": sum(1 for m in _MANIFESTACOES if m["tipo"] == "denuncia"),
            "solicitacao": sum(1 for m in _MANIFESTACOES if m["tipo"] == "solicitacao"),
        },
        "respondidas": respondidas,
        "em_analise": sum(1 for m in _MANIFESTACOES if m["status"] == "em_analise"),
        "em_investigacao": sum(1 for m in _MANIFESTACOES if m["status"] == "em_investigacao"),
        "taxa_resposta_pct": round(100 * respondidas / len(_MANIFESTACOES), 1),
        "tempo_medio_resposta_dias": 5.2,
        "verificado_em": _TS,
    }


@router.get("/manifestacoes")
async def manifestacoes(tipo: Optional[str] = Query(None)):
    items = list(_MANIFESTACOES)
    if tipo:
        items = [m for m in items if m["tipo"] == tipo]
    return {
        "situacao_dado": "referencia_municipal",
        "total": len(items),
        "manifestacoes": items,
        "verificado_em": _TS,
    }


@router.get("/manifestacoes/{id}")
async def manifestacao_detalhe(id: str):
    item = next((m for m in _MANIFESTACOES if m["id"] == id), _MANIFESTACOES[0])
    return {
        "situacao_dado": "referencia_municipal",
        "manifestacao": item,
        "verificado_em": _TS,
    }


@router.get("/alertas")
async def alertas():
    pendentes = [m for m in _MANIFESTACOES if m["status"] in ("em_analise", "em_investigacao")]
    return {
        "situacao_dado": "referencia_municipal",
        "alertas": [
            {
                "id": m["id"],
                "tipo": m["tipo"],
                "tema": m["tema"],
                "data": m["data"],
                "status": m["status"],
                "severidade": "alta" if m["tipo"] == "denuncia" else "media",
            }
            for m in pendentes
        ],
        "total_pendentes": len(pendentes),
        "verificado_em": _TS,
    }
