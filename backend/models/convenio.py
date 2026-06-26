"""
Models: BlocoPacto · Convenio
Municipio foi movido para models/municipio.py
"""
from datetime import datetime
from sqlalchemy import String, Integer, Float, DateTime, Date, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from database import Base


class SituacaoConvenio(str, enum.Enum):
    VIGENTE = "Vigente"
    ENCERRADO = "Encerrado"
    CANCELADO = "Cancelado"
    SUSPENSO = "Suspenso"
    EM_EXECUCAO = "Em Execução"
    EM_LICITACAO = "Em licitação"


class BlocoPacto(Base):
    __tablename__ = "blocos_pacto"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(120))
    descricao: Mapped[str | None] = mapped_column(String(255), nullable=True)

    convenios: Mapped[list["Convenio"]] = relationship(back_populates="bloco_pacto")


class Convenio(Base):
    __tablename__ = "convenios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    municipio_id: Mapped[int] = mapped_column(ForeignKey("municipios.id"), index=True)
    bloco_pacto_id: Mapped[int | None] = mapped_column(ForeignKey("blocos_pacto.id"), nullable=True)
    portaria_id: Mapped[int | None] = mapped_column(ForeignKey("portarias.id"), nullable=True)
    conta_bancaria_id: Mapped[int | None] = mapped_column(
        ForeignKey("contas_bancarias.id"), nullable=True
    )

    numero: Mapped[str] = mapped_column(String(50), index=True)
    objeto: Mapped[str] = mapped_column(String(500))
    programa: Mapped[str | None] = mapped_column(String(200), nullable=True)
    numero_sismob: Mapped[str | None] = mapped_column(String(50), nullable=True)
    numero_processo: Mapped[str | None] = mapped_column(String(50), nullable=True)

    valor_aprovado: Mapped[float] = mapped_column(Float, default=0.0)
    valor_contrato: Mapped[float] = mapped_column(Float, default=0.0)
    valor_pago: Mapped[float] = mapped_column(Float, default=0.0)
    valor_recebido: Mapped[float] = mapped_column(Float, default=0.0)
    perc_fisico_executado: Mapped[float] = mapped_column(Float, default=0.0)
    perc_financeiro_executado: Mapped[float] = mapped_column(Float, default=0.0)

    situacao: Mapped[SituacaoConvenio] = mapped_column(
        SAEnum(SituacaoConvenio), default=SituacaoConvenio.VIGENTE
    )
    data_inicio: Mapped[str | None] = mapped_column(String(10), nullable=True)
    data_previsao_conclusao: Mapped[str | None] = mapped_column(String(10), nullable=True)
    prazo_utilizacao: Mapped[str | None] = mapped_column(String(10), nullable=True)
    origem: Mapped[str] = mapped_column(String(30), default="manual")

    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    municipio: Mapped["Municipio"] = relationship(back_populates="convenios")  # type: ignore
    bloco_pacto: Mapped["BlocoPacto | None"] = relationship(back_populates="convenios")
    portaria: Mapped["Portaria | None"] = relationship(back_populates="convenios")  # type: ignore
    conta_bancaria: Mapped["ContaBancaria | None"] = relationship(back_populates="convenios")  # type: ignore
    repasses: Mapped[list["Repasse"]] = relationship(
        back_populates="convenio", cascade="all, delete-orphan"
    )
    cronogramas: Mapped[list["Cronograma"]] = relationship(
        back_populates="convenio", cascade="all, delete-orphan"
    )
    alertas: Mapped[list["Alerta"]] = relationship(back_populates="convenio")
    empenhos: Mapped[list["Empenho"]] = relationship(  # type: ignore
        back_populates="convenio", cascade="all, delete-orphan"
    )
    obras: Mapped[list["Obra"]] = relationship(back_populates="convenio")  # type: ignore
    aplicacoes: Mapped[list["AplicacaoFinanceira"]] = relationship(  # type: ignore
        back_populates="convenio", cascade="all, delete-orphan"
    )
    documentos: Mapped[list["Documento"]] = relationship(back_populates="convenio")  # type: ignore

    @property
    def saldo_disponivel(self) -> float:
        return self.valor_recebido - self.valor_pago


# importar outros modelos para que o Base os registre
from models.repasse import Repasse  # noqa
from models.cronograma import Cronograma  # noqa
from models.indicador import Indicador  # noqa
from models.alerta import Alerta  # noqa
