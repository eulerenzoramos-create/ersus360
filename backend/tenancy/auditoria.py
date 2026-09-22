"""Registro de auditoria sempre vinculado ao município (tenant) da ação."""
from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from sqlalchemy.ext.asyncio import AsyncSession

from models.usuario import AuditLog

if TYPE_CHECKING:
    from routers.auth import UserOut

logger = logging.getLogger("ersus.auditoria")


async def registrar_auditoria(
    db: AsyncSession,
    acao: str,
    *,
    usuario: "UserOut | None" = None,
    login: str | None = None,
    municipio_id: int | None = None,
    tabela: str | None = None,
    registro_id: int | None = None,
    detalhe: str | None = None,
    ip: str | None = None,
) -> None:
    """Grava e confirma um registro de auditoria. Falhas de gravação são logadas,
    nunca propagadas — a auditoria não pode derrubar a requisição principal."""
    if usuario is not None:
        login = login or usuario.username
        if municipio_id is None:
            municipio_id = usuario.municipio_id
    try:
        db.add(AuditLog(
            usuario_id=getattr(usuario, "usuario_id", None),
            usuario_login=login,
            municipio_id=municipio_id,
            acao=acao[:50],
            tabela=tabela,
            registro_id=registro_id,
            detalhe=(detalhe or "")[:4000] or None,
            ip_origem=(ip or "")[:45] or None,
        ))
        await db.commit()
    except Exception as exc:
        await db.rollback()
        logger.error("Falha ao gravar auditoria %s (%s): %s", acao, login, exc)
    logger.info("AUDIT %s login=%s municipio=%s %s", acao, login, municipio_id, detalhe or "")
