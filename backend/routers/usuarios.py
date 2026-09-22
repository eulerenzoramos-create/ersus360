"""
Router: /api/usuarios — Módulo 13: Perfis de Acesso (multi-tenant)
Gestão dos usuários DO MUNICÍPIO DA SESSÃO. Cadastro entre municípios e
autorizações multi-município ficam em /api/admin-geral.
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime

from database import get_db
from models.usuario import Usuario, Perfil
from routers.auth import UserOut, PERFIS_ADMIN_MUNICIPAL
from tenancy.auditoria import registrar_auditoria
from tenancy.escopo import SessaoMunicipal, garantir_do_municipio

router = APIRouter(prefix="/api/usuarios", tags=["Usuários"])
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── Schemas ───────────────────────────────────────────────────────────────────

class UsuarioIn(BaseModel):
    nome: str
    email: str
    senha: str = Field(min_length=8)
    perfil: Perfil = Perfil.CONSULTA
    ativo: bool = True


class UsuarioUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[str] = None
    perfil: Optional[Perfil] = None
    ativo: Optional[bool] = None


class SenhaUpdate(BaseModel):
    senha_nova: str = Field(min_length=8)


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

_PERFIS_GLOBAIS = {Perfil.ADMINISTRADOR_GERAL, Perfil.SUPERADMIN}


def _somente_admin(current: UserOut):
    if not (current.administrador_geral or current.role in PERFIS_ADMIN_MUNICIPAL):
        raise HTTPException(403, "Acesso restrito ao administrador")


def _sem_perfil_global(perfil: Optional[Perfil]):
    if perfil in _PERFIS_GLOBAIS:
        raise HTTPException(422, "Perfil global só pode ser definido pelo administrador-geral")


async def _usuario_do_municipio(db: AsyncSession, current: UserOut, usuario_id: int) -> Usuario:
    u = await db.get(Usuario, usuario_id)
    return await garantir_do_municipio(db, current, u, "usuarios", usuario_id)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("", response_model=list[UsuarioOut])
async def listar_usuarios(
    current: SessaoMunicipal,
    q: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    _somente_admin(current)
    stmt = select(Usuario).where(Usuario.municipio_id == current.municipio_id).order_by(Usuario.nome)
    if q:
        stmt = stmt.where(Usuario.nome.ilike(f"%{q}%") | Usuario.email.ilike(f"%{q}%"))
    res = await db.execute(stmt)
    return res.scalars().all()


@router.get("/{usuario_id}", response_model=UsuarioOut)
async def get_usuario(
    usuario_id: int,
    current: SessaoMunicipal,
    db: AsyncSession = Depends(get_db),
):
    _somente_admin(current)
    return await _usuario_do_municipio(db, current, usuario_id)


@router.post("", response_model=UsuarioOut, status_code=201)
async def criar_usuario(
    dados: UsuarioIn,
    current: SessaoMunicipal,
    db: AsyncSession = Depends(get_db),
):
    _somente_admin(current)
    _sem_perfil_global(dados.perfil)
    email = dados.email.strip().lower()

    # verificar duplicidade (e-mail é login único em todo o sistema)
    res_dup = await db.execute(select(Usuario).where(Usuario.email == email))
    if res_dup.scalar_one_or_none():
        raise HTTPException(400, "E-mail já cadastrado")

    usuario = Usuario(
        municipio_id=current.municipio_id,
        nome=dados.nome,
        email=email,
        senha_hash=pwd_ctx.hash(dados.senha),
        perfil=dados.perfil,
        ativo=dados.ativo,
    )
    db.add(usuario)
    await db.commit()
    await db.refresh(usuario)
    await registrar_auditoria(db, "USUARIO_CRIADO", usuario=current, tabela="usuarios",
                              registro_id=usuario.id, detalhe=f"{email} perfil={usuario.perfil.value}")
    return usuario


@router.put("/{usuario_id}", response_model=UsuarioOut)
async def atualizar_usuario(
    usuario_id: int,
    dados: UsuarioUpdate,
    current: SessaoMunicipal,
    db: AsyncSession = Depends(get_db),
):
    _somente_admin(current)
    _sem_perfil_global(dados.perfil)
    u = await _usuario_do_municipio(db, current, usuario_id)
    alteracoes = dados.model_dump(exclude_none=True)
    for campo, valor in alteracoes.items():
        setattr(u, campo, valor)
    await db.commit()
    await db.refresh(u)
    await registrar_auditoria(db, "USUARIO_ATUALIZADO", usuario=current, tabela="usuarios",
                              registro_id=u.id, detalhe=", ".join(sorted(alteracoes)))
    return u


@router.put("/{usuario_id}/senha")
async def alterar_senha(
    usuario_id: int,
    dados: SenhaUpdate,
    current: SessaoMunicipal,
    db: AsyncSession = Depends(get_db),
):
    _somente_admin(current)
    u = await _usuario_do_municipio(db, current, usuario_id)
    u.senha_hash = pwd_ctx.hash(dados.senha_nova)
    await db.commit()
    await registrar_auditoria(db, "USUARIO_SENHA", usuario=current, tabela="usuarios", registro_id=u.id)
    return {"ok": True}


@router.delete("/{usuario_id}")
async def desativar_usuario(
    usuario_id: int,
    current: SessaoMunicipal,
    db: AsyncSession = Depends(get_db),
):
    _somente_admin(current)
    u = await _usuario_do_municipio(db, current, usuario_id)
    u.ativo = False
    await db.commit()
    await registrar_auditoria(db, "USUARIO_DESATIVADO", usuario=current, tabela="usuarios", registro_id=u.id)
    return {"ok": True, "mensagem": "Usuário desativado (não excluído para preservar auditoria)"}
