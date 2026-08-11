"""
Model: CredencialMunicipio
Armazena referências às credenciais de acesso às fontes oficiais por município.
NUNCA armazena senhas em texto claro — apenas referências a variáveis de ambiente
ou indicadores de que a credencial está configurada.
"""
from __future__ import annotations
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Boolean, Text, Index
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class CredencialMunicipio(Base):
    """
    Registro de qual fonte está configurada para qual município.
    A senha real deve estar no Railway (env var) ou cofre seguro.
    Este model registra apenas: município, fonte, se está configurada e quando foi verificada.
    """
    __tablename__ = "credenciais_municipio"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    municipio_ibge: Mapped[str] = mapped_column(String(7), index=True)
    municipio_nome: Mapped[str] = mapped_column(String(100))

    # Sistema
    fonte_sistema:  Mapped[str] = mapped_column(String(50))   # FonteSistema
    env_var_cpf:    Mapped[str | None] = mapped_column(String(100), nullable=True)    # nome da env var
    env_var_senha:  Mapped[str | None] = mapped_column(String(100), nullable=True)
    env_var_token:  Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Situação
    configurada:    Mapped[bool] = mapped_column(Boolean, default=False)
    ultima_verificacao: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    ultimo_sucesso: Mapped[datetime | None]  = mapped_column(DateTime, nullable=True)
    ultimo_erro:    Mapped[str | None]       = mapped_column(Text, nullable=True)

    # Responsável
    responsavel_nome:  Mapped[str | None] = mapped_column(String(150), nullable=True)
    responsavel_cargo: Mapped[str | None] = mapped_column(String(100), nullable=True)
    responsavel_cpf_parcial: Mapped[str | None] = mapped_column(String(7), nullable=True)  # apenas XXX.XXX

    # Auditoria
    criado_em:  Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    atualizado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_cred_municipio_fonte", "municipio_ibge", "fonte_sistema"),
    )
