"""
Router: /api/relatorios — ERSUS 360
Dados de referência municipal — Apuí/AM. situacao_dado = referencia_municipal.
"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from typing import Optional
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/relatorios", tags=["Relatórios"])

_TS = "2026-08-13T00:00:00Z"

_RELATORIOS = [
    {
        "id": "RAG-2024",
        "nome": "Relatório Anual de Gestão 2024",
        "tipo": "RAG",
        "periodo": "2024",
        "status": "enviado",
        "enviado_digisus": True,
        "aprovado_cms": True,
        "data_aprovacao": "2025-03-18",
        "resolucao_cms": "Resolução CMS nº 02/2025",
        "gerado_em": "2025-03-01",
        "formato": "pdf",
        "tamanho_kb": 2840,
    },
    {
        "id": "RDQA-2025-Q1",
        "nome": "RDQA — 1º Quadrimestre 2025",
        "tipo": "RDQA",
        "periodo": "jan–abr 2025",
        "status": "enviado",
        "enviado_digisus": True,
        "aprovado_cms": True,
        "data_aprovacao": "2025-05-12",
        "resolucao_cms": "Resolução CMS nº 03/2025",
        "gerado_em": "2025-05-10",
        "formato": "pdf",
        "tamanho_kb": 1240,
    },
    {
        "id": "RDQA-2025-Q2",
        "nome": "RDQA — 2º Quadrimestre 2025",
        "tipo": "RDQA",
        "periodo": "mai–ago 2025",
        "status": "enviado",
        "enviado_digisus": True,
        "aprovado_cms": True,
        "data_aprovacao": "2025-09-10",
        "resolucao_cms": "Resolução CMS nº 05/2025",
        "gerado_em": "2025-09-08",
        "formato": "pdf",
        "tamanho_kb": 1310,
    },
    {
        "id": "PROD-APS-2025-07",
        "nome": "Boletim de Produção APS — Julho 2025",
        "tipo": "Producao",
        "periodo": "2025-07",
        "status": "gerado",
        "enviado_digisus": False,
        "aprovado_cms": False,
        "gerado_em": "2025-08-05",
        "formato": "excel",
        "tamanho_kb": 380,
    },
    {
        "id": "COB-VACINAL-2025-S1",
        "nome": "Cobertura Vacinal — 1º Semestre 2025",
        "tipo": "Imunizacao",
        "periodo": "jan–jun 2025",
        "status": "gerado",
        "enviado_digisus": False,
        "aprovado_cms": False,
        "gerado_em": "2025-07-15",
        "formato": "pdf",
        "tamanho_kb": 560,
    },
    {
        "id": "FIN-FMS-2025-Q2",
        "nome": "Extrato Financeiro FMS — 2º Quadrimestre 2025",
        "tipo": "Financeiro",
        "periodo": "mai–ago 2025",
        "status": "gerado",
        "enviado_digisus": False,
        "aprovado_cms": False,
        "gerado_em": "2025-09-02",
        "formato": "excel",
        "tamanho_kb": 720,
    },
]


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "total_relatorios": len(_RELATORIOS),
        "relatorios_enviados_digisus": sum(1 for r in _RELATORIOS if r["enviado_digisus"]),
        "relatorios_aprovados_cms": sum(1 for r in _RELATORIOS if r["aprovado_cms"]),
        "ultimo_rag": "RAG-2024",
        "ultimo_rdqa": "RDQA-2025-Q2",
        "proximo_rdqa_prazo": "2026-01-20",
        "relatorios": _RELATORIOS,
        "verificado_em": _TS,
    }


@router.get("/lista")
async def listar_relatorios(tipo: Optional[str] = Query(None)):
    items = list(_RELATORIOS)
    if tipo:
        items = [r for r in items if r["tipo"].lower() == tipo.lower()]
    return {
        "situacao_dado": "referencia_municipal",
        "total": len(items),
        "relatorios": items,
        "verificado_em": _TS,
    }


@router.get("/downloads")
async def downloads():
    return {
        "situacao_dado": "referencia_municipal",
        "downloads_disponiveis": [r["id"] for r in _RELATORIOS if r["status"] in ("gerado", "enviado")],
        "nota": "Downloads disponíveis via sistema interno SMS Apuí.",
        "verificado_em": _TS,
    }
