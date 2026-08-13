"""
Router: /api/absenteismo — Gestão de Frequência — FMS Apuí/AM
Dados de referência municipal. situacao_dado = referencia_municipal.
"""
from __future__ import annotations
from fastapi import APIRouter, Depends
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/absenteismo", tags=["Absenteísmo"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "competencia": "Abr/2026",
        "total_servidores": 214,
        "taxa_geral": 6.8,
        "meta_taxa": 8.0,
        "conforme": True,
        "total_dias_falta": 218,
        "total_dias_trab": 3210,
        "n_criticos": 4,
        "motivos": {
            "medico": 142,
            "injust": 18,
            "licenca": 58,
        },
        "por_cargo": [
            {"cargo": "Agente Comunitário",  "pct": 8.1},
            {"cargo": "Téc. Enfermagem",     "pct": 7.2},
            {"cargo": "Enfermeiro",           "pct": 5.8},
            {"cargo": "Médico",               "pct": 4.2},
            {"cargo": "Dentista",             "pct": 5.0},
            {"cargo": "Administrativo",       "pct": 6.4},
            {"cargo": "Motorista",            "pct": 9.3},
            {"cargo": "Auxiliar de Limpeza",  "pct": 10.1},
        ],
        "historico": [
            {"mes": "Nov/25", "pct": 7.4},
            {"mes": "Dez/25", "pct": 8.9},
            {"mes": "Jan/26", "pct": 7.8},
            {"mes": "Fev/26", "pct": 7.1},
            {"mes": "Mar/26", "pct": 6.9},
            {"mes": "Abr/26", "pct": 6.8},
        ],
        "fonte": "Referência municipal FMS Apuí/AM",
    }


@router.get("/servidores")
async def servidores():
    return [
        {
            "nome": "João Carlos Silva",
            "cargo": "Agente Comunitário de Saúde",
            "unidade": "UBS Central",
            "dias_falta": 5,
            "taxa": 23.8,
            "status": "critico",
            "principal_motivo": "Atestado médico (LER/DORT)",
        },
        {
            "nome": "Maria das Graças Pereira",
            "cargo": "Técnica de Enfermagem",
            "unidade": "UBS Leste",
            "dias_falta": 3,
            "taxa": 14.3,
            "status": "critico",
            "principal_motivo": "Licença maternidade",
        },
        {
            "nome": "Antônio Ramos Ferreira",
            "cargo": "Motorista",
            "unidade": "SAMU / Transporte",
            "dias_falta": 4,
            "taxa": 19.0,
            "status": "critico",
            "principal_motivo": "Injustificado (2d) + Atestado (2d)",
        },
        {
            "nome": "Raimunda Oliveira Costa",
            "cargo": "Auxiliar de Limpeza",
            "unidade": "UBS Santa Cruz",
            "dias_falta": 3,
            "taxa": 14.3,
            "status": "critico",
            "principal_motivo": "Atestado médico",
        },
        {
            "nome": "Carlos Eduardo Moura",
            "cargo": "Enfermeiro",
            "unidade": "UBS Ribeirinha",
            "dias_falta": 1,
            "taxa": 4.8,
            "status": "ok",
            "principal_motivo": "Atestado (1d)",
        },
        {
            "nome": "Ana Paula Torres",
            "cargo": "Odontóloga",
            "unidade": "UBS Central",
            "dias_falta": 0,
            "taxa": 0.0,
            "status": "ok",
            "principal_motivo": None,
        },
        {
            "nome": "Francisca Mendes Lima",
            "cargo": "Técnica de Enfermagem",
            "unidade": "UBS Central",
            "dias_falta": 2,
            "taxa": 9.5,
            "status": "atencao",
            "principal_motivo": "Atestado médico",
        },
        {
            "nome": "Pedro Nunes Barbosa",
            "cargo": "Agente Comunitário de Saúde",
            "unidade": "UBS Santa Cruz",
            "dias_falta": 1,
            "taxa": 4.8,
            "status": "ok",
            "principal_motivo": "Injustificado (1d)",
        },
    ]
