"""Models: Usuario + AuditLog"""
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, Boolean, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from database import Base


class Perfil(str, enum.Enum):
    SUPERADMIN   = "superadmin"     # Administrador absoluto — só Euler
    ADMIN        = "admin"          # Administrador do sistema
    GESTOR       = "gestor"         # Gestor / Secretário Municipal — acesso total
    COORDENADOR  = "coordenador"    # Coordenador APS — sem repasses financeiros
    ENFERMEIRO   = "enfermeiro"
    MEDICO       = "medico"
    TECNICO_APS  = "tecnico_aps"
    ACS          = "acs"
    ODONTOLOGIA  = "odontologia"
    FARMACEUTICO = "farmaceutico"
    VIGILANCIA   = "vigilancia"
    FINANCEIRO   = "financeiro"
    CONTABILIDADE= "contabilidade"
    PLANEJAMENTO = "planejamento"
    AUDITORIA    = "auditoria"
    PREFEITO     = "prefeito"
    CONSELHO     = "conselho"
    CONSULTA     = "consulta"


# Módulos do sistema por grupo funcional
_FINANCEIRO = {"financeiro", "repasses", "caf", "fns", "siops", "contratos",
               "ppa_loa", "execucao", "emendas", "portarias"}
_APS        = {"home", "aps", "qualidade", "parametros_ms", "fichas_tecnicas",
               "producao_sisab", "relatorio_producao", "monitor_rt",
               "busca_ativa", "acs", "inconsistencias", "poeps", "sb360",
               "gestao_aps", "painel_gestao", "siaps", "atencao_domiciliar",
               "sala_vacinas", "score", "alertas", "telessaude"}
_VIGILANCIA = {"vigilancia", "epidemiologia", "notificacoes", "sim_sinasc",
               "cancer", "ccih", "sala_vacinas", "monitor_rt"}
_ADMIN      = {"usuarios", "rh", "auditoria_sistema", "cadastros"}
_TUDO       = _FINANCEIRO | _APS | _VIGILANCIA | _ADMIN | {
    "regulacao_mac", "regulacao", "farmacia", "manutencao", "frota",
    "plano_municipal", "score_municipal", "conselho_saude", "ouvidoria",
    "sadt", "pgrss", "gestao_qualidade", "cme", "saude_servidor",
    "ia", "bi", "marketplace", "portal_gestor", "portal_cidadao",
    "agenda", "conformidade", "ocis", "patrimonio", "absenteismo",
}

PERMISSOES: dict[str, set] = {
    "superadmin":    {"*"},
    "admin":         {"*"},
    "gestor":        _TUDO,
    "coordenador":   _TUDO - _FINANCEIRO - _ADMIN | {"siaps", "score"},
    "enfermeiro":    _APS | _VIGILANCIA,
    "medico":        _APS | _VIGILANCIA | {"farmacia"},
    "tecnico_aps":   _APS,
    "acs":           {"home", "acs", "busca_ativa", "inconsistencias", "monitor_rt", "alertas"},
    "odontologia":   _APS - {"busca_ativa", "acs"},
    "farmaceutico":  {"home", "farmacia", "alertas", "producao_sisab", "siaps"},
    "vigilancia":    _VIGILANCIA | {"home", "alertas", "score"},
    "financeiro":    _FINANCEIRO | {"home", "siaps", "alertas", "score"},
    "contabilidade": {"home", "financeiro", "siops", "contratos", "ppa_loa", "alertas"},
    "planejamento":  {"home", "plano_municipal", "score_municipal", "score", "parametros_ms",
                     "qualidade", "poeps", "ppa_loa", "alertas", "siaps"},
    "auditoria":     _TUDO - _ADMIN,
    "prefeito":      {"home", "score", "score_municipal", "financeiro",
                     "portal_gestor", "alertas", "siaps", "qualidade", "aps"},
    "conselho":      {"home", "score", "qualidade", "parametros_ms",
                     "conselho_saude", "alertas", "sim_sinasc"},
    "consulta":      {"home", "alertas"},
}


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    municipio_id: Mapped[int] = mapped_column(ForeignKey("municipios.id"), index=True)
    nome: Mapped[str] = mapped_column(String(150))
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    senha_hash: Mapped[str] = mapped_column(String(255))
    perfil: Mapped[Perfil] = mapped_column(SAEnum(Perfil, name="perfil", create_constraint=True), default=Perfil.CONSULTA)
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
