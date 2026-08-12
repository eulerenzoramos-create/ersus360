"""Router: /api/repasses — listagem e totais de repasses FNS"""
from __future__ import annotations
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Repasse, Convenio
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/repasses", tags=["Repasses"])

DbDep = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[UserOut, Depends(get_current_user)]


class RepasseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    convenio_id: int
    competencia: str
    mes: int
    ano: int
    tipo_repasse: str
    valor_previsto: float
    valor_realizado: float
    data_repasse: Optional[str] = None
    origem: str
    novos_repasses: int = 0


class RepasseMensalOut(BaseModel):
    mes: int
    ano: int
    competencia: str
    total_previsto: float
    total_realizado: float
    novos_repasses: int = 0
    total_repasses: int


@router.get("", response_model=list[RepasseOut])
async def listar_repasses(
    db: DbDep,
    _: CurrentUser,
    municipio_id: int = Query(1),
    convenio_id: Optional[int] = Query(None),
    ano: Optional[int] = Query(None),
):
    """Lista todos os repasses do banco para o município."""
    stmt = (
        select(Repasse)
        .join(Convenio, Repasse.convenio_id == Convenio.id)
        .where(Convenio.municipio_id == municipio_id)
        .order_by(Repasse.competencia.desc(), Repasse.valor_realizado.desc())
    )
    if convenio_id:
        stmt = stmt.where(Repasse.convenio_id == convenio_id)
    if ano:
        stmt = stmt.where(Repasse.ano == ano)

    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/mensais", response_model=list[RepasseMensalOut])
async def repasses_mensais(
    db: DbDep,
    _: CurrentUser,
    ano: int = Query(2026),
    municipio_id: int = Query(1),
):
    """Totais mensais de repasses agrupados por competência."""
    stmt = (
        select(
            Repasse.mes,
            Repasse.ano,
            Repasse.competencia,
            func.sum(Repasse.valor_previsto).label("valor_previsto"),
            func.sum(Repasse.valor_realizado).label("valor_realizado"),
            func.count(Repasse.id).label("total_repasses"),
        )
        .join(Convenio, Repasse.convenio_id == Convenio.id)
        .where(Convenio.municipio_id == municipio_id, Repasse.ano == ano)
        .group_by(Repasse.mes, Repasse.ano, Repasse.competencia)
        .order_by(Repasse.mes)
    )
    result = await db.execute(stmt)
    rows = result.all()
    return [
        RepasseMensalOut(
            mes=r.mes,
            ano=r.ano,
            competencia=r.competencia,
            total_previsto=float(r.valor_previsto or 0),
            total_realizado=float(r.valor_realizado or 0),
            total_repasses=r.total_repasses,
        )
        for r in rows
    ]


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Use GET /api/repasses para listar repasses reais do banco.",
    }
