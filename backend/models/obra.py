"""Models: Obra · ObraFoto · ObraCronograma"""
from datetime import date, datetime
from sqlalchemy import String, Integer, Float, DateTime, Date, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from database import Base


class TipoEstabelecimento(str, enum.Enum):
    UBS = "UBS"
    HOSPITAL = "Hospital"
    CAPS = "CAPS"
    ACADEMIA = "Academia da Saúde"
    UPA = "UPA"
    SAMU = "SAMU"
    CEO = "CEO"
    OUTRO = "Outro"


class TipoObra(str, enum.Enum):
    CONSTRUCAO = "Construção"
    REFORMA = "Reforma"
    AMPLIACAO = "Ampliação"
    EQUIPAMENTO = "Aquisição de Equipamento"


class StatusObra(str, enum.Enum):
    LICITACAO = "Em licitação"
    ANDAMENTO = "Em andamento"
    PARALISADA = "Paralisada"
    CONCLUIDA = "Concluída"
    CANCELADA = "Cancelada"


class StatusEtapa(str, enum.Enum):
    PENDENTE = "Pendente"
    EM_ANDAMENTO = "Em andamento"
    CONCLUIDA = "Concluída"
    ATRASADA = "Atrasada"


class Obra(Base):
    __tablename__ = "obras"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    convenio_id: Mapped[int | None] = mapped_column(ForeignKey("convenios.id"), nullable=True)
    municipio_id: Mapped[int] = mapped_column(ForeignKey("municipios.id"), index=True)
    numero_sismob: Mapped[str | None] = mapped_column(String(50), nullable=True)
    tipo_estabelecimento: Mapped[TipoEstabelecimento] = mapped_column(
        SAEnum(TipoEstabelecimento), default=TipoEstabelecimento.UBS
    )
    nome_estabelecimento: Mapped[str] = mapped_column(String(200))
    tipo_obra: Mapped[TipoObra] = mapped_column(SAEnum(TipoObra), default=TipoObra.CONSTRUCAO)
    endereco: Mapped[str | None] = mapped_column(Text, nullable=True)
    valor_contrato: Mapped[float] = mapped_column(Float, default=0.0)
    empresa_construtora: Mapped[str | None] = mapped_column(String(200), nullable=True)
    cnpj_empresa: Mapped[str | None] = mapped_column(String(18), nullable=True)
    engenheiro_resp: Mapped[str | None] = mapped_column(String(150), nullable=True)
    art_numero: Mapped[str | None] = mapped_column(String(50), nullable=True)
    data_inicio: Mapped[date | None] = mapped_column(Date, nullable=True)
    data_previsao_conclusao: Mapped[date | None] = mapped_column(Date, nullable=True)
    data_conclusao_real: Mapped[date | None] = mapped_column(Date, nullable=True)
    perc_fisico: Mapped[float] = mapped_column(Float, default=0.0)
    perc_financeiro: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[StatusObra] = mapped_column(SAEnum(StatusObra), default=StatusObra.LICITACAO)
    observacoes: Mapped[str | None] = mapped_column(Text, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    municipio: Mapped["Municipio"] = relationship(back_populates="obras")  # type: ignore
    convenio: Mapped["Convenio | None"] = relationship(back_populates="obras")  # type: ignore
    emendas: Mapped[list["Emenda"]] = relationship(back_populates="obra")  # type: ignore
    fotos: Mapped[list["ObraFoto"]] = relationship(
        back_populates="obra", cascade="all, delete-orphan"
    )
    etapas: Mapped[list["ObraCronograma"]] = relationship(
        back_populates="obra", cascade="all, delete-orphan"
    )

    @property
    def dias_atraso(self) -> int | None:
        if self.data_previsao_conclusao and self.status not in (
            StatusObra.CONCLUIDA, StatusObra.CANCELADA
        ):
            delta = (date.today() - self.data_previsao_conclusao).days
            return max(0, delta)
        return None


class ObraFoto(Base):
    __tablename__ = "obras_fotos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    obra_id: Mapped[int] = mapped_column(ForeignKey("obras.id"), index=True)
    arquivo: Mapped[str] = mapped_column(String(500))    # path MinIO
    data_foto: Mapped[date | None] = mapped_column(Date, nullable=True)
    descricao: Mapped[str | None] = mapped_column(String(255), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    obra: Mapped["Obra"] = relationship(back_populates="fotos")


class ObraCronograma(Base):
    __tablename__ = "obras_cronograma"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    obra_id: Mapped[int] = mapped_column(ForeignKey("obras.id"), index=True)
    etapa: Mapped[str] = mapped_column(String(100))
    data_inicio_prevista: Mapped[date | None] = mapped_column(Date, nullable=True)
    data_fim_prevista: Mapped[date | None] = mapped_column(Date, nullable=True)
    data_inicio_real: Mapped[date | None] = mapped_column(Date, nullable=True)
    data_fim_real: Mapped[date | None] = mapped_column(Date, nullable=True)
    perc_previsto: Mapped[float] = mapped_column(Float, default=0.0)
    perc_realizado: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[StatusEtapa] = mapped_column(SAEnum(StatusEtapa), default=StatusEtapa.PENDENTE)

    obra: Mapped["Obra"] = relationship(back_populates="etapas")
