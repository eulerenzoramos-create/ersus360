"""
Router: /api/visa-municipal-apui — ERSUS 360
Dados reais pendentes de integração — situacao_dado = nao_disponivel.
Nenhum valor é simulado ou estimado.
"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from typing import Optional
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/visa-municipal-apui", tags=["visa_municipal_apui"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Integração pendente. Configure no Railway.",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


@router.get("/estabelecimentos")
async def estabelecimentos():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Integração pendente. Configure no Railway.",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


@router.get("/inspecoes")
async def inspecoes():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Integração pendente. Configure no Railway.",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


@router.get("/alertas-produtos")
async def alertas_produtos():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Integração pendente. Configure no Railway.",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


@router.get("/indicadores")
async def indicadores():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Integração pendente. Configure no Railway.",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }

