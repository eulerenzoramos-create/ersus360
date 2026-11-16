"""
Agente de análise das Portarias do FNS — resultados guardados.

Nada aqui altera transferencias_fns: a análise só LÊ as transferências e grava a classificação ao lado.

  - FnsPortariaAnalise: uma linha por (município, exercício, portaria). Guarda a análise completa (JSON),
    o hash dos dados de entrada (se as transferências ou a base normativa mudarem, a análise é refeita e a
    validação do gestor cai) e a data da última verificação.
  - FnsNormaVerificacao: resultado da conferência periódica do texto oficial de cada dispositivo usado.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, Integer, Numeric, String, Text, UniqueConstraint

from database import Base


class FnsPortariaAnalise(Base):
    __tablename__ = "fns_portaria_analise"
    __table_args__ = (UniqueConstraint("municipio_ibge", "exercicio", "numero_portaria",
                                       name="uq_fns_portaria_analise"),)

    id              = Column(Integer, primary_key=True, autoincrement=True)
    municipio_ibge  = Column(String(7), nullable=False, index=True)
    exercicio       = Column(Integer, nullable=False, index=True)
    numero_portaria = Column(String(60), nullable=False)          # "Sem portaria" para repasses sem número
    naturezas       = Column(String(80), nullable=True)           # ex.: "CUSTEIO" ou "CUSTEIO,INVESTIMENTO"
    situacao        = Column(String(30), nullable=False)          # preliminar | pendente_confirmacao | validada
    total_liquido   = Column(Numeric(14, 2), nullable=True)
    qtd_transferencias = Column(Integer, nullable=True)
    resultado       = Column(JSON, nullable=False)
    hash_entrada    = Column(String(64), nullable=False)
    verificado_em   = Column(DateTime, default=datetime.utcnow, nullable=False)
    validado_por    = Column(String(200), nullable=True)
    validado_em     = Column(DateTime, nullable=True)
    nota_validacao  = Column(Text, nullable=True)
    atualizado_em   = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class FnsNormaVerificacao(Base):
    __tablename__ = "fns_norma_verificacao"
    __table_args__ = (UniqueConstraint("dispositivo", name="uq_fns_norma_verif"),)

    id            = Column(Integer, primary_key=True, autoincrement=True)
    dispositivo   = Column(String(40), nullable=False)            # chave em DISPOSITIVOS
    confere       = Column(Boolean, nullable=True)                # None = página indisponível
    detalhe       = Column(Text, nullable=True)
    verificado_em = Column(DateTime, default=datetime.utcnow, nullable=False)


class FnsPortariaAnaliseVersao(Base):
    """Histórico: cada vez que a análise de uma portaria é refeita, a versão anterior fica guardada aqui
    (com a validação que tinha), para auditoria. Nunca é apagada pelo sistema."""
    __tablename__ = "fns_portaria_analise_versao"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    analise_id      = Column(Integer, nullable=False, index=True)
    municipio_ibge  = Column(String(7), nullable=False, index=True)
    exercicio       = Column(Integer, nullable=False)
    numero_portaria = Column(String(60), nullable=False)
    resultado       = Column(JSON, nullable=False)
    hash_entrada    = Column(String(64), nullable=True)
    estado          = Column(String(40), nullable=True)
    validado_por    = Column(String(200), nullable=True)
    validado_em     = Column(DateTime, nullable=True)
    motivo          = Column(Text, nullable=True)
    arquivado_em    = Column(DateTime, default=datetime.utcnow, nullable=False)
