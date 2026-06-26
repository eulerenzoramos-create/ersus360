"""Models: Usuario + AuditLog"""
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, Boolean, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from database import Base


class Perfil(str, enum.Enum):
    ADMIN = "admin"
    SECRETARIO = "secretario"
    TESOURARIA = "tesouraria"
    FINANCEIRO = "financeiro"
    CONTABILIDADE = "contabilidade"
    PLANEJAMENTO = "planejamento"
    AUDITORIA = "auditoria"
    CONTROLADORIA = "controladoria"
    PREFEITO = "prefeito"
    CONSELHO = "conselho"
    CONSULTA = "consulta"


# Permissões por perfil: quais módulos pode acessar em escrita
PERMISSOES = {
    Perfil.ADMIN:          {"*"},
    Perfil.SECRETARIO:     {"dashboard", "alertas", "relatorios", "ia", "programas"},
    Perfil.TESOURARIA:     {"receitas", "execucao", "relatorios", "alertas"},
    Perfil.FINANCEIRO:     {"receitas", "execucao", "relatorios"},
    Perfil.CONTABILIDADE:  {"execucao", "relatorios", "prestacao_contas"},
    Perfil.PLANEJAMENTO:   {"programas", "indicadores", "relatorios"},
    Perfil.AUDITORIA:      {"relatorios", "prestacao_contas"},
    Perfil.CONTROLADORIA:  {"relatorios", "alertas"},
    Perfil.PREFEITO:       {"dashboard"},
    Perfil.CONSELHO:       {"dashboard", "indicadores"},
    Perfil.CONSULTA:       set(),
}


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    municipio_id: Mapped[int] = mapped_column(ForeignKey("municipios.id"), index=True)
    nome: Mapped[str] = mapped_column(String(150))
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    senha_hash: Mapped[str] = mapped_column(String(255))
    perfil: Mapped[Perfil] = mapped_column(SAEnum(Perfil), default=Perfil.CONSULTA)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    ultimo_acesso: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    municipio: Mapped["Municipio"] = relationship(back_populates="usuarios")  # type: ignore


class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    acao: Mapped[str] = mapped_column(String(50))    # CREATE, UPDATE, DELETE, LOGIN
    tabela: Mapped[str | None] = mapped_column(String(50), nullable=True)
    registro_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    detalhe: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_origem: Mapped[str | None] = mapped_column(String(45), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
