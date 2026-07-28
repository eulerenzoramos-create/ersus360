"""Models: visita domiciliar operacional (ERSUS 360) e fila de transmissão ao PEC.

A visita é criada localmente pelo ERSUS 360 (app do ACS), estruturada conforme
o MIVDT e, ao ser transmitida, convertida para o padrão LEDI APS e enviada ao
PEC pela API oficial. Ver services/pec/mivdt.py e services/pec/transmissao.py.

Datas mantidas SEPARADAS de propósito (não colapsar em uma única "data"):
registro local != recebimento no ERSUS != envio ao PEC != processamento no PEC
!= inclusão no fluxo oficial. Da mesma forma, localização da visita, do
dispositivo durante a jornada e da sincronização não são a mesma coisa.
"""
from datetime import datetime
import enum

from sqlalchemy import String, Integer, DateTime, ForeignKey, Boolean, Float, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base
from models.pec_cadastro import OrigemDado


class StatusFilaVisita(str, enum.Enum):
    CRIADO_LOCALMENTE = "criado_localmente"
    SINCRONIZADO_ERSUS = "sincronizado_ersus"
    VALIDADO_ERSUS = "validado_ersus"
    PREPARADO_LEDI = "preparado_ledi"
    ENVIADO_PEC = "enviado_pec"
    RECEBIDO_PEC = "recebido_pec"
    PROCESSANDO_PEC = "processando_pec"
    ACEITO_PEC = "aceito_pec"
    REJEITADO_PEC = "rejeitado_pec"
    CORRIGIDO = "corrigido"
    REENVIADO = "reenviado"
    PROCESSADO_FLUXO_OFICIAL = "processado_fluxo_oficial"


class StatusLocalizacao(str, enum.Enum):
    CAPTURADA = "capturada"
    INDISPONIVEL = "indisponivel"
    DESATUALIZADA = "desatualizada"


class VisitaDomiciliar(Base):
    """Registro operacional de uma visita domiciliar de ACS (dado ERSUS 360, não oficial até aceito_pec)."""
    __tablename__ = "visitas_domiciliares"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    uuid_local: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    municipio_id: Mapped[int] = mapped_column(ForeignKey("municipios.id"), index=True)

    profissional_id: Mapped[int] = mapped_column(ForeignKey("pec_profissionais_saude.id"), index=True)
    equipe_id: Mapped[int] = mapped_column(ForeignKey("pec_equipes_saude.id"), index=True)
    microarea_id: Mapped[int] = mapped_column(ForeignKey("pec_microareas.id"), index=True)
    domicilio_id: Mapped[int] = mapped_column(ForeignKey("pec_domicilios.id"), index=True)
    cidadao_id: Mapped[int | None] = mapped_column(ForeignKey("pec_cidadaos.id"), nullable=True, index=True)

    # Campos oficiais MIVDT (ver services/pec/mivdt.py::MivdtVisitaPayload)
    motivo_visita: Mapped[str] = mapped_column(String(100))
    tipo_visita: Mapped[str] = mapped_column(String(50))
    acompanhamento_realizado: Mapped[str | None] = mapped_column(String(200), nullable=True)
    desfecho: Mapped[str | None] = mapped_column(String(100), nullable=True)
    visita_compartilhada: Mapped[bool] = mapped_column(Boolean, default=False)

    # Dados operacionais — nunca apresentados como oficiais (ver CLAUDE.md)
    data_hora_dispositivo: Mapped[datetime] = mapped_column(DateTime)
    data_hora_servidor: Mapped[datetime] = mapped_column(DateTime)
    duracao_segundos: Mapped[int | None] = mapped_column(Integer, nullable=True)
    latitude_visita: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude_visita: Mapped[float | None] = mapped_column(Float, nullable=True)
    precisao_gps_metros: Mapped[float | None] = mapped_column(Float, nullable=True)
    status_localizacao: Mapped[StatusLocalizacao] = mapped_column(
        SAEnum(StatusLocalizacao, name="status_localizacao_visita", create_constraint=True),
        default=StatusLocalizacao.INDISPONIVEL,
    )

    # Linha do tempo — cada marco é uma data distinta, nunca inferida
    data_registro: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    data_recebimento_ersus: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    data_envio_pec: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    data_processamento_pec: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    data_transmissao_fluxo_oficial: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    status_fila: Mapped[StatusFilaVisita] = mapped_column(
        SAEnum(StatusFilaVisita, name="status_fila_visita", create_constraint=True),
        default=StatusFilaVisita.CRIADO_LOCALMENTE,
    )
    ledi_version: Mapped[str | None] = mapped_column(String(20), nullable=True)
    mivdt_version: Mapped[str | None] = mapped_column(String(20), nullable=True)

    hash_controle: Mapped[str | None] = mapped_column(String(64), nullable=True)
    origem_dado: Mapped[OrigemDado] = mapped_column(
        SAEnum(OrigemDado, name="origem_dado_visita", create_constraint=True),
        default=OrigemDado.ERSUS_OPERACIONAL,
    )

    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    atualizado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    profissional: Mapped["ProfissionalSaude"] = relationship()
    equipe: Mapped["EquipeSaude"] = relationship()
    microarea: Mapped["Microarea"] = relationship()
    domicilio: Mapped["Domicilio"] = relationship()
    cidadao: Mapped["Cidadao | None"] = relationship()
    transmissoes: Mapped[list["VisitaTransmissao"]] = relationship(back_populates="visita")


class VisitaTransmissao(Base):
    """Histórico de tentativas de transmissão LEDI de uma visita ao PEC (auditável, nunca sobrescrito)."""
    __tablename__ = "visitas_transmissoes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    visita_id: Mapped[int] = mapped_column(ForeignKey("visitas_domiciliares.id"), index=True)

    uuid_ficha: Mapped[str] = mapped_column(String(64), index=True)
    ledi_version: Mapped[str] = mapped_column(String(20))
    mivdt_version: Mapped[str] = mapped_column(String(20))

    data_envio: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    codigo_http: Mapped[int | None] = mapped_column(Integer, nullable=True)
    lote_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    protocolo: Mapped[str | None] = mapped_column(String(64), nullable=True)
    resposta_tecnica: Mapped[str | None] = mapped_column(Text, nullable=True)     # JSON serializado
    criticas_validacao: Mapped[str | None] = mapped_column(Text, nullable=True)   # JSON serializado
    tentativas: Mapped[int] = mapped_column(Integer, default=1)
    data_aceitacao: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    visita: Mapped["VisitaDomiciliar"] = relationship(back_populates="transmissoes")
