"""Arboviroses — Dengue, Zika, Chikungunya · FMS Apuí/AM"""
from __future__ import annotations
from datetime import date as _date
from fastapi import APIRouter
from services import sinan_service
from functools import lru_cache

router = APIRouter(prefix="/api/arboviroses", tags=["arboviroses"])

@lru_cache(maxsize=1)
def _SEMANAS():
    return [
        {"semana": "SE 01/26", "dengue_notif": 12, "dengue_conf": 8,  "zika_notif": 1, "chik_notif": 2, "dengue_grave": 0},
        {"semana": "SE 04/26", "dengue_notif": 18, "dengue_conf": 12, "zika_notif": 0, "chik_notif": 3, "dengue_grave": 0},
        {"semana": "SE 08/26", "dengue_notif": 28, "dengue_conf": 19, "zika_notif": 2, "chik_notif": 4, "dengue_grave": 1},
        {"semana": "SE 12/26", "dengue_notif": 42, "dengue_conf": 31, "zika_notif": 2, "chik_notif": 6, "dengue_grave": 1},
        {"semana": "SE 16/26", "dengue_notif": 56, "dengue_conf": 42, "zika_notif": 3, "chik_notif": 8, "dengue_grave": 2},
        {"semana": "SE 20/26", "dengue_notif": 48, "dengue_conf": 36, "zika_notif": 2, "chik_notif": 7, "dengue_grave": 1},
        {"semana": "SE 24/26", "dengue_notif": 38, "dengue_conf": 28, "zika_notif": 1, "chik_notif": 5, "dengue_grave": 1},
    ]


@lru_cache(maxsize=1)
def _BAIRROS():
    return [
        {"bairro": "Centro",            "iip": 4.2,  "ib": 3.8,  "ito": 2.1,  "risco": "alto",   "status": "critico"},
        {"bairro": "Nova Esperança",    "iip": 5.8,  "ib": 5.2,  "ito": 2.8,  "risco": "alto",   "status": "critico"},
        {"bairro": "São José",          "iip": 3.4,  "ib": 3.0,  "ito": 1.8,  "risco": "alto",   "status": "critico"},
        {"bairro": "Matupi (distrito)", "iip": 2.8,  "ib": 2.4,  "ito": 1.4,  "risco": "médio",  "status": "atencao"},
        {"bairro": "Bairro novo/expansão","iip": 6.4,"ib": 5.8,  "ito": 3.2,  "risco": "alto",   "status": "critico"},
        {"bairro": "Área rural/vilas",  "iip": 1.2,  "ib": 1.0,  "ito": 0.6,  "risco": "baixo",  "status": "ok"},
    ]


@router.get("/dashboard")
async def dashboard():
    ano = _date.today().year - 1
    dengue = await sinan_service.buscar_dengue(ano)
    total = dengue["total_casos"]
    return {
        "dengue_notificacoes_ano": total,
        "dengue_confirmados_ano": int(total * 0.73),
        "dengue_graves_ano": dengue.get("casos_graves", 0),
        "dengue_obitos_ano": dengue.get("obitos", 0),
        "zika_notificacoes_ano": 11,
        "chikungunya_notificacoes_ano": 35,
        "dengue_notificacoes_mes": max(1, total // 12),
        "iip_municipal": 3.8,
        "ib_municipal": 3.4,
        "nivel_infestacao": "alto" if total > 100 else "medio" if total > 30 else "baixo",
        "semana_pico": "SE 16/26",
        "casos_semana_pico": 56,
        "sorotipos_circulantes": ["DENV-1","DENV-3"],
        "bairros_criticos": 4,
        "nebulizacao_realizada_mes": True,
        "visitas_imoveis_mes": 2840,
        "imoveis_inspecionados_mes": 2240,
        "depositos_eliminados_mes": 384,
        "status_geral": "critico" if total > 100 else "atencao" if total > 30 else "ok",
        "competencia": f"Ano {ano}",
        "fonte": dengue["fonte"],
    }

@router.get("/semanas-epidemiologicas")
async def semanas_epidemiologicas():
    return _SEMANAS()

@router.get("/levantamento-indice-stegomyia")
async def levantamento_indice():
    return _BAIRROS()

@router.get("/historico")
async def historico():
    return [
        {"mes": "Jan/26", "dengue": 42,  "dengue_graves": 0, "zika": 2, "chik": 6, "iip": 3.2},
        {"mes": "Fev/26", "dengue": 58,  "dengue_graves": 1, "zika": 2, "chik": 8, "iip": 3.8},
        {"mes": "Mar/26", "dengue": 72,  "dengue_graves": 2, "zika": 3, "chik": 9, "iip": 4.2},
        {"mes": "Abr/26", "dengue": 68,  "dengue_graves": 2, "zika": 2, "chik": 7, "iip": 4.0},
        {"mes": "Mai/26", "dengue": 48,  "dengue_graves": 1, "zika": 1, "chik": 5, "iip": 3.6},
        {"mes": "Jun/26", "dengue": 38,  "dengue_graves": 1, "zika": 1, "chik": 5, "iip": 3.4},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Dengue — casos confirmados no ano",               "valor": 176,  "meta": None, "unidade": "n",         "status": "critico", "observacao": "2 sorotipos circulantes (DENV-1 e DENV-3) — risco de dengue grave em população não imune a DENV-3"},
        {"indicador": "Índice de Infestação Predial (IIP) municipal",    "valor": 3.8,  "meta": 1.0,  "unidade": "%",         "status": "critico", "observacao": "IIP > 3.9% = risco muito alto. Bairro nova expansão com IIP 6.4% — maior do município"},
        {"indicador": "Dengue grave / hospitalização",                   "valor": 6,    "meta": 0,    "unidade": "n/ano",     "status": "atencao", "observacao": "6 dengue grave em 2026 — 0 óbito. Classificação de risco padronizada em UBS e hospital"},
        {"indicador": "Cobertura de visitas domiciliares por ACE",       "valor": 78.9, "meta": 100.0,"unidade": "%",         "status": "atencao", "observacao": "21% dos imóveis não visitados — área de expansão urbana sem cobertura de ACE contratado"},
        {"indicador": "Chikungunya — casos notificados no ano",          "valor": 35,   "meta": None, "unidade": "n",         "status": "atencao", "observacao": "Artralgia persistente em 40% dos casos — NASF com demanda crescente de fisioterapia"},
        {"indicador": "Zika — notificações no ano",                      "valor": 11,   "meta": None, "unidade": "n",         "status": "ok",      "observacao": "Sem casos de síndrome congênita do Zika em 2026 — vigilância em gestantes ativa"},
    ]