"""
Router: /api/farmacovigilancia — RAM · Queixas Técnicas · NOTIVISA — FMS Apuí/AM
Dados de referência municipal. situacao_dado = referencia_municipal.
"""
from __future__ import annotations
from fastapi import APIRouter, Depends
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/farmacovigilancia", tags=["farmacovigilancia"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "Jul/2026",
        "notificacoes_mes": 7,
        "ram_mes": 4,
        "queixas_tecnicas_mes": 3,
        "notificacoes_graves_mes": 1,
        "notificadas_notivisa_pct": 86,
        "meta_notivisa_pct": 98,
        "taxa_subnotificacao_estimada_pct": 62,
        "medicamentos_alerta_mes": 2,
        "medicamentos_retirados": 0,
        "fonte": "Referência municipal FMS Apuí/AM",
    }


@router.get("/historico")
async def historico():
    return [
        {"mes": "Fev", "ram": 3, "queixas": 2, "notivisa_pct": 80},
        {"mes": "Mar", "ram": 4, "queixas": 3, "notivisa_pct": 83},
        {"mes": "Abr", "ram": 5, "queixas": 2, "notivisa_pct": 85},
        {"mes": "Mai", "ram": 3, "queixas": 4, "notivisa_pct": 84},
        {"mes": "Jun", "ram": 4, "queixas": 2, "notivisa_pct": 86},
        {"mes": "Jul", "ram": 4, "queixas": 3, "notivisa_pct": 86},
    ]


@router.get("/notificacoes")
async def notificacoes():
    return [
        {
            "id": "FVG2026041",
            "tipo": "RAM",
            "gravidade": "grave",
            "medicamento": "Artemetér + Lumefantrina",
            "reacao": "Prolongamento QT · palpitações",
            "causalidade": "Provável",
            "desfecho": "Recuperado com sequela mínima",
            "profissional": "Enf. Marcos Lima",
            "notivisa": False,
            "alerta": "Notificação ao NOTIVISA pendente. Prazo: 72h.",
        },
        {
            "id": "FVG2026040",
            "tipo": "RAM",
            "gravidade": "moderada",
            "medicamento": "Primaquina",
            "reacao": "Hemólise em paciente G6PD",
            "causalidade": "Definitiva",
            "desfecho": "Recuperado",
            "profissional": "Méd. Ana Costa",
            "notivisa": True,
            "alerta": None,
        },
        {
            "id": "FVG2026039",
            "tipo": "QT",
            "gravidade": "leve",
            "medicamento": "Amoxicilina 500mg",
            "reacao": "Comprimido com aspecto diferente — suspeita de falsificação",
            "causalidade": "A investigar",
            "desfecho": "Em investigação",
            "profissional": "Farm. Carla Mota",
            "notivisa": True,
            "alerta": None,
        },
        {
            "id": "FVG2026038",
            "tipo": "RAM",
            "gravidade": "moderada",
            "medicamento": "Doxiciclina",
            "reacao": "Fotossensibilidade intensa",
            "causalidade": "Possível",
            "desfecho": "Recuperado",
            "profissional": "Méd. Pedro Souza",
            "notivisa": True,
            "alerta": None,
        },
        {
            "id": "FVG2026037",
            "tipo": "QT",
            "gravidade": "leve",
            "medicamento": "Metronidazol suspensão",
            "reacao": "Embalagem com vazamento",
            "causalidade": "Problema de qualidade",
            "desfecho": "Lote retido",
            "profissional": "Farm. Carla Mota",
            "notivisa": True,
            "alerta": None,
        },
    ]


@router.get("/alertas")
async def alertas():
    return [
        {
            "id": "ALT2026001",
            "status": "em_andamento",
            "medicamento": "Artemetér + Lumefantrina (coartem)",
            "tipo_alerta": "Interação QT prolongado",
            "data_alerta": "2026-07-08",
            "descricao": "ANVISA alerta sobre risco de prolongamento QT em doses altas. Verificar triagem eletrocardiográfica prévia.",
            "conduta": "Protocolo de triagem ECG antes de nova prescrição.",
        },
        {
            "id": "ALT2026002",
            "status": "em_andamento",
            "medicamento": "Ivermectina 6mg",
            "tipo_alerta": "Uso off-label — desinformação",
            "data_alerta": "2026-06-20",
            "descricao": "Demanda aumentada sem indicação clínica validada. Orientação à equipe sobre uso racional.",
            "conduta": "Informe técnico distribuído nas UBS.",
        },
    ]
