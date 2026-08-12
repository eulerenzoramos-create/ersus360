"""
Router: /api/tce-tcu — ERSUS 360
Dados reais pendentes de integração — situacao_dado = nao_disponivel.
Nenhum valor é simulado ou estimado.
"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from typing import Optional
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/tce-tcu", tags=["tce-tcu"])


@router.get("/relatorios")
async def listar_relatorios():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": [],
        "nota": "Integração pendente. Configure no Railway.",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


@router.post("/gerar")
async def gerar_relatorio():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": [],
        "nota": "Integração pendente. Configure no Railway.",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


@router.post("/relatorios/{relatorio_id}/assinar")
async def assinar_relatorio():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": [],
        "nota": "Integração pendente. Configure no Railway.",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


@router.post("/relatorios/{relatorio_id}/pdf")
async def gerar_pdf():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": [],
        "nota": "Integração pendente. Configure no Railway.",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


@router.get("/resumo-financeiro")
async def resumo_financeiro():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": [],
        "nota": "Integração pendente. Configure no Railway.",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }

