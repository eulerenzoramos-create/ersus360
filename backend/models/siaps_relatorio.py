"""
Relatórios do SIAPS importados pelo município ("Baixar dados" em siaps.saude.gov.br).

A API do SIAPS exige o login gov.br pessoal de quem opera o sistema, então a
integração é pelo arquivo oficial exportado (CSV ou XLSX). Um registro por
(município, componente, indicador, competência, tipo de equipe): reimportar o
mesmo relatório substitui o anterior.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint

from database import Base


class SiapsRelatorio(Base):
    __tablename__ = "siaps_relatorios"
    __table_args__ = (UniqueConstraint("municipio_id", "componente", "indicador", "competencia", "tipo_equipe",
                                       name="uq_siaps_relatorio"),)

    id              = Column(Integer, primary_key=True, autoincrement=True)
    municipio_id    = Column(Integer, ForeignKey("municipios.id"), nullable=False, index=True)
    municipio_ibge  = Column(String(7), nullable=False)
    componente      = Column(String(20), nullable=False)       # cvat | qualidade
    indicador       = Column(String(200), nullable=False, default="")   # "" no CVAT
    competencia     = Column(String(7), nullable=False)        # AAAA-MM
    tipo_equipe     = Column(String(60), nullable=False)       # "eAP, eSF" | "eSFR" | ...
    condicao        = Column(String(200), nullable=True)
    dado_preliminar = Column(Boolean, nullable=False, default=False)
    gerado_em       = Column(String(60), nullable=True)        # texto do cabeçalho do SIAPS
    colunas         = Column(Text, nullable=False)             # JSON [nomes das colunas de valor]
    linhas          = Column(Text, nullable=False)             # JSON [{cnes, ubs, ine, equipe, sigla, valores, pontuacao}]
    arquivo_nome    = Column(String(255), nullable=True)
    importado_por   = Column(String(200), nullable=True)
    importado_em    = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
