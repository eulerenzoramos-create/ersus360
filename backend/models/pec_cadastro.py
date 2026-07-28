"""Models: cache local dos cadastros oficiais do PEC e-SUS APS.

Estas tabelas NUNCA são a fonte de verdade — são um espelho local, somente
leitura do ponto de vista do usuário, sincronizado a partir do PEC via
services/pec/cadastros.py. Nenhum destes registros deve ser criado/editado
manualmente como se fosse um cadastro paralelo (ver CLAUDE.md e
docs/DOC-PEC-INTEGRACAO.md).

Identificadores de origem (pec_reference_id, hash_controle, origem_dado)
existem em todas as entidades para permitir reconciliação sem duplicidade.
CNS e CPF nunca são armazenados em texto puro — apenas hash + máscara para
exibição (pseudonimização LGPD, ver services/pec/pseudonimizacao.py).
"""
from datetime import datetime
import enum

from sqlalchemy import String, Integer, DateTime, ForeignKey, Boolean, Float, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class OrigemDado(str, enum.Enum):
    PEC = "pec"                        # sincronizado do PEC e-SUS APS — dado oficial
    ERSUS_OPERACIONAL = "ersus_operacional"  # gerado pelo ERSUS 360 (ex.: geolocalização)
    ERSUS_MANUAL = "ersus_manual"       # cadastro manual de contingência, sem vínculo PEC ainda


class EquipeSaude(Base):
    """Equipe de saúde (ESF/EACS/EAP...) — cadastro oficial do PEC (INE)."""
    __tablename__ = "pec_equipes_saude"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    municipio_id: Mapped[int] = mapped_column(ForeignKey("municipios.id"), index=True)

    ine: Mapped[str] = mapped_column(String(20), index=True)
    nome: Mapped[str] = mapped_column(String(150))
    tipo_equipe: Mapped[str] = mapped_column(String(20))   # ESF, EACS, EAP, EMULTI, ...
    cnes: Mapped[str] = mapped_column(String(10), index=True)
    ativa: Mapped[bool] = mapped_column(Boolean, default=True)

    pec_reference_id: Mapped[str | None] = mapped_column(String(64), unique=True, index=True, nullable=True)
    data_ultima_atualizacao_pec: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    hash_controle: Mapped[str | None] = mapped_column(String(64), nullable=True)
    origem_dado: Mapped[OrigemDado] = mapped_column(
        SAEnum(OrigemDado, name="origem_dado_equipe", create_constraint=True),
        default=OrigemDado.PEC,
    )

    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    atualizado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    profissionais: Mapped[list["ProfissionalSaude"]] = relationship(back_populates="equipe")
    microareas: Mapped[list["Microarea"]] = relationship(back_populates="equipe")


class ProfissionalSaude(Base):
    """Profissional vinculado ao PEC (inclui ACS). CNS armazenado só como hash+máscara."""
    __tablename__ = "pec_profissionais_saude"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    municipio_id: Mapped[int] = mapped_column(ForeignKey("municipios.id"), index=True)
    equipe_id: Mapped[int | None] = mapped_column(ForeignKey("pec_equipes_saude.id"), nullable=True, index=True)

    nome: Mapped[str] = mapped_column(String(150))
    cns_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    cns_mascarado: Mapped[str] = mapped_column(String(20))   # ex.: "***.****.**12.3456"
    cbo: Mapped[str] = mapped_column(String(10))
    cbo_descricao: Mapped[str | None] = mapped_column(String(150), nullable=True)
    cnes: Mapped[str] = mapped_column(String(10), index=True)
    cargo: Mapped[str | None] = mapped_column(String(50), nullable=True)   # ex.: "ACS", "Enfermeiro"
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)

    pec_reference_id: Mapped[str | None] = mapped_column(String(64), unique=True, index=True, nullable=True)
    data_ultima_atualizacao_pec: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    hash_controle: Mapped[str | None] = mapped_column(String(64), nullable=True)
    origem_dado: Mapped[OrigemDado] = mapped_column(
        SAEnum(OrigemDado, name="origem_dado_profissional", create_constraint=True),
        default=OrigemDado.PEC,
    )

    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    atualizado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    equipe: Mapped["EquipeSaude"] = relationship(back_populates="profissionais")
    microareas: Mapped[list["Microarea"]] = relationship(back_populates="acs_profissional")


class Microarea(Base):
    """Microárea de atuação de um ACS — cadastro territorial oficial do PEC."""
    __tablename__ = "pec_microareas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    municipio_id: Mapped[int] = mapped_column(ForeignKey("municipios.id"), index=True)
    equipe_id: Mapped[int] = mapped_column(ForeignKey("pec_equipes_saude.id"), index=True)
    acs_profissional_id: Mapped[int | None] = mapped_column(
        ForeignKey("pec_profissionais_saude.id"), nullable=True, index=True
    )

    codigo: Mapped[str] = mapped_column(String(10), index=True)   # ex.: "MA-01"
    zona: Mapped[str] = mapped_column(String(20))                  # urbana | periurbana | rural

    pec_reference_id: Mapped[str | None] = mapped_column(String(64), unique=True, index=True, nullable=True)
    data_ultima_atualizacao_pec: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    hash_controle: Mapped[str | None] = mapped_column(String(64), nullable=True)
    origem_dado: Mapped[OrigemDado] = mapped_column(
        SAEnum(OrigemDado, name="origem_dado_microarea", create_constraint=True),
        default=OrigemDado.PEC,
    )

    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    atualizado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    equipe: Mapped["EquipeSaude"] = relationship(back_populates="microareas")
    acs_profissional: Mapped["ProfissionalSaude | None"] = relationship(back_populates="microareas")
    domicilios: Mapped[list["Domicilio"]] = relationship(back_populates="microarea")


class Domicilio(Base):
    """Domicílio georreferenciado — cadastro domiciliar/territorial oficial do PEC."""
    __tablename__ = "pec_domicilios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    municipio_id: Mapped[int] = mapped_column(ForeignKey("municipios.id"), index=True)
    microarea_id: Mapped[int] = mapped_column(ForeignKey("pec_microareas.id"), index=True)

    uuid_ficha: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    logradouro: Mapped[str | None] = mapped_column(String(200), nullable=True)
    numero: Mapped[str | None] = mapped_column(String(20), nullable=True)
    tipo_domicilio: Mapped[str | None] = mapped_column(String(50), nullable=True)
    situacao_moradia: Mapped[str | None] = mapped_column(String(50), nullable=True)

    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    pec_reference_id: Mapped[str | None] = mapped_column(String(64), unique=True, index=True, nullable=True)
    data_ultima_atualizacao_pec: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    hash_controle: Mapped[str | None] = mapped_column(String(64), nullable=True)
    origem_dado: Mapped[OrigemDado] = mapped_column(
        SAEnum(OrigemDado, name="origem_dado_domicilio", create_constraint=True),
        default=OrigemDado.PEC,
    )

    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    atualizado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    microarea: Mapped["Microarea"] = relationship(back_populates="domicilios")
    cidadaos: Mapped[list["Cidadao"]] = relationship(back_populates="domicilio")


class Cidadao(Base):
    """Cidadão com cadastro individual no PEC. CNS/CPF armazenados só como hash+máscara."""
    __tablename__ = "pec_cidadaos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    municipio_id: Mapped[int] = mapped_column(ForeignKey("municipios.id"), index=True)
    domicilio_id: Mapped[int | None] = mapped_column(ForeignKey("pec_domicilios.id"), nullable=True, index=True)

    nome: Mapped[str] = mapped_column(String(150))
    cns_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    cns_mascarado: Mapped[str] = mapped_column(String(20))
    cpf_hash: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    data_nascimento: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    sexo: Mapped[str | None] = mapped_column(String(1), nullable=True)

    pec_reference_id: Mapped[str | None] = mapped_column(String(64), unique=True, index=True, nullable=True)
    data_ultima_atualizacao_pec: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    hash_controle: Mapped[str | None] = mapped_column(String(64), nullable=True)
    origem_dado: Mapped[OrigemDado] = mapped_column(
        SAEnum(OrigemDado, name="origem_dado_cidadao", create_constraint=True),
        default=OrigemDado.PEC,
    )

    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    atualizado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    domicilio: Mapped["Domicilio | None"] = relationship(back_populates="cidadaos")
