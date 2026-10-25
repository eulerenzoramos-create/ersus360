"""
PMS Vivo — Plano Municipal de Saúde como ferramenta de gestão (PMS → PAS → execução → monitoramento).

  pms_plano          PMS do quadriênio, com versões: só uma versão "aprovado" por município × vigência;
                     alterações viram nova versão (proposta) e a aprovada anterior passa a "substituido".
  pms_diretriz / pms_objetivo / pms_meta   estrutura do PMS (meta com identificador próprio `uid`,
                     estável entre versões, e `codigo` do documento)
  pms_meta_anual     meta prevista por ano da vigência (resultado e fonte entram na fase de monitoramento)
  pms_pas            Programação Anual de Saúde do exercício, ligada a uma versão do PMS
  pms_acao           ação da PAS; situação OFICIAL só muda quando uma atualização é validada
  pms_acao_meta      N:N — uma ação pode contribuir para várias metas e uma meta ter várias ações
  pms_atualizacao    execução informada pelo responsável, aguardando validação (validada | devolvida)
  pms_anexo          evidências (ação/atualização) e documento oficial do PMS (PDF)
  pms_historico      trilha de alterações (só acrescenta)

Tudo com municipio_id (isolamento multi-município). Nenhum valor é preenchido sem fonte: campos vazios
quando o documento/planilha não traz.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import (Column, Date, DateTime, Float, ForeignKey, Index, Integer, String, Text,
                        UniqueConstraint)

from database import Base


class PmsPlano(Base):
    __tablename__ = "pms_plano"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    municipio_id    = Column(Integer, ForeignKey("municipios.id"), nullable=False, index=True)
    titulo          = Column(String(300), nullable=False)
    vigencia_inicio = Column(Integer, nullable=False)       # ex.: 2026
    vigencia_fim    = Column(Integer, nullable=False)       # ex.: 2029
    versao          = Column(Integer, nullable=False, default=1)
    situacao        = Column(String(20), nullable=False, default="rascunho")  # rascunho | aprovado | substituido
    plano_origem_id = Column(Integer, ForeignKey("pms_plano.id"), nullable=True)  # versão da qual esta deriva
    motivo_versao   = Column(Text, nullable=True)
    resolucao_cms   = Column(String(200), nullable=True)    # ato de aprovação no Conselho, como informado
    aprovado_por    = Column(String(200), nullable=True)
    aprovado_em     = Column(DateTime, nullable=True)
    observacoes     = Column(Text, nullable=True)
    criado_por      = Column(String(200), nullable=True)
    criado_em       = Column(DateTime, default=datetime.utcnow, nullable=False)


class PmsDiretriz(Base):
    __tablename__ = "pms_diretriz"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    plano_id     = Column(Integer, ForeignKey("pms_plano.id"), nullable=False, index=True)
    municipio_id = Column(Integer, ForeignKey("municipios.id"), nullable=False, index=True)
    codigo       = Column(String(20), nullable=False)
    descricao    = Column(Text, nullable=False)
    ordem        = Column(Integer, nullable=False, default=0)


class PmsObjetivo(Base):
    __tablename__ = "pms_objetivo"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    diretriz_id  = Column(Integer, ForeignKey("pms_diretriz.id"), nullable=False, index=True)
    plano_id     = Column(Integer, ForeignKey("pms_plano.id"), nullable=False, index=True)
    municipio_id = Column(Integer, ForeignKey("municipios.id"), nullable=False, index=True)
    codigo       = Column(String(20), nullable=False)
    descricao    = Column(Text, nullable=False)
    ordem        = Column(Integer, nullable=False, default=0)


class PmsMeta(Base):
    __tablename__ = "pms_meta"
    __table_args__ = (UniqueConstraint("plano_id", "codigo", name="uq_pms_meta_codigo"),)

    id              = Column(Integer, primary_key=True, autoincrement=True)
    objetivo_id     = Column(Integer, ForeignKey("pms_objetivo.id"), nullable=False, index=True)
    plano_id        = Column(Integer, ForeignKey("pms_plano.id"), nullable=False, index=True)
    municipio_id    = Column(Integer, ForeignKey("municipios.id"), nullable=False, index=True)
    uid             = Column(String(36), nullable=False, index=True)   # identificador próprio, estável entre versões
    codigo          = Column(String(20), nullable=False)               # código no documento (ex.: 1.1.1)
    descricao       = Column(Text, nullable=False)
    indicador       = Column(Text, nullable=True)
    tipo_indicador  = Column(String(30), nullable=True)   # ver services/pms_vivo.TIPOS_INDICADOR
    unidade         = Column(String(40), nullable=True)
    polaridade      = Column(String(15), nullable=True)   # maior_melhor | menor_melhor
    formula         = Column(Text, nullable=True)
    linha_base      = Column(Float, nullable=True)
    ano_linha_base  = Column(Integer, nullable=True)
    meta_quadrienal = Column(Float, nullable=True)
    fonte           = Column(String(300), nullable=True)
    setor_responsavel = Column(String(150), nullable=True)
    ordem           = Column(Integer, nullable=False, default=0)


class PmsMetaAnual(Base):
    __tablename__ = "pms_meta_anual"
    __table_args__ = (UniqueConstraint("meta_id", "ano", name="uq_pms_meta_ano"),)

    id                    = Column(Integer, primary_key=True, autoincrement=True)
    meta_id               = Column(Integer, ForeignKey("pms_meta.id"), nullable=False, index=True)
    municipio_id          = Column(Integer, ForeignKey("municipios.id"), nullable=False, index=True)
    ano                   = Column(Integer, nullable=False)
    meta_prevista         = Column(Float, nullable=True)
    resultado             = Column(Float, nullable=True)       # preenchido no monitoramento (fonte obrigatória)
    resultado_fonte       = Column(String(300), nullable=True)
    resultado_competencia = Column(String(40), nullable=True)
    resultado_em          = Column(DateTime, nullable=True)
    resultado_por         = Column(String(200), nullable=True)


class PmsPas(Base):
    __tablename__ = "pms_pas"
    __table_args__ = (UniqueConstraint("plano_id", "exercicio", name="uq_pms_pas_exercicio"),)

    id            = Column(Integer, primary_key=True, autoincrement=True)
    plano_id      = Column(Integer, ForeignKey("pms_plano.id"), nullable=False, index=True)
    municipio_id  = Column(Integer, ForeignKey("municipios.id"), nullable=False, index=True)
    exercicio     = Column(Integer, nullable=False)
    situacao      = Column(String(20), nullable=False, default="rascunho")   # rascunho | aprovada
    resolucao_cms = Column(String(200), nullable=True)
    aprovada_por  = Column(String(200), nullable=True)
    aprovada_em   = Column(DateTime, nullable=True)
    criado_por    = Column(String(200), nullable=True)
    criado_em     = Column(DateTime, default=datetime.utcnow, nullable=False)


class PmsAcao(Base):
    __tablename__ = "pms_acao"
    __table_args__ = (UniqueConstraint("pas_id", "codigo", name="uq_pms_acao_codigo"),
                      Index("ix_pms_acao_resp", "municipio_id", "responsavel_usuario_id"))

    id                     = Column(Integer, primary_key=True, autoincrement=True)
    pas_id                 = Column(Integer, ForeignKey("pms_pas.id"), nullable=False, index=True)
    municipio_id           = Column(Integer, ForeignKey("municipios.id"), nullable=False, index=True)
    codigo                 = Column(String(30), nullable=False)
    descricao              = Column(Text, nullable=False)
    produto                = Column(String(300), nullable=True)
    quantidade_prevista    = Column(Float, nullable=True)
    prazo                  = Column(Date, nullable=True)
    setor_responsavel      = Column(String(150), nullable=True)
    responsavel_usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    responsavel_nome       = Column(String(150), nullable=True)
    recursos               = Column(Text, nullable=True)
    fonte_financiamento    = Column(String(300), nullable=True)
    indicador_acompanhamento = Column(String(300), nullable=True)
    evidencia_esperada     = Column(Text, nullable=True)
    # Situação OFICIAL (só muda por atualização validada)
    situacao               = Column(String(20), nullable=False, default="nao_iniciada")
    percentual_execucao    = Column(Float, nullable=True)
    quantidade_realizada   = Column(Float, nullable=True)
    resultado_alcancado    = Column(Text, nullable=True)
    justificativa          = Column(Text, nullable=True)
    situacao_validada_por  = Column(String(200), nullable=True)
    situacao_validada_em   = Column(DateTime, nullable=True)
    criado_por             = Column(String(200), nullable=True)
    criado_em              = Column(DateTime, default=datetime.utcnow, nullable=False)
    atualizado_em          = Column(DateTime, default=datetime.utcnow, nullable=False)
    excluido_em            = Column(DateTime, nullable=True)


class PmsAcaoMeta(Base):
    __tablename__ = "pms_acao_meta"
    __table_args__ = (UniqueConstraint("acao_id", "meta_id", name="uq_pms_acao_meta"),)

    id           = Column(Integer, primary_key=True, autoincrement=True)
    acao_id      = Column(Integer, ForeignKey("pms_acao.id"), nullable=False, index=True)
    meta_id      = Column(Integer, ForeignKey("pms_meta.id"), nullable=False, index=True)
    municipio_id = Column(Integer, ForeignKey("municipios.id"), nullable=False, index=True)


class PmsAtualizacao(Base):
    __tablename__ = "pms_atualizacao"

    id                   = Column(Integer, primary_key=True, autoincrement=True)
    acao_id              = Column(Integer, ForeignKey("pms_acao.id"), nullable=False, index=True)
    municipio_id         = Column(Integer, ForeignKey("municipios.id"), nullable=False, index=True)
    situacao             = Column(String(20), nullable=False)   # situação informada
    percentual_execucao  = Column(Float, nullable=True)
    quantidade_realizada = Column(Float, nullable=True)
    resultado_alcancado  = Column(Text, nullable=True)
    justificativa        = Column(Text, nullable=True)
    status               = Column(String(12), nullable=False, default="pendente")  # pendente | validada | devolvida
    informado_por        = Column(String(200), nullable=False)
    informado_em         = Column(DateTime, default=datetime.utcnow, nullable=False)
    validado_por         = Column(String(200), nullable=True)
    validado_em          = Column(DateTime, nullable=True)
    parecer              = Column(Text, nullable=True)          # motivo da devolução / observação do validador


class PmsAnexo(Base):
    __tablename__ = "pms_anexo"

    id             = Column(Integer, primary_key=True, autoincrement=True)
    municipio_id   = Column(Integer, ForeignKey("municipios.id"), nullable=False, index=True)
    entidade       = Column(String(20), nullable=False)        # plano | acao
    entidade_id    = Column(Integer, nullable=False, index=True)
    atualizacao_id = Column(Integer, ForeignKey("pms_atualizacao.id"), nullable=True)
    nome_original  = Column(String(255), nullable=False)
    caminho        = Column(String(500), nullable=False)
    tamanho        = Column(Integer, nullable=False)
    descricao      = Column(String(300), nullable=True)
    enviado_por    = Column(String(200), nullable=True)
    enviado_em     = Column(DateTime, default=datetime.utcnow, nullable=False)
    excluido_em    = Column(DateTime, nullable=True)


class PmsHistorico(Base):
    __tablename__ = "pms_historico"
    __table_args__ = (Index("ix_pms_hist_ent", "municipio_id", "entidade", "entidade_id"),)

    id           = Column(Integer, primary_key=True, autoincrement=True)
    municipio_id = Column(Integer, ForeignKey("municipios.id"), nullable=False)
    entidade     = Column(String(20), nullable=False)          # plano | meta | pas | acao
    entidade_id  = Column(Integer, nullable=False)
    evento       = Column(String(30), nullable=False)
    descricao    = Column(Text, nullable=False)
    usuario      = Column(String(200), nullable=True)
    criado_em    = Column(DateTime, default=datetime.utcnow, nullable=False)
