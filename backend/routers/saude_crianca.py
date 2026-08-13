"""
Router: /api/saude-crianca — ERSUS 360
Dados de referência municipal — Apuí/AM 2026.
situacao_dado = referencia_municipal
"""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-crianca", tags=["Saúde da Criança"])

EQUIPES_BF = [
    {"equipe": "ESF Centro",      "familias_bf": 58, "acomp_saude": 52, "pct": 89.7, "criancas_vacinas_dia": 47, "criancas_crescimento": 50},
    {"equipe": "ESF Cidade Nova", "familias_bf": 64, "acomp_saude": 55, "pct": 85.9, "criancas_vacinas_dia": 51, "criancas_crescimento": 53},
    {"equipe": "ESF Colônia",     "familias_bf": 48, "acomp_saude": 36, "pct": 75.0, "criancas_vacinas_dia": 31, "criancas_crescimento": 34},
    {"equipe": "ESF Rural",       "familias_bf": 48, "acomp_saude": 41, "pct": 85.4, "criancas_vacinas_dia": 37, "criancas_crescimento": 39},
]


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "criancas_acompanhadas": 312,
        "consultas_puericultura_mes": 87,
        "alto_risco": 14,
        "sem_vacinas_dia": 23,
        "familias_bf_acomp": 184,
        "familias_bf_total": 218,
        "historico": [
            {"mes": "Jan", "criancas_acomp": 298, "consultas_puericultura": 79},
            {"mes": "Fev", "criancas_acomp": 302, "consultas_puericultura": 81},
            {"mes": "Mar", "criancas_acomp": 307, "consultas_puericultura": 84},
            {"mes": "Abr", "criancas_acomp": 309, "consultas_puericultura": 85},
            {"mes": "Mai", "criancas_acomp": 311, "consultas_puericultura": 86},
            {"mes": "Jun", "criancas_acomp": 312, "consultas_puericultura": 87},
        ],
        "municipio": "Apuí/AM",
        "competencia": "Jun/2026",
    }


@router.get("/criancas")
async def criancas():
    return [
        {"id": 1,  "iniciais": "G.S.O.",  "equipe": "ESF Centro",      "idade_meses": 8,  "peso_kg": 7.8,  "altura_cm": 68,  "caderneta_atualizada": True,  "vacinas_dia": True,  "estado_nutricional": "eutrofico",       "risco": "baixo"},
        {"id": 2,  "iniciais": "A.P.M.",  "equipe": "ESF Cidade Nova",  "idade_meses": 14, "peso_kg": 9.1,  "altura_cm": 77,  "caderneta_atualizada": True,  "vacinas_dia": True,  "estado_nutricional": "eutrofico",       "risco": "baixo"},
        {"id": 3,  "iniciais": "L.R.F.",  "equipe": "ESF Centro",      "idade_meses": 5,  "peso_kg": 5.4,  "altura_cm": 60,  "caderneta_atualizada": True,  "vacinas_dia": False, "estado_nutricional": "risco_baixo_peso","risco": "alto"},
        {"id": 4,  "iniciais": "M.C.A.",  "equipe": "ESF Colônia",     "idade_meses": 23, "peso_kg": 11.2, "altura_cm": 83,  "caderneta_atualizada": False, "vacinas_dia": True,  "estado_nutricional": "sobrepeso",       "risco": "medio"},
        {"id": 5,  "iniciais": "T.O.S.",  "equipe": "ESF Rural",       "idade_meses": 10, "peso_kg": 6.9,  "altura_cm": 72,  "caderneta_atualizada": True,  "vacinas_dia": True,  "estado_nutricional": "eutrofico",       "risco": "baixo"},
        {"id": 6,  "iniciais": "V.N.L.",  "equipe": "ESF Cidade Nova",  "idade_meses": 3,  "peso_kg": 4.2,  "altura_cm": 56,  "caderneta_atualizada": True,  "vacinas_dia": True,  "estado_nutricional": "eutrofico",       "risco": "baixo"},
        {"id": 7,  "iniciais": "R.A.T.",  "equipe": "ESF Centro",      "idade_meses": 18, "peso_kg": 8.6,  "altura_cm": 80,  "caderneta_atualizada": False, "vacinas_dia": False, "estado_nutricional": "risco_baixo_peso","risco": "alto"},
        {"id": 8,  "iniciais": "E.P.C.",  "equipe": "ESF Colônia",     "idade_meses": 7,  "peso_kg": 6.3,  "altura_cm": 65,  "caderneta_atualizada": True,  "vacinas_dia": True,  "estado_nutricional": "eutrofico",       "risco": "baixo"},
        {"id": 9,  "iniciais": "N.B.R.",  "equipe": "ESF Rural",       "idade_meses": 12, "peso_kg": 7.4,  "altura_cm": 74,  "caderneta_atualizada": True,  "vacinas_dia": False, "estado_nutricional": "risco_baixo_peso","risco": "alto"},
        {"id": 10, "iniciais": "I.F.M.",  "equipe": "ESF Centro",      "idade_meses": 21, "peso_kg": 12.1, "altura_cm": 85,  "caderneta_atualizada": True,  "vacinas_dia": True,  "estado_nutricional": "sobrepeso",       "risco": "medio"},
        {"id": 11, "iniciais": "K.S.A.",  "equipe": "ESF Cidade Nova",  "idade_meses": 36, "peso_kg": 13.8, "altura_cm": 92,  "caderneta_atualizada": True,  "vacinas_dia": True,  "estado_nutricional": "eutrofico",       "risco": "baixo"},
        {"id": 12, "iniciais": "C.M.P.",  "equipe": "ESF Rural",       "idade_meses": 4,  "peso_kg": 4.8,  "altura_cm": 58,  "caderneta_atualizada": True,  "vacinas_dia": True,  "estado_nutricional": "eutrofico",       "risco": "baixo"},
    ]


@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Cobertura de puericultura (0-2 anos)",           "valor": 78, "meta": 85, "status": "atencao",  "invertido": False},
        {"indicador": "Proporção crianças eutróficas SISVAN",            "valor": 71, "meta": 75, "status": "atencao",  "invertido": False},
        {"indicador": "Cobertura vacinal básica (1 ano)",                "valor": 86, "meta": 95, "status": "atencao",  "invertido": False},
        {"indicador": "Cobertura Bolsa Família — condicionalidades",     "valor": 84, "meta": 85, "status": "atencao",  "invertido": False},
        {"indicador": "Proporção desnutrição grave (SISVAN 0-5a)",       "valor": 3,  "meta": 2,  "status": "critico",  "invertido": True},
        {"indicador": "Mortalidade infantil/1.000 NV",                   "valor": 12, "meta": 10, "status": "critico",  "invertido": True},
        {"indicador": "Aleitamento exclusivo até 6 meses (%)",           "valor": 44, "meta": 50, "status": "critico",  "invertido": False},
        {"indicador": "Caderneta da criança atualizada",                 "valor": 82, "meta": 80, "status": "ok",       "invertido": False},
    ]


@router.get("/bolsa-familia")
async def bolsa_familia():
    return EQUIPES_BF
