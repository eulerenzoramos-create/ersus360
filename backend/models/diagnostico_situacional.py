"""
Diagnóstico Situacional da Saúde Municipal — um diagnóstico por município × exercício × período.

  diag_diagnostico   cabeçalho (município, exercício, período, situação, responsável técnico)
  diag_item          um item do checklist (catálogo em services/diagnostico_catalogo.py) com a
                     classificação, a fonte, a competência, a evidência e a justificativa
  diag_historico     trilha de cada mudança no item (só acrescenta, nunca altera)
  diag_anexo         evidência anexada pelo técnico (arquivo na pasta do município)
  diag_acao          ação do plano 5W2H, sempre ligada a um problema validado

Regras (ver services/diagnostico_fontes.py): ausência de dado = "nao_verificado", nunca irregularidade;
coleta automática só reescreve item automático ainda não validado; origem do dado (automático ou
declarado) e validação técnica (pendente, confirmado, contestado) ficam separadas.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import (Boolean, Column, Date, DateTime, Float, ForeignKey, Index, Integer, String, Text,
                        UniqueConstraint)

from database import Base


class DiagDiagnostico(Base):
    __tablename__ = "diag_diagnostico"
    __table_args__ = (
        UniqueConstraint("municipio_id", "exercicio", "periodo_tipo", "periodo", name="uq_diag_periodo"),
    )

    id            = Column(Integer, primary_key=True, autoincrement=True)
    municipio_id  = Column(Integer, ForeignKey("municipios.id"), nullable=False, index=True)
    exercicio     = Column(Integer, nullable=False)
    periodo_tipo  = Column(String(12), nullable=False)          # anual | quadrimestre | semestre
    periodo       = Column(Integer, nullable=False, default=0)  # 0 (anual), 1–3, 1–2
    situacao      = Column(String(20), nullable=False, default="em_elaboracao")  # em_elaboracao | em_validacao | concluido
    responsavel_tecnico = Column(String(150), nullable=True)
    objetivo      = Column(Text, nullable=True)
    observacoes   = Column(Text, nullable=True)
    ultima_coleta = Column(DateTime, nullable=True)
    criado_por    = Column(String(200), nullable=True)
    criado_em     = Column(DateTime, default=datetime.utcnow, nullable=False)
    concluido_por = Column(String(200), nullable=True)
    concluido_em  = Column(DateTime, nullable=True)


class DiagItem(Base):
    __tablename__ = "diag_item"
    __table_args__ = (
        UniqueConstraint("diagnostico_id", "codigo", name="uq_diag_item"),
        Index("ix_diag_item_mun", "municipio_id", "diagnostico_id"),
    )

    id             = Column(Integer, primary_key=True, autoincrement=True)
    diagnostico_id = Column(Integer, ForeignKey("diag_diagnostico.id"), nullable=False)
    municipio_id   = Column(Integer, ForeignKey("municipios.id"), nullable=False)
    area           = Column(String(1), nullable=False)          # A–I
    codigo         = Column(String(10), nullable=False)         # ex.: G01
    classificacao  = Column(String(20), nullable=False, default="nao_verificado")
    origem         = Column(String(12), nullable=False, default="automatico")    # automatico | declarado
    natureza       = Column(String(12), nullable=True)          # comprovado | hipotese
    validacao      = Column(String(12), nullable=False, default="pendente")      # pendente | confirmado | contestado
    fonte          = Column(String(300), nullable=True)
    competencia    = Column(String(40), nullable=True)          # competência do dado na fonte
    evidencia      = Column(Text, nullable=True)
    data_referencia = Column(Date, nullable=True)               # data do dado (fonte) ou da declaração
    justificativa  = Column(Text, nullable=True)
    detalhes       = Column(Text, nullable=True)                # JSON com o resumo da fonte
    prioridade     = Column(String(10), nullable=True)          # alta | media | baixa
    responsavel    = Column(String(150), nullable=True)
    observacoes    = Column(Text, nullable=True)
    vazio_assistencial = Column(Boolean, nullable=False, default=False)
    validado_por   = Column(String(200), nullable=True)
    validado_em    = Column(DateTime, nullable=True)
    atualizado_por = Column(String(200), nullable=True)
    atualizado_em  = Column(DateTime, default=datetime.utcnow, nullable=False)


class DiagHistorico(Base):
    __tablename__ = "diag_historico"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    item_id       = Column(Integer, ForeignKey("diag_item.id"), nullable=False, index=True)
    municipio_id  = Column(Integer, ForeignKey("municipios.id"), nullable=False, index=True)
    evento        = Column(String(20), nullable=False)          # coleta | edicao | validacao | anexo | acao
    descricao     = Column(Text, nullable=False)
    usuario       = Column(String(200), nullable=True)
    criado_em     = Column(DateTime, default=datetime.utcnow, nullable=False)


class DiagAnexo(Base):
    __tablename__ = "diag_anexo"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    item_id       = Column(Integer, ForeignKey("diag_item.id"), nullable=False, index=True)
    municipio_id  = Column(Integer, ForeignKey("municipios.id"), nullable=False, index=True)
    nome_original = Column(String(255), nullable=False)
    caminho       = Column(String(500), nullable=False)          # relativo à pasta do município
    tamanho       = Column(Integer, nullable=False)
    descricao     = Column(String(300), nullable=True)
    enviado_por   = Column(String(200), nullable=True)
    enviado_em    = Column(DateTime, default=datetime.utcnow, nullable=False)
    excluido_em   = Column(DateTime, nullable=True)


class DiagAcao(Base):
    __tablename__ = "diag_acao"

    id             = Column(Integer, primary_key=True, autoincrement=True)
    diagnostico_id = Column(Integer, ForeignKey("diag_diagnostico.id"), nullable=False, index=True)
    item_id        = Column(Integer, ForeignKey("diag_item.id"), nullable=False, index=True)
    municipio_id   = Column(Integer, ForeignKey("municipios.id"), nullable=False, index=True)
    o_que          = Column(Text, nullable=False)       # What
    por_que        = Column(Text, nullable=True)        # Why
    onde           = Column(String(300), nullable=True) # Where
    quando         = Column(Date, nullable=True)        # When (prazo)
    quem           = Column(String(200), nullable=True) # Who
    como           = Column(Text, nullable=True)        # How
    quanto         = Column(Float, nullable=True)       # How much (R$) — vazio quando não estimado
    quanto_texto   = Column(String(300), nullable=True) # fonte do recurso / observação do custo
    produto        = Column(String(300), nullable=True)
    indicador      = Column(String(300), nullable=True)
    evidencia      = Column(Text, nullable=True)
    prioridade     = Column(String(10), nullable=True)  # alta | media | baixa
    status         = Column(String(20), nullable=False, default="nao_iniciada")  # nao_iniciada | em_andamento | concluida | cancelada
    criado_por     = Column(String(200), nullable=True)
    criado_em      = Column(DateTime, default=datetime.utcnow, nullable=False)
    atualizado_por = Column(String(200), nullable=True)
    atualizado_em  = Column(DateTime, default=datetime.utcnow, nullable=False)
    excluido_em    = Column(DateTime, nullable=True)
