"""BLH — Banco de Leite Humano · Coleta · Pasteurização · UTIN · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/blh", tags=["blh"])

@router.get("/dashboard")
async def dashboard():
    return {
        "coleta_ml_mes": 18640,
        "pasteurizado_ml_mes": 16284,
        "distribuido_ml_mes": 15840,
        "doadores_ativas": 22,
        "doadores_cadastradas_total": 68,
        "rn_beneficiados_mes": 34,
        "rn_prematuros_beneficiados": 18,
        "reprovados_pasteurizado_pct": 2.8,
        "meta_reprovados_pct": 3,
        "acidez_dornic_media": 3.4,
        "coleta_domiciliar_pct": 62.4,
        "status_geral": "ok",
    }

@router.get("/coleta")
async def coleta():
    return {
        "por_tipo": [
            {"tipo": "Coleta hospitalar (maternidade)", "volume_ml": 7124,  "doadoras": 8,  "pct": 38.2},
            {"tipo": "Coleta domiciliar",               "volume_ml": 11516, "doadoras": 14, "pct": 61.8},
        ],
        "por_municipio_origem": [
            {"municipio": "Apuí",      "volume_ml": 14280, "doadoras": 18},
            {"municipio": "Matupi",    "volume_ml": 3240,  "doadoras": 3},
            {"municipio": "Itaparana", "volume_ml": 1120,  "doadoras": 1},
        ],
        "doacoes_coleta_mensal": [
            {"semana": "Sem 1", "hospitalar": 1640, "domiciliar": 2284},
            {"semana": "Sem 2", "hospitalar": 1860, "domiciliar": 3120},
            {"semana": "Sem 3", "hospitalar": 1824, "domiciliar": 2948},
            {"semana": "Sem 4", "hospitalar": 1800, "domiciliar": 3164},
        ]
    }

@router.get("/pasteurizacao")
async def pasteurizacao():
    return {
        "lotes_mes": 62,
        "aprovados": 60,
        "reprovados": 2,
        "reprovado_pct": 3.2,
        "acidez_dornic_media": 3.4,
        "crematocrito_pct": 3.8,
        "lotes_detalhe": [
            {"lote": "BLH-2603-001", "volume_ml": 284, "acidez": 3.2, "crematocrito": 3.6, "resultado": "Aprovado"},
            {"lote": "BLH-2603-002", "volume_ml": 268, "acidez": 3.4, "crematocrito": 4.2, "resultado": "Aprovado"},
            {"lote": "BLH-2603-003", "volume_ml": 312, "acidez": 3.8, "crematocrito": 3.8, "resultado": "Aprovado"},
            {"lote": "BLH-2603-004", "volume_ml": 196, "acidez": 5.2, "crematocrito": 2.8, "resultado": "Reprovado", "motivo": "Acidez Dornic > 4°D"},
            {"lote": "BLH-2603-005", "volume_ml": 248, "acidez": 3.6, "crematocrito": 3.4, "resultado": "Aprovado"},
            {"lote": "BLH-2602-058", "volume_ml": 178, "acidez": 4.8, "crematocrito": 3.0, "resultado": "Reprovado", "motivo": "Acidez Dornic > 4°D"},
        ]
    }

@router.get("/historico")
async def historico():
    return [
        {"mes": "Out/25", "coletado": 16240, "pasteurizado": 14280, "distribuido": 13840, "doadoras": 18, "rn_beneficiados": 28},
        {"mes": "Nov/25", "coletado": 17120, "pasteurizado": 15086, "distribuido": 14620, "doadoras": 20, "rn_beneficiados": 30},
        {"mes": "Dez/25", "coletado": 16480, "pasteurizado": 14486, "distribuido": 14024, "doadoras": 19, "rn_beneficiados": 32},
        {"mes": "Jan/26", "coletado": 17840, "pasteurizado": 15640, "distribuido": 15120, "doadoras": 21, "rn_beneficiados": 33},
        {"mes": "Fev/26", "coletado": 18240, "pasteurizado": 16012, "distribuido": 15480, "doadoras": 22, "rn_beneficiados": 34},
        {"mes": "Mar/26", "coletado": 18640, "pasteurizado": 16284, "distribuido": 15840, "doadoras": 22, "rn_beneficiados": 34},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Doadoras ativas",                      "valor": 22,   "meta": 30,  "unidade": "un","status": "atencao", "observacao": "Meta BLH regional: 30 doadoras ativas"},
        {"indicador": "Lotes reprovados na pasteurização",     "valor": 3.2,  "meta": 3,   "unidade": "%", "status": "atencao", "observacao": "2 lotes — Acidez Dornic > 4°D"},
        {"indicador": "RN beneficiados",                      "valor": 34,   "meta": None, "unidade": "un","status": "ok",      "observacao": "18 prematuros < 34 semanas"},
        {"indicador": "Coleta domiciliar",                    "valor": 62.4, "meta": 60,  "unidade": "%", "status": "ok",      "observacao": "Boa adesão à coleta domiciliar"},
        {"indicador": "Volume coletado/mês",                  "valor": 18640,"meta": 20000,"unidade":"mL", "status": "atencao", "observacao": "Crescimento constante — 7% vs mesmo período"},
        {"indicador": "Acidez Dornic média",                  "valor": 3.4,  "meta": 4,   "unidade": "°D","status": "ok",      "observacao": "Dentro do padrão ANVISA RDC 171/2006"},
    ]
