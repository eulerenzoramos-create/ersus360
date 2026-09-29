"""
Pagamento da APS por componente e validação por equipe, lidos AUTOMATICAMENTE do e-Gestor APS
(relatorioaps-prd.saude.gov.br/financiamento/pagamento — API pública, sem login).

Guarda só o que o e-Gestor publica: valores por componente, classificação de Qualidade/Vínculo e a
situação de pagamento de cada equipe (suspensões). Não guarda dados de profissionais (CNS).
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint

from database import Base


class EgestorPagamentoComponente(Base):
    __tablename__ = "egestor_pagamento_componente"
    __table_args__ = (UniqueConstraint("municipio_id", "nu_parcela", "co_componente", name="uq_egestor_pgto_comp"),)

    id               = Column(Integer, primary_key=True, autoincrement=True)
    municipio_id     = Column(Integer, ForeignKey("municipios.id"), nullable=False, index=True)
    nu_parcela       = Column(String(6), nullable=False)       # 202609 = 9ª parcela de 2026
    nu_comp_cnes     = Column(String(6), nullable=False)       # 202607 = competência CNES avaliada
    co_plano         = Column(Integer, nullable=False)
    ds_plano         = Column(String(200), nullable=False)
    co_componente    = Column(Integer, nullable=False)
    ds_componente    = Column(String(200), nullable=False)
    vl_total         = Column(Float)
    vl_desconto      = Column(Float)
    vl_ajuste        = Column(Float)
    classificacao_qualidade = Column(String(30))
    classificacao_vinculo   = Column(String(30))
    resumo           = Column(Text, nullable=False, default="{}")   # campos escalares publicados (JSON)
    coletado_em      = Column(DateTime, default=datetime.utcnow, nullable=False)


class EgestorValidacaoEquipe(Base):
    __tablename__ = "egestor_validacao_equipe"
    __table_args__ = (UniqueConstraint("municipio_id", "nu_parcela", "co_componente", "ine",
                                       name="uq_egestor_valid_equipe"),)

    id               = Column(Integer, primary_key=True, autoincrement=True)
    municipio_id     = Column(Integer, ForeignKey("municipios.id"), nullable=False, index=True)
    nu_parcela       = Column(String(6), nullable=False)
    co_componente    = Column(Integer, nullable=False)
    ine              = Column(String(10), nullable=False)
    ine_vinculada    = Column(String(10))                     # eSB → eSF/eAP de referência
    cnes             = Column(String(7))
    st_pagamento     = Column(String(40))
    pendencias       = Column(Text, nullable=False, default="[]")   # situações diferentes de válido/ativo (JSON)
    payload          = Column(Text, nullable=False, default="{}")
    coletado_em      = Column(DateTime, default=datetime.utcnow, nullable=False)
