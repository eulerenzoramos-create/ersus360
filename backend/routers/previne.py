"""
Router: /api/previne — Previne Brasil (7 indicadores oficiais)
API: https://egestorab.saude.gov.br/api/v1/previne/
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut
from services import previne_service

router = APIRouter(prefix="/api/previne", tags=["Previne Brasil"])

# ── Dados de referência Apuí/AM ───────────────────────────────────────────────

_INDICADORES = [
    {
        "numero": 1,
        "nome": "Pré-natal (≥ 6 consultas)",
        "descricao": "Proporção de gestantes com início no 1º trimestre e ≥ 6 consultas de pré-natal",
        "numerador": 38,
        "denominador": 45,
        "resultado_pct": 84.4,
        "meta_pct": 60.0,
        "pontuacao": 7.0,
        "status": "verde",
        "tendencia": "subindo",
        "eixo": "Criança e Mulher",
    },
    {
        "numero": 2,
        "nome": "Citopatológico do colo do útero",
        "descricao": "Proporção de mulheres (25–64 anos) com coleta de citopatológico na APS",
        "numerador": 512,
        "denominador": 1190,
        "resultado_pct": 43.0,
        "meta_pct": 60.0,
        "pontuacao": 0.0,
        "status": "vermelho",
        "tendencia": "estavel",
        "eixo": "Criança e Mulher",
    },
    {
        "numero": 3,
        "nome": "Vacinação — DTP/Penta",
        "descricao": "Cobertura vacinal em crianças de 1 ano (DTP) e menores de 1 ano (Pentavalente)",
        "numerador": 68,
        "denominador": 82,
        "resultado_pct": 82.9,
        "meta_pct": 95.0,
        "pontuacao": 5.0,
        "status": "amarelo",
        "tendencia": "subindo",
        "eixo": "Criança e Mulher",
    },
    {
        "numero": 4,
        "nome": "Pré-natal na 1ª semana de vida (RN)",
        "descricao": "Proporção de recém-nascidos com consulta na 1ª semana de vida",
        "numerador": 41,
        "denominador": 45,
        "resultado_pct": 91.1,
        "meta_pct": 60.0,
        "pontuacao": 7.0,
        "status": "verde",
        "tendencia": "subindo",
        "eixo": "Criança e Mulher",
    },
    {
        "numero": 5,
        "nome": "Acompanhamento de pessoas com HAS",
        "descricao": "Proporção de pessoas com HAS com consulta e PA aferida nos últimos 12 meses",
        "numerador": 324,
        "denominador": 410,
        "resultado_pct": 79.0,
        "meta_pct": 60.0,
        "pontuacao": 7.0,
        "status": "verde",
        "tendencia": "subindo",
        "eixo": "Doenças Crônicas",
    },
    {
        "numero": 6,
        "nome": "Acompanhamento de pessoas com DM",
        "descricao": "Proporção de pessoas com DM com hemoglobina glicada solicitada nos últimos 12 meses",
        "numerador": 89,
        "denominador": 142,
        "resultado_pct": 62.7,
        "meta_pct": 60.0,
        "pontuacao": 7.0,
        "status": "verde",
        "tendencia": "estavel",
        "eixo": "Doenças Crônicas",
    },
    {
        "numero": 7,
        "nome": "Cuidado das Pessoas com Obesidade",
        "descricao": "Proporção de crianças de 5–9 anos com IMC avaliado pelo médico/enfermeiro",
        "numerador": 156,
        "denominador": 280,
        "resultado_pct": 55.7,
        "meta_pct": 60.0,
        "pontuacao": 0.0,
        "status": "amarelo",
        "tendencia": "subindo",
        "eixo": "Doenças Crônicas",
    },
]

_HISTORICO = [
    { "competencia": "202503", "media_geral": 58.3, "ind1": 78.2, "ind2": 38.1, "ind3": 76.4, "ind4": 86.7, "ind5": 72.3, "ind6": 58.9, "ind7": 48.2 },
    { "competencia": "202504", "media_geral": 61.4, "ind1": 80.1, "ind2": 39.4, "ind3": 78.2, "ind4": 88.1, "ind5": 74.1, "ind6": 60.2, "ind7": 50.1 },
    { "competencia": "202505", "media_geral": 63.8, "ind1": 82.0, "ind2": 41.2, "ind3": 80.1, "ind4": 89.4, "ind5": 76.2, "ind6": 61.8, "ind7": 52.4 },
    { "competencia": "202506", "media_geral": 65.9, "ind1": 83.7, "ind2": 42.1, "ind3": 81.5, "ind4": 90.2, "ind5": 77.8, "ind6": 62.5, "ind7": 53.9 },
    { "competencia": "202507", "media_geral": 68.4, "ind1": 84.4, "ind2": 43.0, "ind3": 82.9, "ind4": 91.1, "ind5": 79.0, "ind6": 62.7, "ind7": 55.7 },
]

_EQUIPES = [
    {
        "ine": "0000315758", "nome": "ESF Apuí I", "tipo": "ESF",
        "ind1": 84.4, "ind2": 45.2, "ind3": 83.1, "ind4": 92.0, "ind5": 80.2, "ind6": 63.5, "ind7": 57.1,
        "media": 72.2, "status": "verde",
    },
    {
        "ine": "0000315766", "nome": "ESF Apuí II", "tipo": "ESF",
        "ind1": 82.1, "ind2": 41.8, "ind3": 80.4, "ind4": 89.7, "ind5": 77.4, "ind6": 61.9, "ind7": 52.3,
        "media": 69.4, "status": "verde",
    },
    {
        "ine": "0000315774", "nome": "ESF Vila do Castanho", "tipo": "ESF",
        "ind1": 86.7, "ind2": 40.1, "ind3": 84.2, "ind4": 91.5, "ind5": 79.5, "ind6": 62.8, "ind7": 57.7,
        "media": 71.8, "status": "verde",
    },
]


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/indicadores")
async def listar_indicadores(
    competencia: str = Query("202507", description="AAAAMM"),
    _: UserOut = Depends(get_current_user),
):
    """7 indicadores Previne Brasil com metas e status."""
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
    """Indicadores Previne Brasil por equipe de saúde da família."""
    return {
        "competencia": competencia,
        "total_equipes": len(_EQUIPES),
        "equipes": _EQUIPES,
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
