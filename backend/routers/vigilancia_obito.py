"""Vigilância do Óbito — Materno, Infantil e Fetal · FMS Apuí/AM"""
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/vigilancia-obito", tags=["vigilancia_obito"])

@lru_cache(maxsize=1)
def _OBITOS_MATERNOS():
    return [
        {"caso": "OM-2026-01", "idade": 22, "causa_basica": "Hemorragia pós-parto", "tipo": "direta", "semana_gestacional": 38, "local_obito": "Hospital Municipal", "comite_investigou": True,  "evitavel": True,  "conclusao": "Retardo no atendimento de urgência obstétrica", "competencia": "Jan/2026"},
        {"caso": "OM-2026-02", "idade": 34, "causa_basica": "Eclâmpsia",             "tipo": "direta", "semana_gestacional": 32, "local_obito": "Hospital Municipal", "comite_investigou": True,  "evitavel": True,  "conclusao": "Pré-natal inadequado — 3 consultas apenas", "competencia": "Mar/2026"},
        {"caso": "OM-2026-03", "idade": 28, "causa_basica": "Sepse puerperal",       "tipo": "direta", "semana_gestacional": 40, "local_obito": "Domicílio",          "comite_investigou": True,  "evitavel": True,  "conclusao": "Falta de reconhecimento de sinais de alerta — parto domiciliar sem assistência", "competencia": "Mai/2026"},
    ]


@lru_cache(maxsize=1)
def _OBITOS_INFANTIS():
    return [
        {"faixa": "Neonatal precoce (0–6 dias)",   "n_2024": 8,  "n_2025": 7,  "n_2026": 5,  "causas_principais": ["Prematuridade","Malformações congênitas","Asfixia"], "evitaveis_pct": 60.0},
        {"faixa": "Neonatal tardio (7–27 dias)",    "n_2024": 4,  "n_2025": 3,  "n_2026": 2,  "causas_principais": ["Sepse neonatal","Malformações"], "evitaveis_pct": 50.0},
        {"faixa": "Pós-neonatal (28d–1 ano)",       "n_2024": 6,  "n_2025": 5,  "n_2026": 3,  "causas_principais": ["Pneumonia","Diarreia","Desnutrição"], "evitaveis_pct": 80.0},
    ]


@router.get("/dashboard")
async def dashboard():
    return {
        "obitos_maternos_ano": 3,
        "razao_mortalidade_materna": 168.4,
        "meta_rmm_oms": 30.0,
        "obitos_infantis_ano": 10,
        "taxa_mortalidade_infantil": 15.2,
        "meta_tmi": 10.0,
        "obitos_fetais_ano": 4,
        "taxa_natimortalidade": 6.1,
        "obitos_investigados_pct": 100.0,
        "obitos_evitaveis_pct": 76.9,
        "comite_reunioes_ano": 6,
        "recomendacoes_emitidas": 14,
        "recomendacoes_implementadas": 8,
        "pct_recomendacoes_impl": 57.1,
        "status_geral": "critico",
        "competencia": "Jun/2026",
    }

@router.get("/obitos-maternos")
async def obitos_maternos():
    return _OBITOS_MATERNOS()

@router.get("/obitos-infantis")
async def obitos_infantis():
    return _OBITOS_INFANTIS()

@router.get("/historico")
async def historico():
    return [
        {"ano": "2022", "om": 2, "rmm": 112.4, "tmi": 18.4, "obitos_infantis": 12},
        {"ano": "2023", "om": 3, "rmm": 168.2, "tmi": 17.1, "obitos_infantis": 11},
        {"ano": "2024", "om": 2, "rmm": 112.1, "tmi": 16.8, "obitos_infantis": 18},
        {"ano": "2025", "om": 4, "rmm": 223.8, "tmi": 15.8, "obitos_infantis": 15},
        {"ano": "2026*","om": 3, "rmm": 168.4, "tmi": 15.2, "obitos_infantis": 10},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Razão de Mortalidade Materna (RMM)",     "valor": 168.4, "meta": 30.0,  "unidade": "/100mil NV", "status": "critico", "observacao": "3 óbitos em 2026 — 100% evitáveis conforme COMAVE. Pré-natal inadequado (<6 consultas) em 2/3 casos"},
        {"indicador": "Taxa de Mortalidade Infantil (TMI)",      "valor": 15.2,  "meta": 10.0,  "unidade": "/mil NV",    "status": "critico", "observacao": "10 óbitos em 2026 — 80% dos pós-neonatais evitáveis por melhora em APS e saneamento"},
        {"indicador": "Taxa de Natimortalidade",                 "valor": 6.1,   "meta": 4.0,   "unidade": "/mil NV",    "status": "atencao", "observacao": "4 óbitos fetais — investigação concluída em 3/4 casos"},
        {"indicador": "Óbitos investigados pelo comitê",         "valor": 100.0, "meta": 100.0, "unidade": "%",          "status": "ok",      "observacao": "COMAVE Apuí investiga 100% dos óbitos maternos e infantis desde 2024"},
        {"indicador": "Recomendações do comitê implementadas",   "valor": 57.1,  "meta": 80.0,  "unidade": "%",          "status": "atencao", "observacao": "8/14 implementadas — 6 dependem de estrutura hospitalar ou contratação de pessoal"},
        {"indicador": "Gestantes com 6+ consultas de pré-natal", "valor": 62.4,  "meta": 85.0,  "unidade": "%",          "status": "critico", "observacao": "Comunidades ribeirinhas com acesso precário são os maiores desafios"},
    ]