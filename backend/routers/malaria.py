"""Malária — Vigilância e Controle · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/malaria", tags=["malaria"])

_LOCALIDADES = [
    {"localidade": "Zona Urbana — Sede",            "area": "urbana",    "exames_mes": 48,  "positivos_mes": 12, "ipa": 4.2,  "falciparum_pct": 18.4, "vivax_pct": 81.6, "status": "atencao"},
    {"localidade": "Linha 7 e Ramais",              "area": "rural",     "exames_mes": 84,  "positivos_mes": 38, "ipa": 22.6, "falciparum_pct": 28.9, "vivax_pct": 71.1, "status": "critico"},
    {"localidade": "Matupi e área",                 "area": "rural",     "exames_mes": 62,  "positivos_mes": 28, "ipa": 19.4, "falciparum_pct": 25.0, "vivax_pct": 75.0, "status": "critico"},
    {"localidade": "Comunidades Ribeirinhas",        "area": "ribeirinha","exames_mes": 36,  "positivos_mes": 18, "ipa": 28.8, "falciparum_pct": 33.3, "vivax_pct": 66.7, "status": "critico"},
    {"localidade": "Assentamentos rurais",           "area": "rural",     "exames_mes": 42,  "positivos_mes": 16, "ipa": 15.2, "falciparum_pct": 12.5, "vivax_pct": 87.5, "status": "atencao"},
    {"localidade": "Área de garimpo",               "area": "garimpo",   "exames_mes": 22,  "positivos_mes": 14, "ipa": 63.6, "falciparum_pct": 57.1, "vivax_pct": 42.9, "status": "critico"},
]

@router.get("/dashboard")
async def dashboard():
    return {
        "exames_mes": 294,
        "casos_mes": 126,
        "ipa_municipio": 66.8,
        "api": 126,
        "falciparum_pct": 27.8,
        "vivax_pct": 69.0,
        "misto_pct": 3.2,
        "casos_graves_mes": 4,
        "hospitalizacoes_mes": 4,
        "obitos_ano": 1,
        "cura_tratamento_pct": 96.8,
        "abandono_tratamento_pct": 3.2,
        "pos_semana_epidemiologica": 24,
        "alerta_epidemico": True,
        "nivel_alerta": "epidemia",
        "ivp_iip": "IPA > 50/1000 hab — nível EPIDEMIA",
        "notificacoes_sinan_mes": 126,
        "status_geral": "critico",
        "competencia": "Jun/2026",
    }

@router.get("/localidades")
async def localidades():
    return _LOCALIDADES

@router.get("/serie-semanas")
async def serie_semanas():
    return [
        {"semana": "SE 01", "casos": 82,  "falciparum": 22, "vivax": 58, "misto": 2, "exames": 190},
        {"semana": "SE 04", "casos": 88,  "falciparum": 24, "vivax": 61, "misto": 3, "exames": 198},
        {"semana": "SE 08", "casos": 96,  "falciparum": 26, "vivax": 67, "misto": 3, "exames": 210},
        {"semana": "SE 12", "casos": 104, "falciparum": 28, "vivax": 72, "misto": 4, "exames": 222},
        {"semana": "SE 16", "casos": 110, "falciparum": 30, "vivax": 76, "misto": 4, "exames": 238},
        {"semana": "SE 20", "casos": 118, "falciparum": 33, "vivax": 81, "misto": 4, "exames": 260},
        {"semana": "SE 24", "casos": 126, "falciparum": 35, "vivax": 87, "misto": 4, "exames": 294},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Jan/26", "casos": 82,  "ipa": 43.4, "falciparum": 22, "vivax": 58, "hospitalizacoes": 2},
        {"mes": "Fev/26", "casos": 94,  "ipa": 49.8, "falciparum": 25, "vivax": 66, "hospitalizacoes": 3},
        {"mes": "Mar/26", "casos": 108, "ipa": 57.2, "falciparum": 29, "vivax": 75, "hospitalizacoes": 3},
        {"mes": "Abr/26", "casos": 114, "ipa": 60.4, "falciparum": 31, "vivax": 79, "hospitalizacoes": 4},
        {"mes": "Mai/26", "casos": 120, "ipa": 63.5, "falciparum": 33, "vivax": 83, "hospitalizacoes": 4},
        {"mes": "Jun/26", "casos": 126, "ipa": 66.8, "falciparum": 35, "vivax": 87, "hospitalizacoes": 4},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "IPA Municipal (Índice Parasitário Anual)",         "valor": 66.8, "meta": 10.0,  "unidade": "/1000 hab", "status": "critico", "observacao": "IPA > 50 = EPIDEMIA. Garimpo com IPA 63.6 — principal foco de P. falciparum resistente"},
        {"indicador": "Proporção de P. falciparum",                       "valor": 27.8, "meta": 10.0,  "unidade": "%",         "status": "critico", "observacao": "Falciparum em área de garimpo com suspeita de resistência à cloroquina — aguardando teste TDR"},
        {"indicador": "Casos graves / hospitalizações por malária",       "valor": 4,    "meta": 0,     "unidade": "n/mês",     "status": "critico", "observacao": "4 hospitalizações em Jun/26 — 1 óbito em 2026 (jovem de 23a, garimpo, diagnóstico tardio)"},
        {"indicador": "Abandono de tratamento antimalárico",              "valor": 3.2,  "meta": 0,     "unidade": "%",         "status": "atencao", "observacao": "4 abandonos em Jun/26 — garimpeiros que migram entre municípios sem concluir esquema"},
        {"indicador": "LAMINF — exames em 24h após notificação",          "valor": 82.4, "meta": 100.0, "unidade": "%",         "status": "atencao", "observacao": "Comunidades ribeirinhas sem microscopista local — exames coletados e processados na sede (24–48h)"},
        {"indicador": "Cobertura de borrifação residual / mosquiteiro",   "valor": 48.2, "meta": 80.0,  "unidade": "%",         "status": "critico", "observacao": "Área de garimpo e ribeirinhos com cobertura < 30% — logística fluvial e resistência cultural"},
    ]
