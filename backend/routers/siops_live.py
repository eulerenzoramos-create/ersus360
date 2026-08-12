"""
Router: /api/siops-live — ERSUS 360
Dados reais pendentes de integração — situacao_dado = nao_disponivel.
Nenhum valor é simulado ou estimado.
"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from typing import Optional
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/siops-live", tags=["siops_live"])


@router.get("/status")
async def status():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Integração pendente. Configure no Railway.",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


@router.post("/sincronizar")
async def sincronizar():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Integração pendente. Configure no Railway.",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Integração pendente. Configure no Railway.",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


@router.get("/despesas/por-fonte")
async def despesas_por_fonte():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Integração pendente. Configure no Railway.",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


@router.get("/despesas/por-subfuncao")
async def despesas_por_subfuncao():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Integração pendente. Configure no Railway.",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


@router.get("/despesas/por-natureza")
async def despesas_por_natureza():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Integração pendente. Configure no Railway.",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


@router.post("/override")
async def salvar_override():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Integração pendente. Configure no Railway.",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


@router.get("/overrides")
async def listar_overrides():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Integração pendente. Configure no Railway.",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


@router.delete("/override/{categoria}/{chave}/{campo}")
async def deletar_override():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Integração pendente. Configure no Railway.",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


@router.get("/exportar-pdf")
async def exportar_pdf():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Integração pendente. Configure no Railway.",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }

