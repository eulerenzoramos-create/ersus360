"""Router: /api/convenios — CRUD completo"""
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Convenio, Repasse, Cronograma, Alerta
from schemas.convenio import ConvenioCreate, ConvenioUpdate, ConvenioOut

router = APIRouter(prefix="/api/convenios", tags=["Convênios"])
DbDep = Annotated[AsyncSession, Depends(get_db)]


@router.get("", response_model=list[ConvenioOut])
async def listar_convenios(
    db: DbDep,
    municipio_id: int = Query(1),
    situacao: str | None = Query(None),
):
    stmt = (
        select(Convenio)
        .where(Convenio.municipio_id == municipio_id)
        .options(selectinload(Convenio.bloco_pacto))
        .order_by(Convenio.criado_em.desc())
    )
    if situacao:
        stmt = stmt.where(Convenio.situacao == situacao)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{id}", response_model=ConvenioOut)
async def get_convenio(id: int, db: DbDep):
    result = await db.execute(
        select(Convenio)
        .where(Convenio.id == id)
        .options(selectinload(Convenio.bloco_pacto))
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(404, "Convênio não encontrado")
    return conv


@router.post("", response_model=ConvenioOut, status_code=201)
async def criar_convenio(body: ConvenioCreate, db: DbDep):
    conv = Convenio(**body.model_dump())
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return conv


@router.put("/{id}", response_model=ConvenioOut)
async def atualizar_convenio(id: int, body: ConvenioUpdate, db: DbDep):
    result = await db.execute(select(Convenio).where(Convenio.id == id))
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(404, "Convênio não encontrado")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(conv, k, v)
    await db.commit()
    await db.refresh(conv)
    return conv


@router.delete("/{id}", status_code=204)
async def deletar_convenio(id: int, db: DbDep):
    result = await db.execute(select(Convenio).where(Convenio.id == id))
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(404, "Convênio não encontrado")
    # Cascade deleta repasses, cronogramas e alertas via ORM
    await db.delete(conv)
    await db.commit()
