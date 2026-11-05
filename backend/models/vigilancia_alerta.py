"""
Vigilância em Saúde — acompanhamento dos alertas da Central de Alertas (dado do MUNICÍPIO, por tenant).

Cada registro é um evento do histórico (nunca é alterado nem apagado): mudança de situação, avaliação técnica
e providências. A situação atual de um alerta é a do registro mais recente. Os alertas em si não são
gravados — são recalculados das fontes oficiais; `alerta_chave` liga o histórico ao alerta.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, Text

from database import Base

SITUACOES = ("novo", "em_avaliacao", "em_acompanhamento", "encerrado", "descartado")


class VigAlertaAcompanhamento(Base):
    __tablename__ = "vig_alerta_acompanhamento"
    __table_args__ = (Index("ix_vig_alerta_mun_chave", "municipio_id", "alerta_chave"),)

    id            = Column(Integer, primary_key=True, autoincrement=True)
    municipio_id  = Column(Integer, ForeignKey("municipios.id"), nullable=False, index=True)
    alerta_chave  = Column(String(40), nullable=False)
    alerta_titulo = Column(String(200), nullable=False)
    ano           = Column(Integer, nullable=False)
    situacao      = Column(String(20), nullable=False)
    avaliacao     = Column(Text, nullable=True)      # avaliação técnica
    providencias  = Column(Text, nullable=True)
    usuario       = Column(String(120), nullable=False)
    perfil        = Column(String(30), nullable=False)
    criado_em     = Column(DateTime, default=datetime.utcnow, nullable=False)
