"""Model: Documento (armazenamento MinIO)"""
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class Documento(Base):
    __tablename__ = "documentos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    municipio_id: Mapped[int] = mapped_column(ForeignKey("municipios.id"), index=True)
    convenio_id: Mapped[int | None] = mapped_column(ForeignKey("convenios.id"), nullable=True)
    titulo: Mapped[str] = mapped_column(String(255))
    tipo: Mapped[str] = mapped_column(String(50))     # Portaria, Ofício, Extrato, NF, Foto...
    arquivo: Mapped[str] = mapped_column(String(500)) # path MinIO: bucket/folder/uuid.ext
    tamanho_kb: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    uploader_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    municipio: Mapped["Municipio"] = relationship(back_populates="documentos")  # type: ignore
    convenio: Mapped["Convenio | None"] = relationship(back_populates="documentos")  # type: ignore
