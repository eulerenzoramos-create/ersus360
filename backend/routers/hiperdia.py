"""
Router: /api/hiperdia — ERSUS 360
Dados de referência municipal — Apuí/AM 2026.
situacao_dado = referencia_municipal
"""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(prefix="/api/hiperdia", tags=["HiperDia / DCNT"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "hipertensos_cadastrados": 1847,
        "hipertensos_controlados_pct": 41,
        "diabeticos_cadastrados": 621,
        "diabeticos_controlados_pct": 34,
        "internacoes_icsap_ano": 47,
        "amputacoes_dm_ano": 3,
        "municipio": "Apuí/AM",
        "competencia": "Jun/2026",
    }


@router.get("/hipertensos")
async def hipertensos():
    return {
        "situacao_dado": "referencia_municipal",
        "total": 1847,
        "controlados": 757,
        "controlados_pct": 41,
        "estagio_1": 498,
        "estagio_2": 387,
        "estagio_3": 148,
        "em_investigacao": 57,
        "por_equipe": [
            {"equipe": "ESF Centro",      "cadastrados": 498, "controlados": 211, "pct": 42},
            {"equipe": "ESF Cidade Nova", "cadastrados": 534, "controlados": 224, "pct": 42},
            {"equipe": "ESF Colônia",     "cadastrados": 412, "controlados": 155, "pct": 38},
            {"equipe": "ESF Rural",       "cadastrados": 403, "controlados": 167, "pct": 41},
        ],
        "municipio": "Apuí/AM",
    }


@router.get("/diabeticos")
async def diabeticos():
    return {
        "situacao_dado": "referencia_municipal",
        "total": 621,
        "controlados_hba1c_menor7": 211,
        "controlados_pct": 34,
        "hba1c_media": 8.6,
        "sem_hba1c_6m": 165,
        "por_equipe": [
            {"equipe": "ESF Centro",      "cadastrados": 168, "controlados": 58, "pct": 35},
            {"equipe": "ESF Cidade Nova", "cadastrados": 181, "controlados": 63, "pct": 35},
            {"equipe": "ESF Colônia",     "cadastrados": 138, "controlados": 44, "pct": 32},
            {"equipe": "ESF Rural",       "cadastrados": 134, "controlados": 46, "pct": 34},
        ],
        "municipio": "Apuí/AM",
    }


@router.get("/internacoes")
async def internacoes():
    return {
        "situacao_dado": "referencia_municipal",
        "internacoes_icsap_ano": 47,
        "por_causa": [
            {"causa": "Angina pectoris",             "n": 12},
            {"causa": "IC — insuficiência cardíaca", "n": 9},
            {"causa": "AVC / AIT",                   "n": 8},
            {"causa": "Crise hipertensiva",           "n": 7},
            {"causa": "Cetoacidose diabética",        "n": 6},
            {"causa": "Hipoglicemia",                 "n": 5},
        ],
        "por_mes": [
            {"mes": "Jan", "n": 7},
            {"mes": "Fev", "n": 8},
            {"mes": "Mar", "n": 9},
            {"mes": "Abr", "n": 7},
            {"mes": "Mai", "n": 8},
            {"mes": "Jun", "n": 8},
        ],
        "municipio": "Apuí/AM",
    }


@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "HAS controlada",                    "valor": 41, "meta": 60, "status": "critico",  "fonte": "SISAB"},
        {"indicador": "DM controlado (HbA1c < 7%)",        "valor": 34, "meta": 55, "status": "critico",  "fonte": "SISAB"},
        {"indicador": "Cobertura cadastral HAS",           "valor": 68, "meta": 80, "status": "atencao",  "fonte": "SISAB"},
        {"indicador": "Cobertura cadastral DM",            "valor": 64, "meta": 80, "status": "critico",  "fonte": "SISAB"},
        {"indicador": "Abandono tratamento HAS/DM",        "valor": 22, "meta": 10, "status": "critico",  "fonte": "SISAB"},
        {"indicador": "Internações ICSAP HAS+DM / ano",   "valor": 47, "meta": 25, "status": "critico",  "fonte": "SIH"},
    ]
