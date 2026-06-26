"""Model: Alerta automático"""
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, Boolean, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from database import Base


class SeveridadeAlerta(str, enum.Enum):
    CRITICO = "critico"
    ATENCAO = "atencao"
    INFO = "info"


class Alerta(Base):
    __tablename__ = "alertas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    municipio_id: Mapped[int] = mapped_column(ForeignKey("municipios.id"), index=True)
    convenio_id: Mapped[int | None] = mapped_column(
        ForeignKey("convenios.id"), nullable=True
    )

    titulo: Mapped[str] = mapped_column(String(200))
    descricao: Mapped[str] = mapped_column(Text)
    modulo: Mapped[str] = mapped_column(String(50))   # "FNS", "APS", "Farmácia" ...
    severidade: Mapped[SeveridadeAlerta] = mapped_column(
        SAEnum(SeveridadeAlerta), default=SeveridadeAlerta.ATENCAO
    )

    resolvido: Mapped[bool] = mapped_column(Boolean, default=False)
    resolvido_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    municipio: Mapped["Municipio"] = relationship(back_populates="alertas")  # type: ignore
    convenio: Mapped["Convenio | None"] = relationship(back_populates="alertas")  # type: ignore
