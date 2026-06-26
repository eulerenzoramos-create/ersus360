"""Model: Cronograma de execução por convênio"""
from datetime import datetime
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from database import Base


class SituacaoCronograma(str, enum.Enum):
    PREVISTO = "Previsto"
    EM_EXECUCAO = "Em execução"
    REALIZADO = "Realizado"
    SUSPENSO = "Suspenso"


class Cronograma(Base):
    __tablename__ = "cronogramas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    convenio_id: Mapped[int] = mapped_column(ForeignKey("convenios.id"), index=True)

    descricao: Mapped[str] = mapped_column(String(300))
    meta_financeira_prevista: Mapped[float] = mapped_column(Float, default=0.0)
    meta_financeira_realizada: Mapped[float] = mapped_column(Float, default=0.0)
    execucao_fisica: Mapped[int] = mapped_column(Integer, default=0)   # 0-100 %
    situacao: Mapped[SituacaoCronograma] = mapped_column(
        SAEnum(SituacaoCronograma), default=SituacaoCronograma.PREVISTO
    )

    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    convenio: Mapped["Convenio"] = relationship(back_populates="cronogramas")  # type: ignore
