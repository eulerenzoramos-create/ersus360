"""PecAuditService — trilha de auditoria de tudo que a integração PEC faz.

Reaproveita a tabela audit_log já existente (models/usuario.py::AuditLog) em vez de
criar uma tabela paralela, mantendo uma única trilha de auditoria no sistema.
"""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from models.usuario import AuditLog


class PecAuditService:
    async def registrar(
        self,
        db: AsyncSession,
        *,
        usuario_id: int | None,
        acao: str,
        tabela: str,
        registro_id: int | None,
        detalhe: str,
        ip_origem: str | None = None,
    ) -> AuditLog:
        entrada = AuditLog(
            usuario_id=usuario_id,
            acao=acao,
            tabela=tabela,
            registro_id=registro_id,
            detalhe=detalhe,
            ip_origem=ip_origem,
        )
        db.add(entrada)
        await db.flush()
        return entrada
