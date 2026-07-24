"""Model: Repasse FNS Fundo a Fundo — Apuí/AM"""
from datetime import datetime
from sqlalchemy import String, Float, DateTime, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class RepasseFNS(Base):
    __tablename__ = "repasses_fns"

    id:               Mapped[str]   = mapped_column(String(40), primary_key=True)
    competencia:      Mapped[str]   = mapped_column(String(10), index=True)   # "Jul/2026"
    bloco:            Mapped[str]   = mapped_column(String(80))
    programa:         Mapped[str]   = mapped_column(Text)
    valor_previsto:   Mapped[float] = mapped_column(Float, default=0.0)
    valor_creditado:  Mapped[float | None] = mapped_column(Float, nullable=True)
    data_prevista:    Mapped[str | None]   = mapped_column(String(10), nullable=True)
    data_credito:     Mapped[str | None]   = mapped_column(String(10), nullable=True)
    status:           Mapped[str]   = mapped_column(String(20), default="previsto")
    portaria:         Mapped[str | None]   = mapped_column(Text, nullable=True)
    observacao:       Mapped[str | None]   = mapped_column(Text, nullable=True)
    fonte:            Mapped[str]   = mapped_column(String(30), default="manual")
    editado_em:       Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    sincronizado_em:  Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    criado_em:        Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id":              self.id,
            "competencia":     self.competencia,
            "bloco":           self.bloco,
            "programa":        self.programa,
            "valor_previsto":  self.valor_previsto,
            "valor_creditado": self.valor_creditado,
            "data_prevista":   self.data_prevista,
            "data_credito":    self.data_credito,
            "status":          self.status,
            "portaria":        self.portaria or "",
            "observacao":      self.observacao or "",
            "fonte":           self.fonte,
            "editado_em":      self.editado_em.isoformat() if self.editado_em else None,
            "sincronizado_em": self.sincronizado_em.isoformat() if self.sincronizado_em else None,
        }
