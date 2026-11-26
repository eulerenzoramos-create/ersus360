"""
Retrato do CNES do município por competência — coletado da API pública do CNES (cnes.datasus.gov.br/services).

Um registro por (município, competência CNES). Uma nova coleta na mesma competência substitui o retrato daquela
competência (o CNES é atualizado ao longo do mês); retratos de competências anteriores ficam como histórico.

LGPD (minimização): o CNS do profissional NÃO é guardado — vira uma chave pseudônima (HMAC) só para cruzar as
lotações da mesma pessoa (vínculos simultâneos, carga horária total). Fica o nome, que já é público no CNES.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, UniqueConstraint

from database import Base


class CnesRetrato(Base):
    __tablename__ = "cnes_retratos"
    __table_args__ = (UniqueConstraint("municipio_id", "competencia", name="uq_cnes_retrato_mun_comp"),)

    id             = Column(Integer, primary_key=True, autoincrement=True)
    municipio_id   = Column(Integer, ForeignKey("municipios.id"), nullable=False, index=True)
    municipio_ibge = Column(String(7), nullable=False)
    competencia    = Column(String(6), nullable=False)          # AAAAMM — competência publicada no CNES
    situacao       = Column(String(10), nullable=False)         # completo | parcial
    totais         = Column(JSON, nullable=False)
    dados          = Column(JSON, nullable=False)               # {estabelecimentos, equipes, pessoas}
    alteracoes     = Column(JSON)                               # diferença para o retrato anterior
    erros          = Column(JSON)                               # chamadas que falharam (coleta parcial)
    fonte          = Column(String(200), nullable=False, default="CNES — API pública (cnes.datasus.gov.br/services)")
    coletado_por   = Column(String(120))
    coletado_em    = Column(DateTime, default=datetime.utcnow, nullable=False)
