"""Model: EmailDiarioLog — histórico de envios do agente de portarias MS"""
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import String, Integer, DateTime, Text, Boolean, Enum
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class StatusEnvio(str, PyEnum):
    PENDENTE   = "pendente"
    ENVIADO    = "enviado"
    FALHA      = "falha"
    PAUSADO    = "pausado"
    REENVIADO  = "reenviado"


class EmailDiarioLog(Base):
    __tablename__ = "email_diario_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    data_referencia: Mapped[str] = mapped_column(String(10), index=True)          # "2026-08-27"
    destinatario: Mapped[str] = mapped_column(String(200))
    assunto: Mapped[str] = mapped_column(String(500))
    corpo_html: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[StatusEnvio] = mapped_column(Enum(StatusEnvio), default=StatusEnvio.PENDENTE)
    tentativas: Mapped[int] = mapped_column(Integer, default=0)
    erro: Mapped[str | None] = mapped_column(Text, nullable=True)
    qtd_portarias: Mapped[int] = mapped_column(Integer, default=0)
    qtd_informes: Mapped[int] = mapped_column(Integer, default=0)
    portarias_ids: Mapped[str | None] = mapped_column(Text, nullable=True)        # JSON list de ids DOU
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    enviado_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    pausado: Mapped[bool] = mapped_column(Boolean, default=False)
