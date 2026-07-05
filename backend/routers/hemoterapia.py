"""Hemoterapia — Banco de Sangue · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/hemoterapia", tags=["hemoterapia"])

@router.get("/dashboard")
async def dashboard():
    return {
        "doacoes_mes": 38,
        "meta_doacoes_mes": 50,
        "doadores_cadastrados": 312,
        "bolsas_coletadas_mes": 38,
        "bolsas_descartadas_mes": 4,
        "descarte_pct": 10.5,
        "autossuficiencia_pct": 72.4,
        "estoque_critico": True,
        "hemocomponentes_criticos": ["Plaquetas", "O-"],
        "campanhas_ativas": 1,
        "triagem_inaptos_pct": 18.3,
        "status_estoque": "critico",
        "tendencia_doacoes": "queda",
    }

@router.get("/estoque")
async def estoque():
    return [
        {"hemocomponente": "Concentrado de Hemácias O+",  "bolsas": 14, "validade_media_dias": 21, "status": "ok",       "estoque_minimo": 8},
        {"hemocomponente": "Concentrado de Hemácias O-",  "bolsas": 2,  "validade_media_dias": 18, "status": "critico",  "estoque_minimo": 4},
        {"hemocomponente": "Concentrado de Hemácias A+",  "bolsas": 8,  "validade_media_dias": 25, "status": "ok",       "estoque_minimo": 5},
        {"hemocomponente": "Concentrado de Hemácias B+",  "bolsas": 3,  "validade_media_dias": 14, "status": "atencao",  "estoque_minimo": 3},
        {"hemocomponente": "Concentrado de Plaquetas",    "bolsas": 2,  "validade_media_dias": 4,  "status": "critico",  "estoque_minimo": 6},
        {"hemocomponente": "Plasma Fresco Congelado",     "bolsas": 10, "validade_media_dias": 180,"status": "ok",       "estoque_minimo": 6},
        {"hemocomponente": "Crioprecipitado",             "bolsas": 5,  "validade_media_dias": 90, "status": "atencao",  "estoque_minimo": 4},
        {"hemocomponente": "Concentrado de Granulócitos", "bolsas": 0,  "validade_media_dias": 0,  "status": "critico",  "estoque_minimo": 2},
    ]

@router.get("/doacoes-historico")
async def doacoes_historico():
    return [
        {"mes": "Out/25", "coletadas": 42, "aptas": 36, "descartadas": 6, "campanhas": 1},
        {"mes": "Nov/25", "coletadas": 45, "aptas": 38, "descartadas": 7, "campanhas": 1},
        {"mes": "Dez/25", "coletadas": 31, "aptas": 26, "descartadas": 5, "campanhas": 0},
        {"mes": "Jan/26", "coletadas": 28, "aptas": 23, "descartadas": 5, "campanhas": 0},
        {"mes": "Fev/26", "coletadas": 35, "aptas": 30, "descartadas": 5, "campanhas": 1},
        {"mes": "Mar/26", "coletadas": 38, "aptas": 34, "descartadas": 4, "campanhas": 1},
    ]

@router.get("/triagem-causas")
async def triagem_causas():
    return [
        {"causa": "Anemia (Hb baixa)",        "inaptos": 12, "pct": 34.3},
        {"causa": "Janela imunológica",        "inaptos": 7,  "pct": 20.0},
        {"causa": "Pressão arterial alterada", "inaptos": 6,  "pct": 17.1},
        {"causa": "Uso recente de medicação",  "inaptos": 5,  "pct": 14.3},
        {"causa": "Viagem área endêmica",      "inaptos": 3,  "pct": 8.6},
        {"causa": "Outros",                    "inaptos": 2,  "pct": 5.7},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Autossuficiência em hemocomponentes", "valor": 72.4, "meta": 100, "unidade": "%",   "status": "critico",  "observacao": "Município depende de Manaus para plaquetas e O-"},
        {"indicador": "Taxa de descarte de bolsas",          "valor": 10.5, "meta": 8,   "unidade": "%",   "status": "atencao",  "observacao": "Acima da meta nacional"},
        {"indicador": "Inaptos na triagem clínica",          "valor": 18.3, "meta": 15,  "unidade": "%",   "status": "atencao",  "observacao": "Anemia principal causa"},
        {"indicador": "Doações/1.000 hab. (ano)",            "valor": 9.8,  "meta": 15,  "unidade": "‰",   "status": "critico",  "observacao": "OMS recomenda ≥15‰"},
        {"indicador": "Bolsas vencidas descartadas",         "valor": 2,    "meta": 0,   "unidade": "un",  "status": "atencao",  "observacao": "Gestão de estoque a melhorar"},
        {"indicador": "Reações transfusionais",              "valor": 1,    "meta": 2,   "unidade": "un",  "status": "ok",       "observacao": "Dentro do limite aceitável"},
    ]
