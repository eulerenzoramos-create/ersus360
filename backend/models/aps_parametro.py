"""
Parâmetros normativos do financiamento da APS usados pelo Simulador (valores por equipe, por classificação,
de implantação, regras de transição) — com fonte, vigência e histórico.

Nada é sobrescrito: cada mudança vira uma linha nova. A versão anterior recebe `vigencia_fim` e continua
servindo aos cálculos das competências passadas (cálculo histórico preservado).

situacao:
  vigente              → usado nos cálculos a partir de `vigencia_inicio` (AAAAMM)
  pendente_validacao   → registrado (manualmente ou por alteração detectada) e ainda não validado
  substituido          → versão anterior (mantida para histórico)
  rejeitado            → não validado (mantido para auditoria)

Os parâmetros-base estão em services/aps_parametros.py (texto da PRT GM/MS 3.493/2024); esta tabela guarda
as atualizações validadas e as alterações detectadas no e-Gestor (valores de referência por portaria).
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String, Text

from database import Base


class ApsParametroNorma(Base):
    __tablename__ = "aps_parametro_norma"

    id               = Column(Integer, primary_key=True, autoincrement=True)
    municipio_id     = Column(Integer, ForeignKey("municipios.id"), nullable=True, index=True)  # None = nacional
    chave            = Column(String(80), nullable=False, index=True)   # ex.: qualidade.eSF.bom
    valor            = Column(Float)
    valor_texto      = Column(String(200))                               # ex.: competência de fim da transição
    norma            = Column(String(200), nullable=False)               # ex.: PRT GM/MS 3.493/2024, Anexo III
    fonte            = Column(String(300), nullable=False)               # de onde o valor foi lido
    origem           = Column(String(20), nullable=False)                # manual | egestor
    justificativa    = Column(Text)
    vigencia_inicio  = Column(String(6), nullable=False)                 # AAAAMM (competência)
    vigencia_fim     = Column(String(6))
    situacao         = Column(String(25), nullable=False, default="pendente_validacao")
    detalhe          = Column(JSON)                                       # ex.: valores de referência do e-Gestor
    registrado_por   = Column(String(120))
    registrado_em    = Column(DateTime, default=datetime.utcnow, nullable=False)
    validado_por     = Column(String(120))
    validado_em      = Column(DateTime)
