"""
Vigilância em Saúde — dados públicos agregados da FVS-RCP/AM (fvs.am.gov.br/dadossaude).

São dados ESTADUAIS e públicos (os 62 municípios do Amazonas), por isso as tabelas não têm
municipio_id: qualquer sessão pode consultar qualquer município do AM para comparação.
Nenhuma linha contém dado pessoal: o coletor só grava contagens/indicadores por município
e período (ver services/fvs_tableau.py — colunas identificadoras são recusadas na leitura).

  fvs_municipio      62 municípios do AM com a Região de Saúde informada pela FVS
  fvs_serie          série histórica: fonte × indicador × município × período × recorte
  fvs_fonte_estado   situação atual de cada fonte (última sincronização, data de publicação na fonte)
  fvs_sincronizacao  histórico de execuções do coletor (registros, diferenças, erros)
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import (JSON, Column, DateTime, Float, ForeignKey, Index, Integer, String, Text,
                        UniqueConstraint)

from database import Base


class FvsMunicipio(Base):
    __tablename__ = "fvs_municipio"

    ibge6        = Column(String(6), primary_key=True)
    ibge7        = Column(String(7), nullable=False, unique=True)
    nome         = Column(String(80), nullable=False)
    regiao_saude = Column(String(60), nullable=True)   # nome da Região de Saúde segundo a FVS
    fonte        = Column(String(120), nullable=False)
    atualizado_em = Column(DateTime, default=datetime.utcnow, nullable=False)


class FvsSerie(Base):
    __tablename__ = "fvs_serie"
    __table_args__ = (
        UniqueConstraint("fonte", "indicador", "ibge6", "ano", "periodo_tipo", "periodo", "recorte",
                         "recorte_valor", name="uq_fvs_serie"),
        Index("ix_fvs_serie_consulta", "fonte", "indicador", "ano", "periodo_tipo"),
        Index("ix_fvs_serie_mun", "ibge6", "fonte"),
    )

    id            = Column(Integer, primary_key=True, autoincrement=True)
    fonte         = Column(String(30), nullable=False)        # pqa_vs | malaria | sinan | aesop | vacinometro
    indicador     = Column(String(80), nullable=False)        # ex.: "casos:Dengue", "IND_07", "positivos"
    ibge6         = Column(String(6), nullable=False)         # "130000" = Amazonas (total estadual da fonte)
    ano           = Column(Integer, nullable=False)
    periodo_tipo  = Column(String(12), nullable=False)        # ano | mes | se | quadrimestre
    periodo       = Column(Integer, nullable=False, default=0)  # 0 (ano), 1–12, 1–53, 1–3
    recorte       = Column(String(20), nullable=False, default="total")   # total | sexo | faixa_etaria | ...
    recorte_valor = Column(String(80), nullable=False, default="")
    valor         = Column(Float, nullable=True)              # número publicado (ou contagem da base oficial)
    numerador     = Column(Float, nullable=True)
    denominador   = Column(Float, nullable=True)
    meta          = Column(String(40), nullable=True)
    alcance       = Column(String(20), nullable=True)         # "SIM"/"NÃO" quando a fonte publica
    texto         = Column(String(80), nullable=True)         # resultado não numérico publicado (NSA, SN, "Sim"…)
    sincronizacao_id = Column(Integer, ForeignKey("fvs_sincronizacao.id"), nullable=True)


class FvsFonteEstado(Base):
    __tablename__ = "fvs_fonte_estado"

    fonte              = Column(String(30), primary_key=True)
    situacao           = Column(String(20), nullable=False, default="nunca_sincronizada")  # ok | erro | ...
    mensagem           = Column(Text, nullable=True)
    publicado_na_fonte = Column(DateTime, nullable=True)   # lastUpdateDate do Tableau Public (UTC)
    data_referencia    = Column(String(40), nullable=True)  # ex.: "dados até 21/10/2026", "SE 37/2026"
    registros          = Column(Integer, nullable=True)
    hash_conteudo      = Column(String(64), nullable=True)
    ultima_tentativa   = Column(DateTime, nullable=True)
    ultima_sucesso     = Column(DateTime, nullable=True)


class FvsSincronizacao(Base):
    __tablename__ = "fvs_sincronizacao"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    fonte         = Column(String(30), nullable=False, index=True)
    origem        = Column(String(20), nullable=False, default="agendada")   # agendada | manual
    usuario       = Column(String(120), nullable=True)
    iniciado_em   = Column(DateTime, default=datetime.utcnow, nullable=False)
    concluido_em  = Column(DateTime, nullable=True)
    situacao      = Column(String(20), nullable=False, default="executando")  # ok | sem_mudanca | erro | executando
    registros     = Column(Integer, nullable=True)
    novos         = Column(Integer, nullable=True)
    alterados     = Column(Integer, nullable=True)
    removidos     = Column(Integer, nullable=True)
    publicado_na_fonte = Column(DateTime, nullable=True)
    hash_conteudo = Column(String(64), nullable=True)
    validacao     = Column(JSON, nullable=True)   # duplicados, municípios fora do AM, campos vazios…
    erro          = Column(Text, nullable=True)
