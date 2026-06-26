"""Schemas: FNS · Dashboard · Indicadores · Alertas"""
from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from models.indicador import SituacaoIndicador
from models.alerta import SeveridadeAlerta


# ─── FNS ────────────────────────────────────────────────────────────────────

class FnsSyncRequest(BaseModel):
    mes: int
    ano: int
    municipio_id: int = 1
    modo: str = "preview"   # "preview" | "sync"


class FnsRepasseItem(BaseModel):
    numero_convenio: str
    objeto: str
    bloco: str
    competencia: str
    valor_previsto: float
    valor_realizado: float
    data_repasse: str | None = None
    tipo: str = "Federal"
    novos: int = 0


class FnsSyncResult(BaseModel):
    status: str             # "ok" | "erro" | "sem_dados"
    municipio_ibge: str
    competencia: str
    total_encontrados: int
    novos_inseridos: int
    atualizados: int
    alertas_gerados: int
    itens: list[FnsRepasseItem] = []
    mensagem: str = ""
    executado_em: datetime


class FnsStatusOut(BaseModel):
    ultimo_sync: datetime | None
    competencia: str | None
    status: str
    novos_repasses: int
    erros: int


class FnsHistoricoItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    competencia: str
    status: str
    novos_inseridos: int
    atualizados: int
    alertas_gerados: int
    executado_em: datetime


# ─── Dashboard ──────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    municipio_id: int
    municipio_nome: str

    # Indicadores
    total_indicadores: int
    indicadores_atingidos: int
    execucao_media: float

    # Financeiro
    total_repasses: float
    convenios_vigentes: int
    total_convenios: int

    # PAS
    execucao_pas: float

    # Alertas
    alertas_ativos: int
    alertas_criticos: int

    atualizado_em: datetime


# ─── Indicadores ────────────────────────────────────────────────────────────

class IndicadorBase(BaseModel):
    indicador: str
    eixo: str | None = None
    unidade_medida: str = "%"
    meta_prevista: float = 100.0
    valor_alcancado: float = 0.0
    meta_financeira_prevista: float = 0.0
    meta_financeira_realizada: float = 0.0
    execucao_fisica: int = 0
    competencia: str | None = None
    situacao: SituacaoIndicador = SituacaoIndicador.EM_ANDAMENTO


class IndicadorCreate(IndicadorBase):
    municipio_id: int = 1


class IndicadorUpdate(IndicadorBase):
    pass


class IndicadorOut(IndicadorBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    municipio_id: int
    criado_em: datetime
    atualizado_em: datetime


# ─── Alertas ────────────────────────────────────────────────────────────────

class AlertaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    municipio_id: int
    convenio_id: int | None
    titulo: str
    descricao: str
    modulo: str
    severidade: SeveridadeAlerta
    resolvido: bool
    resolvido_em: datetime | None
    criado_em: datetime


class AlertaResolverRequest(BaseModel):
    observacao: str | None = None
