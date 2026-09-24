"""Models: Portaria + PortariaMunicipio (vínculo município↔portaria)"""
from datetime import date, datetime
from sqlalchemy import String, Integer, DateTime, Date, Text, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class Portaria(Base):
    __tablename__ = "portarias"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    numero: Mapped[str] = mapped_column(String(50), index=True)
    ano: Mapped[int] = mapped_column(Integer, index=True)
    orgao_emissor: Mapped[str] = mapped_column(String(100), default="GM/MS")
    programa: Mapped[str | None] = mapped_column(String(200), nullable=True)
    bloco: Mapped[str | None] = mapped_column(String(100), nullable=True)
    grupo: Mapped[str | None] = mapped_column(String(100), nullable=True)
    acao: Mapped[str | None] = mapped_column(String(200), nullable=True)
    natureza: Mapped[str | None] = mapped_column(String(100), nullable=True)
    objeto: Mapped[str | None] = mapped_column(Text, nullable=True)
    data_publicacao: Mapped[date | None] = mapped_column(Date, nullable=True)
    link_diario: Mapped[str | None] = mapped_column(String(500), nullable=True)
    arquivo_pdf: Mapped[str | None] = mapped_column(String(500), nullable=True)
    valor_total: Mapped[float] = mapped_column(Float, default=0.0)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    municipios: Mapped[list["PortariaMunicipio"]] = relationship(back_populates="portaria")
    convenios: Mapped[list["Convenio"]] = relationship(back_populates="portaria")  # type: ignore


class PortariaMunicipio(Base):
    """Portarias vinculadas a um município específico (repasse individual).

    Também é a PREVISÃO financeira da Portaria para o município: quanto deveria
    ser recebido, em quais competências e em quantas parcelas. A previsão nunca
    é somada à receita — o recebido vem só das transferências do FNS."""
    __tablename__ = "portarias_municipio"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    portaria_id: Mapped[int] = mapped_column(ForeignKey("portarias.id"), index=True)
    municipio_id: Mapped[int] = mapped_column(ForeignKey("municipios.id"), index=True)
    valor_municipio: Mapped[float] = mapped_column(Float, default=0.0)   # valor previsto total
    competencia: Mapped[str | None] = mapped_column(String(7), nullable=True)  # competência (inicial) prevista AAAA-MM
    observacoes: Mapped[str | None] = mapped_column(Text, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # ── Previsão Portaria × Recebimento FNS ──────────────────────────────────
    exercicio: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    grupo: Mapped[str | None] = mapped_column(String(200), nullable=True)
    acao: Mapped[str | None] = mapped_column(String(400), nullable=True)
    componente: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # unica | mensal | bimestral | trimestral | quadrimestral | semestral | anual
    periodicidade: Mapped[str | None] = mapped_column(String(20), nullable=True)
    qtd_parcelas: Mapped[int | None] = mapped_column(Integer, nullable=True)
    valor_parcela: Mapped[float | None] = mapped_column(Float, nullable=True)
    fundamento: Mapped[str | None] = mapped_column(Text, nullable=True)   # fundamento/origem
    criado_por: Mapped[str | None] = mapped_column(String(200), nullable=True)
    atualizado_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, onupdate=datetime.utcnow)
    excluido_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    portaria: Mapped["Portaria"] = relationship(back_populates="municipios")
    municipio: Mapped["Municipio"] = relationship(back_populates="portarias")  # type: ignore
