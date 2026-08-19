"""
Modelo: TransferenciaFns
Armazena transferências fundo a fundo do Fundo Nacional de Saúde (FNS)
obtidas da fonte oficial consultafns.saude.gov.br ou Portal da Transparência.

Princípios:
- Chave única por transferência para impedir duplicidade
- Histórico de alterações preservado (nunca apaga versão anterior)
- Link opcional com parcela do e-Gestor APS para conciliação
- Zero inventado: campos nullable quando fonte não informar
"""
from __future__ import annotations
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Numeric, Date, DateTime, Boolean,
    Text, JSON, UniqueConstraint, Index,
)
from database import Base


class TransferenciaFns(Base):
    __tablename__ = "transferencias_fns"

    # ── Chave primária e identificação ────────────────────────────────────────
    id            = Column(Integer, primary_key=True, autoincrement=True)
    chave_unica   = Column(String(120), unique=True, nullable=False, index=True,
                           comment="Hash determinístico: IBGE+exercicio+mes+bloco+grupo+acao+acao_detalhada+valor_liquido")

    # ── Município ─────────────────────────────────────────────────────────────
    municipio_ibge = Column(String(7), nullable=False, index=True)
    municipio_nome = Column(String(100), nullable=True)
    uf             = Column(String(2), nullable=True)
    cnpj_fundo     = Column(String(18), nullable=True)

    # ── Período ───────────────────────────────────────────────────────────────
    exercicio      = Column(Integer, nullable=False, index=True)
    mes            = Column(Integer, nullable=True)           # 1–12
    data_pagamento = Column(Date,    nullable=True, index=True)
    competencia    = Column(String(7), nullable=True, index=True)  # "YYYY/MM"

    # ── Classificação financeira (campos oficiais do FNS) ─────────────────────
    bloco          = Column(String(200), nullable=True)
    grupo          = Column(String(200), nullable=True)
    acao           = Column(String(400), nullable=True)
    acao_detalhada = Column(String(500), nullable=True)

    # ── Tipo de incentivo (classificação ERSUS360) ────────────────────────────
    tipo_incentivo = Column(String(60),  nullable=True, index=True)

    # ── Identificadores oficiais ───────────────────────────────────────────────
    numero_proposta = Column(String(60), nullable=True)
    numero_processo = Column(String(60), nullable=True)
    numero_portaria = Column(String(60), nullable=True)
    numero_ob       = Column(String(60), nullable=True)   # ordem bancária
    conta_bancaria  = Column(String(60), nullable=True)

    # ── Dados bancários da OB (detalhamento fundo a fundo) ────────────────────
    banco_ob         = Column(String(10),  nullable=True, comment="Código do banco da OB (ex: 001)")
    agencia_ob       = Column(String(20),  nullable=True, comment="Agência bancária da OB (ex: 009261)")
    numero_conta_ob  = Column(String(30),  nullable=True, comment="Número da conta bancária da OB")
    data_ob          = Column(Date,        nullable=True, comment="Data da Ordem Bancária")

    # ── Valores (Numeric 14,2 — nunca Float para dinheiro) ────────────────────
    valor_total     = Column(Numeric(14, 2), nullable=True)
    valor_desconto  = Column(Numeric(14, 2), nullable=True, default=0)
    valor_liquido   = Column(Numeric(14, 2), nullable=True)

    # ── Situação ──────────────────────────────────────────────────────────────
    situacao        = Column(String(60), nullable=True)

    # ── Proveniência ──────────────────────────────────────────────────────────
    fonte           = Column(String(40), nullable=False)  # "consultafns" | "transparencia"
    url_consultada  = Column(Text, nullable=True)
    pagina_coleta   = Column(Integer, nullable=True)
    data_coleta     = Column(DateTime, default=datetime.utcnow, nullable=False)

    # ── Conciliação com e-Gestor APS ──────────────────────────────────────────
    nu_parcela_egestor    = Column(String(10), nullable=True, index=True)
    status_conciliacao    = Column(String(40), nullable=True)
    diferenca_valor       = Column(Numeric(14, 2), nullable=True)
    nota_conciliacao      = Column(Text, nullable=True)

    # ── Histórico de alterações ───────────────────────────────────────────────
    historico       = Column(JSON, nullable=True, default=list,
                             comment="Lista de {'data', 'campo', 'valor_anterior', 'valor_novo', 'fonte'}")

    # ── Controle ──────────────────────────────────────────────────────────────
    ativo           = Column(Boolean, default=True, nullable=False)
    criado_em       = Column(DateTime, default=datetime.utcnow, nullable=False)
    atualizado_em   = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("chave_unica", name="uq_transferencia_fns_chave"),
        Index("ix_tfns_ibge_exercicio", "municipio_ibge", "exercicio"),
        Index("ix_tfns_tipo_mes", "tipo_incentivo", "mes", "exercicio"),
    )

    def __repr__(self):
        return f"<TransferenciaFns {self.exercicio}/{self.mes} {self.tipo_incentivo} R${self.valor_liquido}>"


class ColetaFns(Base):
    """
    Registro de cada execução de coleta do FNS.
    Permite auditar quantas páginas foram coletadas e se o total confere.
    """
    __tablename__ = "coletas_fns"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    municipio_ibge  = Column(String(7), nullable=False, index=True)
    exercicio       = Column(Integer, nullable=False)
    mes             = Column(Integer, nullable=True)
    competencia     = Column(String(7), nullable=True)

    # resultado
    total_paginas     = Column(Integer, nullable=True)
    total_registros   = Column(Integer, nullable=True)  # retornado pela fonte
    registros_coletados = Column(Integer, nullable=True)
    total_oficial_bruto = Column(Numeric(14, 2), nullable=True)
    total_coletado_bruto = Column(Numeric(14, 2), nullable=True)
    divergencia_total  = Column(Numeric(14, 2), nullable=True)
    todas_paginas_ok   = Column(Boolean, nullable=True)

    fonte           = Column(String(40), nullable=True)
    sucesso         = Column(Boolean, default=False)
    mensagem_erro   = Column(Text, nullable=True)
    iniciado_em     = Column(DateTime, default=datetime.utcnow)
    concluido_em    = Column(DateTime, nullable=True)
