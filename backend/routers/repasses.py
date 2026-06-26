"""Router: /api/repasses"""
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Repasse
from schemas.convenio import RepasseCreate, RepasseUpdate, RepasseOut, RepasseMensalOut

router = APIRouter(prefix="/api/repasses", tags=["Repasses"])
DbDep = Annotated[AsyncSession, Depends(get_db)]


@router.get("", response_model=list[RepasseOut])
async def listar_repasses(
    db: DbDep,
    municipio_id: int = Query(1),
    convenio_id: int | None = Query(None),
    competencia: str | None = Query(None),
):
    from models import Convenio
    stmt = (
        select(Repasse)
        .join(Convenio, Repasse.convenio_id == Convenio.id)
        .where(Convenio.municipio_id == municipio_id)
        .order_by(Repasse.ano.desc(), Repasse.mes.desc())
    )
    if convenio_id:
        stmt = stmt.where(Repasse.convenio_id == convenio_id)
    if competencia:
        stmt = stmt.where(Repasse.competencia == competencia)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/mensais", response_model=list[RepasseMensalOut])
async def repasses_mensais(
    db: DbDep,
    municipio_id: int = Query(1),
    ano: int = Query(2026),
):
    """Agrupado por mês — usado no gráfico de evolução mensal."""
    from models import Convenio
    stmt = (
        select(
            Repasse.competencia,
            Repasse.mes,
            Repasse.ano,
            func.sum(Repasse.valor_previsto).label("total_previsto"),
            func.sum(Repasse.valor_realizado).label("total_realizado"),
            func.sum(Repasse.novos_repasses).label("novos_repasses"),
        )
        .join(Convenio, Repasse.convenio_id == Convenio.id)
        .where(Convenio.municipio_id == municipio_id, Repasse.ano == ano)
        .group_by(Repasse.competencia, Repasse.mes, Repasse.ano)
        .order_by(Repasse.mes)
    )
    result = await db.execute(stmt)
    rows = result.all()
    return [
        RepasseMensalOut(
            competencia=r.competencia,
            mes=r.mes,
            ano=r.ano,
            total_previsto=r.total_previsto or 0.0,
            total_realizado=r.total_realizado or 0.0,
            novos_repasses=r.novos_repasses or 0,
        )
        for r in rows
    ]


@router.post("", response_model=RepasseOut, status_code=201)
async def criar_repasse(body: RepasseCreate, db: DbDep):
    rep = Repasse(**body.model_dump())
    db.add(rep)
    await db.commit()
    await db.refresh(rep)
    return rep


@router.put("/{id}", response_model=RepasseOut)
async def atualizar_repasse(id: int, body: RepasseUpdate, db: DbDep):
    result = await db.execute(select(Repasse).where(Repasse.id == id))
    rep = result.scalar_one_or_none()
    if not rep:
        raise HTTPException(404, "Repasse não encontrado")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(rep, k, v)
    await db.commit()
    await db.refresh(rep)
    return rep


@router.delete("/{id}", status_code=204)
async def deletar_repasse(id: int, db: DbDep):
    result = await db.execute(select(Repasse).where(Repasse.id == id))
    rep = result.scalar_one_or_none()
    if not rep:
        raise HTTPException(404, "Repasse não encontrado")
    await db.delete(rep)
    await db.commit()
