"""Monitoramento de Metas — PMS / Novo Financiamento APS / Quadrimestral · Apuí/AM"""
from __future__ import annotations
import asyncio
from datetime import date as _date
from fastapi import APIRouter
from services import previne_service, siops_service

router = APIRouter(prefix="/api/monitoramento-metas-apui", tags=["Monitoramento de Metas Apuí"])

DASHBOARD = {
    "metas_pms_total": 48,
    "metas_alcancadas": 18,
    "metas_andamento": 22,
    "metas_criticas": 8,
    "percentual_alcancado": 37.5,
    "indicadores_previne_total": 21,
    "indicadores_previne_meta": 9,
    "nota_previne_brasil": 5.84,
    "meta_nota_previne": 7.0,
    "relatorio_quadrimestral": "2º Quadrimestre 2025",
    "status": "atencao",
}

METAS_PMS = [
    {"eixo": "Atenção Básica",        "meta": "Cobertura ESF ≥ 90%",              "valor_atual": "87.3%", "meta_val": "90%",  "status": "atencao"},
    {"eixo": "Atenção Básica",        "meta": "Pré-natal adequado ≥ 90%",         "valor_atual": "71.3%", "meta_val": "90%",  "status": "atencao"},
    {"eixo": "Atenção Básica",        "meta": "Vacina Pentavalente ≥ 95%",        "valor_atual": "91.2%", "meta_val": "95%",  "status": "atencao"},
    {"eixo": "Vigilância em Saúde",   "meta": "Notificação malária ≤ 7d",         "valor_atual": "94.8%", "meta_val": "100%", "status": "atencao"},
    {"eixo": "Vigilância em Saúde",   "meta": "Cobertura vacinal Febre Amarela",  "valor_atual": "96.8%", "meta_val": "95%",  "status": "ok"},
    {"eixo": "Saúde Mental",          "meta": "Altas CAPS / reinserção social",   "valor_atual": "48.2%", "meta_val": "60%",  "status": "atencao"},
    {"eixo": "Assistência Farm.",     "meta": "Dispensações atendidas ≥ 90%",     "valor_atual": "79.4%", "meta_val": "90%",  "status": "atencao"},
    {"eixo": "Gestão",                "meta": "Execução orçamentária ≥ 85%",      "valor_atual": "72.4%", "meta_val": "85%",  "status": "atencao"},
    {"eixo": "Gestão",                "meta": "Gastos saúde ≥ 15% receita",       "valor_atual": "18.4%", "meta_val": "15%",  "status": "ok"},
    {"eixo": "Urgência",              "meta": "SAMU cobertura municipal",          "valor_atual": "Não",   "meta_val": "Sim",  "status": "critico"},
]

PREVINE_BRASIL = [
    {"indicador": "I1 — Pré-natal (6+ consultas)",          "resultado": 71.3,  "meta": 60.0,  "nota": 10.0, "status": "ok"},
    {"indicador": "I2 — Pré-natal na 1ª semana",            "resultado": 48.4,  "meta": 60.0,  "nota": 6.2,  "status": "atencao"},
    {"indicador": "I3 — Sífilis + HIV gestante",            "resultado": 97.3,  "meta": 90.0,  "nota": 10.0, "status": "ok"},
    {"indicador": "I4 — HbA1c Diabetes",                    "resultado": 42.8,  "meta": 50.0,  "nota": 4.8,  "status": "atencao"},
    {"indicador": "I5 — PA Hipertensão",                    "resultado": 58.4,  "meta": 60.0,  "nota": 7.2,  "status": "atencao"},
    {"indicador": "I6 — Citopatológico colo útero",         "resultado": 44.2,  "meta": 60.0,  "nota": 4.4,  "status": "critico"},
    {"indicador": "I7 — Saúde bucal (1ª cons. odont.)",    "resultado": 31.8,  "meta": 50.0,  "nota": 3.2,  "status": "critico"},
    {"indicador": "I8 — Práticas integrativas PICS",        "resultado": 12.4,  "meta": 20.0,  "nota": 2.4,  "status": "critico"},
]

HISTORICO = [
    {"quadrimestre": "1º Q/2024", "metas_alcancadas": 14, "nota_previne": 5.12, "execucao_orc_pct": 68.4},
    {"quadrimestre": "2º Q/2024", "metas_alcancadas": 15, "nota_previne": 5.48, "execucao_orc_pct": 70.2},
    {"quadrimestre": "3º Q/2024", "metas_alcancadas": 16, "nota_previne": 5.64, "execucao_orc_pct": 71.8},
    {"quadrimestre": "4º Q/2024", "metas_alcancadas": 17, "nota_previne": 5.72, "execucao_orc_pct": 72.0},
    {"quadrimestre": "1º Q/2025", "metas_alcancadas": 17, "nota_previne": 5.78, "execucao_orc_pct": 71.4},
    {"quadrimestre": "2º Q/2025", "metas_alcancadas": 18, "nota_previne": 5.84, "execucao_orc_pct": 72.4},
]

INDICADORES = [
    {"indicador": "Metas PMS alcançadas",         "valor": "18/48", "meta": "48/48", "status": "atencao"},
    {"indicador": "Nota Novo Financiamento APS",           "valor": 5.84,    "meta": 7.0,     "status": "atencao"},
    {"indicador": "Indicadores Previne na meta",  "valor": "9/21",  "meta": "21/21", "status": "atencao"},
    {"indicador": "Metas críticas",               "valor": 8,       "meta": 0,       "status": "critico"},
    {"indicador": "Relatório quadrimestral CMS",  "valor": "Em dia", "meta": "Em dia","status": "ok"},
    {"indicador": "Execução orçamentária",        "valor": "72.4%", "meta": "85%",   "status": "atencao"},
]

@router.get("/dashboard")
async def dashboard():
    hoje = _date.today()
    comp = f"{hoje.year}{hoje.month:02d}"
    previne_data, siops_data = await asyncio.gather(
        previne_service.buscar_indicadores(comp),
        siops_service.buscar_apuracao(hoje.year),
    )
    media_previne = previne_data.get("media_geral_pct") or DASHBOARD.get("previne_media_pct", 68.0)
    asps_pct = float(siops_data.get("minimo_constitucional_pct_aplicado") or DASHBOARD.get("asps_pct", 17.16))
    return {
        **DASHBOARD,
        "previne_media_pct": media_previne,
        "previne_indicadores_total": len(previne_data.get("indicadores", [])),
        "asps_pct": asps_pct,
        "asps_status": "ok" if asps_pct >= 15.0 else "critico",
        "fonte_previne": previne_data.get("fonte", "referencia"),
        "fonte_siops": siops_data.get("fonte", "referencia"),
    }

@router.get("/metas-pms")
def metas_pms():       return METAS_PMS

@router.get("/previne-brasil")
async def previne_brasil():
    hoje = _date.today()
    comp = f"{hoje.year}{hoje.month:02d}"
    data = await previne_service.buscar_indicadores(comp)
    if data.get("indicadores"):
        return data
    return PREVINE_BRASIL
@router.get("/historico")
def historico():       return HISTORICO
@router.get("/indicadores")
def indicadores():     return INDICADORES
