"""
Resultados oficiais publicados pelo SIAPS na área pública (apisiaps.saude.gov.br/api/public, sem login).

Cada coleta guarda o JSON recebido do Ministério da Saúde. Uma nova linha só nasce quando o conteúdo
publicado muda (hash diferente): a versão anterior fica preservada, então dá para saber quando o MS
publicou ou revisou um resultado. Nada aqui é calculado pelo ERSUS360.

  recurso = "quadrimestre" → chave "2026Q1" (Avaliação do Quadrimestre: Vínculo e Acompanhamento
                              Territorial e Qualidade, por tipo de equipe e por indicador)
  recurso = "equidade"     → chave = competência de referência do IED (ex.: "202608")
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, UniqueConstraint

from database import Base


class SiapsPublicoColeta(Base):
    __tablename__ = "siaps_publico_coleta"
    __table_args__ = (UniqueConstraint("municipio_id", "recurso", "chave", "versao", name="uq_siaps_publico_versao"),)

    id            = Column(Integer, primary_key=True, autoincrement=True)
    municipio_id  = Column(Integer, ForeignKey("municipios.id"), nullable=False, index=True)
    recurso       = Column(String(20), nullable=False)          # quadrimestre | equidade
    chave         = Column(String(10), nullable=False)          # 2026Q1 | 202608
    versao        = Column(Integer, nullable=False, default=1)  # 1 = primeira publicação vista
    hash          = Column(String(64), nullable=False)
    payload       = Column(JSON, nullable=False)                # resposta oficial, sem alteração
    coletado_em   = Column(DateTime, default=datetime.utcnow, nullable=False)   # quando esta versão foi vista
    verificado_em = Column(DateTime, default=datetime.utcnow, nullable=False)   # última conferência sem mudança
