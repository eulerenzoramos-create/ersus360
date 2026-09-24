"""
Origem dos recursos FNS — Ministério da Saúde × Emendas Parlamentares.

O FNS soma, dentro do mesmo grupo (Atenção Primária, MAC…), o repasse regular
do Ministério e o que veio de emenda parlamentar. O detalhamento por pagamento
(consultafns detalhe-pagamento) identifica a emenda ("EMENDA - INCREMENTO
TEMPORÁRIO…") e o nº da proposta, mas NÃO informa o tipo da emenda.

  - FnsPagamentoDetalhe: espelho informativo de cada pagamento do detalhamento
    oficial (por OB/proposta). Serve só para compor a origem; nunca é somado aos
    totais do Controle Financeiro (esses continuam vindo de transferencias_fns).
  - FnsPropostaOrigem: classificação da proposta pela Secretaria (individual,
    bancada, comissão, programa do MS), com autor da classificação.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint

from database import Base


class FnsPagamentoDetalhe(Base):
    __tablename__ = "fns_pagamentos_detalhe"
    __table_args__ = (UniqueConstraint("chave", name="uq_fns_pag_det_chave"),)

    id             = Column(Integer, primary_key=True, autoincrement=True)
    chave          = Column(String(200), nullable=False)
    municipio_ibge = Column(String(7), nullable=False, index=True)
    exercicio      = Column(Integer, nullable=False, index=True)
    mes            = Column(Integer, nullable=False)
    grupo          = Column(String(200), nullable=True)      # grupo normalizado (Atenção Primária, MAC…)
    componente     = Column(String(500), nullable=True)      # programaFundo.descricao
    numero_ob      = Column(String(60), nullable=True)
    numero_portaria = Column(String(60), nullable=True)
    numero_proposta = Column(String(60), nullable=True, index=True)
    parcela_fns    = Column(String(40), nullable=True)
    valor_liquido  = Column(Numeric(14, 2), nullable=True)
    origem         = Column(String(20), nullable=False)      # emenda | proposta | ministerio
    data_ob        = Column(String(10), nullable=True)
    atualizado_em  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class FnsPropostaOrigem(Base):
    __tablename__ = "fns_propostas_origem"
    __table_args__ = (UniqueConstraint("municipio_id", "numero_proposta", name="uq_fns_prop_origem"),)

    id              = Column(Integer, primary_key=True, autoincrement=True)
    municipio_id    = Column(Integer, ForeignKey("municipios.id"), nullable=False, index=True)
    numero_proposta = Column(String(60), nullable=False)
    tipo            = Column(String(20), nullable=False)     # individual | bancada | comissao | programa_ms
    parlamentar     = Column(String(200), nullable=True)
    numero_emenda   = Column(String(60), nullable=True)
    observacao      = Column(Text, nullable=True)
    classificado_por = Column(String(200), nullable=True)
    classificado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
