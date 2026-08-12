"""
Routers: Vigilância em Saúde · Transporte/TFD · Regulação
API indisponível → nao_disponivel. Nunca dados de agravos, veículos, TFD ou regulação inventados.
"""
from __future__ import annotations
from datetime import datetime
from typing import Annotated
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from database import get_db

DbDep = Annotated[AsyncSession, Depends(get_db)]

_NAO_DISP = {"situacao_dado": "nao_disponivel", "dados": None}

def _ts():
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S")

# ─── VIGILÂNCIA ──────────────────────────────────────────────────────────────

vigilancia_router = APIRouter(prefix="/api/vigilancia", tags=["Vigilância"])


class AgravoDado(BaseModel):
    agravo: str
    casos_confirmados: int
    casos_suspeitos: int
    obitos: int
    competencia: str
    semana_epidemiologica: int | None = None


@vigilancia_router.get("/dashboard")
async def vigilancia_dashboard(municipio_id: int = Query(1)):
    return {
        **_NAO_DISP,
        "ultima_atualizacao": _ts(),
        "nota": (
            "Dados de vigilância requerem integração com SINAN/GAL. "
            "Configure as credenciais no Railway. Nenhum valor de agravo, cobertura ou inspeção foi inventado."
        ),
    }


@vigilancia_router.get("/agravos")
async def listar_agravos(municipio_id: int = Query(1)):
    return {
        **_NAO_DISP,
        "ultima_atualizacao": _ts(),
        "nota": "Dados de agravos requerem integração com SINAN. Nenhum caso foi inventado.",
    }


@vigilancia_router.get("/vacinacao")
async def vacinacao(municipio_id: int = Query(1)):
    return {
        **_NAO_DISP,
        "ultima_atualizacao": _ts(),
        "nota": "Cobertura vacinal requer integração com SIPNI/PNI. Nenhum percentual foi inventado.",
    }


# ─── TRANSPORTE / TFD ────────────────────────────────────────────────────────

transporte_router = APIRouter(prefix="/api/transporte", tags=["Transporte/TFD"])


class VeiculoSaude(BaseModel):
    id: int
    placa: str
    modelo: str
    ano: int
    tipo: str
    situacao: str
    km_atual: int
    proxima_revisao_km: int
    motorista: str | None = None


@transporte_router.get("/dashboard")
async def transporte_dashboard(municipio_id: int = Query(1)):
    return {
        **_NAO_DISP,
        "ultima_atualizacao": _ts(),
        "nota": (
            "Dados de frota e TFD requerem integração com sistema de gestão de frotas local. "
            "Nenhum veículo, valor de diária ou km foi inventado."
        ),
    }


@transporte_router.get("/veiculos")
async def listar_veiculos(municipio_id: int = Query(1)):
    return {
        **_NAO_DISP,
        "ultima_atualizacao": _ts(),
        "nota": "Frota requer cadastro no sistema local. Nenhuma placa ou veículo foi inventado.",
    }


@transporte_router.get("/tfd")
async def listar_tfd(municipio_id: int = Query(1), mes: int = Query(6), ano: int = Query(2026)):
    return {
        **_NAO_DISP,
        "ultima_atualizacao": _ts(),
        "nota": "TFD requer integração com sistema de regulação local. Nenhum paciente ou custo foi inventado.",
    }


# ─── REGULAÇÃO ───────────────────────────────────────────────────────────────

regulacao_router = APIRouter(prefix="/api/regulacao", tags=["Regulação"])


@regulacao_router.get("/dashboard")
async def regulacao_dashboard(municipio_id: int = Query(1)):
    return {
        **_NAO_DISP,
        "ultima_atualizacao": _ts(),
        "nota": (
            "Dados de regulação requerem integração com SISREG ou sistema de regulação local. "
            "Nenhuma solicitação, autorização ou prazo foi inventado."
        ),
    }


@regulacao_router.get("/solicitacoes")
async def listar_solicitacoes(
    municipio_id: int = Query(1),
    status: str | None = Query(None),
):
    return {
        **_NAO_DISP,
        "ultima_atualizacao": _ts(),
        "nota": "Solicitações requerem integração com SISREG. Nenhuma solicitação foi inventada.",
    }
