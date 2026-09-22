"""Models: Municipio (expandido, multi-tenant) + ContaBancaria"""
import enum
import uuid as _uuid
from datetime import date, datetime
from sqlalchemy import String, Integer, DateTime, Date, ForeignKey, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class SituacaoMunicipio(str, enum.Enum):
    """Ciclo de vida do município no ERSUS360 (armazenado como texto)."""
    DISPONIVEL = "disponivel"   # consta na relação oficial, sem contrato
    IMPLANTACAO = "implantacao"  # contratado, em configuração
    ATIVO = "ativo"              # autorizado a usar o sistema
    SUSPENSO = "suspenso"        # bloqueado temporariamente, dados preservados
    ENCERRADO = "encerrado"      # contrato finalizado, dados preservados


# Situações em que usuários municipais podem entrar no sistema.
SITUACOES_COM_ACESSO = {SituacaoMunicipio.ATIVO.value}


class Municipio(Base):
    """Tenant do ERSUS360. `id` é o tenant_id interno e imutável;
    `uuid` é o identificador público (não sequencial) usado em URLs."""
    __tablename__ = "municipios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    uuid: Mapped[str | None] = mapped_column(
        String(36), unique=True, index=True, nullable=True, default=lambda: str(_uuid.uuid4())
    )
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

    # ── Credenciamento / multi-tenant ────────────────────────────────────────
    situacao: Mapped[str | None] = mapped_column(
        String(20), nullable=True, index=True, default=SituacaoMunicipio.DISPONIVEL.value
    )
    cnpj_prefeitura: Mapped[str | None] = mapped_column(String(18), nullable=True)
    cnpj_secretaria: Mapped[str | None] = mapped_column(String(18), nullable=True)
    cnes_secretaria: Mapped[str | None] = mapped_column(String(7), nullable=True)
    endereco: Mapped[str | None] = mapped_column(String(255), nullable=True)
    responsavel_tecnico: Mapped[str | None] = mapped_column(String(150), nullable=True)
    responsavel_administrativo: Mapped[str | None] = mapped_column(String(150), nullable=True)
    brasao_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    data_implantacao: Mapped[date | None] = mapped_column(Date, nullable=True)
    contrato_inicio: Mapped[date | None] = mapped_column(Date, nullable=True)
    contrato_fim: Mapped[date | None] = mapped_column(Date, nullable=True)
    plano: Mapped[str | None] = mapped_column(String(50), nullable=True)
    modulos_contratados: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON: lista de módulos
    limite_usuarios: Mapped[int | None] = mapped_column(Integer, nullable=True)
    configuracoes: Mapped[str | None] = mapped_column(Text, nullable=True)        # JSON livre
    atualizado_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, onupdate=datetime.utcnow)
    excluido_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)  # exclusão lógica

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
