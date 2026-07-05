"""Acolhimento e Classificação de Risco — Manchester · ABCDE · UPA · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/acolhimento", tags=["acolhimento"])

@router.get("/dashboard")
async def dashboard():
    return {
        "atendimentos_upa_mes": 1284,
        "atendimentos_classificados_pct": 96.4,
        "vermelho_emergencia": 48,
        "laranja_muito_urgente": 124,
        "amarelo_urgente": 386,
        "verde_pouco_urgente": 582,
        "azul_nao_urgente": 144,
        "tempo_espera_verde_min": 42,
        "meta_verde_min": 30,
        "tempo_espera_amarelo_min": 18,
        "meta_amarelo_min": 30,
        "alta_sem_internacao_pct": 78.4,
        "fuga_antes_atend_pct": 4.2,
        "status_geral": "atencao",
    }

@router.get("/fluxo")
async def fluxo():
    return {
        "por_turno": [
            {"turno": "Manhã (06–12h)",     "atendimentos": 384, "vermelho": 16, "laranja": 38, "amarelo": 118, "verde": 172, "azul": 40},
            {"turno": "Tarde (12–18h)",     "atendimentos": 428, "vermelho": 18, "laranja": 46, "amarelo": 138, "verde": 184, "azul": 42},
            {"turno": "Noite (18–00h)",     "atendimentos": 312, "vermelho": 9,  "laranja": 28, "amarelo": 96,  "verde": 142, "azul": 37},
            {"turno": "Madrugada (00–06h)", "atendimentos": 160, "vermelho": 5,  "laranja": 12, "amarelo": 34,  "verde": 84,  "azul": 25},
        ],
        "por_dia_semana": [
            {"dia": "Seg", "atend": 228}, {"dia": "Ter", "atend": 196},
            {"dia": "Qua", "atend": 184}, {"dia": "Qui", "atend": 188},
            {"dia": "Sex", "atend": 204}, {"dia": "Sab", "atend": 148},
            {"dia": "Dom", "atend": 136},
        ]
    }

@router.get("/queixas")
async def queixas():
    return [
        {"queixa": "Dor abdominal",                "casos": 186, "pct": 14.5, "classificacao_modal": "Amarelo"},
        {"queixa": "Febre / síndrome gripal",      "casos": 168, "pct": 13.1, "classificacao_modal": "Verde"},
        {"queixa": "Trauma / queda",               "casos": 124, "pct": 9.7,  "classificacao_modal": "Verde"},
        {"queixa": "Cefaleia",                     "casos": 112, "pct": 8.7,  "classificacao_modal": "Verde"},
        {"queixa": "Dor torácica",                 "casos": 84,  "pct": 6.5,  "classificacao_modal": "Laranja"},
        {"queixa": "Dispneia",                     "casos": 78,  "pct": 6.1,  "classificacao_modal": "Laranja"},
        {"queixa": "Convulsão / rebaixamento",     "casos": 48,  "pct": 3.7,  "classificacao_modal": "Vermelho"},
        {"queixa": "Acidente ofídico / escorpião", "casos": 38,  "pct": 3.0,  "classificacao_modal": "Laranja"},
        {"queixa": "Problema odontológico",        "casos": 96,  "pct": 7.5,  "classificacao_modal": "Azul"},
        {"queixa": "Pré-natal / obstétrico",       "casos": 68,  "pct": 5.3,  "classificacao_modal": "Amarelo"},
        {"queixa": "Outros",                       "casos": 282, "pct": 22.0, "classificacao_modal": "Verde"},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Out/25", "atendimentos": 1124, "tempo_verde": 48, "tempo_amarelo": 22, "fuga_pct": 5.2, "alta_pct": 76.4},
        {"mes": "Nov/25", "atendimentos": 1168, "tempo_verde": 46, "tempo_amarelo": 20, "fuga_pct": 4.8, "alta_pct": 77.2},
        {"mes": "Dez/25", "atendimentos": 1284, "tempo_verde": 52, "tempo_amarelo": 24, "fuga_pct": 5.6, "alta_pct": 74.8},
        {"mes": "Jan/26", "atendimentos": 1248, "tempo_verde": 44, "tempo_amarelo": 19, "fuga_pct": 4.6, "alta_pct": 77.8},
        {"mes": "Fev/26", "atendimentos": 1268, "tempo_verde": 43, "tempo_amarelo": 18, "fuga_pct": 4.4, "alta_pct": 78.2},
        {"mes": "Mar/26", "atendimentos": 1284, "tempo_verde": 42, "tempo_amarelo": 18, "fuga_pct": 4.2, "alta_pct": 78.4},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Tempo de espera — Verde (P3)",    "valor": 42, "meta": 30, "unidade": "min","status": "critico", "observacao": "Acima do padrão Manchester: ≤30 min"},
        {"indicador": "Tempo de espera — Amarelo (P2)",  "valor": 18, "meta": 30, "unidade": "min","status": "ok",      "observacao": "Dentro do padrão Manchester: ≤30 min"},
        {"indicador": "Fuga antes do atendimento",       "valor": 4.2,"meta": 3,  "unidade": "%",  "status": "atencao", "observacao": "Principalmente verdes/azuis com longa espera"},
        {"indicador": "Alta sem internação",             "valor": 78.4,"meta": 80, "unidade": "%",  "status": "atencao", "observacao": "Resolutividade abaixo da meta — avaliar fluxos"},
        {"indicador": "Classificação de risco realizada","valor": 96.4,"meta": 100,"unidade": "%",  "status": "ok",      "observacao": "Meta: 100% dos pacientes classificados"},
        {"indicador": "P1 (Vermelho) — tempo de espera","valor": 0,   "meta": 0,  "unidade": "min","status": "ok",      "observacao": "Atendimento imediato — sem espera registrada"},
    ]
