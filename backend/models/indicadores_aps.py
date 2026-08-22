"""
Modelos para o módulo Indicadores APS — três camadas:
  1. Operacional diário (PEC)
  2. Monitoramento mensal (SIAPS)
  3. Avaliação quadrimestral (oficial)
"""
from __future__ import annotations
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    Text, JSON, ForeignKey, UniqueConstraint, Index,
)
from sqlalchemy.orm import relationship
from database import Base


# ── Configuração de Indicador (versionada) ─────────────────────────────────────

class IndicadorConfig(Base):
    __tablename__ = "indicador_config"
    id             = Column(Integer, primary_key=True)
    codigo         = Column(String(20), nullable=False)        # ex: "IND01"
    nome           = Column(String(200), nullable=False)
    descricao      = Column(Text)
    objetivo       = Column(Text)
    numerador_desc = Column(Text)
    denominador_desc = Column(Text)
    formula        = Column(Text)
    criterios_inclusao  = Column(Text)
    criterios_exclusao  = Column(Text)
    tipo_equipe    = Column(String(100))                       # "eSF,eAP,eSFR"
    periodo_afericao = Column(String(20))                      # "mensal" | "quadrimestral"
    parametro_meta = Column(Float)
    pontuacao_max  = Column(Float)
    peso           = Column(Float, default=1.0)
    fonte          = Column(String(100), default="SIAPS")
    nota_metodologica = Column(Text)
    versao         = Column(String(20), nullable=False)        # ex: "2024.1"
    vigente        = Column(Boolean, default=True)
    vigencia_inicio = Column(String(7))                        # "2024-01"
    vigencia_fim    = Column(String(7))                        # null = sem fim
    criado_em      = Column(DateTime, default=datetime.utcnow)
    atualizado_em  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("codigo", "versao", name="uq_indicador_config_codigo_versao"),
    )


# ── Classificação (parametrizável) ────────────────────────────────────────────

class ClassificacaoConfig(Base):
    __tablename__ = "classificacao_config"
    id             = Column(Integer, primary_key=True)
    componente     = Column(String(50), nullable=False)        # "CVAT" | "QUALIDADE"
    classificacao  = Column(String(30), nullable=False)        # "otimo" | "bom" | "suficiente" | "regular"
    label          = Column(String(30), nullable=False)        # "Ótimo" | "Bom" ...
    limite_min     = Column(Float, nullable=False)
    limite_max     = Column(Float)                             # null = sem limite superior
    cor_hex        = Column(String(10), default="#1d4ed8")
    versao         = Column(String(20), nullable=False)
    vigencia_inicio = Column(String(7))
    vigencia_fim    = Column(String(7))
    criado_em      = Column(DateTime, default=datetime.utcnow)


# ── Log de Sincronização ───────────────────────────────────────────────────────

class SincronizacaoLog(Base):
    __tablename__ = "sincronizacao_log"
    id              = Column(Integer, primary_key=True)
    municipio_ibge  = Column(String(10), nullable=False, index=True)
    fonte           = Column(String(50), nullable=False)        # "PEC" | "SIAPS" | "MANUAL"
    competencia     = Column(String(7))                         # "2026-05"
    iniciado_em     = Column(DateTime, default=datetime.utcnow)
    concluido_em    = Column(DateTime)
    duracao_s       = Column(Float)
    sucesso         = Column(Boolean, default=False)
    registros_lidos     = Column(Integer, default=0)
    registros_inseridos = Column(Integer, default=0)
    registros_atualizados = Column(Integer, default=0)
    registros_rejeitados  = Column(Integer, default=0)
    erros           = Column(Integer, default=0)
    metodo          = Column(String(100))                       # "api" | "arquivo" | "manual"
    versao_pec      = Column(String(20))
    usuario         = Column(String(100))
    periodo_inicio  = Column(String(10))
    periodo_fim     = Column(String(10))
    payload_resumo  = Column(JSON)
    observacao      = Column(Text)
    criado_em       = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_sinc_log_ibge_comp", "municipio_ibge", "competencia"),
    )


# ── Resultado Mensal SIAPS ─────────────────────────────────────────────────────

class ResultadoMensalSiaps(Base):
    __tablename__ = "resultado_mensal_siaps"
    id              = Column(Integer, primary_key=True)
    municipio_ibge  = Column(String(10), nullable=False, index=True)
    competencia     = Column(String(7), nullable=False)         # "2026-05"
    equipe_ine      = Column(String(30))
    equipe_nome     = Column(String(100))
    equipe_tipo     = Column(String(20))
    cnes            = Column(String(10))
    indicador_codigo = Column(String(20), nullable=False)
    indicador_nome  = Column(String(200))
    numerador       = Column(Float)
    denominador     = Column(Float)
    resultado_pct   = Column(Float)
    meta            = Column(Float)
    pontuacao       = Column(Float)
    classificacao   = Column(String(30))
    situacao        = Column(String(30), default="preliminar")  # "preliminar" | "consolidado"
    fonte           = Column(String(50), default="SIAPS")
    versao_metodologia = Column(String(20))
    data_publicacao = Column(String(10))
    data_extracao   = Column(DateTime, default=datetime.utcnow)
    data_atualizacao = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    payload_original = Column(JSON)                             # JSON bruto da fonte

    __table_args__ = (
        UniqueConstraint(
            "municipio_ibge", "competencia", "equipe_ine", "indicador_codigo",
            name="uq_resultado_mensal",
        ),
        Index("ix_res_mensal_ibge_comp", "municipio_ibge", "competencia"),
    )


# ── Resultado CVAT Mensal ──────────────────────────────────────────────────────

class ResultadoCvatMensal(Base):
    __tablename__ = "resultado_cvat_mensal"
    id              = Column(Integer, primary_key=True)
    municipio_ibge  = Column(String(10), nullable=False, index=True)
    competencia     = Column(String(7), nullable=False)
    equipe_ine      = Column(String(30))
    equipe_nome     = Column(String(100))
    equipe_tipo     = Column(String(20))
    cnes            = Column(String(10))
    ubs             = Column(String(200))
    # Variáveis A–K com nome e descrição
    var_A = Column(Float); var_A_nome = Column(String(200))
    var_B = Column(Float); var_B_nome = Column(String(200))
    var_C = Column(Float); var_C_nome = Column(String(200))
    var_D = Column(Float); var_D_nome = Column(String(200))
    var_E = Column(Float); var_E_nome = Column(String(200))
    var_F = Column(Float); var_F_nome = Column(String(200))
    var_G = Column(Float); var_G_nome = Column(String(200))
    var_H = Column(Float); var_H_nome = Column(String(200))
    var_I = Column(Float); var_I_nome = Column(String(200))
    var_J = Column(Float); var_J_nome = Column(String(200))
    var_K = Column(Float); var_K_nome = Column(String(200))
    pontuacao       = Column(Float)
    classificacao   = Column(String(30))
    situacao        = Column(String(30), default="preliminar")
    populacao_parametro = Column(Integer)
    ied_municipal   = Column(String(10))
    fonte           = Column(String(50), default="SIAPS")
    versao_metodologia = Column(String(20))
    data_extracao   = Column(DateTime, default=datetime.utcnow)
    data_atualizacao = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    payload_original = Column(JSON)

    __table_args__ = (
        UniqueConstraint("municipio_ibge", "competencia", "equipe_ine", name="uq_cvat_mensal"),
        Index("ix_cvat_mensal_ibge_comp", "municipio_ibge", "competencia"),
    )


# ── Resultado Quadrimestral ────────────────────────────────────────────────────

class ResultadoQuadrimestral(Base):
    __tablename__ = "resultado_quadrimestral"
    id              = Column(Integer, primary_key=True)
    municipio_ibge  = Column(String(10), nullable=False, index=True)
    ano             = Column(Integer, nullable=False)
    quadrimestre    = Column(Integer, nullable=False)           # 1, 2 ou 3
    equipe_ine      = Column(String(30))
    equipe_nome     = Column(String(100))
    equipe_tipo     = Column(String(20))
    cnes            = Column(String(10))
    indicador_codigo = Column(String(20))
    indicador_nome  = Column(String(200))
    # Meses que compõem o quadrimestre
    comp_mes1       = Column(String(7))
    comp_mes2       = Column(String(7))
    comp_mes3       = Column(String(7))
    comp_mes4       = Column(String(7))
    resultado_mes1  = Column(Float)
    resultado_mes2  = Column(Float)
    resultado_mes3  = Column(Float)
    resultado_mes4  = Column(Float)
    media_quadrimestre = Column(Float)
    pontuacao       = Column(Float)
    peso            = Column(Float)
    classificacao   = Column(String(30))
    situacao        = Column(String(30), default="oficial")
    componente      = Column(String(50))                        # "CVAT" | "QUALIDADE" | "BOAS_PRATICAS"
    valor_financeiro = Column(Float)
    fonte           = Column(String(50), default="SIAPS")
    versao_metodologia = Column(String(20))
    data_publicacao = Column(String(10))
    data_extracao   = Column(DateTime, default=datetime.utcnow)
    # Resultado anterior preservado (nunca sobrescrever sem salvar o anterior)
    resultado_anterior_json = Column(JSON)
    payload_original = Column(JSON)

    __table_args__ = (
        UniqueConstraint(
            "municipio_ibge", "ano", "quadrimestre", "equipe_ine", "indicador_codigo",
            name="uq_resultado_quadrimestral",
        ),
        Index("ix_res_quad_ibge_ano_q", "municipio_ibge", "ano", "quadrimestre"),
    )


# ── Projeção Diária (PEC) ─────────────────────────────────────────────────────

class ProjecaoDiaria(Base):
    __tablename__ = "projecao_diaria"
    id              = Column(Integer, primary_key=True)
    municipio_ibge  = Column(String(10), nullable=False, index=True)
    data_referencia = Column(String(10), nullable=False)        # "2026-08-22"
    competencia     = Column(String(7), nullable=False)
    equipe_ine      = Column(String(30))
    equipe_nome     = Column(String(100))
    indicador_codigo = Column(String(20), nullable=False)
    numerador_projetado   = Column(Float)
    denominador_projetado = Column(Float)
    resultado_projetado   = Column(Float)
    meta            = Column(Float)
    distancia_meta  = Column(Float)
    necessario_meta = Column(Float)                             # quanto falta para atingir
    cobertura_dados = Column(Float)                             # % de dados disponíveis
    registros_pendentes = Column(Integer, default=0)
    versao_formula  = Column(String(20))
    fonte           = Column(String(50), default="PEC")
    situacao        = Column(String(30), default="operacional")
    calculado_em    = Column(DateTime, default=datetime.utcnow)
    sincronizacao_id = Column(Integer, ForeignKey("sincronizacao_log.id"))

    __table_args__ = (
        UniqueConstraint(
            "municipio_ibge", "data_referencia", "equipe_ine", "indicador_codigo",
            name="uq_projecao_diaria",
        ),
    )


# ── Inconsistência ────────────────────────────────────────────────────────────

class InconsistenciaAPS(Base):
    __tablename__ = "inconsistencia_aps"
    id              = Column(Integer, primary_key=True)
    municipio_ibge  = Column(String(10), nullable=False, index=True)
    competencia     = Column(String(7))
    equipe_ine      = Column(String(30))
    equipe_nome     = Column(String(100))
    tipo            = Column(String(50), nullable=False)        # "CNES_DIVERGENTE" | "INE_INVALIDO" ...
    gravidade       = Column(String(20), default="atencao")    # "informativo"|"atencao"|"urgente"|"critico"
    descricao       = Column(Text)
    causa_provavel  = Column(Text)
    evidencia       = Column(Text)
    situacao        = Column(String(20), default="aberta")     # "aberta"|"em_tratamento"|"resolvida"
    responsavel     = Column(String(100))
    prazo           = Column(String(10))
    providencia     = Column(Text)
    data_resolucao  = Column(String(10))
    fonte           = Column(String(50))
    criado_em       = Column(DateTime, default=datetime.utcnow)
    atualizado_em   = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
