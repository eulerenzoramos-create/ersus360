"""Modelo: Emendas Parlamentares (InvestSUS / DigiSUS Gestor)"""
from __future__ import annotations
from datetime import datetime
from decimal import Decimal
from sqlalchemy import (
    Column, Integer, String, Numeric, Date, DateTime,
    Boolean, Text, ForeignKey, Enum as SAEnum,
)
from sqlalchemy.orm import relationship
from database import Base
import enum


class TipoEmenda(str, enum.Enum):
    individual = "individual"
    bancada    = "bancada"
    comissao   = "comissao"
    relator    = "relator"


class FaseEmenda(str, enum.Enum):
    indicada     = "indicada"
    empenhada    = "empenhada"
    em_execucao  = "em_execucao"
    liquidada    = "liquidada"
    paga         = "paga"
    cancelada    = "cancelada"


class QuadrimestreEmenda(str, enum.Enum):
    Q1 = "1Q"
    Q2 = "2Q"
    Q3 = "3Q"


class Emenda(Base):
    __tablename__ = "emendas"

    id               = Column(Integer, primary_key=True, index=True)
    municipio_id     = Column(Integer, ForeignKey("municipios.id"), nullable=False)
    obra_id          = Column(Integer, ForeignKey("obras.id"), nullable=True)

    numero_emenda    = Column(String(30), nullable=False)
    ano              = Column(Integer, nullable=False)
    parlamentar      = Column(String(100), nullable=False)
    partido          = Column(String(20))
    uf_parlamentar   = Column(String(2))
    tipo             = Column(SAEnum(TipoEmenda), default=TipoEmenda.individual)

    objeto           = Column(Text)
    programa         = Column(String(150))           # APS, MAC, obras, farmácia…
    vinculo          = Column(String(50))             # custeio | obra | equipamento

    valor_indicado   = Column(Numeric(14, 2), default=0)
    valor_empenhado  = Column(Numeric(14, 2), default=0)
    valor_liquidado  = Column(Numeric(14, 2), default=0)
    valor_pago       = Column(Numeric(14, 2), default=0)

    fase             = Column(SAEnum(FaseEmenda), default=FaseEmenda.indicada)
    quadrimestre     = Column(SAEnum(QuadrimestreEmenda), nullable=True)

    data_indicacao   = Column(Date, nullable=True)
    data_empenho     = Column(Date, nullable=True)
    data_prev_conclusao = Column(Date, nullable=True)
    nota_empenho     = Column(String(50))
    observacoes      = Column(Text)

    criado_em        = Column(DateTime, default=datetime.utcnow)
    atualizado_em    = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # relationships
    municipio        = relationship("Municipio", back_populates="emendas")
    obra             = relationship("Obra", back_populates="emendas")

    @property
    def perc_empenhado(self) -> float:
        if not self.valor_indicado or self.valor_indicado == 0:
            return 0.0
        return round(float(self.valor_empenhado or 0) / float(self.valor_indicado) * 100, 1)

    @property
    def perc_executado(self) -> float:
        if not self.valor_indicado or self.valor_indicado == 0:
            return 0.0
        return round(float(self.valor_pago or 0) / float(self.valor_indicado) * 100, 1)

    @property
    def saldo_a_pagar(self) -> float:
        return float(self.valor_indicado or 0) - float(self.valor_pago or 0)
