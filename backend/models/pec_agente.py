"""
PEC_SYNC_AGENT — dados recebidos do agente local instalado no servidor do e-SUS PEC.

O agente lê o banco do PEC com usuário SOMENTE LEITURA e envia ao ERSUS360 apenas
dados AGREGADOS de gestão dos ACS (equipes, ACS, microáreas, contagens de cadastros,
visitas e grupos prioritários) — nenhum nome, CPF, CNS ou dado clínico de cidadão.
Contrato e validação em routers/pec_agente.py; cálculos do painel em services/pec_acs.py.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class PecAgenteExecucao(Base):
    """Histórico de tudo que o agente enviou (aceito ou rejeitado) — aba Capturar PEC."""
    __tablename__ = "pec_agente_execucoes"
    __table_args__ = (Index("ix_pec_agente_exec_mun_data", "municipio_id", "recebido_em"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    municipio_id: Mapped[int] = mapped_column(ForeignKey("municipios.id"), index=True)
    tipo: Mapped[str] = mapped_column(String(30))          # esquema | acs | heartbeat
    status: Mapped[str] = mapped_column(String(20))        # aceito | rejeitado | sem_alteracao
    recebido_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    competencia: Mapped[str | None] = mapped_column(String(7), nullable=True)
    registros: Mapped[int] = mapped_column(Integer, default=0)
    rejeitados: Mapped[int] = mapped_column(Integer, default=0)
    mensagem: Mapped[str | None] = mapped_column(Text, nullable=True)
    agente_versao: Mapped[str | None] = mapped_column(String(30), nullable=True)
    pec_versao: Mapped[str | None] = mapped_column(String(30), nullable=True)
    ip_origem: Mapped[str | None] = mapped_column(String(64), nullable=True)


class PecAcsLote(Base):
    """Último lote agregado de dados ACS por competência (idempotente: 1 por competência)."""
    __tablename__ = "pec_acs_lotes"
    __table_args__ = (UniqueConstraint("municipio_id", "competencia", name="uq_pec_acs_lote_comp"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    municipio_id: Mapped[int] = mapped_column(ForeignKey("municipios.id"), index=True)
    competencia: Mapped[str] = mapped_column(String(7))     # AAAA-MM
    recebido_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    gerado_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)  # leitura no PEC
    periodo_inicio: Mapped[str | None] = mapped_column(String(10), nullable=True)
    periodo_fim: Mapped[str | None] = mapped_column(String(10), nullable=True)
    agente_versao: Mapped[str | None] = mapped_column(String(30), nullable=True)
    pec_versao: Mapped[str | None] = mapped_column(String(30), nullable=True)
    hash_conteudo: Mapped[str] = mapped_column(String(64))
    payload: Mapped[dict] = mapped_column(JSON)


class PecInconsistenciaLote(Base):
    """Relatório de inconsistências do recebimento de fichas no PEC, AGREGADO por competência
    (tipo de ficha × CNES × situação × tipo de erro) — sem responsável pelo envio, UUID,
    nome de arquivo ou conteúdo de ficha. 1 por município e competência (idempotente)."""
    __tablename__ = "pec_inconsistencia_lotes"
    __table_args__ = (UniqueConstraint("municipio_id", "competencia", name="uq_pec_inconsist_comp"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    municipio_id: Mapped[int] = mapped_column(ForeignKey("municipios.id"), index=True)
    competencia: Mapped[str] = mapped_column(String(7))     # AAAA-MM
    recebido_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    gerado_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    agente_versao: Mapped[str | None] = mapped_column(String(30), nullable=True)
    pec_versao: Mapped[str | None] = mapped_column(String(30), nullable=True)
    hash_conteudo: Mapped[str] = mapped_column(String(64))
    payload: Mapped[dict] = mapped_column(JSON)


class PecEsquemaRelatorio(Base):
    """Diagnóstico de esquema enviado pelo agente: SÓ nomes de tabelas/colunas e se o
    usuário somente-leitura tem SELECT — nunca linhas de dados."""
    __tablename__ = "pec_esquema_relatorios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    municipio_id: Mapped[int] = mapped_column(ForeignKey("municipios.id"), index=True)
    recebido_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    pec_versao: Mapped[str | None] = mapped_column(String(30), nullable=True)
    agente_versao: Mapped[str | None] = mapped_column(String(30), nullable=True)
    payload: Mapped[dict] = mapped_column(JSON)
