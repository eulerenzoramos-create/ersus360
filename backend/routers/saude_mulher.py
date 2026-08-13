"""
Router: /api/saude-mulher — ERSUS 360
Dados de referência municipal — Apuí/AM 2026.
situacao_dado = referencia_municipal
"""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-mulher", tags=["Saúde da Mulher"])

HISTORICO_6M = [
    {"mes": "Jan", "gestantes_ativas": 43, "consultas": 178, "partos": 6, "partos_normal": 4},
    {"mes": "Fev", "gestantes_ativas": 44, "consultas": 182, "partos": 5, "partos_normal": 4},
    {"mes": "Mar", "gestantes_ativas": 46, "consultas": 191, "partos": 7, "partos_normal": 5},
    {"mes": "Abr", "gestantes_ativas": 45, "consultas": 187, "partos": 6, "partos_normal": 4},
    {"mes": "Mai", "gestantes_ativas": 48, "consultas": 196, "partos": 8, "partos_normal": 6},
    {"mes": "Jun", "gestantes_ativas": 47, "consultas": 193, "partos": 7, "partos_normal": 5},
]


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "gestantes_ativas": 47,
        "alto_risco": 8,
        "sem_teste_hiv_sif": 6,
        "indicadores_criticos": 3,
        "historico": HISTORICO_6M,
        "municipio": "Apuí/AM",
        "competencia": "Jun/2026",
    }


@router.get("/gestantes")
async def gestantes():
    return [
        {"id": 1, "iniciais": "M.S.O.",  "equipe": "ESF Centro",      "ig_atual": 28, "consultas": 6,  "consultas_meta": 7, "odonto": True,  "hiv_sifilis": True,  "risco": "habitual", "proximo_retorno": "15/07/2026"},
        {"id": 2, "iniciais": "A.P.R.",  "equipe": "ESF Cidade Nova",  "ig_atual": 34, "consultas": 7,  "consultas_meta": 7, "odonto": True,  "hiv_sifilis": True,  "risco": "habitual", "proximo_retorno": "08/07/2026"},
        {"id": 3, "iniciais": "R.F.S.",  "equipe": "ESF Centro",      "ig_atual": 38, "consultas": 8,  "consultas_meta": 7, "odonto": True,  "hiv_sifilis": True,  "risco": "alto",     "proximo_retorno": "01/07/2026"},
        {"id": 4, "iniciais": "T.M.A.",  "equipe": "ESF Colônia",     "ig_atual": 16, "consultas": 2,  "consultas_meta": 4, "odonto": False, "hiv_sifilis": False, "risco": "habitual", "proximo_retorno": "20/07/2026"},
        {"id": 5, "iniciais": "L.C.B.",  "equipe": "ESF Rural",       "ig_atual": 22, "consultas": 4,  "consultas_meta": 5, "odonto": False, "hiv_sifilis": True,  "risco": "habitual", "proximo_retorno": "17/07/2026"},
        {"id": 6, "iniciais": "G.O.N.",  "equipe": "ESF Cidade Nova",  "ig_atual": 31, "consultas": 5,  "consultas_meta": 6, "odonto": True,  "hiv_sifilis": False, "risco": "atencao",  "proximo_retorno": "10/07/2026"},
        {"id": 7, "iniciais": "C.A.M.",  "equipe": "ESF Centro",      "ig_atual": 36, "consultas": 7,  "consultas_meta": 7, "odonto": True,  "hiv_sifilis": True,  "risco": "alto",     "proximo_retorno": "03/07/2026"},
        {"id": 8, "iniciais": "F.R.L.",  "equipe": "ESF Colônia",     "ig_atual": 10, "consultas": 1,  "consultas_meta": 3, "odonto": False, "hiv_sifilis": False, "risco": "habitual", "proximo_retorno": "25/07/2026"},
        {"id": 9, "iniciais": "N.P.S.",  "equipe": "ESF Rural",       "ig_atual": 24, "consultas": 4,  "consultas_meta": 5, "odonto": False, "hiv_sifilis": True,  "risco": "alto",     "proximo_retorno": "12/07/2026"},
        {"id":10, "iniciais": "P.A.C.",  "equipe": "ESF Centro",      "ig_atual": 19, "consultas": 3,  "consultas_meta": 4, "odonto": True,  "hiv_sifilis": True,  "risco": "baixo",    "proximo_retorno": "22/07/2026"},
        {"id":11, "iniciais": "V.S.F.",  "equipe": "ESF Cidade Nova",  "ig_atual": 30, "consultas": 6,  "consultas_meta": 6, "odonto": True,  "hiv_sifilis": True,  "risco": "habitual", "proximo_retorno": "14/07/2026"},
        {"id":12, "iniciais": "B.C.R.",  "equipe": "ESF Colônia",     "ig_atual": 27, "consultas": 5,  "consultas_meta": 6, "odonto": False, "hiv_sifilis": True,  "risco": "habitual", "proximo_retorno": "18/07/2026"},
        {"id":13, "iniciais": "E.M.T.",  "equipe": "ESF Rural",       "ig_atual": 35, "consultas": 6,  "consultas_meta": 7, "odonto": False, "hiv_sifilis": False, "risco": "alto",     "proximo_retorno": "05/07/2026"},
        {"id":14, "iniciais": "I.A.S.",  "equipe": "ESF Centro",      "ig_atual": 12, "consultas": 2,  "consultas_meta": 3, "odonto": False, "hiv_sifilis": False, "risco": "baixo",    "proximo_retorno": "28/07/2026"},
        {"id":15, "iniciais": "K.O.P.",  "equipe": "ESF Cidade Nova",  "ig_atual": 33, "consultas": 6,  "consultas_meta": 7, "odonto": True,  "hiv_sifilis": True,  "risco": "habitual", "proximo_retorno": "09/07/2026"},
    ]


@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Proporção de gestantes com 6+ consultas PN",  "valor": 68,  "meta": 80, "status": "critico",  "fonte": "SISAB",    "invertido": False},
        {"indicador": "Cobertura de teste HIV/Sífilis no PN",         "valor": 87,  "meta": 95, "status": "atencao",  "fonte": "SISAB",    "invertido": False},
        {"indicador": "Proporção de parto normal",                    "valor": 71,  "meta": 75, "status": "atencao",  "fonte": "SINASC",   "invertido": False},
        {"indicador": "Cobertura odontológica no PN",                 "valor": 54,  "meta": 70, "status": "critico",  "fonte": "SISAB",    "invertido": False},
        {"indicador": "Proporção de puerpério até 42 dias",           "valor": 76,  "meta": 80, "status": "atencao",  "fonte": "SISAB",    "invertido": False},
        {"indicador": "Cobertura pré-natal 1º trimestre",             "valor": 62,  "meta": 75, "status": "critico",  "fonte": "SINASC",   "invertido": False},
        {"indicador": "Óbito materno/100k NV",                        "valor": 0,   "meta": 0,  "status": "ok",       "fonte": "SIM",      "invertido": True},
        {"indicador": "Cobertura vacinação gestante (dT/dTpa)",       "valor": 81,  "meta": 80, "status": "ok",       "fonte": "SIPNI",    "invertido": False},
    ]


@router.get("/puerperas")
async def puerperas():
    return [
        {"id": 1, "iniciais": "M.S.O.", "equipe": "ESF Centro",     "data_parto": "10/06/2026", "dias_puerp": 21, "consulta_puerp": True,  "risco": "baixo"},
        {"id": 2, "iniciais": "J.A.F.", "equipe": "ESF Cidade Nova", "data_parto": "15/06/2026", "dias_puerp": 16, "consulta_puerp": True,  "risco": "baixo"},
        {"id": 3, "iniciais": "D.C.L.", "equipe": "ESF Colônia",    "data_parto": "02/06/2026", "dias_puerp": 29, "consulta_puerp": False, "risco": "alto"},
        {"id": 4, "iniciais": "R.P.M.", "equipe": "ESF Rural",      "data_parto": "18/06/2026", "dias_puerp": 13, "consulta_puerp": False, "risco": "habitual"},
        {"id": 5, "iniciais": "V.O.T.", "equipe": "ESF Centro",     "data_parto": "25/06/2026", "dias_puerp": 6,  "consulta_puerp": False, "risco": "baixo"},
        {"id": 6, "iniciais": "A.N.S.", "equipe": "ESF Cidade Nova", "data_parto": "20/05/2026", "dias_puerp": 42, "consulta_puerp": True,  "risco": "baixo"},
        {"id": 7, "iniciais": "G.R.C.", "equipe": "ESF Colônia",    "data_parto": "28/06/2026", "dias_puerp": 3,  "consulta_puerp": False, "risco": "habitual"},
        {"id": 8, "iniciais": "K.M.A.", "equipe": "ESF Rural",      "data_parto": "05/06/2026", "dias_puerp": 26, "consulta_puerp": True,  "risco": "alto"},
    ]
