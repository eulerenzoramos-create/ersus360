"""
Monitoramento SIAPS — ausência de envio de produção válida.

Fonte: relatório PÚBLICO do e-Gestor APS "Equipes e serviços com ausência de envio de informação"
(relatorioaps.saude.gov.br/gerenciaaps/ausencia-envio-producao; API relatorioaps-prd.saude.gov.br/
credenciamento/sujeitos-suspensao). A fonte só informa AUSÊNCIA de produção válida e há quantas
competências ela dura: não traz quantidades de atendimentos, transmissões nem rejeições.

Três tabelas, todas por município:
- coleta: uma linha por (município, competência) baixada da fonte. Distingue "competência sem nenhuma
  ausência" (regular) de "competência ainda não coletada" (não verificada).
- ausência: as linhas da fonte que pertencem ao município (equipe, estabelecimento ou profissional).
  O CNS do profissional nunca é guardado por inteiro: só máscara e um hash para não duplicar.
- acompanhamento: o que o gestor registra por equipe (responsável, situação, observação).
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint

from database import Base


class EgestorAusenciaColeta(Base):
    __tablename__ = "egestor_ausencia_coletas"
    __table_args__ = (UniqueConstraint("municipio_id", "competencia", name="uq_egestor_ausencia_coleta"),)

    id                    = Column(Integer, primary_key=True, autoincrement=True)
    municipio_id          = Column(Integer, ForeignKey("municipios.id"), nullable=False, index=True)
    municipio_ibge        = Column(String(7), nullable=False)
    competencia           = Column(String(7), nullable=False)        # AAAA-MM (competência CNES)
    data_geracao_fonte    = Column(String(10), nullable=True)        # "DD/MM/AAAA", como a fonte informa
    ultima_competencia_fonte = Column(String(7), nullable=True)      # última competência publicada na fonte
    qt_equipes            = Column(Integer, nullable=False, default=0)
    qt_estabelecimentos   = Column(Integer, nullable=False, default=0)
    qt_profissionais      = Column(Integer, nullable=False, default=0)
    qt_equipes_brasil     = Column(Integer, nullable=True)
    coletado_por          = Column(String(200), nullable=True)
    coletado_em           = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class EgestorAusencia(Base):
    __tablename__ = "egestor_ausencias"
    __table_args__ = (UniqueConstraint("municipio_id", "competencia", "tipo_registro", "chave",
                                       name="uq_egestor_ausencia"),)

    id              = Column(Integer, primary_key=True, autoincrement=True)
    municipio_id    = Column(Integer, ForeignKey("municipios.id"), nullable=False, index=True)
    municipio_ibge  = Column(String(7), nullable=False)
    competencia     = Column(String(7), nullable=False, index=True)  # AAAA-MM
    tipo_registro   = Column(String(20), nullable=False)             # equipe | estabelecimento | profissional
    chave           = Column(String(40), nullable=False)             # INE | CNES | hash do CNS + equipe
    ine             = Column(String(10), nullable=True)
    cnes            = Column(String(7), nullable=True)
    tipologia       = Column(String(5), nullable=True)               # coTipoEquipe (ex.: "72")
    componente      = Column(String(200), nullable=True)             # componente de pagamento (estabelecimento)
    cbo             = Column(String(10), nullable=True)              # profissional
    cns_mascarado   = Column(String(20), nullable=True)              # profissional — nunca o CNS inteiro
    descricao       = Column(Text, nullable=False, default="")       # dsSubTipoSuspensao
    qt_consecutivas = Column(Integer, nullable=True)                 # 1, 2, 3; 4 = "Superior a 03"
    qt_texto        = Column(String(80), nullable=True)              # texto original da fonte
    coletado_em     = Column(DateTime, default=datetime.utcnow, nullable=False)


class EgestorAusenciaEvidencia(Base):
    """Evidência oficial consultada para o diagnóstico da ausência (uma por fonte × competência).

    fonte: "sisab_validacao" (relatório público de validação do SISAB: recebido/aprovado/reprovado/no prazo,
    por CNES e INE — só totais) ou "egestor_pagamento" (validação de cada equipe na parcela da competência CNES).
    O payload é a resposta oficial já reduzida ao município; nada é estimado. `hash_anterior`/`alterado_em`
    registram mudança entre consultas (alerta "alteração na situação de processamento")."""
    __tablename__ = "egestor_ausencia_evidencias"
    __table_args__ = (UniqueConstraint("municipio_id", "fonte", "competencia", name="uq_egestor_ausencia_evidencia"),)

    id             = Column(Integer, primary_key=True, autoincrement=True)
    municipio_id   = Column(Integer, ForeignKey("municipios.id"), nullable=False, index=True)
    fonte          = Column(String(30), nullable=False)
    competencia    = Column(String(7), nullable=False)               # AAAA-MM
    situacao       = Column(String(20), nullable=False)              # ok | nao_publicado | erro
    mensagem       = Column(Text, nullable=True)
    payload        = Column(Text, nullable=False, default="{}")      # JSON
    hash           = Column(String(64), nullable=True)
    hash_anterior  = Column(String(64), nullable=True)
    alterado_em    = Column(DateTime, nullable=True)
    consultado_por = Column(String(200), nullable=True)
    consultado_em  = Column(DateTime, default=datetime.utcnow, nullable=False)


class EgestorAusenciaAcompanhamento(Base):
    __tablename__ = "egestor_ausencia_acompanhamentos"
    __table_args__ = (UniqueConstraint("municipio_id", "ine", name="uq_egestor_ausencia_acomp"),)

    id             = Column(Integer, primary_key=True, autoincrement=True)
    municipio_id   = Column(Integer, ForeignKey("municipios.id"), nullable=False, index=True)
    ine            = Column(String(10), nullable=False)
    situacao       = Column(String(20), nullable=False, default="pendente")  # pendente|em_acompanhamento|regularizado|sem_providencia
    responsavel    = Column(String(200), nullable=True)
    observacao     = Column(Text, nullable=True)
    atualizado_por = Column(String(200), nullable=True)
    atualizado_em  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
