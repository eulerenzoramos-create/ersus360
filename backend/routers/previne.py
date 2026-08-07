"""
Router: /api/previne — Novo Financiamento APS (7 indicadores oficiais)
API: https://egestorab.saude.gov.br/api/v1/previne/
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut
from services import previne_service
from functools import lru_cache

router = APIRouter(prefix="/api/previne", tags=["Novo Financiamento APS"])

# ── Dados de referência Apuí/AM ───────────────────────────────────────────────

@lru_cache(maxsize=1)
def _INDICADORES():
    # 15 indicadores — Portaria GM/MS 3.493/2024 (Novo Financiamento APS)
    return [
        # ── Eixo Criança e Mulher ─────────────────────────────────────────────
        {"numero":1,  "nome":"Pré-natal (≥7 consultas, início 1º trim.)",    "descricao":"Proporção de gestantes com início no 1º trimestre e ≥7 consultas de pré-natal",                                "numerador":38,  "denominador":45,   "resultado_pct":84.4, "meta_pct":55.0, "pontuacao":7.0, "status":"verde",   "tendencia":"subindo", "eixo":"Criança e Mulher"},
        {"numero":2,  "nome":"Citopatológico do colo do útero",               "descricao":"Proporção de mulheres (25–64 anos) com coleta de citopatológico na APS nos últimos 3 anos",                   "numerador":512, "denominador":1190, "resultado_pct":43.0, "meta_pct":50.0, "pontuacao":0.0, "status":"vermelho", "tendencia":"estavel", "eixo":"Criança e Mulher"},
        {"numero":3,  "nome":"Vacinação DTP/Pentavalente",                    "descricao":"Cobertura vacinal pentavalente (3ª dose) em crianças menores de 1 ano",                                       "numerador":68,  "denominador":82,   "resultado_pct":82.9, "meta_pct":90.0, "pontuacao":5.0, "status":"amarelo",  "tendencia":"subindo", "eixo":"Criança e Mulher"},
        {"numero":4,  "nome":"Puerpério / Consulta RN 1ª semana",             "descricao":"Proporção de recém-nascidos com consulta na 1ª semana de vida e mães com consulta de puerpério",             "numerador":41,  "denominador":45,   "resultado_pct":91.1, "meta_pct":55.0, "pontuacao":7.0, "status":"verde",   "tendencia":"subindo", "eixo":"Criança e Mulher"},
        # ── Eixo Saúde Bucal ─────────────────────────────────────────────────
        {"numero":5,  "nome":"1ª Consulta Odontológica Programática",         "descricao":"Proporção de pessoas com primeira consulta odontológica programática registrada",                              "numerador":286, "denominador":780,  "resultado_pct":36.7, "meta_pct":45.0, "pontuacao":0.0, "status":"vermelho", "tendencia":"subindo", "eixo":"Saúde Bucal"},
        {"numero":6,  "nome":"Tratamento Odontológico Completado",            "descricao":"Proporção de pessoas com tratamento odontológico completado",                                                  "numerador":198, "denominador":680,  "resultado_pct":29.1, "meta_pct":45.0, "pontuacao":0.0, "status":"vermelho", "tendencia":"estavel", "eixo":"Saúde Bucal"},
        {"numero":7,  "nome":"Urgência Odontológica Resolvida",               "descricao":"Proporção de urgências odontológicas resolvidas na APS sem encaminhamento desnecessário",                     "numerador":284, "denominador":520,  "resultado_pct":54.6, "meta_pct":45.0, "pontuacao":7.0, "status":"verde",   "tendencia":"subindo", "eixo":"Saúde Bucal"},
        # ── Eixo Doenças Crônicas ─────────────────────────────────────────────
        {"numero":8,  "nome":"Acompanhamento de pessoas com HAS",             "descricao":"Proporção de pessoas com HAS com consulta e PA aferida nos últimos 12 meses",                                  "numerador":324, "denominador":410,  "resultado_pct":79.0, "meta_pct":60.0, "pontuacao":7.0, "status":"verde",   "tendencia":"subindo", "eixo":"Doenças Crônicas"},
        {"numero":9,  "nome":"Acompanhamento de pessoas com DM (HbA1c)",      "descricao":"Proporção de pessoas com DM com hemoglobina glicada solicitada nos últimos 12 meses",                         "numerador":89,  "denominador":142,  "resultado_pct":62.7, "meta_pct":55.0, "pontuacao":7.0, "status":"verde",   "tendencia":"estavel", "eixo":"Doenças Crônicas"},
        {"numero":10, "nome":"Obesidade Infantil — IMC avaliado (5–9 anos)",  "descricao":"Proporção de crianças de 5–9 anos com IMC avaliado pelo médico/enfermeiro",                                    "numerador":156, "denominador":280,  "resultado_pct":55.7, "meta_pct":55.0, "pontuacao":7.0, "status":"verde",   "tendencia":"subindo", "eixo":"Doenças Crônicas"},
        {"numero":11, "nome":"Alto Risco Cardiovascular — estatina/antiag.",  "descricao":"Proporção de pessoas com alto risco CV com estatina ou antiagregante plaquetário prescritos",                  "numerador":84,  "denominador":215,  "resultado_pct":39.1, "meta_pct":50.0, "pontuacao":0.0, "status":"vermelho", "tendencia":"estavel", "eixo":"Doenças Crônicas"},
        # ── Eixo Saúde Mental ─────────────────────────────────────────────────
        {"numero":12, "nome":"Acompanhamento — Esquizofrenia / Psicose",      "descricao":"Proporção de pessoas com esquizofrenia ou psicose em acompanhamento regular na APS",                         "numerador":52,  "denominador":118,  "resultado_pct":44.1, "meta_pct":50.0, "pontuacao":0.0, "status":"amarelo",  "tendencia":"subindo", "eixo":"Saúde Mental"},
        {"numero":13, "nome":"Acompanhamento — Transtorno Afetivo Bipolar",   "descricao":"Proporção de pessoas com TAB em acompanhamento regular na APS",                                               "numerador":38,  "denominador":96,   "resultado_pct":39.6, "meta_pct":50.0, "pontuacao":0.0, "status":"vermelho", "tendencia":"subindo", "eixo":"Saúde Mental"},
        # ── Eixo IST / Sífilis ────────────────────────────────────────────────
        {"numero":14, "nome":"Sífilis em Gestante — Tratamento Adequado",     "descricao":"Proporção de gestantes com diagnóstico de sífilis com tratamento adequado realizado",                         "numerador":11,  "denominador":14,   "resultado_pct":78.6, "meta_pct":55.0, "pontuacao":7.0, "status":"verde",   "tendencia":"estavel", "eixo":"IST / Sífilis"},
        {"numero":15, "nome":"Sífilis Congênita — Criança Tratada",           "descricao":"Proporção de crianças com diagnóstico de sífilis congênita com tratamento adequado",                         "numerador":6,   "denominador":7,    "resultado_pct":85.7, "meta_pct":55.0, "pontuacao":7.0, "status":"verde",   "tendencia":"estavel", "eixo":"IST / Sífilis"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        { "competencia": "202503", "media_geral": 56.2, "ind1": 78.2, "ind2": 38.1, "ind3": 76.4, "ind4": 86.7, "ind5": 32.1, "ind6": 24.8, "ind7": 48.2, "ind8": 72.3, "ind9": 58.9, "ind10": 64.5, "ind11": 35.2, "ind12": 40.1, "ind13": 35.8, "ind14": 74.2, "ind15": 78.5 },
        { "competencia": "202504", "media_geral": 58.5, "ind1": 80.1, "ind2": 39.4, "ind3": 78.2, "ind4": 88.1, "ind5": 33.8, "ind6": 26.1, "ind7": 50.4, "ind8": 74.1, "ind9": 60.2, "ind10": 66.2, "ind11": 36.5, "ind12": 41.5, "ind13": 37.2, "ind14": 75.8, "ind15": 80.0 },
        { "competencia": "202505", "media_geral": 60.2, "ind1": 82.0, "ind2": 41.2, "ind3": 80.1, "ind4": 89.4, "ind5": 34.9, "ind6": 27.2, "ind7": 52.1, "ind8": 76.2, "ind9": 61.8, "ind10": 67.8, "ind11": 37.8, "ind12": 42.8, "ind13": 38.4, "ind14": 77.1, "ind15": 81.4 },
        { "competencia": "202506", "media_geral": 62.1, "ind1": 83.7, "ind2": 42.1, "ind3": 81.5, "ind4": 90.2, "ind5": 35.8, "ind6": 28.0, "ind7": 53.4, "ind8": 77.8, "ind9": 62.5, "ind10": 68.9, "ind11": 38.5, "ind12": 43.5, "ind13": 39.0, "ind14": 78.0, "ind15": 82.5 },
        { "competencia": "202507", "media_geral": 64.3, "ind1": 84.4, "ind2": 43.0, "ind3": 82.9, "ind4": 91.1, "ind5": 36.7, "ind6": 29.1, "ind7": 54.6, "ind8": 79.0, "ind9": 62.7, "ind10": 69.8, "ind11": 39.1, "ind12": 44.1, "ind13": 39.6, "ind14": 78.6, "ind15": 85.7 },
    ]


@lru_cache(maxsize=1)
def _EQUIPES():
    # INEs reais conforme CNES Jul/2026 — 9 equipes ESF de Apuí/AM
    return [
        {
            "ine": "0001483724", "nome": "CACHOEIRA",     "ubs": "UBS Irmã Elizabete",                      "tipo": "ESF",
            "ind1": 86.7, "ind2": 43.0, "ind3": 88.2, "ind4": 91.1,
            "ind5": 38.5, "ind6": 30.2, "ind7": 54.8,
            "ind8": 79.0, "ind9": 62.5, "ind10": 77.8,
            "ind11": 42.5, "ind12": 48.2, "ind13": 42.0, "ind14": 80.0, "ind15": 83.3,
            "media": 64.3, "status": "verde",
        },
        {
            "ine": "0001483732", "nome": "SÃO SEBASTIÃO", "ubs": "UBS Anizio Ferreira da Silva",             "tipo": "ESF",
            "ind1": 80.0, "ind2": 41.2, "ind3": 82.4, "ind4": 88.9,
            "ind5": 37.2, "ind6": 29.4, "ind7": 53.6,
            "ind8": 75.4, "ind9": 58.1, "ind10": 73.3,
            "ind11": 41.0, "ind12": 47.1, "ind13": 40.8, "ind14": 76.9, "ind15": 80.0,
            "media": 62.4, "status": "verde",
        },
        {
            "ine": "0001483740", "nome": "ACARI",          "ubs": "UBS Anizio Ferreira da Silva",             "tipo": "ESF",
            "ind1": 78.6, "ind2": 39.8, "ind3": 80.0, "ind4": 90.0,
            "ind5": 36.8, "ind6": 28.8, "ind7": 52.4,
            "ind8": 77.3, "ind9": 60.0, "ind10": 72.2,
            "ind11": 40.2, "ind12": 46.5, "ind13": 39.5, "ind14": 75.0, "ind15": 78.6,
            "media": 61.7, "status": "verde",
        },
        {
            "ine": "0001483759", "nome": "TRÊS ESTADOS",   "ubs": "UBS Osvaldo Lemes Cabral",                 "tipo": "ESF",
            "ind1": 55.6, "ind2": 28.4, "ind3": 62.5, "ind4": 66.7,
            "ind5": 24.5, "ind6": 18.2, "ind7": 38.6,
            "ind8": 58.1, "ind9": 45.5, "ind10": 54.5,
            "ind11": 28.5, "ind12": 32.0, "ind13": 26.4, "ind14": 50.0, "ind15": 50.0,
            "media": 42.6, "status": "amarelo",
        },
        {
            "ine": "0001483767", "nome": "JUMA",           "ubs": "Centro de Saúde Curumim",                  "tipo": "ESF",
            "ind1": 85.7, "ind2": 44.8, "ind3": 85.0, "ind4": 92.9,
            "ind5": 39.4, "ind6": 31.0, "ind7": 55.8,
            "ind8": 80.5, "ind9": 63.6, "ind10": 79.4,
            "ind11": 43.5, "ind12": 49.2, "ind13": 43.8, "ind14": 82.4, "ind15": 85.7,
            "media": 64.5, "status": "verde",
        },
        {
            "ine": "0001483775", "nome": "LIBERDADE",      "ubs": "Centro de Saúde Curumim",                  "tipo": "ESF",
            "ind1": 90.9, "ind2": 52.4, "ind3": 90.5, "ind4": 100.0,
            "ind5": 46.2, "ind6": 38.5, "ind7": 63.4,
            "ind8": 85.2, "ind9": 71.4, "ind10": 83.3,
            "ind11": 52.5, "ind12": 57.8, "ind13": 53.2, "ind14": 91.7, "ind15": 100.0,
            "media": 71.8, "status": "verde",
        },
        {
            "ine": "0001483783", "nome": "KENNEDY",        "ubs": "UBS Padre Faliero Bonci",                  "tipo": "ESF",
            "ind1": 50.0, "ind2": 22.1, "ind3": 58.3, "ind4": 60.0,
            "ind5": 22.4, "ind6": 16.8, "ind7": 36.0,
            "ind8": 52.6, "ind9": 40.0, "ind10": 45.5,
            "ind11": 24.0, "ind12": 28.5, "ind13": 22.8, "ind14": 42.9, "ind15": 50.0,
            "media": 38.1, "status": "amarelo",
        },
        {
            "ine": "0001483791", "nome": "JK",             "ubs": "UBS JK",                                   "tipo": "ESF",
            "ind1": 83.3, "ind2": 42.5, "ind3": 86.2, "ind4": 90.0,
            "ind5": 38.0, "ind6": 29.8, "ind7": 53.0,
            "ind8": 77.8, "ind9": 61.5, "ind10": 76.9,
            "ind11": 41.2, "ind12": 47.5, "ind13": 40.5, "ind14": 77.8, "ind15": 81.8,
            "media": 62.5, "status": "verde",
        },
        {
            "ine": "0001483805", "nome": "ESTRADA NOVA",   "ubs": "UBS Claudia Pereira dos Santos Damacena",  "tipo": "ESF",
            "ind1": 44.4, "ind2": 19.8, "ind3": 55.0, "ind4": 57.1,
            "ind5": 20.5, "ind6": 15.2, "ind7": 34.4,
            "ind8": 48.7, "ind9": 35.7, "ind10": 41.2,
            "ind11": 21.8, "ind12": 26.0, "ind13": 20.4, "ind14": 38.5, "ind15": 42.9,
            "media": 35.4, "status": "amarelo",
        },
    ]



# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/indicadores")
async def listar_indicadores(
    competencia: str = Query("202507", description="AAAAMM"),
    _: UserOut = Depends(get_current_user),
):
    """7 indicadores Novo Financiamento APS com metas e status."""
    return await previne_service.buscar_indicadores(competencia)


@router.get("/historico")
async def historico_indicadores(
    meses: int = Query(6, ge=1, le=24),
    _: UserOut = Depends(get_current_user),
):
    """Histórico mensal dos 7 indicadores."""
    return await previne_service.buscar_historico(meses)


@router.get("/equipes")
async def indicadores_por_equipe(
    competencia: str = Query("202507"),
    _: UserOut = Depends(get_current_user),
):
    """Indicadores Novo Financiamento APS por equipe de saúde da família."""
    return {
        "competencia": competencia,
        "total_equipes": len(_EQUIPES()),
        "equipes": _EQUIPES(),
        "fonte": "referencia",
    }


@router.get("/busca-ativa")
async def busca_ativa(
    indicador: int = Query(..., ge=1, le=7, description="Número do indicador (1–7)"),
    _: UserOut = Depends(get_current_user),
):
    """Lista de pacientes elegíveis para busca ativa por indicador."""
    bases = {
        1: {"indicador": "Pré-natal ≥ 6 consultas", "total_elegivel": 45, "total_realizado": 38, "pendentes": 7},
        2: {"indicador": "Citopatológico", "total_elegivel": 1190, "total_realizado": 512, "pendentes": 678},
        3: {"indicador": "Vacinação DTP/Penta", "total_elegivel": 82, "total_realizado": 68, "pendentes": 14},
        4: {"indicador": "Consulta RN 1ª semana", "total_elegivel": 45, "total_realizado": 41, "pendentes": 4},
        5: {"indicador": "HAS acompanhada", "total_elegivel": 410, "total_realizado": 324, "pendentes": 86},
        6: {"indicador": "DM com HbA1c", "total_elegivel": 142, "total_realizado": 89, "pendentes": 53},
        7: {"indicador": "Obesidade infantil IMC", "total_elegivel": 280, "total_realizado": 156, "pendentes": 124},
    }
    base = bases.get(indicador, bases[1])
    return {
        **base,
        "microareas_criticas": ["MA-02", "MA-07"],
        "acs_responsaveis": ["Carlos Souza", "Ana Lima"],
        "observacao": "Dados de referência Apuí/AM — competência Jul/2026",
        "fonte": "referencia",
    }
