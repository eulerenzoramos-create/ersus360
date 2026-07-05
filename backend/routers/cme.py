"""CME — Central de Material e Esterilização · Ciclos · Biológicos · Rastreabilidade · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/cme", tags=["cme"])

@router.get("/dashboard")
async def dashboard():
    return {
        "ciclos_mes": 284,
        "ciclos_criticos": 186,
        "ciclos_semicriticos": 98,
        "falhas_biologico_mes": 2,
        "falhas_quimico_mes": 4,
        "conformidade_geral_pct": 96.8,
        "meta_conformidade_pct": 98,
        "instrumentais_rastreados": 1284,
        "lotes_reprovados_mes": 2,
        "tempo_medio_ciclo_min": 48,
        "indicadores_biologicos_positivos": 2,
        "status_geral": "atencao",
    }

@router.get("/ciclos")
async def ciclos():
    return [
        {"equipamento": "Autoclave Gravitacional 1",   "ciclos_mes": 98,  "falhas": 1, "conformidade_pct": 99.0, "ultimo_bio": "Negativo", "calibracao": "OK",    "status": "ok"},
        {"equipamento": "Autoclave Pré-Vácuo 2",       "ciclos_mes": 88,  "falhas": 0, "conformidade_pct": 100,  "ultimo_bio": "Negativo", "calibracao": "OK",    "status": "ok"},
        {"equipamento": "Estufa Pasteur 1",             "ciclos_mes": 46,  "falhas": 2, "conformidade_pct": 95.7, "ultimo_bio": "Positivo", "calibracao": "Venc.", "status": "critico"},
        {"equipamento": "Plasma de Peróxido H₂O₂",     "ciclos_mes": 28,  "falhas": 1, "conformidade_pct": 96.4, "ultimo_bio": "Negativo", "calibracao": "OK",    "status": "atencao"},
        {"equipamento": "Termodesinfectora",            "ciclos_mes": 24,  "falhas": 0, "conformidade_pct": 100,  "ultimo_bio": "N/A",     "calibracao": "OK",    "status": "ok"},
    ]

@router.get("/rastreabilidade")
async def rastreabilidade():
    return [
        {"lote": "CME-2603-001", "tipo": "Caixa cirúrgica básica",         "ciclos": 3,  "validade": "26/03/26", "destino": "Centro Cirúrgico", "status": "ok"},
        {"lote": "CME-2603-002", "tipo": "Kit curativo",                    "ciclos": 1,  "validade": "26/03/26", "destino": "UPA 24h",          "status": "ok"},
        {"lote": "CME-2603-003", "tipo": "Material endoscopia",             "ciclos": 2,  "validade": "25/03/26", "destino": "Ambulatório",      "status": "ok"},
        {"lote": "CME-2602-028", "tipo": "Instrumental laparoscópico",      "ciclos": 1,  "validade": "REPROVADO","destino": "Quarentena",       "status": "critico"},
        {"lote": "CME-2603-004", "tipo": "Caixa ginecologia",               "ciclos": 2,  "validade": "27/03/26", "destino": "Maternidade",      "status": "ok"},
        {"lote": "CME-2603-005", "tipo": "Material odontologia",            "ciclos": 1,  "validade": "26/03/26", "destino": "CEO",              "status": "ok"},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Out/25", "ciclos": 248, "falhas": 6, "conformidade_pct": 97.6},
        {"mes": "Nov/25", "ciclos": 256, "falhas": 5, "conformidade_pct": 98.0},
        {"mes": "Dez/25", "ciclos": 232, "falhas": 8, "conformidade_pct": 96.6},
        {"mes": "Jan/26", "ciclos": 262, "falhas": 7, "conformidade_pct": 97.3},
        {"mes": "Fev/26", "ciclos": 274, "falhas": 5, "conformidade_pct": 98.2},
        {"mes": "Mar/26", "ciclos": 284, "falhas": 6, "conformidade_pct": 97.9},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Conformidade geral de ciclos",              "valor": 96.8, "meta": 98,  "unidade": "%", "status": "atencao", "observacao": "Estufa Pasteur 1 com indicador biológico positivo"},
        {"indicador": "Indicadores biológicos positivos",          "valor": 2,    "meta": 0,   "unidade": "un","status": "critico", "observacao": "Estufa 1 — calibração vencida"},
        {"indicador": "Lotes reprovados",                          "valor": 2,    "meta": 0,   "unidade": "un","status": "atencao", "observacao": "1 lote em quarentena — instrumentos laparoscópicos"},
        {"indicador": "Tempo médio de ciclo (autoclave)",          "valor": 48,   "meta": 60,  "unidade": "min","status":"ok",       "observacao": "Dentro do padrão ABNT"},
        {"indicador": "Rastreabilidade de instrumentais",          "valor": 100,  "meta": 100, "unidade": "%", "status": "ok",      "observacao": "100% com código de barras"},
        {"indicador": "Calibração de equipamentos em dia",         "valor": 80,   "meta": 100, "unidade": "%", "status": "atencao", "observacao": "Estufa Pasteur 1 — calibração vencida há 12d"},
    ]
