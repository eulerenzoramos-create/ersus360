"""Model: Execução Financeira FNS — Apuí/AM
Registra empenhos, liquidações e pagamentos vinculados a recursos FNS.
"""
from datetime import date, datetime
from sqlalchemy import String, Integer, Float, DateTime, Date, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class ExecucaoFns(Base):
    __tablename__ = "execucao_fns"

    id:               Mapped[int]   = mapped_column(Integer, primary_key=True, autoincrement=True)
    exercicio:        Mapped[int]   = mapped_column(Integer, default=2026, index=True)
    recurso:          Mapped[str]   = mapped_column(String(200))
    bloco:            Mapped[str]   = mapped_column(String(100), default="")
    grupo:            Mapped[str]   = mapped_column(String(100), default="")

    # Dotação = valor FNS recebido associado a este empenho
    dotacao:          Mapped[float] = mapped_column(Float, default=0.0)

    # Empenho
    numero_empenho:   Mapped[str | None] = mapped_column(String(50), nullable=True)
    data_empenho:     Mapped[date | None] = mapped_column(Date, nullable=True)
    empenhado:        Mapped[float] = mapped_column(Float, default=0.0)

    # Liquidação
    data_liquidacao:  Mapped[date | None] = mapped_column(Date, nullable=True)
    liquidado:        Mapped[float] = mapped_column(Float, default=0.0)
    nota_fiscal:      Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Pagamento
    data_pagamento:   Mapped[date | None] = mapped_column(Date, nullable=True)
    pago:             Mapped[float] = mapped_column(Float, default=0.0)
    numero_ob:        Mapped[str | None] = mapped_column(String(50), nullable=True)
    banco_pagamento:  Mapped[str | None] = mapped_column(String(120), nullable=True)
    agencia_pagamento: Mapped[str | None] = mapped_column(String(30), nullable=True)
    numero_conta_pag: Mapped[str | None] = mapped_column(String(40), nullable=True)

    # Identificação
    fornecedor:       Mapped[str]   = mapped_column(String(200), default="")
    cnpj_fornecedor:  Mapped[str | None] = mapped_column(String(18), nullable=True)
    contrato:         Mapped[str | None] = mapped_column(String(100), nullable=True)
    conta_pagadora:   Mapped[str | None] = mapped_column(String(100), nullable=True)
    portaria:         Mapped[str | None] = mapped_column(String(200), nullable=True)

    situacao:         Mapped[str]   = mapped_column(String(20), default="Pendente")
    observacao:       Mapped[str | None] = mapped_column(Text, nullable=True)
    ativo:            Mapped[bool]  = mapped_column(Boolean, default=True)

    criado_em:        Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    atualizado_em:    Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def saldo(self) -> float:
        return self.dotacao - self.pago

    @property
    def percentual(self) -> float:
        if self.dotacao <= 0:
            return 0.0
        return round((self.pago / self.dotacao) * 100, 1)

    def to_dict(self) -> dict:
        return {
            "id":              self.id,
            "exercicio":       self.exercicio,
            "recurso":         self.recurso,
            "bloco":           self.bloco,
            "grupo":           self.grupo,
            "dotacao":         self.dotacao,
            "numero_empenho":  self.numero_empenho,
            "data_empenho":    self.data_empenho.isoformat() if self.data_empenho else None,
            "empenhado":       self.empenhado,
            "data_liquidacao": self.data_liquidacao.isoformat() if self.data_liquidacao else None,
            "liquidado":       self.liquidado,
            "nota_fiscal":     self.nota_fiscal,
            "data_pagamento":  self.data_pagamento.isoformat() if self.data_pagamento else None,
            "pago":            self.pago,
            "numero_ob":        self.numero_ob,
            "banco_pagamento":  self.banco_pagamento,
            "agencia_pagamento": self.agencia_pagamento,
            "numero_conta_pag": self.numero_conta_pag,
            "fornecedor":      self.fornecedor,
            "cnpj_fornecedor": self.cnpj_fornecedor,
            "contrato":        self.contrato,
            "conta_pagadora":  self.conta_pagadora,
            "portaria":        self.portaria,
            "situacao":        self.situacao,
            "observacao":      self.observacao,
            "saldo":           self.saldo,
            "percentual":      self.percentual,
        }


class DocumentoExecucao(Base):
    __tablename__ = "documentos_execucao"

    id:          Mapped[int]  = mapped_column(Integer, primary_key=True, autoincrement=True)
    execucao_id: Mapped[int]  = mapped_column(Integer, index=True)
    nome:        Mapped[str]  = mapped_column(String(255))
    tipo_mime:   Mapped[str]  = mapped_column(String(100), default="application/octet-stream")
    tamanho_kb:  Mapped[int]  = mapped_column(Integer, default=0)
    conteudo_b64: Mapped[str] = mapped_column(Text)
    criado_em:   Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def to_dict_meta(self) -> dict:
        return {
            "id":          self.id,
            "execucao_id": self.execucao_id,
            "nome":        self.nome,
            "tipo_mime":   self.tipo_mime,
            "tamanho_kb":  self.tamanho_kb,
            "criado_em":   self.criado_em.isoformat(),
        }
