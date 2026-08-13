"""
Router: /api/farmacia-basica — ERSUS 360
Dados de referência municipal — Apuí/AM (pop. ~20 mil).
situacao_dado = referencia_municipal
"""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(prefix="/api/farmacia-basica", tags=["Assistência Farmacêutica"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "Jan–Jun 2026",
        "dispensacoes_mes": 3840,
        "itens_em_falta": 4,
        "receitas_atendidas_pct": 91.2,
        "custo_basico_mes_r": 48600,
        "medicamentos_basicos_monitorados": 112,
        "componente_especializado_pacientes": 38,
        "componente_especializado_custo_r": 22400,
        "vencimento_proximo_30d": 7,
        "nota": "Referência baseada em parâmetros típicos para municípios amazônicos de ~20 mil habitantes.",
    }


@router.get("/estoque")
async def estoque():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "itens": [
            {"item": "Amoxicilina 500mg", "estoque_unidades": 1200, "cobertura_dias": 18, "status": "critico"},
            {"item": "Salbutamol spray", "estoque_unidades": 90,   "cobertura_dias": 8,  "status": "critico"},
            {"item": "Sulfato Ferroso 40mg", "estoque_unidades": 600, "cobertura_dias": 14, "status": "critico"},
            {"item": "Azitromicina 500mg", "estoque_unidades": 480,  "cobertura_dias": 12, "status": "critico"},
            {"item": "Metformina 850mg",  "estoque_unidades": 4800,  "cobertura_dias": 52, "status": "ok"},
            {"item": "Enalapril 10mg",    "estoque_unidades": 5400,  "cobertura_dias": 58, "status": "ok"},
            {"item": "AAS 100mg",         "estoque_unidades": 6200,  "cobertura_dias": 65, "status": "ok"},
            {"item": "Omeprazol 20mg",    "estoque_unidades": 3600,  "cobertura_dias": 41, "status": "atencao"},
            {"item": "Dipirona 500mg",    "estoque_unidades": 7800,  "cobertura_dias": 72, "status": "ok"},
            {"item": "Clonazepam 2mg",    "estoque_unidades": 420,   "cobertura_dias": 28, "status": "atencao"},
        ],
        "nota": "Referência municipal Apuí/AM.",
    }


@router.get("/dispensacao")
async def dispensacao():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "total_dispensacoes_mes": 3840,
        "por_categoria": [
            {"categoria": "Cardiovascular", "dispensacoes": 980, "pct": 25.5},
            {"categoria": "Antimicrobianos", "dispensacoes": 680, "pct": 17.7},
            {"categoria": "DCNT/Diabetes",  "dispensacoes": 720, "pct": 18.8},
            {"categoria": "Saúde Mental",   "dispensacoes": 340, "pct": 8.9},
            {"categoria": "Respiratório",   "dispensacoes": 420, "pct": 10.9},
            {"categoria": "Outros",         "dispensacoes": 700, "pct": 18.2},
        ],
        "receitas_sem_atendimento": 339,
        "motivo_principal_falta": "Ruptura de estoque — Salbutamol e Amoxicilina",
        "nota": "Referência municipal Apuí/AM.",
    }


@router.get("/programas")
async def programas():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "programas": [
            {
                "programa": "Farmácia Popular (Aqui Tem)",
                "pacientes": 312,
                "status": "ativo",
                "observacao": "Insulina e anti-hipertensivos gratuitos.",
            },
            {
                "programa": "REMUME — Relação Municipal",
                "itens": 112,
                "cobertura_pct": 91.2,
                "status": "atencao",
                "observacao": "4 itens em ruptura no momento.",
            },
            {
                "programa": "Componente Especializado (CEAF)",
                "pacientes": 38,
                "custo_mensal_r": 22400,
                "status": "ativo",
                "observacao": "Dispensação estadual — DENAFAR Manaus. Logística 2×/mês.",
            },
            {
                "programa": "Fitoterapia / PNPMF",
                "pacientes": 120,
                "status": "ativo",
                "observacao": "Xarope de Guaco, Hortelã e Aroeira disponíveis na UBS.",
            },
        ],
        "nota": "Referência municipal Apuí/AM.",
    }
