"""
Model: Inconsistencia
Registro estruturado de cada inconsistência identificada no município.
Cada campo é obrigatório conforme a missão ERSUS 360.
"""
from __future__ import annotations
import enum
from datetime import datetime
from sqlalchemy import (
    String, Integer, DateTime, ForeignKey, Boolean,
    Text, Float, Enum as SAEnum, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class GravidadeInconsistencia(str, enum.Enum):
    CRITICA = "critica"
    ALTA    = "alta"
    MEDIA   = "media"
    BAIXA   = "baixa"


class SituacaoInconsistencia(str, enum.Enum):
    IDENTIFICADA    = "identificada"      # Detectada, aguardando análise
    EM_CORRECAO     = "em_correcao"       # Em correção pelo município
    CORRIGIDA       = "corrigida"         # Corrigida — aguardando confirmação na fonte
    ENCERRADA       = "encerrada"         # Confirmada oficialmente na fonte seguinte
    DESCARTADA      = "descartada"        # Descartada com justificativa


class Inconsistencia(Base):
    __tablename__ = "inconsistencias"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # Localização
    municipio_ibge: Mapped[str] = mapped_column(String(7), index=True)
    municipio_nome: Mapped[str] = mapped_column(String(100))
    municipio_uf:   Mapped[str] = mapped_column(String(2))
    competencia:    Mapped[str] = mapped_column(String(7))      # AAAAMM

    # Identificação
    programa:       Mapped[str]  = mapped_column(String(100))   # "CVAT", "Qualidade", "CNES", etc.
    componente:     Mapped[str]  = mapped_column(String(100))   # ex: "Componente Vínculo e Acompanhamento"
    descricao:      Mapped[str]  = mapped_column(Text)

    # Registros afetados
    cnes:           Mapped[str | None] = mapped_column(String(10), nullable=True)
    ine:            Mapped[str | None] = mapped_column(String(10), nullable=True)
    equipe_nome:    Mapped[str | None] = mapped_column(String(150), nullable=True)
    quantidade_afetada: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Evidência e fontes
    evidencia:      Mapped[str]  = mapped_column(Text)
    fontes_comparadas: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON list
    link_evidencia: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Análise
    causa_confirmada: Mapped[str | None]  = mapped_column(Text, nullable=True)
    risco_assistencial: Mapped[str | None] = mapped_column(Text, nullable=True)
    risco_financeiro:   Mapped[float | None] = mapped_column(Float, nullable=True)   # R$
    gravidade:      Mapped[str] = mapped_column(
        SAEnum(GravidadeInconsistencia, name="gravidade_inconsistencia"),
        default=GravidadeInconsistencia.MEDIA
    )

    # Correção
    sistema_correcao: Mapped[str | None] = mapped_column(String(100), nullable=True)
    procedimento:     Mapped[str | None] = mapped_column(Text, nullable=True)
    responsavel:      Mapped[str | None] = mapped_column(String(150), nullable=True)
    prazo:            Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    competencia_regularizacao: Mapped[str | None] = mapped_column(String(7), nullable=True)

    # Resolução
    evidencia_resolucao: Mapped[str | None] = mapped_column(Text, nullable=True)
    link_resolucao:      Mapped[str | None] = mapped_column(Text, nullable=True)
    resolvida_em:        Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Situação
    situacao: Mapped[str] = mapped_column(
        SAEnum(SituacaoInconsistencia, name="situacao_inconsistencia"),
        default=SituacaoInconsistencia.IDENTIFICADA,
        index=True
    )

    # Auditoria
    criado_em:      Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    atualizado_em:  Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    criado_por_id:  Mapped[int | None] = mapped_column(Integer, nullable=True)

    __table_args__ = (
        Index("ix_incons_municipio_comp", "municipio_ibge", "competencia"),
        Index("ix_incons_cnes_ine", "cnes", "ine"),
        Index("ix_incons_situacao", "situacao"),
    )
