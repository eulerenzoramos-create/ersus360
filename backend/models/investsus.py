"""
Models: InvestSUS — Emendas, Propostas e Execução
Ciclo completo: indicação → proposta → aprovação → empenho → formalização → pagamento → execução → PC
"""
from __future__ import annotations
from datetime import date, datetime
from sqlalchemy import (
    String, Integer, Float, DateTime, Date, Text,
    ForeignKey, Boolean, JSON, Enum as SAEnum, Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from database import Base


# ── Enums parametrizáveis ─────────────────────────────────────────────────────

class TipoEmenda(str, enum.Enum):
    INDIVIDUAL = "individual"
    BANCADA = "bancada"
    COMISSAO = "comissao"
    COLETIVA = "coletiva"
    PROGRAMACAO = "programacao"
    PROGRAMA = "programa"
    OUTRO = "outro"


class SituacaoNormalizada(str, enum.Enum):
    RECURSO_DISPONIVEL = "recurso_disponivel"
    RECURSO_PROGRAMADO = "recurso_programado"
    INDICACAO_PARLAMENTAR = "indicacao_parlamentar"
    BENEFICIARIO_INDICADO = "beneficiario_indicado"
    PRAZO_CADASTRAMENTO = "prazo_cadastramento"
    PROPOSTA_ELABORACAO = "proposta_elaboracao"
    PROPOSTA_CADASTRADA = "proposta_cadastrada"
    PROPOSTA_ENVIADA = "proposta_enviada"
    EM_ANALISE = "em_analise"
    EM_DILIGENCIA = "em_diligencia"
    AGUARDANDO_COMPLEMENTACAO = "aguardando_complementacao"
    COMPLEMENTACAO_ENVIADA = "complementacao_enviada"
    EM_REANALIZE = "em_reanalize"
    APROVADA = "aprovada"
    REJEITADA = "rejeitada"
    CANCELADA = "cancelada"
    EMPENHADA = "empenhada"
    EMPENHADA_AGUARDANDO_FORMALIZACAO = "empenhada_aguardando_formalizacao"
    FORMALIZADA = "formalizada"
    PORTARIA_PUBLICADA = "portaria_publicada"
    AGUARDANDO_PAGAMENTO = "aguardando_pagamento"
    PARCIALMENTE_PAGA = "parcialmente_paga"
    TOTALMENTE_PAGA = "totalmente_paga"
    EXECUCAO_NAO_INICIADA = "execucao_nao_iniciada"
    EM_EXECUCAO = "em_execucao"
    EXECUCAO_ATRASADA = "execucao_atrasada"
    EXECUCAO_PARALISADA = "execucao_paralisada"
    EXECUCAO_FISICA_CONCLUIDA = "execucao_fisica_concluida"
    EXECUCAO_FINANCEIRA_CONCLUIDA = "execucao_financeira_concluida"
    MONITORAMENTO_PENDENTE = "monitoramento_pendente"
    MONITORAMENTO_PREENCHIDO = "monitoramento_preenchido"
    PRESTACAO_CONTAS_PENDENTE = "prestacao_contas_pendente"
    PRESTACAO_CONTAS_ENVIADA = "prestacao_contas_enviada"
    DEVOLUCAO_SALDO_PENDENTE = "devolucao_saldo_pendente"
    INSTRUMENTO_CONCLUIDO = "instrumento_concluido"


class NivelAlertaInvest(str, enum.Enum):
    INFORMATIVO = "informativo"
    ATENCAO = "atencao"
    URGENTE = "urgente"
    CRITICO = "critico"


class TipoParecer(str, enum.Enum):
    MERITO = "merito"
    TECNICO = "tecnico"
    JURIDICO = "juridico"
    FINANCEIRO = "financeiro"
    COMPLEMENTAR = "complementar"


class ResultadoParecer(str, enum.Enum):
    FAVORAVEL = "favoravel"
    DESFAVORAVEL = "desfavoravel"
    DILIGENCIA = "diligencia"
    PENDENTE = "pendente"


class OrigemAtualizacao(str, enum.Enum):
    MANUAL = "manual"
    IMPORTACAO_CSV = "importacao_csv"
    IMPORTACAO_PDF = "importacao_pdf"
    SISTEMA = "sistema"


# ── Parlamentar ───────────────────────────────────────────────────────────────

class Parlamentar(Base):
    __tablename__ = "is_parlamentares"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(200), index=True)
    partido: Mapped[str | None] = mapped_column(String(50), nullable=True)
    uf: Mapped[str | None] = mapped_column(String(2), nullable=True)
    cargo: Mapped[str | None] = mapped_column(String(80), nullable=True)  # Deputado Federal, Senador...
    identificacao_rp: Mapped[str | None] = mapped_column(String(30), nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    propostas: Mapped[list["PropostaInvestSUS"]] = relationship(back_populates="parlamentar")


# ── Programa / Modalidade (parametrizável) ────────────────────────────────────

class ProgramaInvestSUS(Base):
    __tablename__ = "is_programas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(200), unique=True)
    codigo: Mapped[str | None] = mapped_column(String(50), nullable=True)
    bloco: Mapped[str | None] = mapped_column(String(100), nullable=True)  # PAP, MAC, Custeio...
    tipo_financiamento: Mapped[str | None] = mapped_column(String(50), nullable=True)  # custeio, investimento
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    propostas: Mapped[list["PropostaInvestSUS"]] = relationship(back_populates="programa")


# ── Proposta principal ────────────────────────────────────────────────────────

class PropostaInvestSUS(Base):
    __tablename__ = "is_propostas"
    __table_args__ = (
        Index("ix_is_propostas_municipio", "municipio_id"),
        Index("ix_is_propostas_numero", "numero_proposta"),
        Index("ix_is_propostas_situacao", "situacao_normalizada"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    municipio_id: Mapped[int] = mapped_column(ForeignKey("municipios.id"), index=True)
    parlamentar_id: Mapped[int | None] = mapped_column(ForeignKey("is_parlamentares.id"), nullable=True)
    programa_id: Mapped[int | None] = mapped_column(ForeignKey("is_programas.id"), nullable=True)

    # Identificação
    numero_proposta: Mapped[str] = mapped_column(String(100), index=True)
    numero_emenda: Mapped[str | None] = mapped_column(String(100), nullable=True)
    numero_instrumento: Mapped[str | None] = mapped_column(String(100), nullable=True)
    numero_processo: Mapped[str | None] = mapped_column(String(100), nullable=True)
    exercicio: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)

    # Entidade beneficiária
    entidade_nome: Mapped[str | None] = mapped_column(String(300), nullable=True)
    entidade_cnpj: Mapped[str | None] = mapped_column(String(18), nullable=True)
    entidade_municipio: Mapped[str | None] = mapped_column(String(100), nullable=True)
    entidade_uf: Mapped[str | None] = mapped_column(String(2), nullable=True)
    entidade_esfera: Mapped[str | None] = mapped_column(String(80), nullable=True)
    entidade_natureza_juridica: Mapped[str | None] = mapped_column(String(100), nullable=True)
    fundo_saude: Mapped[str | None] = mapped_column(String(200), nullable=True)
    responsavel_legal: Mapped[str | None] = mapped_column(String(200), nullable=True)
    situacao_cadastral: Mapped[str | None] = mapped_column(String(100), nullable=True)
    situacao_habilitacao: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Objeto
    objeto: Mapped[str | None] = mapped_column(Text, nullable=True)
    finalidade: Mapped[str | None] = mapped_column(Text, nullable=True)
    tipo_objeto: Mapped[str | None] = mapped_column(String(100), nullable=True)
    modalidade_transferencia: Mapped[str | None] = mapped_column(String(100), nullable=True)
    bloco_financiamento: Mapped[str | None] = mapped_column(String(100), nullable=True)
    componente: Mapped[str | None] = mapped_column(String(50), nullable=True)  # PAP, MAC
    tipo_financiamento: Mapped[str | None] = mapped_column(String(50), nullable=True)  # custeio, investimento
    acao_orcamentaria: Mapped[str | None] = mapped_column(String(200), nullable=True)
    populacao_beneficiada: Mapped[int | None] = mapped_column(Integer, nullable=True)
    resultados_esperados: Mapped[str | None] = mapped_column(Text, nullable=True)
    prazo_previsto: Mapped[str | None] = mapped_column(String(50), nullable=True)
    justificativa: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Valores
    valor_indicado: Mapped[float] = mapped_column(Float, default=0.0)
    valor_proposta: Mapped[float] = mapped_column(Float, default=0.0)
    valor_aprovado: Mapped[float] = mapped_column(Float, default=0.0)
    valor_empenhado: Mapped[float] = mapped_column(Float, default=0.0)
    valor_pago: Mapped[float] = mapped_column(Float, default=0.0)
    valor_executado: Mapped[float] = mapped_column(Float, default=0.0)
    saldo_bancario: Mapped[float] = mapped_column(Float, default=0.0)
    rendimentos: Mapped[float] = mapped_column(Float, default=0.0)
    valor_devolvido: Mapped[float] = mapped_column(Float, default=0.0)

    # Execução
    perc_fisico: Mapped[float] = mapped_column(Float, default=0.0)
    perc_financeiro: Mapped[float] = mapped_column(Float, default=0.0)

    # Portaria / Empenho
    portaria_numero: Mapped[str | None] = mapped_column(String(100), nullable=True)
    portaria_data: Mapped[date | None] = mapped_column(Date, nullable=True)
    empenho_numero: Mapped[str | None] = mapped_column(String(100), nullable=True)
    empenho_data: Mapped[date | None] = mapped_column(Date, nullable=True)
    conta_bancaria: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # Situações
    situacao_original: Mapped[str | None] = mapped_column(String(300), nullable=True)
    situacao_normalizada: Mapped[SituacaoNormalizada] = mapped_column(
        SAEnum(SituacaoNormalizada), default=SituacaoNormalizada.RECURSO_DISPONIVEL, index=True
    )
    tipo_emenda: Mapped[TipoEmenda] = mapped_column(
        SAEnum(TipoEmenda), default=TipoEmenda.INDIVIDUAL
    )

    # DigiSUS / PAS
    digisus_exercicio: Mapped[int | None] = mapped_column(Integer, nullable=True)
    digisus_diretriz: Mapped[str | None] = mapped_column(Text, nullable=True)
    digisus_objetivo: Mapped[str | None] = mapped_column(Text, nullable=True)
    digisus_meta: Mapped[str | None] = mapped_column(Text, nullable=True)
    digisus_indicador: Mapped[str | None] = mapped_column(String(300), nullable=True)
    digisus_acao: Mapped[str | None] = mapped_column(String(300), nullable=True)
    digisus_situacao_vinculacao: Mapped[str | None] = mapped_column(String(100), nullable=True)
    digisus_justificativa: Mapped[str | None] = mapped_column(Text, nullable=True)
    digisus_verificado_em: Mapped[date | None] = mapped_column(Date, nullable=True)
    digisus_verificado_por: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Gestão
    responsavel_interno: Mapped[str | None] = mapped_column(String(200), nullable=True)
    prazo_vigencia: Mapped[date | None] = mapped_column(Date, nullable=True)
    fonte_dado: Mapped[str | None] = mapped_column(String(100), nullable=True)
    payload_original: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Auditoria
    criado_por: Mapped[str | None] = mapped_column(String(100), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    atualizado_por: Mapped[str | None] = mapped_column(String(100), nullable=True)
    atualizado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    ultima_consulta_investsus: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Relacionamentos
    parlamentar: Mapped["Parlamentar | None"] = relationship(back_populates="propostas")
    programa: Mapped["ProgramaInvestSUS | None"] = relationship(back_populates="propostas")
    municipio: Mapped["Municipio"] = relationship()  # type: ignore
    historico: Mapped[list["HistoricoSituacao"]] = relationship(back_populates="proposta", cascade="all, delete-orphan", order_by="HistoricoSituacao.id")
    unidades: Mapped[list["UnidadeBeneficiada"]] = relationship(back_populates="proposta", cascade="all, delete-orphan")
    planos_trabalho: Mapped[list["PlanoTrabalho"]] = relationship(back_populates="proposta", cascade="all, delete-orphan")
    naturezas_despesa: Mapped[list["NaturezaDespesa"]] = relationship(back_populates="proposta", cascade="all, delete-orphan")
    pareceres: Mapped[list["Parecer"]] = relationship(back_populates="proposta", cascade="all, delete-orphan", order_by="Parecer.data_parecer")
    pagamentos_investsus: Mapped[list["PagamentoInvestSUS"]] = relationship(back_populates="proposta", cascade="all, delete-orphan")
    alertas_investsus: Mapped[list["AlertaInvestSUS"]] = relationship(back_populates="proposta", cascade="all, delete-orphan")
    documentos_investsus: Mapped[list["DocumentoInvestSUS"]] = relationship(back_populates="proposta", cascade="all, delete-orphan")
    atualizacoes: Mapped[list["AtualizacaoManual"]] = relationship(back_populates="proposta", cascade="all, delete-orphan", order_by="AtualizacaoManual.data_consulta.desc()")

    @property
    def saldo_executar(self) -> float:
        return max(0.0, self.valor_pago - self.valor_executado)


# ── Histórico de situações (linha do tempo) ───────────────────────────────────

class HistoricoSituacao(Base):
    __tablename__ = "is_historico_situacoes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    proposta_id: Mapped[int] = mapped_column(ForeignKey("is_propostas.id"), index=True)
    situacao_anterior: Mapped[str | None] = mapped_column(String(300), nullable=True)
    situacao_nova: Mapped[str] = mapped_column(String(300))
    situacao_norm_anterior: Mapped[str | None] = mapped_column(String(100), nullable=True)
    situacao_norm_nova: Mapped[str | None] = mapped_column(String(100), nullable=True)
    data_evento: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    usuario: Mapped[str | None] = mapped_column(String(100), nullable=True)
    origem: Mapped[str] = mapped_column(String(50), default="manual")
    observacao: Mapped[str | None] = mapped_column(Text, nullable=True)

    proposta: Mapped["PropostaInvestSUS"] = relationship(back_populates="historico")


# ── Unidade beneficiada ───────────────────────────────────────────────────────

class UnidadeBeneficiada(Base):
    __tablename__ = "is_unidades_beneficiadas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    proposta_id: Mapped[int] = mapped_column(ForeignKey("is_propostas.id"), index=True)
    cnes: Mapped[str | None] = mapped_column(String(10), nullable=True, index=True)
    nome_estabelecimento: Mapped[str | None] = mapped_column(String(300), nullable=True)
    municipio: Mapped[str | None] = mapped_column(String(100), nullable=True)
    tipo_estabelecimento: Mapped[str | None] = mapped_column(String(100), nullable=True)
    esfera_gestao: Mapped[str | None] = mapped_column(String(80), nullable=True)
    situacao_cnes: Mapped[str | None] = mapped_column(String(80), nullable=True)
    valor_destinado: Mapped[float] = mapped_column(Float, default=0.0)
    objeto_destinado: Mapped[str | None] = mapped_column(Text, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    proposta: Mapped["PropostaInvestSUS"] = relationship(back_populates="unidades")
    planos: Mapped[list["PlanoTrabalho"]] = relationship(back_populates="unidade", cascade="all, delete-orphan")


# ── Plano de Trabalho ─────────────────────────────────────────────────────────

class PlanoTrabalho(Base):
    __tablename__ = "is_planos_trabalho"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    proposta_id: Mapped[int] = mapped_column(ForeignKey("is_propostas.id"), index=True)
    unidade_id: Mapped[int | None] = mapped_column(ForeignKey("is_unidades_beneficiadas.id"), nullable=True)
    versao: Mapped[int] = mapped_column(Integer, default=1)
    valor_indicado: Mapped[float] = mapped_column(Float, default=0.0)
    objeto: Mapped[str | None] = mapped_column(Text, nullable=True)
    justificativa: Mapped[str | None] = mapped_column(Text, nullable=True)
    situacao: Mapped[str | None] = mapped_column(String(100), nullable=True)
    data_elaboracao: Mapped[date | None] = mapped_column(Date, nullable=True)
    data_envio: Mapped[date | None] = mapped_column(Date, nullable=True)
    data_aprovacao: Mapped[date | None] = mapped_column(Date, nullable=True)
    responsavel: Mapped[str | None] = mapped_column(String(200), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    atualizado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    proposta: Mapped["PropostaInvestSUS"] = relationship(back_populates="planos_trabalho")
    unidade: Mapped["UnidadeBeneficiada | None"] = relationship(back_populates="planos")
    acoes: Mapped[list["AcaoServico"]] = relationship(back_populates="plano", cascade="all, delete-orphan")


# ── Ação / Serviço / Meta ─────────────────────────────────────────────────────

class AcaoServico(Base):
    __tablename__ = "is_acoes_servicos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    plano_id: Mapped[int] = mapped_column(ForeignKey("is_planos_trabalho.id"), index=True)
    categoria: Mapped[str | None] = mapped_column(String(100), nullable=True)
    descricao: Mapped[str] = mapped_column(Text)
    tipo: Mapped[str | None] = mapped_column(String(100), nullable=True)
    meta_quantitativa: Mapped[float | None] = mapped_column(Float, nullable=True)
    unidade_medida: Mapped[str | None] = mapped_column(String(50), nullable=True)
    meta_qualitativa: Mapped[str | None] = mapped_column(Text, nullable=True)
    justificativa: Mapped[str | None] = mapped_column(Text, nullable=True)
    valor: Mapped[float] = mapped_column(Float, default=0.0)
    periodo_execucao: Mapped[str | None] = mapped_column(String(100), nullable=True)
    responsavel: Mapped[str | None] = mapped_column(String(200), nullable=True)
    situacao_execucao: Mapped[str | None] = mapped_column(String(100), nullable=True)
    resultado_alcancado: Mapped[str | None] = mapped_column(Text, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    plano: Mapped["PlanoTrabalho"] = relationship(back_populates="acoes")


# ── Natureza de Despesa ───────────────────────────────────────────────────────

class NaturezaDespesa(Base):
    __tablename__ = "is_naturezas_despesa"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    proposta_id: Mapped[int] = mapped_column(ForeignKey("is_propostas.id"), index=True)
    codigo: Mapped[str] = mapped_column(String(20))  # ex: 339030
    descricao: Mapped[str | None] = mapped_column(String(200), nullable=True)
    categoria_economica: Mapped[str | None] = mapped_column(String(100), nullable=True)
    grupo: Mapped[str | None] = mapped_column(String(100), nullable=True)
    modalidade_aplicacao: Mapped[str | None] = mapped_column(String(100), nullable=True)
    elemento: Mapped[str | None] = mapped_column(String(100), nullable=True)
    valor_previsto: Mapped[float] = mapped_column(Float, default=0.0)
    valor_contratado: Mapped[float] = mapped_column(Float, default=0.0)
    valor_empenhado_municipio: Mapped[float] = mapped_column(Float, default=0.0)
    valor_liquidado: Mapped[float] = mapped_column(Float, default=0.0)
    valor_pago: Mapped[float] = mapped_column(Float, default=0.0)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    proposta: Mapped["PropostaInvestSUS"] = relationship(back_populates="naturezas_despesa")

    @property
    def saldo(self) -> float:
        return max(0.0, self.valor_previsto - self.valor_pago)


# ── Pareceres e Diligências ───────────────────────────────────────────────────

class Parecer(Base):
    __tablename__ = "is_pareceres"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    proposta_id: Mapped[int] = mapped_column(ForeignKey("is_propostas.id"), index=True)
    area_responsavel: Mapped[str | None] = mapped_column(String(200), nullable=True)
    sigla_area: Mapped[str | None] = mapped_column(String(50), nullable=True)
    data_parecer: Mapped[date | None] = mapped_column(Date, nullable=True)
    tipo: Mapped[TipoParecer] = mapped_column(SAEnum(TipoParecer), default=TipoParecer.MERITO)
    resultado: Mapped[ResultadoParecer] = mapped_column(SAEnum(ResultadoParecer), default=ResultadoParecer.PENDENTE)
    texto: Mapped[str | None] = mapped_column(Text, nullable=True)
    numero_parecer: Mapped[str | None] = mapped_column(String(100), nullable=True)
    responsavel: Mapped[str | None] = mapped_column(String(200), nullable=True)
    # Diligência
    eh_diligencia: Mapped[bool] = mapped_column(Boolean, default=False)
    prazo_resposta: Mapped[date | None] = mapped_column(Date, nullable=True)
    data_resposta: Mapped[date | None] = mapped_column(Date, nullable=True)
    situacao_resposta: Mapped[str | None] = mapped_column(String(100), nullable=True)
    data_reanalize: Mapped[date | None] = mapped_column(Date, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    proposta: Mapped["PropostaInvestSUS"] = relationship(back_populates="pareceres")


# ── Pagamentos do InvestSUS ───────────────────────────────────────────────────

class PagamentoInvestSUS(Base):
    __tablename__ = "is_pagamentos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    proposta_id: Mapped[int] = mapped_column(ForeignKey("is_propostas.id"), index=True)
    ordem_bancaria: Mapped[str | None] = mapped_column(String(100), nullable=True)
    data_pagamento: Mapped[date | None] = mapped_column(Date, nullable=True)
    valor: Mapped[float] = mapped_column(Float, default=0.0)
    parcela: Mapped[int | None] = mapped_column(Integer, nullable=True)
    conta_bancaria: Mapped[str | None] = mapped_column(String(200), nullable=True)
    fonte_oficial: Mapped[str | None] = mapped_column(String(100), nullable=True)
    situacao: Mapped[str | None] = mapped_column(String(100), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    proposta: Mapped["PropostaInvestSUS"] = relationship(back_populates="pagamentos_investsus")


# ── Alertas específicos do InvestSUS ─────────────────────────────────────────

class AlertaInvestSUS(Base):
    __tablename__ = "is_alertas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    proposta_id: Mapped[int] = mapped_column(ForeignKey("is_propostas.id"), index=True)
    municipio_id: Mapped[int] = mapped_column(ForeignKey("municipios.id"), index=True)
    tipo_alerta: Mapped[str] = mapped_column(String(100))
    nivel: Mapped[NivelAlertaInvest] = mapped_column(SAEnum(NivelAlertaInvest), default=NivelAlertaInvest.ATENCAO)
    titulo: Mapped[str] = mapped_column(String(300))
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    providencia: Mapped[str | None] = mapped_column(Text, nullable=True)
    prazo: Mapped[date | None] = mapped_column(Date, nullable=True)
    responsavel: Mapped[str | None] = mapped_column(String(200), nullable=True)
    resolvido: Mapped[bool] = mapped_column(Boolean, default=False)
    resolvido_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    resolvido_por: Mapped[str | None] = mapped_column(String(100), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    proposta: Mapped["PropostaInvestSUS"] = relationship(back_populates="alertas_investsus")
    municipio: Mapped["Municipio"] = relationship()  # type: ignore


# ── Documentos do InvestSUS ───────────────────────────────────────────────────

class DocumentoInvestSUS(Base):
    __tablename__ = "is_documentos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    proposta_id: Mapped[int] = mapped_column(ForeignKey("is_propostas.id"), index=True)
    nome: Mapped[str] = mapped_column(String(300))
    tipo: Mapped[str | None] = mapped_column(String(100), nullable=True)
    caminho: Mapped[str | None] = mapped_column(String(500), nullable=True)
    tamanho_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    hash_sha256: Mapped[str | None] = mapped_column(String(64), nullable=True)
    enviado_por: Mapped[str | None] = mapped_column(String(100), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    proposta: Mapped["PropostaInvestSUS"] = relationship(back_populates="documentos_investsus")


# ── Atualização Manual (registro de consulta ao InvestSUS) ───────────────────

class AtualizacaoManual(Base):
    __tablename__ = "is_atualizacoes_manuais"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    proposta_id: Mapped[int] = mapped_column(ForeignKey("is_propostas.id"), index=True)
    data_consulta: Mapped[date] = mapped_column(Date)
    situacao_encontrada: Mapped[str | None] = mapped_column(String(300), nullable=True)
    situacao_anterior: Mapped[str | None] = mapped_column(String(300), nullable=True)
    observacoes: Mapped[str | None] = mapped_column(Text, nullable=True)
    responsavel: Mapped[str] = mapped_column(String(100))
    origem: Mapped[OrigemAtualizacao] = mapped_column(SAEnum(OrigemAtualizacao), default=OrigemAtualizacao.MANUAL)
    arquivo_anexo: Mapped[str | None] = mapped_column(String(500), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    proposta: Mapped["PropostaInvestSUS"] = relationship(back_populates="atualizacoes")


# ── Snapshot do portal InvestSUS (capturado via bookmarklet) ──────────────────

class SnapshotInvestSUS(Base):
    __tablename__ = "is_snapshots"
    __table_args__ = (
        Index("ix_is_snapshots_municipio", "municipio_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    municipio_id: Mapped[int] = mapped_column(ForeignKey("municipios.id"), index=True)
    capturado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    origem: Mapped[str] = mapped_column(String(50), default="bookmarklet")
    dados: Mapped[dict] = mapped_column(JSON, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
