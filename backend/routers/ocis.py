"""
Router: /api/ocis — OCIS (Observatório e Central de Informações em Saúde) — ERSUS 360
Dados de referência municipal — Apuí/AM. situacao_dado = referencia_municipal.
"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from typing import Optional
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/ocis", tags=["OCIS"])

_TS = "2026-08-13T00:00:00Z"


@router.get("/dashboard")
async def dashboard_ocis(_: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "score_geral": 74.3,
        "alertas_ativos": 5,
        "regulacoes_abertas": 38,
        "tfd_em_tramite": 12,
        "filas_monitoradas": 4,
        "unidades_monitoradas": 4,
        "ultima_atualizacao": "2025-08-13",
        "kpis_resumo": {
            "cobertura_esf_pct": 78.5,
            "ipa_malaria": 7.8,
            "cobertura_vacinal_dtp_pct": 88.2,
            "aplicacao_saude_pct": 18.4,
        },
        "verificado_em": _TS,
    }


@router.get("/central-alertas")
async def central_alertas(_: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado": "referencia_municipal",
        "alertas": [
            {"id": "AL-001", "tipo": "vacinacao",    "severidade": "alta",   "descricao": "Cobertura DTP 88,2% — abaixo da meta 95%",            "modulo": "Imunizacao",   "data": "2025-08-10"},
            {"id": "AL-002", "tipo": "rh",           "severidade": "media",  "descricao": "Contrato médico CT-001/2023 vencido",                 "modulo": "RH",           "data": "2025-06-01"},
            {"id": "AL-003", "tipo": "saude_mental", "severidade": "media",  "descricao": "CAPS AD tipo I não implantado — meta PMS em atraso",  "modulo": "Planejamento", "data": "2025-05-01"},
            {"id": "AL-004", "tipo": "prenatal",     "severidade": "baixa",  "descricao": "Pré-natal 7+ consultas 71,4% — meta 75%",             "modulo": "APS",          "data": "2025-08-05"},
            {"id": "AL-005", "tipo": "ouvidoria",    "severidade": "alta",   "descricao": "Denúncia OUV-005/2025 em investigação",               "modulo": "Ouvidoria",    "data": "2025-04-08"},
        ],
        "verificado_em": _TS,
    }


@router.get("/regulacao/fila-espera")
async def fila_espera(_: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "central_regulacao": "Central de Regulação SMS Apuí",
        "filas": [
            {"especialidade": "Ginecologia/Obstetrícia", "fila": 14, "espera_media_dias": 42, "referencia": "Humaitá/AM"},
            {"especialidade": "Ortopedia",               "fila": 9,  "espera_media_dias": 68, "referencia": "Manaus/AM"},
            {"especialidade": "Cardiologia",             "fila": 6,  "espera_media_dias": 95, "referencia": "Manaus/AM"},
            {"especialidade": "Oftalmologia",            "fila": 9,  "espera_media_dias": 52, "referencia": "Porto Velho/RO"},
        ],
        "total_em_fila": 38,
        "verificado_em": _TS,
    }


@router.get("/tfd")
async def listar_tfd(_: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "tfd_ativos": [
            {"id": "TFD-045/2025", "especialidade": "Cardiologia",   "municipio_ref": "Manaus/AM",      "data_solicitacao": "2025-07-10", "status": "aguardando_vaga",  "prioridade": "eletivo"},
            {"id": "TFD-046/2025", "especialidade": "Ortopedia",     "municipio_ref": "Manaus/AM",      "data_solicitacao": "2025-07-15", "status": "agendado",         "data_consulta": "2025-09-18", "prioridade": "eletivo"},
            {"id": "TFD-047/2025", "especialidade": "Ginecologia",   "municipio_ref": "Humaitá/AM",     "data_solicitacao": "2025-07-30", "status": "agendado",         "data_consulta": "2025-09-05", "prioridade": "eletivo"},
            {"id": "TFD-048/2025", "especialidade": "Nefrologia",    "municipio_ref": "Manaus/AM",      "data_solicitacao": "2025-08-01", "status": "aguardando_vaga",  "prioridade": "urgente"},
            {"id": "TFD-049/2025", "especialidade": "Oftalmologia",  "municipio_ref": "Porto Velho/RO", "data_solicitacao": "2025-08-05", "status": "aguardando_vaga",  "prioridade": "eletivo"},
        ],
        "total_em_tramite": 12,
        "verificado_em": _TS,
    }


@router.get("/tfd/dashboard")
async def dashboard_tfd(_: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "total_tfd_2025": 49,
        "realizados": 37,
        "em_tramite": 12,
        "cancelados": 0,
        "espera_media_dias": 38,
        "custo_total_passagens_2025": 28400.00,
        "custo_medio_por_tfd": 766.00,
        "especialidades_mais_demandadas": ["Ginecologia/Obstetrícia", "Ortopedia", "Cardiologia", "Oftalmologia"],
        "verificado_em": _TS,
    }


@router.get("/mapa/unidades")
async def mapa_unidades(_: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "unidades": [
            {
                "cnes": "2802090",
                "nome": "UBS Central Apuí",
                "tipo": "UBS",
                "logradouro": "Av. Paraná, 550 — Centro",
                "lat": -7.1950,
                "lon": -59.8880,
                "equipes_esf": 1,
                "situacao": "ativa",
            },
            {
                "cnes": "2802104",
                "nome": "ESF Centro",
                "tipo": "ESF",
                "logradouro": "Rua Goiás, 120 — Centro",
                "lat": -7.1960,
                "lon": -59.8895,
                "equipes_esf": 1,
                "situacao": "ativa",
            },
            {
                "cnes": "2802112",
                "nome": "ESF Bairro Novo",
                "tipo": "ESF",
                "logradouro": "Rua Minas Gerais, 45 — Bairro Novo",
                "lat": -7.2010,
                "lon": -59.8840,
                "equipes_esf": 1,
                "situacao": "ativa",
            },
            {
                "cnes": "2802120",
                "nome": "ESF Rio Juma",
                "tipo": "ESF",
                "logradouro": "Ramal Rio Juma — Zona Rural",
                "lat": -7.2200,
                "lon": -59.9100,
                "equipes_esf": 0,
                "situacao": "ativa_sem_medico",
            },
        ],
        "verificado_em": _TS,
    }
