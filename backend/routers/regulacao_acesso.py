"""
Router: /api/regulacao-acesso — ERSUS 360
Dados de referência municipal — Apuí/AM
Regulação via CROSS/AM · SISREG · TFD frequente
"""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(prefix="/api/regulacao-acesso", tags=["Regulação de Acesso"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "competencia": "Mar/2026",
        "solicitacoes_abertas": 312,
        "autorizadas_mes": 214,
        "negadas_mes": 18,
        "taxa_autorizacao_pct": 92.2,
        "tempo_medio_autorizacao_dias": 8.4,
        "meta_tempo_autorizacao_dias": 10,
        "tfd_ativos": 48,
        "tfd_novos_mes": 12,
        "regulacao_via": "CROSS/AM · SISREG",
    }


@router.get("/especialidades")
async def especialidades():
    return [
        {"situacao_dado": "referencia_municipal", "especialidade": "Cardiologia", "solicitacoes_mes": 42, "autorizadas": 38, "negadas": 4, "tempo_medio_dias": 12.1, "destino": "Humaitá/Manaus"},
        {"situacao_dado": "referencia_municipal", "especialidade": "Neurologia", "solicitacoes_mes": 18, "autorizadas": 16, "negadas": 2, "tempo_medio_dias": 18.4, "destino": "Manaus"},
        {"situacao_dado": "referencia_municipal", "especialidade": "Ortopedia", "solicitacoes_mes": 36, "autorizadas": 34, "negadas": 2, "tempo_medio_dias": 9.8, "destino": "Humaitá"},
        {"situacao_dado": "referencia_municipal", "especialidade": "Dermatologia", "solicitacoes_mes": 24, "autorizadas": 22, "negadas": 2, "tempo_medio_dias": 14.2, "destino": "Manaus"},
        {"situacao_dado": "referencia_municipal", "especialidade": "Endocrinologia", "solicitacoes_mes": 16, "autorizadas": 14, "negadas": 2, "tempo_medio_dias": 16.8, "destino": "Manaus"},
        {"situacao_dado": "referencia_municipal", "especialidade": "Oftalmologia", "solicitacoes_mes": 28, "autorizadas": 26, "negadas": 2, "tempo_medio_dias": 7.2, "destino": "Humaitá"},
        {"situacao_dado": "referencia_municipal", "especialidade": "Psiquiatria", "solicitacoes_mes": 22, "autorizadas": 20, "negadas": 2, "tempo_medio_dias": 11.4, "destino": "Humaitá/Manaus"},
        {"situacao_dado": "referencia_municipal", "especialidade": "Outras", "solicitacoes_mes": 126, "autorizadas": 114, "negadas": 12, "tempo_medio_dias": 8.1, "destino": "Humaitá/Manaus"},
    ]


@router.get("/exames")
async def exames():
    return [
        {"situacao_dado": "referencia_municipal", "exame": "Ressonância Magnética", "solicitacoes_mes": 22, "autorizadas": 20, "negadas": 2, "tempo_medio_dias": 22.4, "destino": "Manaus"},
        {"situacao_dado": "referencia_municipal", "exame": "Tomografia", "solicitacoes_mes": 28, "autorizadas": 26, "negadas": 2, "tempo_medio_dias": 14.8, "destino": "Humaitá"},
        {"situacao_dado": "referencia_municipal", "exame": "Endoscopia", "solicitacoes_mes": 18, "autorizadas": 18, "negadas": 0, "tempo_medio_dias": 10.2, "destino": "Humaitá"},
        {"situacao_dado": "referencia_municipal", "exame": "Ecocardiograma", "solicitacoes_mes": 16, "autorizadas": 15, "negadas": 1, "tempo_medio_dias": 12.0, "destino": "Humaitá"},
        {"situacao_dado": "referencia_municipal", "exame": "Outros", "solicitacoes_mes": 48, "autorizadas": 44, "negadas": 4, "tempo_medio_dias": 7.8, "destino": "Humaitá"},
    ]


@router.get("/tfd")
async def tfd():
    return {
        "situacao_dado": "referencia_municipal",
        "competencia": "Mar/2026",
        "tfd_ativos": 48,
        "tfd_novos_mes": 12,
        "tfd_encerrados_mes": 8,
        "destinos": [
            {"destino": "Manaus", "pacientes": 32, "custo_estimado_per_capita": 2100},
            {"destino": "Humaitá", "pacientes": 16, "custo_estimado_per_capita": 840},
        ],
        "custo_total_mes_estimado": 81000,
        "patologias_principais": [
            {"patologia": "Neoplasias (quimio/radio)", "pacientes": 14},
            {"patologia": "Doenças Cardiovasculares", "pacientes": 10},
            {"patologia": "Doenças Neurológicas", "pacientes": 8},
            {"patologia": "Ortopedia / Cirurgia eletiva", "pacientes": 9},
            {"patologia": "Outras", "pacientes": 7},
        ],
    }


@router.get("/historico")
async def historico():
    return [
        {"situacao_dado": "referencia_municipal", "mes": "Out/25", "solicitacoes": 284, "autorizadas": 196, "negadas": 16, "tfd_ativos": 42},
        {"situacao_dado": "referencia_municipal", "mes": "Nov/25", "solicitacoes": 292, "autorizadas": 204, "negadas": 17, "tfd_ativos": 44},
        {"situacao_dado": "referencia_municipal", "mes": "Dez/25", "solicitacoes": 268, "autorizadas": 188, "negadas": 15, "tfd_ativos": 43},
        {"situacao_dado": "referencia_municipal", "mes": "Jan/26", "solicitacoes": 298, "autorizadas": 208, "negadas": 18, "tfd_ativos": 46},
        {"situacao_dado": "referencia_municipal", "mes": "Fev/26", "solicitacoes": 304, "autorizadas": 210, "negadas": 17, "tfd_ativos": 47},
        {"situacao_dado": "referencia_municipal", "mes": "Mar/26", "solicitacoes": 312, "autorizadas": 214, "negadas": 18, "tfd_ativos": 48},
    ]
