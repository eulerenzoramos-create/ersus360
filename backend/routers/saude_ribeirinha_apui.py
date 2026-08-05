from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-ribeirinha-apui", tags=["saude_ribeirinha_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "populacao_ribeirinha_estimada": 3840,
        "pct_populacao_total": 15.4,
        "comunidades_ribeirinhas": 28,
        "comunidades_com_atendimento_regular": 16,
        "cobertura_atendimento_pct": 57.1,
        "equipes_fluviais_ativas": 2,
        "lanchas_saude_disponiveis": 2,
        "lanchas_em_manutencao": 1,
        "visitas_ribeirinhas_mes": 84,
        "atendimentos_por_visita_media": 22.4,
        "tempo_medio_deslocamento_horas": 4.8,
        "comunidades_sem_agua_tratada_pct": 72.4,
        "saneamento_basico_pct": 18.4,
        "mortalidade_infantil_ribeirinha": 32.4,
        "cobertura_vacinal_ribeirinha_pct": 68.4,
        "status_cobertura": "critico",
        "status_saneamento": "critico",
    }


@lru_cache(maxsize=1)
def _COMUNIDADES():
    return [
        {"comunidade": "Vila do Juma",          "populacao": 284, "rio": "Juma",       "distancia_sede_km": 84,  "atend_regular": True,  "agua_tratada": False, "acesso": "Fluvial",          "status": "atencao"},
        {"comunidade": "Santo Antônio do Maici","populacao": 212, "rio": "Maici",      "distancia_sede_km": 124, "atend_regular": True,  "agua_tratada": False, "acesso": "Fluvial",          "status": "atencao"},
        {"comunidade": "Boca do Acará",         "populacao": 184, "rio": "Acará",      "distancia_sede_km": 148, "atend_regular": False, "agua_tratada": False, "acesso": "Fluvial/sazonal",  "status": "critico"},
        {"comunidade": "Vila Aparecida",        "populacao": 164, "rio": "Juma",       "distancia_sede_km": 108, "atend_regular": True,  "agua_tratada": False, "acesso": "Fluvial",          "status": "atencao"},
        {"comunidade": "Nova Esperança",        "populacao": 148, "rio": "Marmelos",   "distancia_sede_km": 168, "atend_regular": False, "agua_tratada": False, "acesso": "Fluvial (seco: estrad.)", "status": "critico"},
        {"comunidade": "São João do Juma",      "populacao": 128, "rio": "Juma",       "distancia_sede_km": 96,  "atend_regular": True,  "agua_tratada": False, "acesso": "Fluvial",          "status": "atencao"},
        {"comunidade": "Boa Esperança",         "populacao": 112, "rio": "Maici",      "distancia_sede_km": 184, "atend_regular": False, "agua_tratada": False, "acesso": "Fluvial",          "status": "critico"},
        {"comunidade": "Cachoeira do Acará",    "populacao": 96,  "rio": "Acará",      "distancia_sede_km": 212, "atend_regular": False, "agua_tratada": False, "acesso": "Fluvial/sazonal",  "status": "critico"},
        {"comunidade": "São Paulo do Juma",     "populacao": 88,  "rio": "Juma",       "distancia_sede_km": 142, "atend_regular": True,  "agua_tratada": False, "acesso": "Fluvial",          "status": "atencao"},
        {"comunidade": "Outras (19 menores)",   "populacao": 2424,"rio": "Vários",     "distancia_sede_km": 0,   "atend_regular": False, "agua_tratada": False, "acesso": "Irregular",        "status": "critico"},
    ]


@lru_cache(maxsize=1)
def _PERFIL_MORBIDADE():
    return [
        {"agravo": "Malária (P.vivax/falciparum)",  "taxa_100k": 4284, "ribeirinho_vs_urbano": "8,4×", "status": "critico"},
        {"agravo": "Parasitoses intestinais",        "taxa_100k": 2840, "ribeirinho_vs_urbano": "4,2×", "status": "critico"},
        {"agravo": "Leishmaniose tegumentar",         "taxa_100k": 484,  "ribeirinho_vs_urbano": "6,8×", "status": "critico"},
        {"agravo": "Doenças diarreicas agudas",       "taxa_100k": 3284, "ribeirinho_vs_urbano": "5,1×", "status": "critico"},
        {"agravo": "Desnutrição infantil",            "taxa_100k": 1284, "ribeirinho_vs_urbano": "3,2×", "status": "critico"},
        {"agravo": "Hepatite A / E",                 "taxa_100k": 284,  "ribeirinho_vs_urbano": "7,4×", "status": "critico"},
        {"agravo": "Trauma / acidentes fluviais",    "taxa_100k": 648,  "ribeirinho_vs_urbano": "3,8×", "status": "atencao"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "visitas": 68,  "atendimentos": 1184, "cobertura_pct": 48.2, "vacinacao_pct": 62.4},
        {"ano": "2023", "visitas": 72,  "atendimentos": 1284, "cobertura_pct": 51.8, "vacinacao_pct": 64.8},
        {"ano": "2024", "visitas": 80,  "atendimentos": 1484, "cobertura_pct": 54.2, "vacinacao_pct": 66.4},
        {"ano": "2025", "visitas": 84,  "atendimentos": 1884, "cobertura_pct": 57.1, "vacinacao_pct": 68.4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Cobertura de atendimento",            "valor": 57.1, "meta": 90.0,  "unidade": "%",        "status": "critico", "observacao": "42,9% das comunidades sem atendimento regular — 3 lanchas necessárias, 1 em manutenção permanente"},
        {"indicador": "Água tratada nas comunidades",        "valor": 0.0,  "meta": 100.0, "unidade": "%",        "status": "critico", "observacao": "ZERO comunidades ribeirinhas com água tratada — fonte é o rio, sem tratamento, veículo de DDA e hepatite A"},
        {"indicador": "Saneamento básico",                   "valor": 18.4, "meta": 100.0, "unidade": "%",        "status": "critico", "observacao": "18,4% com algum saneamento — doenças de veiculação hídrica são 8,4× mais frequentes do que na área urbana"},
        {"indicador": "Taxa malária em ribeirinhos",         "valor": 4284, "meta": None,  "unidade": "/100k",    "status": "critico", "observacao": "Malária 8,4× mais frequente que na área urbana — trabalho em mata, sem proteção, distante de diagnóstico"},
        {"indicador": "Cobertura vacinal ribeirinha",        "valor": 68.4, "meta": 95.0,  "unidade": "%",        "status": "critico", "observacao": "26,6% sem vacinação completa — acesso irregular das equipes e cadeia de frio insuficiente nas lanchas"},
        {"indicador": "Mortalidade infantil ribeirinha",     "valor": 32.4, "meta": 10.0,  "unidade": "/1k NV",   "status": "critico", "observacao": "3,2× a meta nacional — partos domiciliares sem assistência, diarreia grave sem acesso a hidratação"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/comunidades")
def comunidades():
    return _COMUNIDADES


@router.get("/morbidade")
def morbidade():
    return _PERFIL_MORBIDADE


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
