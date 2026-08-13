"""
Router: /api/tb-hanseniase — Tuberculose · Hanseníase · PNCT · PNCH — FMS Apuí/AM
Dados de referência municipal. situacao_dado = referencia_municipal.
"""
from __future__ import annotations
from fastapi import APIRouter, Depends
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/tb-hanseniase", tags=["tb_hanseniase"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "2026",
        "tb_em_tratamento": 5,
        "tb_alertas": 1,
        "tb_tdo_adesao_pct": 80,
        "hans_em_tratamento": 4,
        "coef_hans_2025": 19.0,
        "fonte": "Referência municipal FMS Apuí/AM",
    }


@router.get("/historico")
async def historico():
    return [
        {"ano": "2021",  "tb_casos": 7,  "coef_hans": 22.1, "hans_casos": 4},
        {"ano": "2022",  "tb_casos": 6,  "coef_hans": 20.8, "hans_casos": 4},
        {"ano": "2023",  "tb_casos": 8,  "coef_hans": 18.5, "hans_casos": 4},
        {"ano": "2024",  "tb_casos": 6,  "coef_hans": 21.3, "hans_casos": 4},
        {"ano": "2025",  "tb_casos": 5,  "coef_hans": 19.0, "hans_casos": 4},
        {"ano": "2026*", "tb_casos": 5,  "coef_hans": 19.0, "hans_casos": 4},
    ]


@router.get("/tuberculose")
async def tuberculose():
    return [
        {
            "id": "TB2026001",
            "codigo": "TB2026001",
            "forma": "Pulmonar",
            "situacao": "em_tratamento",
            "esquema": "RHZE",
            "mes_inicio": "Mar/2026",
            "mes_prev_alta": "Set/2026",
            "resultado_bk": "positivo",
            "baciloscopia_2m": "negativo",
            "tdo": True,
            "contatos_total": 6,
            "contatos_examinados": 6,
            "notificante": "UBS Central",
            "alerta": None,
        },
        {
            "id": "TB2026002",
            "codigo": "TB2026002",
            "forma": "Pulmonar",
            "situacao": "em_tratamento",
            "esquema": "RHZE",
            "mes_inicio": "Abr/2026",
            "mes_prev_alta": "Out/2026",
            "resultado_bk": "positivo",
            "baciloscopia_2m": None,
            "tdo": False,
            "contatos_total": 4,
            "contatos_examinados": 2,
            "notificante": "UBS Leste",
            "alerta": "TDO não iniciado — risco de abandono. Contatos incompletos.",
        },
        {
            "id": "TB2026003",
            "codigo": "TB2026003",
            "forma": "Extrapulmonar (pleural)",
            "situacao": "em_tratamento",
            "esquema": "RHZE",
            "mes_inicio": "Fev/2026",
            "mes_prev_alta": "Ago/2026",
            "resultado_bk": "negativo",
            "baciloscopia_2m": "negativo",
            "tdo": True,
            "contatos_total": 3,
            "contatos_examinados": 3,
            "notificante": "UBS Central",
            "alerta": None,
        },
        {
            "id": "TB2025011",
            "codigo": "TB2025011",
            "forma": "Pulmonar",
            "situacao": "alta_cura",
            "esquema": "RHZE",
            "mes_inicio": "Jan/2025",
            "mes_prev_alta": "Jul/2025",
            "resultado_bk": "negativo",
            "baciloscopia_2m": "negativo",
            "tdo": True,
            "contatos_total": 5,
            "contatos_examinados": 5,
            "notificante": "UBS Santa Cruz",
            "alerta": None,
        },
        {
            "id": "TB2026004",
            "codigo": "TB2026004",
            "forma": "Pulmonar",
            "situacao": "em_tratamento",
            "esquema": "RHZE",
            "mes_inicio": "Jun/2026",
            "mes_prev_alta": "Dez/2026",
            "resultado_bk": "positivo",
            "baciloscopia_2m": None,
            "tdo": True,
            "contatos_total": 7,
            "contatos_examinados": 5,
            "notificante": "UBS Ribeirinha",
            "alerta": None,
        },
    ]


@router.get("/hanseniase")
async def hanseniase():
    return [
        {
            "id": "HAN2026001",
            "codigo": "HAN2026001",
            "forma": "Dimorfa",
            "classificacao": "MB",
            "status": "em_tratamento",
            "esquema": "PQT-MB",
            "mes_inicio": "Jan/2026",
            "duracao_prevista": "12 meses",
            "grau_incapacidade_inicial": 1,
            "grau_incapacidade_atual": 1,
            "exames_contatos": 4,
            "notificante": "UBS Central",
        },
        {
            "id": "HAN2026002",
            "codigo": "HAN2026002",
            "forma": "Tuberculoide",
            "classificacao": "PB",
            "status": "em_tratamento",
            "esquema": "PQT-PB",
            "mes_inicio": "Fev/2026",
            "duracao_prevista": "6 meses",
            "grau_incapacidade_inicial": 0,
            "grau_incapacidade_atual": 0,
            "exames_contatos": 3,
            "notificante": "UBS Leste",
        },
        {
            "id": "HAN2025022",
            "codigo": "HAN2025022",
            "forma": "Virchowiana",
            "classificacao": "MB",
            "status": "em_tratamento",
            "esquema": "PQT-MB",
            "mes_inicio": "Set/2025",
            "duracao_prevista": "12 meses",
            "grau_incapacidade_inicial": 2,
            "grau_incapacidade_atual": 2,
            "exames_contatos": 6,
            "notificante": "UBS Central",
        },
        {
            "id": "HAN2025018",
            "codigo": "HAN2025018",
            "forma": "Borderline",
            "classificacao": "MB",
            "status": "alta_cura",
            "esquema": "PQT-MB",
            "mes_inicio": "Jul/2024",
            "duracao_prevista": "12 meses",
            "grau_incapacidade_inicial": 1,
            "grau_incapacidade_atual": 0,
            "exames_contatos": 5,
            "notificante": "UBS Santa Cruz",
        },
    ]
