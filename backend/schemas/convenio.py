"""Schemas Pydantic v2 — Convenio, Repasse, Cronograma"""
from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator
from models.convenio import SituacaoConvenio
from models.repasse import TipoRepasse
from models.cronograma import SituacaoCronograma


# ─── BlocoPacto ──────────────────────────────────────────────────────────────

class BlocoPactoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nome: str
    descricao: str | None = None


# ─── Convenio ────────────────────────────────────────────────────────────────

class ConvenioBase(BaseModel):
    numero: str
    objeto: str
    programa: str | None = None
    numero_sismob: str | None = None
    numero_processo: str | None = None
    valor_contrato: float = 0.0
    perc_fisico_executado: float = 0.0
    perc_financeiro_executado: float = 0.0
    situacao: SituacaoConvenio = SituacaoConvenio.VIGENTE
    data_inicio: str | None = None
    data_previsao_conclusao: str | None = None
    bloco_pacto_id: int | None = None


class ConvenioCreate(ConvenioBase):
    municipio_id: int = 1


class ConvenioUpdate(ConvenioBase):
    pass


class ConvenioOut(ConvenioBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    municipio_id: int
    criado_em: datetime
    atualizado_em: datetime
    bloco_pacto: BlocoPactoOut | None = None


# ─── Repasse ─────────────────────────────────────────────────────────────────

class RepasseBase(BaseModel):
    convenio_id: int
    competencia: str           # "2026-06"
    mes: int
    ano: int
    tipo_repasse: str = "Federal"
    novos_repasses: int = 0
    valor_previsto: float = 0.0
    valor_realizado: float = 0.0
    data_repasse: str | None = None

    @field_validator("competencia")
    @classmethod
    def valida_competencia(cls, v: str) -> str:
        if len(v) != 7 or v[4] != "-":
            raise ValueError("competencia deve estar no formato YYYY-MM")
        return v


class RepasseCreate(RepasseBase):
    origem: str = "manual"


class RepasseUpdate(BaseModel):
    valor_previsto: float | None = None
    valor_realizado: float | None = None
    tipo_repasse: str | None = None
    novos_repasses: int | None = None
    data_repasse: str | None = None


class RepasseOut(RepasseBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    origem: str
    criado_em: datetime


class RepasseMensalOut(BaseModel):
    """Agregado mensal para o gráfico de evolução."""
    competencia: str
    mes: int
    ano: int
    total_previsto: float
    total_realizado: float
    novos_repasses: int


# ─── Cronograma ──────────────────────────────────────────────────────────────

class CronogramaBase(BaseModel):
    convenio_id: int
    descricao: str
    meta_financeira_prevista: float = 0.0
    meta_financeira_realizada: float = 0.0
    execucao_fisica: int = 0
    situacao: SituacaoCronograma = SituacaoCronograma.PREVISTO


class CronogramaCreate(CronogramaBase):
    pass


class CronogramaUpdate(BaseModel):
    descricao: str | None = None
    meta_financeira_prevista: float | None = None
    meta_financeira_realizada: float | None = None
    execucao_fisica: int | None = None
    situacao: SituacaoCronograma | None = None


class CronogramaOut(CronogramaBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    criado_em: datetime
    atualizado_em: datetime
