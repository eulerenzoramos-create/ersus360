"""
ERSUS 360 — Business Intelligence Router
Score ERSUS, painéis executivo/APS/financeiro/epidemiológico
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from routers.auth import get_current_user

router = APIRouter(prefix="/api/bi", tags=["Business Intelligence"])

# ── Score ERSUS 360 ───────────────────────────────────────────────────────────

@router.get("/score")
async def score_ersus(_=Depends(get_current_user)):
    return {
        "score_total": 72.4,
        "classificacao": "Gestão em desenvolvimento",
        "cor": "amarelo",
        "dimensoes": {
            "atencao_primaria": {"peso": 35, "score": 78.0, "contribuicao": 27.3},
            "financeiro":       {"peso": 25, "score": 68.5, "contribuicao": 17.1},
            "epidemiologia":    {"peso": 20, "score": 71.0, "contribuicao": 14.2},
            "gestao":           {"peso": 10, "score": 82.0, "contribuicao": 8.2},
            "infraestrutura":   {"peso": 10, "score": 56.0, "contribuicao": 5.6},
        },
        "competencia": "2026-06",
        "ultima_atualizacao": "2026-07-01T01:00:00",
        "fonte": "referencia",
    }


# ── Painel Executivo ──────────────────────────────────────────────────────────

@router.get("/painel-executivo")
async def painel_executivo(_=Depends(get_current_user)):
    return {
        "score_ersus": 72.4,
        "previne_media_pct": 76.8,
        "cobertura_esf_pct": 68.5,
        "execucao_pab_pct": 81.2,
        "familias_cadastradas": 3847,
        "alertas_criticos": 3,
        "obras_andamento": 2,
        "headcount_total": 187,
        "previne_indicadores": [
            {"indicador": "Ind.1 Pré-natal", "resultado": 82.0, "meta": 60.0, "status": "verde"},
            {"indicador": "Ind.2 Citopatológico", "resultado": 71.0, "meta": 60.0, "status": "verde"},
            {"indicador": "Ind.3 Vacinas", "resultado": 91.0, "meta": 90.0, "status": "verde"},
            {"indicador": "Ind.4 Pré-natal 1ª sem", "resultado": 63.0, "meta": 60.0, "status": "verde"},
            {"indicador": "Ind.5 Hipertensão", "resultado": 58.0, "meta": 60.0, "status": "amarelo"},
            {"indicador": "Ind.6 Diabetes", "resultado": 55.0, "meta": 60.0, "status": "amarelo"},
            {"indicador": "Ind.7 Des. Infantil", "resultado": 78.0, "meta": 60.0, "status": "verde"},
        ],
        "fonte": "referencia",
    }


# ── Painel APS ────────────────────────────────────────────────────────────────

@router.get("/painel-aps")
async def painel_aps(_=Depends(get_current_user)):
    return {
        "equipes": [
            {"nome": "ESF 01 — Centro", "consultas_mes": 412, "meta_mes": 480, "pct": 85.8},
            {"nome": "ESF 02 — Vila Nova", "consultas_mes": 389, "meta_mes": 480, "pct": 81.0},
            {"nome": "ESF 03 — Bela Vista", "consultas_mes": 356, "meta_mes": 480, "pct": 74.2},
            {"nome": "ESB 01 — Centro", "consultas_mes": 198, "meta_mes": 240, "pct": 82.5},
        ],
        "acs_visitas": [
            {"nome": "Maria Silva", "microarea": "01", "realizadas": 45, "meta": 50, "pct": 90.0},
            {"nome": "João Santos", "microarea": "02", "realizadas": 38, "meta": 50, "pct": 76.0},
            {"nome": "Ana Lima", "microarea": "03", "realizadas": 49, "meta": 50, "pct": 98.0},
        ],
        "inconsistencias": [
            {"tipo": "Sem responsável", "qtd": 47},
            {"tipo": "CNS inválido", "qtd": 23},
            {"tipo": "Cadastro duplicado", "qtd": 12},
        ],
        "fonte": "referencia",
    }


# ── Painel Financeiro ─────────────────────────────────────────────────────────

@router.get("/painel-financeiro")
async def painel_financeiro(_=Depends(get_current_user)):
    return {
        "blocos": [
            {"nome": "PAB Fixo", "empenhado": 100800, "liquidado": 95200, "pct": 94.4},
            {"nome": "ESF", "empenhado": 30666, "liquidado": 28900, "pct": 94.2},
            {"nome": "ACS", "empenhado": 26400, "liquidado": 24800, "pct": 93.9},
            {"nome": "MAC", "empenhado": 180000, "liquidado": 118000, "pct": 65.6},
            {"nome": "Vigilância", "empenhado": 82000, "liquidado": 64000, "pct": 78.0},
            {"nome": "Farmácia", "empenhado": 48000, "liquidado": 38500, "pct": 80.2},
        ],
        "minimo_constitucional_pct": 18.4,
        "meta_constitucional_pct": 15.0,
        "status_minimo": "atingido",
        "convenios_vigentes": 4,
        "convenios_vencendo_30d": 1,
        "fonte": "referencia",
    }


# ── Painel Epidemiológico ─────────────────────────────────────────────────────

@router.get("/painel-epidemiologico")
async def painel_epidemiologico(_=Depends(get_current_user)):
    return {
        "coberturas_vacinais": [
            {"vacina": "BCG", "cobertura": 92.0, "meta": 95.0, "status": "amarelo"},
            {"vacina": "Pentavalente", "cobertura": 89.0, "meta": 95.0, "status": "amarelo"},
            {"vacina": "Pneumo 10V", "cobertura": 85.0, "meta": 95.0, "status": "amarelo"},
            {"vacina": "Rotavírus", "cobertura": 88.0, "meta": 95.0, "status": "amarelo"},
            {"vacina": "Poliomielite", "cobertura": 91.0, "meta": 95.0, "status": "amarelo"},
            {"vacina": "Febre Amarela", "cobertura": 94.0, "meta": 95.0, "status": "amarelo"},
            {"vacina": "Tríplice Viral", "cobertura": 96.0, "meta": 95.0, "status": "verde"},
        ],
        "malaria_ipa": 12.3,
        "malaria_status": "alerta",
        "dengue_casos_mes": 8,
        "mortalidade_infantil": 11.2,
        "semanas_epi_historico": [
            {"semana": "SE 20/2026", "malaria": 18, "dengue": 3},
            {"semana": "SE 21/2026", "malaria": 22, "dengue": 5},
            {"semana": "SE 22/2026", "malaria": 15, "dengue": 4},
            {"semana": "SE 23/2026", "malaria": 19, "dengue": 8},
            {"semana": "SE 24/2026", "malaria": 24, "dengue": 6},
        ],
        "fonte": "referencia",
    }


# ── Histórico ─────────────────────────────────────────────────────────────────

@router.get("/historico/{modulo}")
async def historico(modulo: str, _=Depends(get_current_user)):
    series = {
        "score": [
            {"competencia": "2026-01", "valor": 61.2},
            {"competencia": "2026-02", "valor": 64.8},
            {"competencia": "2026-03", "valor": 67.5},
            {"competencia": "2026-04", "valor": 70.1},
            {"competencia": "2026-05", "valor": 71.8},
            {"competencia": "2026-06", "valor": 72.4},
        ],
        "previne": [
            {"competencia": "2026-01", "valor": 70.2},
            {"competencia": "2026-02", "valor": 72.1},
            {"competencia": "2026-03", "valor": 74.8},
            {"competencia": "2026-04", "valor": 75.3},
            {"competencia": "2026-05", "valor": 76.0},
            {"competencia": "2026-06", "valor": 76.8},
        ],
    }
    return {
        "modulo": modulo,
        "serie": series.get(modulo, [{"competencia": "2026-06", "valor": 70.0}]),
        "fonte": "referencia",
    }
