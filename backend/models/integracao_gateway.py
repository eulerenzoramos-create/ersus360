"""
Models: ERSUS Integration Gateway
Tabelas de auditoria e controle de transmissões RNDS/LEDI.
"""
from __future__ import annotations
import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, DateTime, Text, Boolean,
    Enum as SAEnum, func,
)
from database import Base


class SistemaDestino(str, enum.Enum):
    RNDS = "RNDS"
    LEDI = "LEDI"
    ESUS_EXT = "ESUS_EXT"


class StatusTransmissao(str, enum.Enum):
    PENDENTE = "Pendente"
    ENVIADO = "Enviado"
    PROCESSADO = "Processado"
    REJEITADO = "Rejeitado"
    ERRO = "Erro"
    REPROCESSAMENTO = "Reprocessamento"


class GatewayTransmissao(Base):
    """Auditoria de cada transmissão ao RNDS ou LEDI."""
    __tablename__ = "gateway_transmissoes"

    id = Column(Integer, primary_key=True, index=True)
    municipio_id = Column(Integer, nullable=False, index=True)
    cnes = Column(String(7), nullable=True)
    sistema = Column(SAEnum(SistemaDestino), nullable=False)
    endpoint = Column(String(500), nullable=False)
    operacao = Column(String(100), nullable=True)
    status = Column(SAEnum(StatusTransmissao), nullable=False, default=StatusTransmissao.PENDENTE)
    id_transacao = Column(String(100), nullable=True, unique=True)
    hash_payload = Column(String(64), nullable=True, index=True)
    codigo_retorno = Column(Integer, nullable=True)
    resposta = Column(Text, nullable=True)
    mensagem_erro = Column(Text, nullable=True)
    quantidade_registros = Column(Integer, nullable=True)
    tentativas = Column(Integer, default=0)
    # nunca armazena: senha, token, chave privada
    criado_em = Column(DateTime, server_default=func.now(), nullable=False)
    atualizado_em = Column(DateTime, server_default=func.now(), onupdate=func.now())


class GatewayConfig(Base):
    """Configuração do gateway por município."""
    __tablename__ = "gateway_config"

    id = Column(Integer, primary_key=True, index=True)
    municipio_id = Column(Integer, nullable=False, unique=True, index=True)
    pausado = Column(Boolean, default=False, nullable=False)
    modo_diagnostico = Column(Boolean, default=True, nullable=False)
    rnds_ativo = Column(Boolean, default=False, nullable=False)
    ledi_ativo = Column(Boolean, default=False, nullable=False)
    uf = Column(String(2), default="AM", nullable=False)
    criado_em = Column(DateTime, server_default=func.now())
    atualizado_em = Column(DateTime, server_default=func.now(), onupdate=func.now())
