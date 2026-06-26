"""Model: Repasse financeiro"""
from datetime import datetime
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from database import Base


class TipoRepasse(str, enum.Enum):
    CUSTEIO = "Custeio e investimento"
    MAC = "MAC"
    ATENCAO_BASICA = "Atenção Básica"
    VIGILANCIA = "Vigilância em Saúde"
    FARMACIA = "Farmácia"
    MUNICIPAL = "Municipal"
    FEDERAL = "Federal"
    ESTADUAL = "Estadual"


class Repasse(Base):
    __tablename__ = "repasses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    convenio_id: Mapped[int] = mapped_column(ForeignKey("convenios.id"), index=True)

    competencia: Mapped[str] = mapped_column(String(7))   # "2026-06"
    mes: Mapped[int] = mapped_column(Integer)
    ano: Mapped[int] = mapped_column(Integer)
    tipo_repasse: Mapped[str] = mapped_column(String(80), default="Federal")
    novos_repasses: Mapped[int] = mapped_column(Integer, default=0)

    valor_previsto: Mapped[float] = mapped_column(Float, default=0.0)
    valor_realizado: Mapped[float] = mapped_column(Float, default=0.0)
    data_repasse: Mapped[str | None] = mapped_column(String(10), nullable=True)

    # Origem: 'manual' | 'fns_sync'
    origem: Mapped[str] = mapped_column(String(20), default="manual")

    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    convenio: Mapped["Convenio"] = relationship(back_populates="repasses")  # type: ignore

    def __repr__(self) -> str:
        return f"<Repasse {self.competencia} conv={self.convenio_id} R${self.valor_realizado:,.2f}>"
