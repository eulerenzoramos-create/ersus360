"""
Saúde do Adolescente — Apuí/AM
ECA · PROSAD · SSR · Saúde Mental Adolescente · DST/IST
"""
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-adolescente", tags=["Saúde do Adolescente"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "competencia": "Mar/2026",
        "populacao_10_19": 1820,
        "cobertura_consulta_pct": 38.4,
        "cobertura_consulta_status": "critico",
        "gravidez_adolescente_casos": 9,
        "gravidez_adolescente_pct_nascimentos": 14.3,
        "gravidez_adolescente_status": "critico",
        "dst_ist_novos_casos": 7,
        "saude_mental_rastreio_pct": 21.6,
        "saude_mental_rastreio_status": "critico",
        "violencia_notificacoes": 4,
        "escolas_parceiras": 3,
    }


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador":"Consulta de adolescentes na APS",     "valor":38.4,"meta":70.0,"unidade":"%","status":"critico", "observacao":"PROSAD recomenda ≥70%"},
        {"indicador":"Gravidez na adolescência (% NV)",     "valor":14.3,"meta":8.0, "unidade":"%","status":"critico", "observacao":"Média AM 12.1%","invertido":True},
        {"indicador":"Rastreio saúde mental (PHQ-A)",       "valor":21.6,"meta":60.0,"unidade":"%","status":"critico", "observacao":"Ansiedade/depressão 10-19 anos"},
        {"indicador":"Vacinação HPV dose completa (F)",     "valor":54.2,"meta":80.0,"unidade":"%","status":"atencao", "observacao":"Meninas 9-14 anos"},
        {"indicador":"Vacinação HPV dose completa (M)",     "valor":41.8,"meta":80.0,"unidade":"%","status":"critico", "observacao":"Meninos 11-14 anos"},
        {"indicador":"Testagem IST (gonorreia/sífilis)",    "valor":31.4,"meta":60.0,"unidade":"%","status":"critico", "observacao":"Adolescentes sexualmente ativos"},
        {"indicador":"Notif. violência contra adolescente", "valor":4,   "meta":None,"unidade":"casos","status":"atencao","observacao":"Jan-Mar/26"},
        {"indicador":"Grupos educativos nas escolas",       "valor":3,   "meta":3,   "unidade":"grupos","status":"ok",    "observacao":"ESF + Escola"},
    ]


@lru_cache(maxsize=1)
def _GRAVIDEZ_HISTORICO():
    return [
        {"ano":2021,"total_nv":68,"adol_nv":11,"pct":16.2},
        {"ano":2022,"total_nv":71,"adol_nv":10,"pct":14.1},
        {"ano":2023,"total_nv":65,"adol_nv":10,"pct":15.4},
        {"ano":2024,"total_nv":63,"adol_nv":8, "pct":12.7},
        {"ano":2025,"total_nv":61,"adol_nv":9, "pct":14.8},
    ]


@lru_cache(maxsize=1)
def _CASOS_DST():
    return [
        {"id":"ADO-001","faixa":"15-19","diagnostico":"Sífilis adquirida","trimestre":"T1/26","encaminhamento":"UBS","tto_iniciado":True},
        {"id":"ADO-002","faixa":"15-19","diagnostico":"Gonorreia",        "trimestre":"T1/26","encaminhamento":"UBS","tto_iniciado":True},
        {"id":"ADO-003","faixa":"10-14","diagnostico":"Sífilis adquirida","trimestre":"T1/26","encaminhamento":"CAPS","tto_iniciado":True,"alerta":"Menor de 14 — investigar violência"},
        {"id":"ADO-004","faixa":"15-19","diagnostico":"HPV (condiloma)",  "trimestre":"T1/26","encaminhamento":"UBS","tto_iniciado":False},
        {"id":"ADO-005","faixa":"15-19","diagnostico":"Clamídia",         "trimestre":"T1/26","encaminhamento":"UBS","tto_iniciado":True},
        {"id":"ADO-006","faixa":"15-19","diagnostico":"Tricomoníase",     "trimestre":"T1/26","encaminhamento":"UBS","tto_iniciado":True},
        {"id":"ADO-007","faixa":"15-19","diagnostico":"Herpes genital",   "trimestre":"T1/26","encaminhamento":"UBS","tto_iniciado":False},
    ]


@lru_cache(maxsize=1)
def _PRODUCAO_MENSAL():
    return [
        {"mes":"Out/25","consultas":62,"grupos_educativos":3,"notif_violencia":1,"testagens_ist":18},
        {"mes":"Nov/25","consultas":58,"grupos_educativos":2,"notif_violencia":0,"testagens_ist":14},
        {"mes":"Dez/25","consultas":51,"grupos_educativos":1,"notif_violencia":0,"testagens_ist":11},
        {"mes":"Jan/26","consultas":64,"grupos_educativos":3,"notif_violencia":2,"testagens_ist":19},
        {"mes":"Fev/26","consultas":67,"grupos_educativos":3,"notif_violencia":0,"testagens_ist":22},
        {"mes":"Mar/26","consultas":70,"grupos_educativos":3,"notif_violencia":1,"testagens_ist":24},
    ]


@router.get("/dashboard")
async def dashboard():
    return _DASHBOARD

@router.get("/indicadores")
async def indicadores():
    return _INDICADORES

@router.get("/gravidez-historico")
async def gravidez_historico():
    return _GRAVIDEZ_HISTORICO

@router.get("/dst-ist")
async def dst_ist():
    return _CASOS_DST

@router.get("/producao")
async def producao():
    return _PRODUCAO_MENSAL
