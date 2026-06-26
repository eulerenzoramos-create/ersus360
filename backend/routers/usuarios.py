"""
Router: /api/usuarios — Módulo 13: Perfis de Acesso
Substitui o USERS_DB hardcoded do auth.py por usuários reais no banco.
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime

from database import get_db
from models import Municipio
from models.usuario import Usuario, Perfil
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/usuarios", tags=["Usuários"])
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── Schemas ───────────────────────────────────────────────────────────────────

class UsuarioIn(BaseModel):
    nome: str
    email: str
    senha: str
    perfil: Perfil = Perfil.CONSULTA
    ativo: bool = True


class UsuarioUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[str] = None
    perfil: Optional[Perfil] = None
    ativo: Optional[bool] = None


class SenhaUpdate(BaseModel):
    senha_nova: str


class UsuarioOut(BaseModel):
    id: int
    municipio_id: int
    nome: str
    email: str
    perfil: Perfil
    ativo: bool
    ultimo_acesso: Optional[datetime]
    criado_em: datetime

    class Config:
        from_attributes = True


# ── Helpers ───────────────────────────────────────────────────────────────────

def _somente_admin(current: UserOut):
    if current.role != "admin":
        raise HTTPException(403, "Acesso restrito ao administrador")


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("", response_model=list[UsuarioOut])
async def listar_usuarios(
    db: AsyncSession = Depends(get_db),
    current: UserOut = Depends(get_current_user),
):
    _somente_admin(current)
    res_mun = await db.execute(select(Municipio).limit(1))
    mun = res_mun.scalar_one_or_none()
    if not mun:
        return []
    res = await db.execute(
        select(Usuario)
        .where(Usuario.municipio_id == mun.id)
        .order_by(Usuario.nome)
    )
    return res.scalars().all()


@router.get("/{usuario_id}", response_model=UsuarioOut)
async def get_usuario(
    usuario_id: int,
    db: AsyncSession = Depends(get_db),
    current: UserOut = Depends(get_current_user),
):
    _somente_admin(current)
    res = await db.execute(select(Usuario).where(Usuario.id == usuario_id))
    u = res.scalar_one_or_none()
    if not u:
        raise HTTPException(404, "Usuário não encontrado")
    return u


@router.post("", response_model=UsuarioOut, status_code=201)
async def criar_usuario(
    dados: UsuarioIn,
    db: AsyncSession = Depends(get_db),
    current: UserOut = Depends(get_current_user),
):
    _somente_admin(current)
    res_mun = await db.execute(select(Municipio).limit(1))
    mun = res_mun.scalar_one_or_none()
    if not mun:
        raise HTTPException(404, "Município não cadastrado")

    # verificar duplicidade
    res_dup = await db.execute(select(Usuario).where(Usuario.email == dados.email))
    if res_dup.scalar_one_or_none():
        raise HTTPException(400, "E-mail já cadastrado")

    usuario = Usuario(
        municipio_id=mun.id,
        nome=dados.nome,
        email=dados.email,
        senha_hash=pwd_ctx.hash(dados.senha),
        perfil=dados.perfil,
        ativo=dados.ativo,
    )
    db.add(usuario)
    await db.commit()
    await db.refresh(usuario)
    return usuario


@router.put("/{usuario_id}", response_model=UsuarioOut)
async def atualizar_usuario(
    usuario_id: int,
    dados: UsuarioUpdate,
    db: AsyncSession = Depends(get_db),
    current: UserOut = Depends(get_current_user),
):
    _somente_admin(current)
    res = await db.execute(select(Usuario).where(Usuario.id == usuario_id))
    u = res.scalar_one_or_none()
    if not u:
        raise HTTPException(404, "Usuário não encontrado")
    for campo, valor in dados.model_dump(exclude_none=True).items():
        setattr(u, campo, valor)
    await db.commit()
    await db.refresh(u)
    return u


@router.put("/{usuario_id}/senha")
async def alterar_senha(
    usuario_id: int,
    dados: SenhaUpdate,
    db: AsyncSession = Depends(get_db),
    current: UserOut = Depends(get_current_user),
):
    _somente_admin(current)
    res = await db.execute(select(Usuario).where(Usuario.id == usuario_id))
    u = res.scalar_one_or_none()
    if not u:
        raise HTTPException(404, "Usuário não encontrado")
    u.senha_hash = pwd_ctx.hash(dados.senha_nova)
    await db.commit()
    return {"ok": True}


@router.delete("/{usuario_id}")
async def desativar_usuario(
    usuario_id: int,
    db: AsyncSession = Depends(get_db),
    current: UserOut = Depends(get_current_user),
):
    _somente_admin(current)
    res = await db.execute(select(Usuario).where(Usuario.id == usuario_id))
    u = res.scalar_one_or_none()
    if not u:
        raise HTTPException(404, "Usuário não encontrado")
    u.ativo = False
    await db.commit()
    return {"ok": True, "mensagem": "Usuário desativado (não excluído para preservar auditoria)"}
