"""
Model: ExtracaoRegistro + DataRecord
Rastreabilidade obrigatória de toda informação no ERSUS 360.

Todo número, indicador ou classificação apresentado ao usuário DEVE ter
um registro de proveniência aqui. Sem este registro o dado não pode ser exibido.

Regra: nunca exibir dado sem fonte, competência e data de consulta comprovados.
"""
from __future__ import annotations
import enum
from datetime import datetime
from sqlalchemy import (
    String, Integer, DateTime, ForeignKey, Boolean,
    Text, Float, Enum as SAEnum, UniqueConstraint, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class SituacaoDado(str, enum.Enum):
    """Classificação obrigatória de cada dado conforme a missão ERSUS 360."""
    OFICIAL_VALIDADO         = "oficial_validado"           # Extração real + processamento confirmado
    OFICIAL_AGUARDANDO       = "oficial_aguardando"         # Extração real, processamento em curso
    DIVERGENTE               = "divergente"                 # Fontes com valores diferentes
    REJEITADO                = "rejeitado"                  # Consta como rejeitado na fonte
    NAO_LOCALIZADO           = "nao_localizado"             # Buscado mas não encontrado
    NAO_DISPONIVEL           = "nao_disponivel"             # Fonte inacessível ou sem permissão
    ESTIMATIVA_AUTORIZADA    = "estimativa_autorizada"      # Estimativa explicitamente identificada
    DADO_NAO_VALIDADO        = "dado_nao_validado"          # Sem acesso ou relatório oficial


class MetodoExtracao(str, enum.Enum):
    API_OFICIAL          = "api_oficial"            # API pública ou autenticada oficial
    API_AUTENTICADA      = "api_autenticada"        # API com credenciais (gov.br / Bearer)
    ARQUIVO_IMPORTADO    = "arquivo_importado"      # Arquivo official exportado e importado
    DIGITACAO_MANUAL     = "digitacao_manual"       # Último recurso — digitação confirmada
    REFERENCIA_INTERNA   = "referencia_interna"     # Dado de referência, sem extração real
    CALCULO_DERIVADO     = "calculo_derivado"       # Calculado a partir de dados extraídos
    ESTIMATIVA           = "estimativa"             # Estimativa, sem base de extração real


class FonteSistema(str, enum.Enum):
    CNES_SCNES   = "CNES/SCNES"
    EGESTOR_APS  = "e-Gestor APS"
    SIAPS        = "SIAPS"
    ESUS_PEC     = "e-SUS PEC"
    CADSUS       = "CadSUS"
    FNS          = "FNS (Fundo Nacional de Saúde)"
    INVESTSUS    = "InvestSUS"
    SISAB        = "SISAB (histórico)"
    IBGE         = "IBGE"
    SIOPS        = "SIOPS"
    SISMOB       = "SISMOB"
    RNDS         = "RNDS"
    ERSUS360     = "ERSUS 360 (interno)"
    DESCONHECIDO = "Desconhecido"


class ExtracaoRegistro(Base):
    """
    Registro de cada extração de dados de uma fonte oficial.
    Uma extração pode conter múltiplos DataRecord.
    """
    __tablename__ = "extracoes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # Identificação do município
    municipio_ibge: Mapped[str] = mapped_column(String(7), index=True)
    municipio_nome: Mapped[str] = mapped_column(String(100))
    municipio_uf:   Mapped[str] = mapped_column(String(2))

    # Fonte
    fonte_sistema:  Mapped[str] = mapped_column(String(50))      # FonteSistema
    competencia:    Mapped[str] = mapped_column(String(7))        # AAAAMM
    url_consultada: Mapped[str | None]  = mapped_column(Text, nullable=True)
    metodo:         Mapped[str] = mapped_column(String(30))       # MetodoExtracao

    # Resultado
    sucesso:        Mapped[bool] = mapped_column(Boolean, default=False)
    status_http:    Mapped[int | None]  = mapped_column(Integer, nullable=True)
    erro_descricao: Mapped[str | None]  = mapped_column(Text, nullable=True)
    total_registros: Mapped[int] = mapped_column(Integer, default=0)

    # Rastreabilidade
    realizada_em:   Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    arquivo_original: Mapped[str | None] = mapped_column(Text, nullable=True)  # path ou hash
    hash_arquivo:   Mapped[str | None]  = mapped_column(String(64), nullable=True)  # SHA-256

    dados: Mapped[list["DataRecord"]] = relationship(back_populates="extracao", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_extracao_municipio_fonte_comp", "municipio_ibge", "fonte_sistema", "competencia"),
    )


class DataRecord(Base):
    """
    Cada dado individual com proveniência completa.
    Nunca misturar municípios diferentes nesta tabela.
    """
    __tablename__ = "data_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    extracao_id: Mapped[int] = mapped_column(ForeignKey("extracoes.id"), index=True)

    # Localização
    municipio_ibge: Mapped[str] = mapped_column(String(7), index=True)
    competencia:    Mapped[str] = mapped_column(String(7))      # AAAAMM
    cnes:           Mapped[str | None] = mapped_column(String(10), nullable=True)
    ine:            Mapped[str | None] = mapped_column(String(10), nullable=True)

    # Dado
    dominio:     Mapped[str] = mapped_column(String(80))    # "cvat", "qualidade", "cnes_equipe", etc.
    chave:       Mapped[str] = mapped_column(String(100))   # nome do campo/indicador
    valor_texto: Mapped[str | None] = mapped_column(Text, nullable=True)
    valor_num:   Mapped[float | None] = mapped_column(Float, nullable=True)

    # Classificação obrigatória
    situacao:       Mapped[str] = mapped_column(String(30), default=SituacaoDado.DADO_NAO_VALIDADO)
    fonte_sistema:  Mapped[str] = mapped_column(String(50))
    metodo:         Mapped[str] = mapped_column(String(30))
    link_evidencia: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Timestamps
    data_referencia: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)  # data do dado na fonte
    consultado_em:   Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    atualizado_em:   Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    extracao: Mapped["ExtracaoRegistro"] = relationship(back_populates="dados")

    __table_args__ = (
        Index("ix_dr_municipio_dominio_comp", "municipio_ibge", "dominio", "competencia"),
        Index("ix_dr_cnes_ine", "cnes", "ine"),
    )
