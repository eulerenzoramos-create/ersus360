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

from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint

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


class SiapsQuadrimestreEquipe(Base):
    """Avaliação quadrimestral OFICIAL por equipe (área logada do SIAPS, captura assistida).

    Uma linha por versão: quando o Ministério altera a nota/classificação de uma equipe (ex.: correções
    das versões do SIAPS), nasce a versão seguinte e a anterior fica preservada (ativa=False).
    componente: "CVAT" (Componente II, coTipoIndicador 119) | "QUALIDADE" (Componente III, 120).
    indicadores: {SG: {nota, peso, conceito, classificacao, score, nm, dn, mensal...}} como publicado.
    """
    __tablename__ = "siaps_quadrimestre_equipe"
    __table_args__ = (UniqueConstraint("municipio_id", "quadrimestre", "componente", "ine", "versao",
                                       name="uq_siaps_quad_equipe_versao"),)

    id             = Column(Integer, primary_key=True, autoincrement=True)
    municipio_id   = Column(Integer, ForeignKey("municipios.id"), nullable=False, index=True)
    quadrimestre   = Column(String(6), nullable=False)          # 2026Q1
    componente     = Column(String(10), nullable=False)         # CVAT | QUALIDADE
    sg_equipe      = Column(String(10), nullable=False)
    ine            = Column(String(10), nullable=False)
    equipe         = Column(String(120))
    cnes           = Column(String(10))
    ubs            = Column(String(200))
    nota_final     = Column(Float)
    classificacao  = Column(String(20))                         # otimo | bom | suficiente | regular
    equipe_valida  = Column(Boolean)
    homologada     = Column(Boolean)
    indicadores    = Column(JSON)
    versao         = Column(Integer, nullable=False, default=1)
    ativa          = Column(Boolean, nullable=False, default=True)
    hash           = Column(String(64), nullable=False)
    capturado_em   = Column(DateTime, default=datetime.utcnow, nullable=False)
