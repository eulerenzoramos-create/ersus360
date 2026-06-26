"""Models: Municipio (expandido) + ContaBancaria"""
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class Municipio(Base):
    __tablename__ = "municipios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(100))
    uf: Mapped[str] = mapped_column(String(2))
    codigo_ibge: Mapped[str] = mapped_column(String(7), unique=True, index=True)
    cnpj_fundo: Mapped[str | None] = mapped_column(String(18), nullable=True)
    secretario: Mapped[str | None] = mapped_column(String(150), nullable=True)
    prefeito: Mapped[str | None] = mapped_column(String(150), nullable=True)
    gestor_fundo: Mapped[str | None] = mapped_column(String(150), nullable=True)
    telefone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(150), nullable=True)
    populacao: Mapped[int | None] = mapped_column(Integer, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    convenios: Mapped[list["Convenio"]] = relationship(back_populates="municipio")  # type: ignore
    indicadores: Mapped[list["Indicador"]] = relationship(back_populates="municipio")  # type: ignore
    alertas: Mapped[list["Alerta"]] = relationship(back_populates="municipio")  # type: ignore
    contas_bancarias: Mapped[list["ContaBancaria"]] = relationship(back_populates="municipio")
    usuarios: Mapped[list["Usuario"]] = relationship(back_populates="municipio")  # type: ignore
    obras: Mapped[list["Obra"]] = relationship(back_populates="municipio")  # type: ignore
    documentos: Mapped[list["Documento"]] = relationship(back_populates="municipio")  # type: ignore
    portarias: Mapped[list["PortariaMunicipio"]] = relationship(back_populates="municipio")  # type: ignore
    emendas: Mapped[list["Emenda"]] = relationship(back_populates="municipio")  # type: ignore


class ContaBancaria(Base):
    __tablename__ = "contas_bancarias"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    municipio_id: Mapped[int] = mapped_column(ForeignKey("municipios.id"), index=True)
    banco: Mapped[str] = mapped_column(String(100))
    agencia: Mapped[str] = mapped_column(String(10))
    conta: Mapped[str] = mapped_column(String(20))
    digito: Mapped[str | None] = mapped_column(String(2), nullable=True)
    tipo: Mapped[str] = mapped_column(String(80))      # ex: "Conta Saúde PAB"
    fonte_recurso: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ativa: Mapped[bool] = mapped_column(Boolean, default=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    municipio: Mapped["Municipio"] = relationship(back_populates="contas_bancarias")
    convenios: Mapped[list["Convenio"]] = relationship(back_populates="conta_bancaria")  # type: ignore
