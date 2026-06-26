"""
Router: /api/municipio — Módulo 1: Cadastro do Município
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from database import get_db
from models import Municipio, ContaBancaria
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/municipio", tags=["Município"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class MunicipioUpdate(BaseModel):
    nome: Optional[str] = None
    cnpj_fundo: Optional[str] = None
    secretario: Optional[str] = None
    prefeito: Optional[str] = None
    gestor_fundo: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    populacao: Optional[int] = None


class MunicipioOut(BaseModel):
    id: int
    nome: str
    uf: str
    codigo_ibge: str
    cnpj_fundo: Optional[str]
    secretario: Optional[str]
    prefeito: Optional[str]
    gestor_fundo: Optional[str]
    telefone: Optional[str]
    email: Optional[str]
    populacao: Optional[int]

    class Config:
        from_attributes = True


class ContaBancariaIn(BaseModel):
    banco: str
    agencia: str
    conta: str
    digito: Optional[str] = None
    tipo: str
    fonte_recurso: Optional[str] = None
    ativa: bool = True


class ContaBancariaOut(ContaBancariaIn):
    id: int
    municipio_id: int

    class Config:
        from_attributes = True


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("", response_model=MunicipioOut)
async def get_municipio(
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    res = await db.execute(select(Municipio).limit(1))
    mun = res.scalar_one_or_none()
    if not mun:
        raise HTTPException(status_code=404, detail="Município não cadastrado")
    return mun


@router.put("", response_model=MunicipioOut)
async def update_municipio(
    dados: MunicipioUpdate,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    res = await db.execute(select(Municipio).limit(1))
    mun = res.scalar_one_or_none()
    if not mun:
        raise HTTPException(status_code=404, detail="Município não cadastrado")

    for campo, valor in dados.model_dump(exclude_none=True).items():
        setattr(mun, campo, valor)

    await db.commit()
    await db.refresh(mun)
    return mun


@router.get("/contas", response_model=list[ContaBancariaOut])
async def listar_contas(
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    res_mun = await db.execute(select(Municipio).limit(1))
    mun = res_mun.scalar_one_or_none()
    if not mun:
        return []
    res = await db.execute(
        select(ContaBancaria)
        .where(ContaBancaria.municipio_id == mun.id)
        .order_by(ContaBancaria.tipo)
    )
    return res.scalars().all()


@router.post("/contas", response_model=ContaBancariaOut, status_code=201)
async def criar_conta(
    dados: ContaBancariaIn,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    res_mun = await db.execute(select(Municipio).limit(1))
    mun = res_mun.scalar_one_or_none()
    if not mun:
        raise HTTPException(status_code=404, detail="Município não cadastrado")

    conta = ContaBancaria(municipio_id=mun.id, **dados.model_dump())
    db.add(conta)
    await db.commit()
    await db.refresh(conta)
    return conta


@router.put("/contas/{conta_id}", response_model=ContaBancariaOut)
async def atualizar_conta(
    conta_id: int,
    dados: ContaBancariaIn,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    res = await db.execute(select(ContaBancaria).where(ContaBancaria.id == conta_id))
    conta = res.scalar_one_or_none()
    if not conta:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    for campo, valor in dados.model_dump().items():
        setattr(conta, campo, valor)
    await db.commit()
    await db.refresh(conta)
    return conta


@router.delete("/contas/{conta_id}")
async def remover_conta(
    conta_id: int,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    res = await db.execute(select(ContaBancaria).where(ContaBancaria.id == conta_id))
    conta = res.scalar_one_or_none()
    if not conta:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    await db.delete(conta)
    await db.commit()
    return {"ok": True}
