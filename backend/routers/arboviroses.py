"""
Router: /api/arboviroses — Dengue · Zika · Chikungunya · LIRAa — FMS Apuí/AM
Dados de referência municipal. situacao_dado = referencia_municipal.
"""
from __future__ import annotations
from fastapi import APIRouter, Depends
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/arboviroses", tags=["arboviroses"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "2026 (Jan–Jul)",
        "dengue_confirmados_ano": 36,
        "dengue_graves_ano": 1,
        "iip_municipal": 2.1,
        "nivel_infestacao": "médio",
        "bairros_criticos": 2,
        "chikungunya_notificacoes_ano": 8,
        "zika_notificacoes_ano": 3,
        "depositos_eliminados_mes": 1840,
        "sorotipos_circulantes": ["DENV-1", "DENV-3"],
        "semana_pico": 7,
        "casos_semana_pico": 10,
        "fonte": "Referência municipal FMS Apuí/AM",
    }


@router.get("/semanas-epidemiologicas")
async def semanas_epidemiologicas():
    return [
        {"semana": "SE01", "dengue_notif": 8,  "dengue_conf": 6,  "chik_notif": 1},
        {"semana": "SE02", "dengue_notif": 10, "dengue_conf": 8,  "chik_notif": 2},
        {"semana": "SE03", "dengue_notif": 7,  "dengue_conf": 5,  "chik_notif": 1},
        {"semana": "SE04", "dengue_notif": 5,  "dengue_conf": 4,  "chik_notif": 1},
        {"semana": "SE05", "dengue_notif": 6,  "dengue_conf": 5,  "chik_notif": 0},
        {"semana": "SE06", "dengue_notif": 4,  "dengue_conf": 3,  "chik_notif": 0},
        {"semana": "SE07", "dengue_notif": 3,  "dengue_conf": 2,  "chik_notif": 1},
        {"semana": "SE08", "dengue_notif": 2,  "dengue_conf": 1,  "chik_notif": 0},
        {"semana": "SE09", "dengue_notif": 2,  "dengue_conf": 1,  "chik_notif": 1},
        {"semana": "SE10", "dengue_notif": 3,  "dengue_conf": 2,  "chik_notif": 0},
        {"semana": "SE11", "dengue_notif": 1,  "dengue_conf": 1,  "chik_notif": 0},
        {"semana": "SE12", "dengue_notif": 1,  "dengue_conf": 1,  "chik_notif": 0},
    ]


@router.get("/levantamento-indice-stegomyia")
async def levantamento_indice():
    return [
        {"bairro": "Centro",          "iip": 1.8, "ib": 3.2, "ito": 0.9, "risco": "médio"},
        {"bairro": "Nova Apuí",       "iip": 2.4, "ib": 4.1, "ito": 1.2, "risco": "médio"},
        {"bairro": "São Francisco",   "iip": 4.2, "ib": 6.8, "ito": 2.1, "risco": "alto"},
        {"bairro": "Vila Rural",      "iip": 0.8, "ib": 1.4, "ito": 0.4, "risco": "baixo"},
        {"bairro": "Setor Industrial","iip": 3.9, "ib": 5.6, "ito": 1.8, "risco": "alto"},
        {"bairro": "Aeroporto",       "iip": 0.6, "ib": 1.1, "ito": 0.3, "risco": "baixo"},
        {"bairro": "Km 180",          "iip": 1.2, "ib": 2.0, "ito": 0.6, "risco": "médio"},
    ]


@router.get("/historico")
async def historico():
    return [
        {"mes": "Jan", "dengue": 8,  "chik": 1, "zika": 0, "iip": 1.4},
        {"mes": "Fev", "dengue": 10, "chik": 2, "zika": 1, "iip": 2.1},
        {"mes": "Mar", "dengue": 7,  "chik": 2, "zika": 1, "iip": 2.4},
        {"mes": "Abr", "dengue": 5,  "chik": 1, "zika": 0, "iip": 2.0},
        {"mes": "Mai", "dengue": 3,  "chik": 1, "zika": 1, "iip": 1.8},
        {"mes": "Jun", "dengue": 2,  "chik": 1, "zika": 0, "iip": 1.6},
        {"mes": "Jul", "dengue": 1,  "chik": 1, "zika": 0, "iip": 2.1},
    ]


@router.get("/indicadores")
async def indicadores():
    return [
        {
            "indicador": "IIP Municipal",
            "valor": 2.1, "unidade": "%",
            "meta": 1.0,
            "status": "atencao",
            "observacao": "Índice de Infestação Predial 2,1% — entre médio (1–3,9%). Ações de eliminação de criadouros em andamento.",
        },
        {
            "indicador": "Taxa de confirmação laboratorial (dengue)",
            "valor": 78, "unidade": "%",
            "meta": 80,
            "status": "atencao",
            "observacao": "Capacidade laboratorial limitada. Amostras encaminhadas a Humaitá/LACEN-AM.",
        },
        {
            "indicador": "Cobertura de nebulização",
            "valor": 92, "unidade": "%",
            "meta": 90,
            "status": "ok",
            "observacao": "Área urbana coberta nas últimas 4 semanas. Zona rural com restrição de acesso em período chuvoso.",
        },
        {
            "indicador": "Imóveis visitados por agente (mês)",
            "valor": 810, "unidade": "imóveis",
            "meta": None,
            "status": "ok",
            "observacao": "6 ACE em campo. Média 135 imóveis/ACE/mês.",
        },
        {
            "indicador": "Depósitos eliminados (mês)",
            "valor": 1840, "unidade": "depósitos",
            "meta": None,
            "status": "ok",
            "observacao": "Pneus e recipientes descartados em mutirão comunitário — bairros São Francisco e Nova Apuí.",
        },
    ]
