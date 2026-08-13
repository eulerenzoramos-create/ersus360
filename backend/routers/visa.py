"""
Router: /api/visa — Vigilância Sanitária Municipal · Alvarás · Fiscalizações — FMS Apuí/AM
Dados de referência municipal. situacao_dado = referencia_municipal.
"""
from __future__ import annotations
from fastapi import APIRouter, Depends
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/visa", tags=["visa"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "2026",
        "total_estabelecimentos": 148,
        "inspecionados_ano": 94,
        "resultado_bom": 61,
        "resultado_regular": 22,
        "resultado_insatisfatorio": 11,
        "licencas_vencidas": 18,
        "autos_abertos": 9,
        "autos_vencidos": 3,
        "proximas_inspecoes": 24,
        "historico": [
            {"mes": "Fev",  "realizadas": 14, "programadas": 16},
            {"mes": "Mar",  "realizadas": 17, "programadas": 18},
            {"mes": "Abr",  "realizadas": 16, "programadas": 18},
            {"mes": "Mai",  "realizadas": 15, "programadas": 16},
            {"mes": "Jun",  "realizadas": 18, "programadas": 18},
            {"mes": "Jul",  "realizadas": 14, "programadas": 16},
        ],
        "fonte": "Referência municipal FMS Apuí/AM",
    }


@router.get("/estabelecimentos")
async def estabelecimentos():
    return [
        {
            "razao": "Farmácia Apuí Saúde",
            "atividade": "Farmácia",
            "risco": "alto",
            "ultima_inspecao": "2026-04-10",
            "proxima_inspecao": "2026-10-10",
            "resultado": "bom",
            "licenca_valida": True,
            "autos": 0,
        },
        {
            "razao": "Restaurante O Ribeirinho",
            "atividade": "Alimentos",
            "risco": "alto",
            "ultima_inspecao": "2026-03-15",
            "proxima_inspecao": "2026-09-15",
            "resultado": "regular",
            "licenca_valida": True,
            "autos": 1,
        },
        {
            "razao": "Salão de Beleza Flor",
            "atividade": "Cosméticos",
            "risco": "medio",
            "ultima_inspecao": "2026-02-20",
            "proxima_inspecao": "2026-08-20",
            "resultado": "bom",
            "licenca_valida": False,
            "autos": 0,
        },
        {
            "razao": "Clínica Odontológica Sorriso",
            "atividade": "Serviço de Saúde",
            "risco": "alto",
            "ultima_inspecao": "2026-05-08",
            "proxima_inspecao": "2026-11-08",
            "resultado": "bom",
            "licenca_valida": True,
            "autos": 0,
        },
        {
            "razao": "Açougue Central",
            "atividade": "Alimentos (carne)",
            "risco": "alto",
            "ultima_inspecao": "2026-06-12",
            "proxima_inspecao": "2026-09-12",
            "resultado": "insatisfatorio",
            "licenca_valida": True,
            "autos": 2,
        },
        {
            "razao": "Posto de Combustível BR",
            "atividade": "Inflamáveis",
            "risco": "alto",
            "ultima_inspecao": "2026-01-18",
            "proxima_inspecao": "2026-07-18",
            "resultado": "regular",
            "licenca_valida": False,
            "autos": 1,
        },
    ]
