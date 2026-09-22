"""Model: registro das execuções de backup, verificação e restauração."""
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class BackupExecucao(Base):
    __tablename__ = "backup_execucoes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tipo: Mapped[str] = mapped_column(String(20))            # "geral" | "municipio"
    # município do backup (None = backup geral de todo o banco)
    municipio_id: Mapped[int | None] = mapped_column(ForeignKey("municipios.id"), nullable=True, index=True)
    origem: Mapped[str] = mapped_column(String(20), default="agendado")  # agendado | manual
    status: Mapped[str] = mapped_column(String(20), default="executando")  # executando|ok|erro|expirado
    arquivo: Mapped[str | None] = mapped_column(String(500), nullable=True)
    tamanho_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    sha256: Mapped[str | None] = mapped_column(String(64), nullable=True)
    total_registros: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_arquivos: Mapped[int | None] = mapped_column(Integer, nullable=True)
    erro: Mapped[str | None] = mapped_column(Text, nullable=True)
    solicitado_por: Mapped[str | None] = mapped_column(String(200), nullable=True)
    iniciado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    concluido_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    # teste de restauração (carga completa num banco temporário + conferência)
    verificado_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    verificacao_ok: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    verificacao_detalhe: Mapped[str | None] = mapped_column(Text, nullable=True)
    # restauração efetiva (somente backups de município)
    restaurado_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    restaurado_por: Mapped[str | None] = mapped_column(String(200), nullable=True)
