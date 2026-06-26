"""
Routers: Vigilância em Saúde · Transporte/TFD · Regulação
"""
from __future__ import annotations
from datetime import datetime
from typing import Annotated
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from database import get_db

DbDep = Annotated[AsyncSession, Depends(get_db)]

# ─── VIGILÂNCIA ──────────────────────────────────────────────────────────────

vigilancia_router = APIRouter(prefix="/api/vigilancia", tags=["Vigilância"])


class AgravoDado(BaseModel):
    agravo: str
    casos_confirmados: int
    casos_suspeitos: int
    obitos: int
    competencia: str
    semana_epidemiologica: int | None = None


@vigilancia_router.get("/dashboard")
async def vigilancia_dashboard(municipio_id: int = Query(1)):
    return {
        "municipio_id": municipio_id,
        "competencia": "2026-06",
        "agravos_notificados": 28,
        "doencas_monitoradas": 28,
        "surtos_ativos": 0,
        "casos_novos_mes": 10,
        "cobertura_vacinal_geral": 88.4,
        "cobertura_vacinal_media": 88.4,
        "inspecoes_sanitarias": 142,
        "visitas_sanitarias": 142,
        "amostras_agua": 24,
        "atualizado_em": datetime.utcnow(),
    }


@vigilancia_router.get("/agravos")
async def listar_agravos(municipio_id: int = Query(1)):
    """Retorna agravos compatível com o frontend (campos extras para UI)."""
    dados = [
        {"id": 1, "agravo": "Dengue",                 "nome": "Dengue",                 "cid10": "A90", "casos_confirmados": 4,  "casos_suspeitos": 12, "casos_mes": 4,  "casos_acum": 18, "obitos": 0, "tendencia": "crescente", "alerta": True,  "competencia": "2026-06", "semana_epidemiologica": 24},
        {"id": 2, "agravo": "Malária",                "nome": "Malária",                "cid10": "B50", "casos_confirmados": 2,  "casos_suspeitos": 5,  "casos_mes": 2,  "casos_acum": 9,  "obitos": 0, "tendencia": "estável",   "alerta": False, "competencia": "2026-06", "semana_epidemiologica": 24},
        {"id": 3, "agravo": "Leishmaniose Tegumentar","nome": "Leishmaniose Tegumentar","cid10": "B55", "casos_confirmados": 1,  "casos_suspeitos": 3,  "casos_mes": 1,  "casos_acum": 4,  "obitos": 0, "tendencia": "estável",   "alerta": False, "competencia": "2026-06", "semana_epidemiologica": None},
        {"id": 4, "agravo": "Leptospirose",           "nome": "Leptospirose",           "cid10": "A27", "casos_confirmados": 0,  "casos_suspeitos": 2,  "casos_mes": 0,  "casos_acum": 2,  "obitos": 0, "tendencia": "decrescente","alerta": False, "competencia": "2026-06", "semana_epidemiologica": None},
        {"id": 5, "agravo": "Tuberculose",            "nome": "Tuberculose",            "cid10": "A15", "casos_confirmados": 1,  "casos_suspeitos": 0,  "casos_mes": 1,  "casos_acum": 3,  "obitos": 0, "tendencia": "estável",   "alerta": False, "competencia": "2026-06", "semana_epidemiologica": None},
        {"id": 6, "agravo": "Sífilis Congênita",      "nome": "Sífilis Congênita",      "cid10": "A50", "casos_confirmados": 2,  "casos_suspeitos": 0,  "casos_mes": 2,  "casos_acum": 5,  "obitos": 0, "tendencia": "crescente", "alerta": True,  "competencia": "2026-06", "semana_epidemiologica": None},
    ]
    return dados


@vigilancia_router.get("/vacinacao")
async def vacinacao(municipio_id: int = Query(1)):
    return [
        {"vacina": "BCG", "meta": 95.0, "cobertura": 92.3, "situacao": "ok"},
        {"vacina": "Penta (3ª dose)", "meta": 95.0, "cobertura": 88.7, "situacao": "atencao"},
        {"vacina": "Poliomielite (VIP/VOP)", "meta": 95.0, "cobertura": 87.1, "situacao": "atencao"},
        {"vacina": "Rotavírus (2ª dose)", "meta": 95.0, "cobertura": 84.5, "situacao": "atencao"},
        {"vacina": "Febre Amarela", "meta": 95.0, "cobertura": 96.2, "situacao": "ok"},
        {"vacina": "tríplice viral (2ª dose)", "meta": 95.0, "cobertura": 91.8, "situacao": "ok"},
        {"vacina": "HPV (4 doses)", "meta": 80.0, "cobertura": 62.3, "situacao": "critico"},
    ]


# ─── TRANSPORTE / TFD ────────────────────────────────────────────────────────

transporte_router = APIRouter(prefix="/api/transporte", tags=["Transporte/TFD"])


class VeiculoSaude(BaseModel):
    id: int
    placa: str
    modelo: str
    ano: int
    tipo: str
    situacao: str
    km_atual: int
    proxima_revisao_km: int
    motorista: str | None = None


@transporte_router.get("/dashboard")
async def transporte_dashboard(municipio_id: int = Query(1)):
    return {
        "veiculos_total": 6,
        "veiculos_disponiveis": 4,
        "veiculos_manutencao": 1,
        "veiculos_indisponiveis": 1,
        "tfd_mes_atual": 34,
        "tfd_valor_mes": 41800.00,
        "km_rodados_mes": 8420,
        "atualizado_em": datetime.utcnow(),
    }


@transporte_router.get("/veiculos", response_model=list[VeiculoSaude])
async def listar_veiculos(municipio_id: int = Query(1)):
    return [
        VeiculoSaude(id=1, placa="AMV-1234", modelo="Fiat Ducato Ambulância", ano=2021, tipo="Ambulância",
            situacao="Disponível", km_atual=48200, proxima_revisao_km=50000, motorista="João Silva"),
        VeiculoSaude(id=2, placa="AMV-5678", modelo="Toyota Hilux", ano=2020, tipo="Caminhonete",
            situacao="Disponível", km_atual=62100, proxima_revisao_km=65000, motorista="Maria Santos"),
        VeiculoSaude(id=3, placa="AMV-9012", modelo="VW Kombi", ano=2018, tipo="Van",
            situacao="Em Manutenção", km_atual=91400, proxima_revisao_km=92000, motorista=None),
        VeiculoSaude(id=4, placa="AMV-3456", modelo="Fiat Doblô", ano=2022, tipo="Veículo leve",
            situacao="Disponível", km_atual=28300, proxima_revisao_km=30000, motorista="Carlos Lima"),
        VeiculoSaude(id=5, placa="AMV-7890", modelo="Lancha Honda BF115", ano=2019, tipo="Embarcação",
            situacao="Disponível", km_atual=0, proxima_revisao_km=0, motorista="Pedro Costa"),
        VeiculoSaude(id=6, placa="AMV-2345", modelo="Fiat Fiorino", ano=2016, tipo="Veículo leve",
            situacao="Indisponível", km_atual=118000, proxima_revisao_km=120000, motorista=None),
    ]


@transporte_router.get("/tfd")
async def listar_tfd(municipio_id: int = Query(1), mes: int = Query(6), ano: int = Query(2026)):
    """Tratamento Fora do Domicílio — pacientes e custos."""
    return [
        {"id": 1, "paciente": "M.S.O.", "especialidade": "Oncologia", "destino": "Manaus/AM",
         "data_saida": f"{ano}-{mes:02d}-03", "valor_diaria": 80.0, "dias": 5, "status": "Realizado"},
        {"id": 2, "paciente": "J.A.F.", "especialidade": "Cardiologia", "destino": "Manaus/AM",
         "data_saida": f"{ano}-{mes:02d}-08", "valor_diaria": 80.0, "dias": 3, "status": "Realizado"},
        {"id": 3, "paciente": "E.R.S.", "especialidade": "Neurologia", "destino": "Manaus/AM",
         "data_saida": f"{ano}-{mes:02d}-15", "valor_diaria": 80.0, "dias": 7, "status": "Realizado"},
        {"id": 4, "paciente": "A.C.M.", "especialidade": "Ortopedia", "destino": "Manaus/AM",
         "data_saida": f"{ano}-{mes:02d}-22", "valor_diaria": 80.0, "dias": 4, "status": "Agendado"},
    ]


# ─── REGULAÇÃO ───────────────────────────────────────────────────────────────

regulacao_router = APIRouter(prefix="/api/regulacao", tags=["Regulação"])


@regulacao_router.get("/dashboard")
async def regulacao_dashboard(municipio_id: int = Query(1)):
    return {
        "solicitacoes_mes": 87,
        "autorizadas": 62,
        "negadas": 8,
        "pendentes": 17,
        "tempo_medio_espera_dias": 12,
        "taxa_autorizacao": 71.3,
        "atualizado_em": datetime.utcnow(),
    }


@regulacao_router.get("/solicitacoes")
async def listar_solicitacoes(
    municipio_id: int = Query(1),
    status: str | None = Query(None),
):
    return [
        {"id": 1, "especialidade": "Cardiologia", "tipo": "Consulta", "status": "Autorizada",
         "solicitada_em": "2026-06-01", "autorizada_em": "2026-06-05", "prazo_dias": 4},
        {"id": 2, "especialidade": "Ortopedia", "tipo": "Cirurgia", "status": "Pendente",
         "solicitada_em": "2026-06-10", "autorizada_em": None, "prazo_dias": None},
        {"id": 3, "especialidade": "Oncologia", "tipo": "Quimioterapia", "status": "Autorizada",
         "solicitada_em": "2026-06-02", "autorizada_em": "2026-06-04", "prazo_dias": 2},
        {"id": 4, "especialidade": "Neurologia", "tipo": "Exame", "status": "Pendente",
         "solicitada_em": "2026-06-12", "autorizada_em": None, "prazo_dias": None},
        {"id": 5, "especialidade": "Oftalmologia", "tipo": "Cirurgia", "status": "Negada",
         "solicitada_em": "2026-05-28", "autorizada_em": "2026-06-03", "prazo_dias": 6},
    ]
