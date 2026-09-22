"""Router: /api/convenios — CRUD completo (sempre do município da sessão)"""
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Convenio, Repasse, Cronograma, Alerta
from schemas.convenio import ConvenioCreate, ConvenioUpdate, ConvenioOut
from tenancy.escopo import MunicipioDaSessao, SessaoMunicipal, garantir_do_municipio

router = APIRouter(prefix="/api/convenios", tags=["Convênios"])
DbDep = Annotated[AsyncSession, Depends(get_db)]


@router.get("", response_model=list[ConvenioOut])
async def listar_convenios(
    db: DbDep,
    municipio_id: MunicipioDaSessao,
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


async def convenio_da_sessao(db: AsyncSession, current, id: int) -> Convenio:
    result = await db.execute(
        select(Convenio)
        .where(Convenio.id == id)
        .options(selectinload(Convenio.bloco_pacto))
    )
    return await garantir_do_municipio(db, current, result.scalar_one_or_none(), "convenios", id)


@router.get("/{id}", response_model=ConvenioOut)
async def get_convenio(id: int, db: DbDep, current: SessaoMunicipal):
    return await convenio_da_sessao(db, current, id)


@router.post("", response_model=ConvenioOut, status_code=201)
async def criar_convenio(body: ConvenioCreate, db: DbDep, municipio_id: MunicipioDaSessao):
    conv = Convenio(**body.model_dump(), municipio_id=municipio_id)
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return conv


@router.put("/{id}", response_model=ConvenioOut)
async def atualizar_convenio(id: int, body: ConvenioUpdate, db: DbDep, current: SessaoMunicipal):
    conv = await convenio_da_sessao(db, current, id)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(conv, k, v)
    await db.commit()
    await db.refresh(conv)
    return conv


@router.delete("/{id}", status_code=204)
async def deletar_convenio(id: int, db: DbDep, current: SessaoMunicipal):
    conv = await convenio_da_sessao(db, current, id)
    # Cascade deleta repasses, cronogramas e alertas via ORM
    await db.delete(conv)
    await db.commit()
