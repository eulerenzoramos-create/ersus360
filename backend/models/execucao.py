"""Models: Empenho · Liquidacao · Pagamento · RestoPagar · AplicacaoFinanceira"""
from datetime import date, datetime
from sqlalchemy import String, Integer, Float, DateTime, Date, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from database import Base


class SituacaoEmpenho(str, enum.Enum):
    NORMAL = "Normal"
    ANULADO = "Anulado"
    REFORCO = "Reforço"


class SituacaoResto(str, enum.Enum):
    PROCESSADO = "Processado"
    NAO_PROCESSADO = "Não processado"
    PAGO = "Pago"
    CANCELADO = "Cancelado"


class Empenho(Base):
    __tablename__ = "empenhos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    convenio_id: Mapped[int] = mapped_column(ForeignKey("convenios.id"), index=True)
    numero: Mapped[str] = mapped_column(String(50))
    data_empenho: Mapped[date] = mapped_column(Date)
    valor: Mapped[float] = mapped_column(Float, default=0.0)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    natureza: Mapped[str | None] = mapped_column(String(100), nullable=True)
    modalidade: Mapped[str | None] = mapped_column(String(80), nullable=True)
    credor: Mapped[str | None] = mapped_column(String(200), nullable=True)
    cnpj_credor: Mapped[str | None] = mapped_column(String(18), nullable=True)
    situacao: Mapped[SituacaoEmpenho] = mapped_column(
        SAEnum(SituacaoEmpenho), default=SituacaoEmpenho.NORMAL
    )
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    convenio: Mapped["Convenio"] = relationship(back_populates="empenhos")  # type: ignore
    liquidacoes: Mapped[list["Liquidacao"]] = relationship(
        back_populates="empenho", cascade="all, delete-orphan"
    )
    restos: Mapped[list["RestoPagar"]] = relationship(
        back_populates="empenho", cascade="all, delete-orphan"
    )


class Liquidacao(Base):
    __tablename__ = "liquidacoes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    empenho_id: Mapped[int] = mapped_column(ForeignKey("empenhos.id"), index=True)
    data_liquidacao: Mapped[date] = mapped_column(Date)
    valor: Mapped[float] = mapped_column(Float, default=0.0)
    nota_fiscal: Mapped[str | None] = mapped_column(String(50), nullable=True)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    empenho: Mapped["Empenho"] = relationship(back_populates="liquidacoes")
    pagamentos: Mapped[list["Pagamento"]] = relationship(
        back_populates="liquidacao", cascade="all, delete-orphan"
    )


class Pagamento(Base):
    __tablename__ = "pagamentos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    liquidacao_id: Mapped[int] = mapped_column(ForeignKey("liquidacoes.id"), index=True)
    data_pagamento: Mapped[date] = mapped_column(Date)
    valor: Mapped[float] = mapped_column(Float, default=0.0)
    forma_pagamento: Mapped[str] = mapped_column(String(50), default="OB")
    numero_ob: Mapped[str | None] = mapped_column(String(50), nullable=True)
    banco_favorecido: Mapped[str | None] = mapped_column(String(100), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    liquidacao: Mapped["Liquidacao"] = relationship(back_populates="pagamentos")


class RestoPagar(Base):
    __tablename__ = "restos_a_pagar"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    empenho_id: Mapped[int] = mapped_column(ForeignKey("empenhos.id"), index=True)
    ano_inscricao: Mapped[int] = mapped_column(Integer)
    valor_inscrito: Mapped[float] = mapped_column(Float, default=0.0)
    valor_pago: Mapped[float] = mapped_column(Float, default=0.0)
    valor_cancelado: Mapped[float] = mapped_column(Float, default=0.0)
    situacao: Mapped[SituacaoResto] = mapped_column(
        SAEnum(SituacaoResto), default=SituacaoResto.PROCESSADO
    )
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    empenho: Mapped["Empenho"] = relationship(back_populates="restos")

    @property
    def valor_saldo(self) -> float:
        return self.valor_inscrito - self.valor_pago - self.valor_cancelado


class AplicacaoFinanceira(Base):
    __tablename__ = "aplicacoes_financeiras"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    convenio_id: Mapped[int] = mapped_column(ForeignKey("convenios.id"), index=True)
    conta_bancaria_id: Mapped[int | None] = mapped_column(
        ForeignKey("contas_bancarias.id"), nullable=True
    )
    competencia: Mapped[str] = mapped_column(String(7))
    saldo_inicial: Mapped[float] = mapped_column(Float, default=0.0)
    rendimento: Mapped[float] = mapped_column(Float, default=0.0)
    saldo_final: Mapped[float] = mapped_column(Float, default=0.0)
    data_extrato: Mapped[date | None] = mapped_column(Date, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    convenio: Mapped["Convenio"] = relationship(back_populates="aplicacoes")  # type: ignore
