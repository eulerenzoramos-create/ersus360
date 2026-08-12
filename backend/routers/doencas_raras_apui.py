"""
Router: /api/doencas-raras-apui — ERSUS 360
Dados reais pendentes de integração — situacao_dado = nao_disponivel.
Nenhum valor é simulado ou estimado.
"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from typing import Optional
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/doencas-raras-apui", tags=["doencas_raras_apui"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": [],
        "nota": "Integração pendente. Configure no Railway.",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


@router.get("/doencas")
async def doencas():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": [],
        "nota": "Integração pendente. Configure no Railway.",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


@router.get("/judicializacao")
async def judicializacao():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": [],
        "nota": "Integração pendente. Configure no Railway.",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


@router.get("/historico")
async def historico():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": [],
        "nota": "Integração pendente. Configure no Railway.",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


@router.get("/indicadores")
async def indicadores():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": [],
        "nota": "Integração pendente. Configure no Railway.",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }

