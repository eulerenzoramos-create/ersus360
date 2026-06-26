"""Model: Indicador PAS"""
from datetime import datetime
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from database import Base


class SituacaoIndicador(str, enum.Enum):
    ATINGIDO = "Atingido"
    EM_ANDAMENTO = "Em andamento"
    NAO_ATINGIDO = "Não atingido"
    NAO_AVALIADO = "Não avaliado"


class Indicador(Base):
    __tablename__ = "indicadores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    municipio_id: Mapped[int] = mapped_column(ForeignKey("municipios.id"), index=True)

    indicador: Mapped[str] = mapped_column(String(200))
    eixo: Mapped[str | None] = mapped_column(String(100), nullable=True)
    unidade_medida: Mapped[str] = mapped_column(String(30), default="%")

    meta_prevista: Mapped[float] = mapped_column(Float, default=100.0)
    valor_alcancado: Mapped[float] = mapped_column(Float, default=0.0)
    meta_financeira_prevista: Mapped[float] = mapped_column(Float, default=0.0)
    meta_financeira_realizada: Mapped[float] = mapped_column(Float, default=0.0)
    execucao_fisica: Mapped[int] = mapped_column(Integer, default=0)

    competencia: Mapped[str | None] = mapped_column(String(7), nullable=True)  # "2026-06"
    situacao: Mapped[SituacaoIndicador] = mapped_column(
        SAEnum(SituacaoIndicador), default=SituacaoIndicador.EM_ANDAMENTO
    )

    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    municipio: Mapped["Municipio"] = relationship(back_populates="indicadores")  # type: ignore
