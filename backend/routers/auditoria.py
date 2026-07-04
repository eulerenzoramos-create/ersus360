"""Router: /api/auditoria — Logs de auditoria do sistema"""
from __future__ import annotations
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime
from pydantic import BaseModel

from database import get_db
from models.usuario import AuditLog
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/auditoria", tags=["Auditoria"])


class LogOut(BaseModel):
    id: int
    usuario_id: Optional[int]
    usuario_nome: Optional[str] = "Sistema"
    ip_address: Optional[str] = None
    acao: str
    modulo: Optional[str] = None
    descricao: Optional[str] = None
    nivel: Optional[str] = "INFO"
    criado_em: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_audit(cls, a: AuditLog) -> "LogOut":
        return cls(
            id=a.id,
            usuario_id=a.usuario_id,
            usuario_nome=str(a.usuario_id) if a.usuario_id else "Sistema",
            ip_address=a.ip_origem,
            acao=a.acao,
            modulo=a.tabela,
            descricao=a.detalhe,
            nivel="AUDIT" if a.acao in ("CREATE", "UPDATE", "DELETE") else "INFO",
            criado_em=a.criado_em,
        )


def _somente_admin(current: UserOut):
    from fastapi import HTTPException
    if current.role not in ("admin", "superadmin"):
        raise HTTPException(403, "Acesso restrito ao administrador")


@router.get("/logs", response_model=list[LogOut])
async def listar_logs(
    db: AsyncSession = Depends(get_db),
    current: UserOut = Depends(get_current_user),
    limite: int = Query(100, le=500),
    nivel: Optional[str] = Query(None),
    modulo: Optional[str] = Query(None),
):
    _somente_admin(current)
    q = select(AuditLog).order_by(desc(AuditLog.criado_em)).limit(limite)
    res = await db.execute(q)
    logs = res.scalars().all()
    resultado = [LogOut.from_audit(l) for l in logs]
    if nivel:
        resultado = [l for l in resultado if l.nivel == nivel]
    if modulo:
        resultado = [l for l in resultado if l.modulo == modulo]
    return resultado


@router.get("/logs/{log_id}", response_model=LogOut)
async def detalhar_log(
    log_id: int,
    db: AsyncSession = Depends(get_db),
    current: UserOut = Depends(get_current_user),
):
    _somente_admin(current)
    res = await db.execute(select(AuditLog).where(AuditLog.id == log_id))
    log = res.scalar_one_or_none()
    if not log:
        from fastapi import HTTPException
        raise HTTPException(404, "Log não encontrado")
    return LogOut.from_audit(log)
