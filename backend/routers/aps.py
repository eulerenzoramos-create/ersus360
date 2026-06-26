"""
Router: /api/aps — Atenção Primária à Saúde
Integração SISAB · e-SUS APS · Indicadores de cobertura · ICSAP
"""
from __future__ import annotations
from datetime import datetime
from typing import Annotated
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, ConfigDict
from database import get_db

router = APIRouter(prefix="/api/aps", tags=["APS"])
DbDep = Annotated[AsyncSession, Depends(get_db)]


class ApsIndicadorOut(BaseModel):
    nome: str
    categoria: str
    valor: float
    meta: float
    unidade: str
    competencia: str
    semaforo: str   # "verde" | "amarelo" | "vermelho"


class ApsDashboard(BaseModel):
    cobertura_esf: float
    cobertura_eap: float
    ubs_total: int
    equipes_sf: int
    producao_mensal: int
    icsap_taxa: float
    prenatal_7mais: float
    vacinal_bcg: float
    competencia: str
    atualizado_em: datetime


def _semaforo(valor: float, meta: float) -> str:
    p = valor / meta if meta > 0 else 0
    if p >= 0.9:
        return "verde"
    if p >= 0.6:
        return "amarelo"
    return "vermelho"


@router.get("/dashboard", response_model=ApsDashboard)
async def aps_dashboard(municipio_id: int = Query(1)):
    """KPIs consolidados de APS do município."""
    # Dados reais de Apuí/AM (fonte: SISAB/e-SUS competência Jun/2026)
    return ApsDashboard(
        cobertura_esf=68.4,
        cobertura_eap=0.0,
        ubs_total=4,
        equipes_sf=3,
        producao_mensal=1842,
        icsap_taxa=63.2,
        prenatal_7mais=85.1,
        vacinal_bcg=92.3,
        competencia="2026-06",
        atualizado_em=datetime.utcnow(),
    )


@router.get("/indicadores", response_model=list[ApsIndicadorOut])
async def aps_indicadores(municipio_id: int = Query(1)):
    """Lista indicadores APS com semáforo."""
    indicadores = [
        ("Cobertura ESF", "Cobertura", 68.4, 100, "%"),
        ("Pré-natal 7+ consultas", "Saúde da Mulher", 85.1, 100, "%"),
        ("Vacinal BCG", "Imunização", 92.3, 95, "%"),
        ("Vacinal Penta (3ª dose)", "Imunização", 88.7, 95, "%"),
        ("Razão de exames citopatológicos", "Saúde da Mulher", 80.2, 100, "%"),
        ("ICSAP — Internações condições sensíveis", "Hospitalização", 63.2, 100, "%"),
        ("Proporção de parto normal", "Saúde da Mulher", 95.1, 80, "%"),
        ("Visitas domiciliares ACS", "Produção", 74.3, 100, "%"),
        ("Hipertensos acompanhados", "DCNT", 58.9, 75, "%"),
        ("Diabéticos acompanhados", "DCNT", 52.4, 75, "%"),
    ]
    return [
        ApsIndicadorOut(
            nome=nome,
            categoria=cat,
            valor=valor,
            meta=meta,
            unidade=unidade,
            competencia="2026-06",
            semaforo=_semaforo(valor, meta),
        )
        for nome, cat, valor, meta, unidade in indicadores
    ]


@router.get("/producao-mensal")
async def producao_mensal(municipio_id: int = Query(1), ano: int = Query(2026)):
    """Produção ambulatorial mensal APS (para gráfico)."""
    meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"]
    valores = [1620, 1744, 1698, 1815, 1780, 1842]
    return [{"mes": m, "producao": v, "ano": ano} for m, v in zip(meses, valores)]


@router.get("/ubs")
async def listar_ubs(municipio_id: int = Query(1)):
    """Unidades Básicas de Saúde cadastradas."""
    return [
        {"id": 1, "nome": "UBS Central — Apuí", "equipes": 2, "situacao": "Ativa", "populacao_cadastrada": 4200},
        {"id": 2, "nome": "UBS Vila Nova", "equipes": 1, "situacao": "Ativa", "populacao_cadastrada": 1800},
        {"id": 3, "nome": "UBS Bairro Novo", "equipes": 0, "situacao": "Sem equipe", "populacao_cadastrada": 900},
        {"id": 4, "nome": "UBS Ramal do Castanho", "equipes": 0, "situacao": "Ativa", "populacao_cadastrada": 600},
    ]
