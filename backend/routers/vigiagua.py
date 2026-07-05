"""VIGIÁGUA — Vigilância da Qualidade da Água · SISÁGUA · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/vigiagua", tags=["vigiagua"])

@router.get("/dashboard")
async def dashboard():
    return {
        "amostras_mes": 124,
        "amostras_conformes_pct": 87.9,
        "meta_conformidade_pct": 95,
        "amostras_nao_conformes": 15,
        "pontos_monitorados": 48,
        "sistemas_monitorados": 6,
        "populacao_abastecida": 21840,
        "cobertura_abastecimento_pct": 72.4,
        "alertas_ativos": 3,
        "parametros_criticos": 2,
        "status_geral": "atencao",
    }

@router.get("/sistemas")
async def sistemas():
    return [
        {"sistema": "SAA Apuí (Sabesp)",         "tipo": "SAA",  "populacao": 14280, "amostras_mes": 48, "conformidade_pct": 94.2, "cloro_residual": 0.48, "turbidez_ntu": 0.8, "parametro_critico": None,          "status": "ok"},
        {"sistema": "SAA Matupi (CAEMA)",         "tipo": "SAA",  "populacao": 3840,  "amostras_mes": 24, "conformidade_pct": 82.6, "cloro_residual": 0.28, "turbidez_ntu": 2.4, "parametro_critico": "Turbidez alta","status": "atencao"},
        {"sistema": "SAC Bela Vista",             "tipo": "SAC",  "populacao": 1240,  "amostras_mes": 12, "conformidade_pct": 75.0, "cloro_residual": 0.18, "turbidez_ntu": 3.8, "parametro_critico": "Cloro baixo + Turbidez","status": "critico"},
        {"sistema": "SAC Itaparana",              "tipo": "SAC",  "populacao": 840,   "amostras_mes": 8,  "conformidade_pct": 88.4, "cloro_residual": 0.38, "turbidez_ntu": 1.2, "parametro_critico": None,          "status": "ok"},
        {"sistema": "SAC Vila dos Caboclos",      "tipo": "SAC",  "populacao": 480,   "amostras_mes": 6,  "conformidade_pct": 66.7, "cloro_residual": 0.12, "turbidez_ntu": 4.8, "parametro_critico": "Cloro muito baixo","status": "critico"},
        {"sistema": "Soluções individuais (poços)","tipo": "SI",  "populacao": 1160,  "amostras_mes": 26, "conformidade_pct": 61.5, "cloro_residual": 0.0,  "turbidez_ntu": 6.2, "parametro_critico": "E.coli positivo","status": "critico"},
    ]

@router.get("/parametros")
async def parametros():
    return [
        {"parametro": "Cloro residual livre",  "vmp": "0,2–2,0 mg/L",  "conformes": 108, "nao_conformes": 16, "nao_conforme_pct": 12.9, "tendencia": "piora",   "status": "critico"},
        {"parametro": "Turbidez",              "vmp": "≤ 5,0 NTU",      "conformes": 116, "nao_conformes": 8,  "nao_conforme_pct": 6.5,  "tendencia": "estavel", "status": "atencao"},
        {"parametro": "pH",                    "vmp": "6,0–9,5",         "conformes": 122, "nao_conformes": 2,  "nao_conforme_pct": 1.6,  "tendencia": "melhora", "status": "ok"},
        {"parametro": "Coliformes totais",     "vmp": "Ausência",        "conformes": 118, "nao_conformes": 6,  "nao_conforme_pct": 4.8,  "tendencia": "estavel", "status": "atencao"},
        {"parametro": "E. coli",               "vmp": "Ausência",        "conformes": 120, "nao_conformes": 4,  "nao_conforme_pct": 3.2,  "tendencia": "piora",   "status": "atencao"},
        {"parametro": "Flúor",                 "vmp": "0,6–0,9 mg/L",   "conformes": 124, "nao_conformes": 0,  "nao_conforme_pct": 0.0,  "tendencia": "estavel", "status": "ok"},
        {"parametro": "Cor aparente",          "vmp": "≤ 15 uH",         "conformes": 122, "nao_conformes": 2,  "nao_conforme_pct": 1.6,  "tendencia": "estavel", "status": "ok"},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Out/25", "amostras": 108, "conformidade_pct": 91.2, "nao_conformes": 9,  "alertas": 1},
        {"mes": "Nov/25", "amostras": 116, "conformidade_pct": 89.8, "nao_conformes": 11, "alertas": 2},
        {"mes": "Dez/25", "amostras": 98,  "conformidade_pct": 88.6, "nao_conformes": 11, "alertas": 2},
        {"mes": "Jan/26", "amostras": 112, "conformidade_pct": 90.2, "nao_conformes": 11, "alertas": 2},
        {"mes": "Fev/26", "amostras": 118, "conformidade_pct": 88.4, "nao_conformes": 14, "alertas": 3},
        {"mes": "Mar/26", "amostras": 124, "conformidade_pct": 87.9, "nao_conformes": 15, "alertas": 3},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Conformidade geral das amostras",       "valor": 87.9, "meta": 95,  "unidade": "%", "status": "critico", "observacao": "Trend de queda — cloração insuficiente em SACs rurais"},
        {"indicador": "Cobertura de abastecimento tratado",    "valor": 72.4, "meta": 90,  "unidade": "%", "status": "critico", "observacao": "27.6% da população sem acesso a água tratada"},
        {"indicador": "Sistemas com E. coli positivo",         "valor": 2,    "meta": 0,   "unidade": "un","status": "critico", "observacao": "SAC Vila Caboclos + poços individuais"},
        {"indicador": "Amostras com cloro residual baixo",     "valor": 12.9, "meta": 5,   "unidade": "%", "status": "critico", "observacao": "Portaria GM/MS 888/2021: VMP 0,2 mg/L"},
        {"indicador": "Turbidez fora do padrão",               "valor": 6.5,  "meta": 5,   "unidade": "%", "status": "atencao", "observacao": "SAC Matupi + SAC Bela Vista"},
        {"indicador": "Alertas ativos no SISÁGUA",             "valor": 3,    "meta": 0,   "unidade": "un","status": "atencao", "observacao": "Notificado à SEMSA-AM"},
    ]
