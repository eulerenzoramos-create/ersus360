"""
Equipes do município segundo a API pública do SIAPS (apisiaps.saude.gov.br/api/public/filtros/equipes).

Sem login e para qualquer município: INE, nome e o tipo oficial usado no cofinanciamento
(eSF, eAP, eSFR, eSB, eMulti, eCR, eAPP). Atualizado automaticamente toda semana; a equipe que
deixa de aparecer fica marcada como inativa (não é apagada, para manter o histórico).
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, UniqueConstraint

from database import Base


class EquipeSiaps(Base):
    __tablename__ = "equipes_siaps"
    __table_args__ = (UniqueConstraint("municipio_id", "ine", name="uq_equipe_siaps"),)

    id            = Column(Integer, primary_key=True, autoincrement=True)
    municipio_id  = Column(Integer, ForeignKey("municipios.id"), nullable=False, index=True)
    ine           = Column(String(10), nullable=False)
    nome          = Column(String(200), nullable=False)
    tipo          = Column(String(10), nullable=False)          # eSF | eAP | eSFR | eSB | eMulti | eCR | eAPP
    ativa         = Column(Boolean, nullable=False, default=True)
    atualizado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
