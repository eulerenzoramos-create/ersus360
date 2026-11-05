"""
Models: InvestSUS — Execução Financeira dos Planos de Trabalho

Uma ficha por proposta (is_propostas). Valor aprovado e repasses do FNS vêm sempre da
proposta e de is_pagamentos (dados oficiais sincronizados) — nunca são redigitados aqui.
Esta camada guarda só o que o município executa: ações do plano (previsto original
preservado + previsto atualizado), lançamentos de empenho/liquidação/pagamento,
movimentos da conta vinculada (saldo inicial, rendimentos, devoluções), documentos e
trilha de auditoria. Registro financeiro nunca é apagado: é cancelado ou estornado.
"""
from __future__ import annotations
from datetime import date, datetime
from sqlalchemy import String, Integer, Float, DateTime, Date, Text, ForeignKey, Boolean, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


# Origem do dado — exibida em toda tela/relatório; manual nunca aparece como oficial.
ORIGENS_DADO = ("oficial", "importado", "manual")
# Validação pelo gestor municipal.
STATUS_VALIDACAO = ("pendente", "validado", "rejeitado")


class FichaExecucao(Base):
    __tablename__ = "is_exec_fichas"
    __table_args__ = (
        Index("ix_is_exec_fichas_proposta", "proposta_id", unique=True),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    municipio_id: Mapped[int] = mapped_column(ForeignKey("municipios.id"), index=True)
    proposta_id: Mapped[int] = mapped_column(ForeignKey("is_propostas.id"))

    # Classificação: nulo = derivada automaticamente da proposta (services/investsus_execucao.py)
    origem_recurso: Mapped[str | None] = mapped_column(String(30), nullable=True)   # rp6 | rp7 | rp8 | programa | outros_federais
    destinacao: Mapped[str | None] = mapped_column(String(30), nullable=True)       # aps_pap | mac | outra
    programa_acao: Mapped[str | None] = mapped_column(String(300), nullable=True)

    conta_bancaria: Mapped[str | None] = mapped_column(String(200), nullable=True)
    situacao_plano: Mapped[str | None] = mapped_column(String(40), nullable=True)   # nao_cadastrado | em_elaboracao | aprovado | em_execucao | concluido
    prazo_execucao: Mapped[date | None] = mapped_column(Date, nullable=True)
    responsavel: Mapped[str | None] = mapped_column(String(200), nullable=True)
    observacoes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Conciliação: saldo do extrato bancário informado pelo município (manual)
    saldo_extrato: Mapped[float | None] = mapped_column(Float, nullable=True)
    saldo_extrato_data: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Plano aprovado "travado": a partir daí o previsto só muda com justificativa + autorização
    plano_aprovado_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    plano_aprovado_por: Mapped[str | None] = mapped_column(String(100), nullable=True)

    criado_por: Mapped[str | None] = mapped_column(String(100), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    atualizado_por: Mapped[str | None] = mapped_column(String(100), nullable=True)
    atualizado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    acoes: Mapped[list["AcaoExecucao"]] = relationship(back_populates="ficha", order_by="AcaoExecucao.ordem")
    lancamentos: Mapped[list["LancamentoExecucao"]] = relationship(back_populates="ficha")
    movimentos: Mapped[list["MovimentoFinanceiro"]] = relationship(back_populates="ficha")


class AcaoExecucao(Base):
    """Linha da planilha: uma ação/despesa do plano de trabalho aprovado."""
    __tablename__ = "is_exec_acoes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ficha_id: Mapped[int] = mapped_column(ForeignKey("is_exec_fichas.id"), index=True)
    municipio_id: Mapped[int] = mapped_column(ForeignKey("municipios.id"), index=True)
    ordem: Mapped[int] = mapped_column(Integer, default=0)
    descricao: Mapped[str] = mapped_column(String(300))
    # Finalidade/meta do plano que agrupa as ações (ex.: "Ambientes saudáveis e estilos de
    # vida ativos na APS") — vem do caminho da meta no plano do InvestSUS.
    grupo: Mapped[str | None] = mapped_column(String(300), nullable=True)
    detalhamento: Mapped[str | None] = mapped_column(Text, nullable=True)
    natureza_despesa: Mapped[str | None] = mapped_column(String(20), nullable=True)  # ex.: 339030
    quantidade: Mapped[float | None] = mapped_column(Float, nullable=True)
    unidade: Mapped[str | None] = mapped_column(String(50), nullable=True)
    valor_unitario: Mapped[float | None] = mapped_column(Float, nullable=True)
    # Referência original do plano aprovado — gravada na criação/importação e nunca alterada.
    valor_previsto_original: Mapped[float] = mapped_column(Float, default=0.0)
    valor_previsto_atual: Mapped[float] = mapped_column(Float, default=0.0)
    origem_dado: Mapped[str] = mapped_column(String(20), default="manual")
    # Ação/meta importada do plano do InvestSUS — evita importar duas vezes.
    acao_servico_id: Mapped[int | None] = mapped_column(ForeignKey("is_acoes_servicos.id"), nullable=True, index=True)
    natureza_id: Mapped[int | None] = mapped_column(ForeignKey("is_naturezas_despesa.id"), nullable=True, index=True)
    ativa: Mapped[bool] = mapped_column(Boolean, default=True)
    motivo_inativacao: Mapped[str | None] = mapped_column(Text, nullable=True)
    criado_por: Mapped[str | None] = mapped_column(String(100), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    ficha: Mapped["FichaExecucao"] = relationship(back_populates="acoes")
    lancamentos: Mapped[list["LancamentoExecucao"]] = relationship(back_populates="acao")


class LancamentoExecucao(Base):
    """Empenho, liquidação ou pagamento (e respectivas anulações/estornos) de uma ação.

    `chave_dedup` identifica o documento (tipo + número, ou tipo + data + valor + fornecedor
    quando não há número); índice único impede contar a mesma despesa duas vezes. Ao
    cancelar, a chave vai para `chave_cancelada` e o lançamento deixa de somar.
    """
    __tablename__ = "is_exec_lancamentos"
    __table_args__ = (
        Index("ix_is_exec_lanc_dedup", "ficha_id", "chave_dedup", unique=True),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ficha_id: Mapped[int] = mapped_column(ForeignKey("is_exec_fichas.id"), index=True)
    acao_id: Mapped[int] = mapped_column(ForeignKey("is_exec_acoes.id"), index=True)
    municipio_id: Mapped[int] = mapped_column(ForeignKey("municipios.id"), index=True)
    # empenho | anulacao_empenho | liquidacao | estorno_liquidacao | pagamento | estorno_pagamento
    # | nota_fiscal | estorno_nota_fiscal (controle simplificado: NF paga baixa os três estágios)
    tipo: Mapped[str] = mapped_column(String(30))
    # Elemento de despesa baixado (ex.: 339030); vazio = natureza da ação
    natureza_despesa: Mapped[str | None] = mapped_column(String(20), nullable=True)
    data: Mapped[date] = mapped_column(Date)
    valor: Mapped[float] = mapped_column(Float)
    fornecedor: Mapped[str | None] = mapped_column(String(300), nullable=True)
    fornecedor_documento: Mapped[str | None] = mapped_column(String(20), nullable=True)  # CNPJ do fornecedor
    numero_empenho: Mapped[str | None] = mapped_column(String(60), nullable=True)
    numero_liquidacao: Mapped[str | None] = mapped_column(String(60), nullable=True)
    ordem_bancaria: Mapped[str | None] = mapped_column(String(60), nullable=True)
    documento_comprobatorio: Mapped[str | None] = mapped_column(String(200), nullable=True)  # NF, contrato…
    historico: Mapped[str | None] = mapped_column(Text, nullable=True)
    origem_dado: Mapped[str] = mapped_column(String(20), default="manual")
    status_validacao: Mapped[str] = mapped_column(String(20), default="pendente")
    validado_por: Mapped[str | None] = mapped_column(String(100), nullable=True)
    validado_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    chave_dedup: Mapped[str | None] = mapped_column(String(300), nullable=True)
    chave_cancelada: Mapped[str | None] = mapped_column(String(300), nullable=True)
    cancelado: Mapped[bool] = mapped_column(Boolean, default=False)
    cancelado_motivo: Mapped[str | None] = mapped_column(Text, nullable=True)
    cancelado_por: Mapped[str | None] = mapped_column(String(100), nullable=True)
    cancelado_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    criado_por: Mapped[str | None] = mapped_column(String(100), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    ficha: Mapped["FichaExecucao"] = relationship(back_populates="lancamentos")
    acao: Mapped["AcaoExecucao"] = relationship(back_populates="lancamentos")


class MovimentoFinanceiro(Base):
    """Movimento da conta vinculada que não é repasse do FNS nem pagamento de ação."""
    __tablename__ = "is_exec_movimentos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ficha_id: Mapped[int] = mapped_column(ForeignKey("is_exec_fichas.id"), index=True)
    municipio_id: Mapped[int] = mapped_column(ForeignKey("municipios.id"), index=True)
    tipo: Mapped[str] = mapped_column(String(30))  # saldo_inicial | rendimento | devolucao | outra_saida
    data: Mapped[date] = mapped_column(Date)
    valor: Mapped[float] = mapped_column(Float)
    descricao: Mapped[str | None] = mapped_column(String(300), nullable=True)
    documento: Mapped[str | None] = mapped_column(String(200), nullable=True)
    origem_dado: Mapped[str] = mapped_column(String(20), default="manual")
    status_validacao: Mapped[str] = mapped_column(String(20), default="pendente")
    cancelado: Mapped[bool] = mapped_column(Boolean, default=False)
    cancelado_motivo: Mapped[str | None] = mapped_column(Text, nullable=True)
    cancelado_por: Mapped[str | None] = mapped_column(String(100), nullable=True)
    criado_por: Mapped[str | None] = mapped_column(String(100), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    ficha: Mapped["FichaExecucao"] = relationship(back_populates="movimentos")


class DocumentoExecucao(Base):
    """Anexo da ficha (plano aprovado, espelho) ou de um lançamento (NF, contrato, comprovante)."""
    __tablename__ = "is_exec_documentos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ficha_id: Mapped[int] = mapped_column(ForeignKey("is_exec_fichas.id"), index=True)
    municipio_id: Mapped[int] = mapped_column(ForeignKey("municipios.id"), index=True)
    lancamento_id: Mapped[int | None] = mapped_column(ForeignKey("is_exec_lancamentos.id"), nullable=True, index=True)
    # plano_aprovado | espelho_proposta | nota_fiscal | contrato | comprovante | extrato | outro
    tipo: Mapped[str] = mapped_column(String(40))
    nome_original: Mapped[str] = mapped_column(String(300))
    caminho: Mapped[str] = mapped_column(String(500))
    tamanho: Mapped[int] = mapped_column(Integer, default=0)
    hash_sha256: Mapped[str] = mapped_column(String(64))
    descricao: Mapped[str | None] = mapped_column(String(300), nullable=True)
    enviado_por: Mapped[str | None] = mapped_column(String(100), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    excluido_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    excluido_por: Mapped[str | None] = mapped_column(String(100), nullable=True)


class AuditoriaExecucao(Base):
    """Trilha campo a campo: quem, quando, valor anterior, valor novo e justificativa."""
    __tablename__ = "is_exec_auditoria"
    __table_args__ = (
        Index("ix_is_exec_aud_ficha", "ficha_id", "criado_em"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ficha_id: Mapped[int] = mapped_column(ForeignKey("is_exec_fichas.id"))
    municipio_id: Mapped[int] = mapped_column(ForeignKey("municipios.id"), index=True)
    entidade: Mapped[str] = mapped_column(String(30))  # ficha | acao | lancamento | movimento | documento
    entidade_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    evento: Mapped[str] = mapped_column(String(40))    # criacao | alteracao | cancelamento | validacao | importacao | anexo
    campo: Mapped[str | None] = mapped_column(String(60), nullable=True)
    valor_anterior: Mapped[str | None] = mapped_column(Text, nullable=True)
    valor_novo: Mapped[str | None] = mapped_column(Text, nullable=True)
    justificativa: Mapped[str | None] = mapped_column(Text, nullable=True)
    autorizacao: Mapped[str | None] = mapped_column(String(300), nullable=True)  # ofício/portaria que autorizou a alteração do plano
    usuario: Mapped[str | None] = mapped_column(String(100), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
