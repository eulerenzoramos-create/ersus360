"""Modelos: Conta Bancária e Movimentação do Fundo Municipal de Saúde."""
from __future__ import annotations
from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base


class ContaBancariaFMS(Base):
    __tablename__ = "conta_bancaria_fms"

    id              = Column(Integer, primary_key=True, index=True)
    banco           = Column(String(100), nullable=False)
    codigo_banco    = Column(String(10))
    agencia         = Column(String(20))
    numero_conta    = Column(String(40))
    digito          = Column(String(5))
    tipo            = Column(String(50), default="Corrente")   # Corrente | Poupança | Aplicação
    descricao       = Column(String(300))
    saldo_inicial   = Column(Numeric(15, 2), default=0)
    data_saldo_ini  = Column(Date)
    ativo           = Column(Boolean, default=True)
    criado_em       = Column(DateTime, default=datetime.utcnow)
    criado_por      = Column(String(100))

    movimentacoes   = relationship("MovimentacaoContaFMS", back_populates="conta", cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        return {
            "id":            self.id,
            "banco":         self.banco,
            "codigo_banco":  self.codigo_banco,
            "agencia":       self.agencia,
            "numero_conta":  self.numero_conta,
            "digito":        self.digito,
            "tipo":          self.tipo,
            "descricao":     self.descricao,
            "saldo_inicial": float(self.saldo_inicial or 0),
            "data_saldo_ini": self.data_saldo_ini.isoformat() if self.data_saldo_ini else None,
            "ativo":         self.ativo,
            "criado_em":     self.criado_em.isoformat() if self.criado_em else None,
            "criado_por":    self.criado_por,
        }


class MovimentacaoContaFMS(Base):
    __tablename__ = "movimentacao_conta_fms"

    id            = Column(Integer, primary_key=True, index=True)
    conta_id      = Column(Integer, ForeignKey("conta_bancaria_fms.id"), nullable=False)
    tipo          = Column(String(20), nullable=False)   # "entrada" | "saida"
    valor         = Column(Numeric(15, 2), nullable=False)
    data          = Column(Date, nullable=False)
    descricao     = Column(String(300))
    origem        = Column(String(80), default="manual")  # manual | repasse | pagamento
    referencia_id = Column(Integer)
    criado_em     = Column(DateTime, default=datetime.utcnow)
    criado_por    = Column(String(100))

    conta = relationship("ContaBancariaFMS", back_populates="movimentacoes")

    def to_dict(self) -> dict:
        return {
            "id":            self.id,
            "conta_id":      self.conta_id,
            "tipo":          self.tipo,
            "valor":         float(self.valor or 0),
            "data":          self.data.isoformat() if self.data else None,
            "descricao":     self.descricao,
            "origem":        self.origem,
            "referencia_id": self.referencia_id,
            "criado_em":     self.criado_em.isoformat() if self.criado_em else None,
            "criado_por":    self.criado_por,
        }
