"""
Router: /api/rdqa — ERSUS 360
Dados de referência municipal — Apuí/AM. situacao_dado = referencia_municipal.
"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from typing import Optional
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/rdqa", tags=["RDQA"])

_TS = "2026-08-13T00:00:00Z"


@router.get("/gerar")
async def gerar_rdqa(quadrimestre: Optional[str] = Query(None)):
    quad = quadrimestre or "2025-Q2"
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí",
        "ibge": "1300144",
        "uf": "AM",
        "quadrimestre": quad,
        "periodo_referencia": "maio–agosto 2025",
        "secretaria": "Rosângela Motter",
        "enviado_digisus": True,
        "data_envio": "2025-09-15",
        "aprovado_cms": True,
        "data_aprovacao_cms": "2025-09-10",
        "resolucao_cms": "Resolução CMS nº 05/2025",
        "indicadores": [
            {
                "codigo": "1.1.1",
                "nome": "Proporção de nascidos vivos com 7 ou mais consultas de pré-natal",
                "meta_pms": 75.0,
                "realizado": 71.4,
                "tendencia": "crescente",
                "status": "em_andamento",
            },
            {
                "codigo": "1.1.2",
                "nome": "Proporção de parto normal",
                "meta_pms": 60.0,
                "realizado": 58.3,
                "tendencia": "estavel",
                "status": "em_andamento",
            },
            {
                "codigo": "1.2.1",
                "nome": "Cobertura vacinal DTP em menores de 1 ano",
                "meta_pms": 95.0,
                "realizado": 88.2,
                "tendencia": "decrescente",
                "status": "alerta",
            },
            {
                "codigo": "1.3.1",
                "nome": "Razão de exames citopatológicos do colo de útero (25–64 anos)",
                "meta_pms": 0.45,
                "realizado": 0.38,
                "tendencia": "crescente",
                "status": "em_andamento",
            },
            {
                "codigo": "2.1.1",
                "nome": "Incidência de malária (IPA)",
                "meta_pms": 10.0,
                "realizado": 7.8,
                "tendencia": "decrescente",
                "status": "meta_atingida",
            },
            {
                "codigo": "2.2.1",
                "nome": "Proporção de notificações SINAN encerradas em ≤ 60 dias",
                "meta_pms": 90.0,
                "realizado": 93.1,
                "tendencia": "estavel",
                "status": "meta_atingida",
            },
            {
                "codigo": "3.1.1",
                "nome": "Cobertura da Estratégia Saúde da Família",
                "meta_pms": 80.0,
                "realizado": 78.5,
                "tendencia": "crescente",
                "status": "em_andamento",
            },
            {
                "codigo": "3.2.1",
                "nome": "Média de consultas médicas por habitante/ano (APS)",
                "meta_pms": 1.5,
                "realizado": 1.42,
                "tendencia": "estavel",
                "status": "em_andamento",
            },
        ],
        "gerado_em": _TS,
    }


@router.get("/historico")
async def historico_rdqa():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí",
        "historico": [
            {
                "quadrimestre": "2023-Q1",
                "periodo": "jan–abr 2023",
                "enviado": True,
                "data_envio": "2023-05-18",
                "aprovado_cms": True,
                "nota_geral": 72.1,
            },
            {
                "quadrimestre": "2023-Q2",
                "periodo": "mai–ago 2023",
                "enviado": True,
                "data_envio": "2023-09-14",
                "aprovado_cms": True,
                "nota_geral": 73.5,
            },
            {
                "quadrimestre": "2023-Q3",
                "periodo": "set–dez 2023",
                "enviado": True,
                "data_envio": "2024-01-20",
                "aprovado_cms": True,
                "nota_geral": 71.8,
            },
            {
                "quadrimestre": "2024-Q1",
                "periodo": "jan–abr 2024",
                "enviado": True,
                "data_envio": "2024-05-17",
                "aprovado_cms": True,
                "nota_geral": 74.0,
            },
            {
                "quadrimestre": "2024-Q2",
                "periodo": "mai–ago 2024",
                "enviado": True,
                "data_envio": "2024-09-12",
                "aprovado_cms": True,
                "nota_geral": 75.2,
            },
            {
                "quadrimestre": "2024-Q3",
                "periodo": "set–dez 2024",
                "enviado": True,
                "data_envio": "2025-01-22",
                "aprovado_cms": True,
                "nota_geral": 74.9,
            },
            {
                "quadrimestre": "2025-Q1",
                "periodo": "jan–abr 2025",
                "enviado": True,
                "data_envio": "2025-05-16",
                "aprovado_cms": True,
                "nota_geral": 76.3,
            },
            {
                "quadrimestre": "2025-Q2",
                "periodo": "mai–ago 2025",
                "enviado": True,
                "data_envio": "2025-09-15",
                "aprovado_cms": True,
                "nota_geral": 77.1,
            },
        ],
        "verificado_em": _TS,
    }
