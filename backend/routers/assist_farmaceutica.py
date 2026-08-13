"""
Router: /api/assist-farmaceutica — ERSUS 360
Dados de referência municipal — Apuí/AM (pop. ~20 mil).
situacao_dado = referencia_municipal
"""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(prefix="/api/assist-farmaceutica", tags=["assist_farmaceutica"])


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


@router.get("/medicamentos-basicos")
async def medicamentos_basicos():
    return [
        {"situacao_dado": "referencia_municipal", "medicamento": "Amoxicilina 500mg cap",   "estoque_dias": 18, "demanda_mensal": 1980, "dispensado_mes": 1800, "ruptura_historica": True,  "status": "critico"},
        {"situacao_dado": "referencia_municipal", "medicamento": "Salbutamol spray 100mcg", "estoque_dias": 8,  "demanda_mensal": 340,  "dispensado_mes": 270,  "ruptura_historica": True,  "status": "critico"},
        {"situacao_dado": "referencia_municipal", "medicamento": "Sulfato Ferroso 40mg",    "estoque_dias": 14, "demanda_mensal": 1280, "dispensado_mes": 920,  "ruptura_historica": True,  "status": "critico"},
        {"situacao_dado": "referencia_municipal", "medicamento": "Azitromicina 500mg",      "estoque_dias": 12, "demanda_mensal": 1200, "dispensado_mes": 960,  "ruptura_historica": True,  "status": "critico"},
        {"situacao_dado": "referencia_municipal", "medicamento": "Metformina 850mg",        "estoque_dias": 52, "demanda_mensal": 2760, "dispensado_mes": 2760, "ruptura_historica": False, "status": "ok"},
        {"situacao_dado": "referencia_municipal", "medicamento": "Enalapril 10mg",          "estoque_dias": 58, "demanda_mensal": 2800, "dispensado_mes": 2800, "ruptura_historica": False, "status": "ok"},
        {"situacao_dado": "referencia_municipal", "medicamento": "AAS 100mg",               "estoque_dias": 65, "demanda_mensal": 3000, "dispensado_mes": 3000, "ruptura_historica": False, "status": "ok"},
        {"situacao_dado": "referencia_municipal", "medicamento": "Omeprazol 20mg",          "estoque_dias": 41, "demanda_mensal": 2640, "dispensado_mes": 2640, "ruptura_historica": False, "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "medicamento": "Dipirona 500mg comp",     "estoque_dias": 72, "demanda_mensal": 3240, "dispensado_mes": 3240, "ruptura_historica": False, "status": "ok"},
        {"situacao_dado": "referencia_municipal", "medicamento": "Clonazepam 2mg",          "estoque_dias": 28, "demanda_mensal": 450,  "dispensado_mes": 420,  "ruptura_historica": False, "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "medicamento": "Prednisona 20mg",         "estoque_dias": 35, "demanda_mensal": 600,  "dispensado_mes": 580,  "ruptura_historica": False, "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "medicamento": "Vitamina A (cáps. 100UI)", "estoque_dias": 22, "demanda_mensal": 820, "dispensado_mes": 640,  "ruptura_historica": True,  "status": "critico"},
    ]


@router.get("/componente-especializado")
async def componente_especializado():
    return [
        {"situacao_dado": "referencia_municipal", "medicamento": "Adalimumabe (Humira)", "pacientes": 3,  "custo_mensal_r": 4800,  "ruptura_mes": 0, "fornecimento_estadual": True,  "status": "ok"},
        {"situacao_dado": "referencia_municipal", "medicamento": "Insulina Glargina U100", "pacientes": 12, "custo_mensal_r": 3600, "ruptura_mes": 1, "fornecimento_estadual": True,  "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "medicamento": "Levotiroxina 100mcg",  "pacientes": 8,  "custo_mensal_r": 480,   "ruptura_mes": 0, "fornecimento_estadual": True,  "status": "ok"},
        {"situacao_dado": "referencia_municipal", "medicamento": "Clozapina 100mg",      "pacientes": 4,  "custo_mensal_r": 1440,  "ruptura_mes": 2, "fornecimento_estadual": True,  "status": "critico"},
        {"situacao_dado": "referencia_municipal", "medicamento": "Metotrexato 2,5mg",    "pacientes": 5,  "custo_mensal_r": 720,   "ruptura_mes": 0, "fornecimento_estadual": True,  "status": "ok"},
        {"situacao_dado": "referencia_municipal", "medicamento": "Tacrolimus 1mg",       "pacientes": 2,  "custo_mensal_r": 3200,  "ruptura_mes": 0, "fornecimento_estadual": True,  "status": "ok"},
        {"situacao_dado": "referencia_municipal", "medicamento": "Rivastigmina 4,5mg",   "pacientes": 4,  "custo_mensal_r": 960,   "ruptura_mes": 1, "fornecimento_estadual": True,  "status": "atencao"},
    ]


@router.get("/historico")
async def historico():
    return [
        {"situacao_dado": "referencia_municipal", "mes": "Jan/26", "dispensacoes": 3620, "itens_em_falta": 6, "receitas_atendidas_pct": 88.4},
        {"situacao_dado": "referencia_municipal", "mes": "Fev/26", "dispensacoes": 3710, "itens_em_falta": 5, "receitas_atendidas_pct": 89.2},
        {"situacao_dado": "referencia_municipal", "mes": "Mar/26", "dispensacoes": 3780, "itens_em_falta": 4, "receitas_atendidas_pct": 90.1},
        {"situacao_dado": "referencia_municipal", "mes": "Abr/26", "dispensacoes": 3820, "itens_em_falta": 5, "receitas_atendidas_pct": 89.8},
        {"situacao_dado": "referencia_municipal", "mes": "Mai/26", "dispensacoes": 3850, "itens_em_falta": 4, "receitas_atendidas_pct": 91.0},
        {"situacao_dado": "referencia_municipal", "mes": "Jun/26", "dispensacoes": 3840, "itens_em_falta": 4, "receitas_atendidas_pct": 91.2},
    ]


@router.get("/indicadores")
async def indicadores():
    return [
        {"situacao_dado": "referencia_municipal", "indicador": "Cobertura REMUME (%)",               "valor": 91.2, "meta": 100, "unidade": "%",     "status": "atencao", "observacao": "4 itens em ruptura — Amoxicilina, Salbutamol, Sulfato Ferroso, Azitromicina."},
        {"situacao_dado": "referencia_municipal", "indicador": "Receitas Atendidas (%)",              "valor": 91.2, "meta": 95,  "unidade": "%",     "status": "atencao", "observacao": "339 receitas/mês sem atendimento completo."},
        {"situacao_dado": "referencia_municipal", "indicador": "Itens em Ruptura",                    "valor": 4,    "meta": 0,   "unidade": "itens", "status": "critico", "observacao": "Salbutamol: 8 dias — CRÍTICO para asmáticos."},
        {"situacao_dado": "referencia_municipal", "indicador": "Lotes a Vencer ≤30 dias",             "valor": 7,    "meta": 0,   "unidade": "lotes", "status": "atencao", "observacao": "Redistribuição ou devolução para FESA até 30/07."},
        {"situacao_dado": "referencia_municipal", "indicador": "Pacientes Comp. Especializado (CEAF)","valor": 38,   "meta": None,"unidade": "pac.",  "status": "ok",      "observacao": "Dispensação via DENAFAR Manaus, 2×/mês. Logística aérea."},
        {"situacao_dado": "referencia_municipal", "indicador": "Custo CEAF/Mês (R$)",                 "valor": 22400,"meta": None,"unidade": "R$",   "status": "ok",      "observacao": "Financiamento estadual — MS repassa ao SCTIE/AM."},
    ]
