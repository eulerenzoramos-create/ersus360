"""Hemoterapia — Banco de Sangue · Hemocomponentes · Doadores · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/hemoterapia", tags=["hemoterapia"])

@router.get("/dashboard")
async def dashboard():
    return {
        "doacoes_mes": 48,
        "meta_doacoes_mes": 60,
        "doacoes_pct_meta": 80.0,
        "doadores_cadastrados": 284,
        "doadores_ativos": 124,
        "hemocomponentes_estoque": 186,
        "sangue_o_pos_dias": 4,
        "sangue_o_neg_dias": 1,
        "hemacia_total_unidades": 68,
        "plaquetas_total_unidades": 12,
        "plasma_total_unidades": 38,
        "triagem_reprovados_pct": 18.4,
        "transfusoes_mes": 38,
        "reacoes_transfusionais": 1,
        "status_geral": "critico",
    }

@router.get("/estoque")
async def estoque():
    return [
        {"componente": "Concentrado de Hemácias O+",  "tipo_sanguineo": "O+",  "unidades": 22, "dias_estoque": 4,  "validade_media_dias": 35,  "meta_dias": 7, "status": "critico"},
        {"componente": "Concentrado de Hemácias A+",  "tipo_sanguineo": "A+",  "unidades": 18, "dias_estoque": 6,  "validade_media_dias": 35,  "meta_dias": 7, "status": "atencao"},
        {"componente": "Concentrado de Hemácias B+",  "tipo_sanguineo": "B+",  "unidades": 12, "dias_estoque": 8,  "validade_media_dias": 35,  "meta_dias": 7, "status": "ok"},
        {"componente": "Concentrado de Hemácias AB+", "tipo_sanguineo": "AB+", "unidades": 6,  "dias_estoque": 5,  "validade_media_dias": 35,  "meta_dias": 7, "status": "atencao"},
        {"componente": "Concentrado de Hemácias O-",  "tipo_sanguineo": "O-",  "unidades": 2,  "dias_estoque": 1,  "validade_media_dias": 35,  "meta_dias": 5, "status": "critico"},
        {"componente": "Concentrado de Plaquetas",    "tipo_sanguineo": "pool","unidades": 12, "dias_estoque": 3,  "validade_media_dias": 5,   "meta_dias": 5, "status": "atencao"},
        {"componente": "Plasma Fresco Congelado",     "tipo_sanguineo": "pool","unidades": 38, "dias_estoque": 12, "validade_media_dias": 365, "meta_dias": 7, "status": "ok"},
        {"componente": "Crioprecipitado",             "tipo_sanguineo": "pool","unidades": 8,  "dias_estoque": 10, "validade_media_dias": 365, "meta_dias": 7, "status": "ok"},
    ]

@router.get("/triagem-causas")
async def triagem_causas():
    return [
        {"causa": "Hematócrito baixo / anemia",       "reprovados": 28, "pct": 31.8, "reversivel": True},
        {"causa": "Uso de medicamentos",               "reprovados": 18, "pct": 20.5, "reversivel": True},
        {"causa": "Comportamento de risco (IST)",      "reprovados": 14, "pct": 15.9, "reversivel": False},
        {"causa": "Peso abaixo do mínimo (50 kg)",     "reprovados": 10, "pct": 11.4, "reversivel": True},
        {"causa": "Viagem zona endêmica recente",      "reprovados": 8,  "pct": 9.1,  "reversivel": True},
        {"causa": "Tatuagem/piercing recente",         "reprovados": 6,  "pct": 6.8,  "reversivel": True},
        {"causa": "Outras causas definitivas",         "reprovados": 4,  "pct": 4.5,  "reversivel": False},
    ]

@router.get("/doacoes-historico")
async def doacoes_historico():
    return [
        {"mes": "Out/25", "doacoes": 42, "meta": 60, "transfusoes": 34, "descarte_pct": 4.2, "doadores_novos": 8},
        {"mes": "Nov/25", "doacoes": 44, "meta": 60, "transfusoes": 36, "descarte_pct": 3.8, "doadores_novos": 10},
        {"mes": "Dez/25", "doacoes": 38, "meta": 60, "transfusoes": 32, "descarte_pct": 5.2, "doadores_novos": 6},
        {"mes": "Jan/26", "doacoes": 46, "meta": 60, "transfusoes": 36, "descarte_pct": 4.0, "doadores_novos": 9},
        {"mes": "Fev/26", "doacoes": 44, "meta": 60, "transfusoes": 36, "descarte_pct": 3.6, "doadores_novos": 8},
        {"mes": "Mar/26", "doacoes": 48, "meta": 60, "transfusoes": 38, "descarte_pct": 3.4, "doadores_novos": 11},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Estoque O- (sangue universal)",     "valor": 1,    "meta": 5,   "unidade": "dias","status": "critico",  "observacao": "2 unidades — risco para traumas graves e partos de emergência"},
        {"indicador": "Estoque O+ abaixo da meta",         "valor": 4,    "meta": 7,   "unidade": "dias","status": "critico",  "observacao": "22 unidades — tipo mais solicitado (43% das transfusões)"},
        {"indicador": "Captação de doações / meta",        "valor": 80.0, "meta": 100, "unidade": "%",  "status": "atencao",  "observacao": "48/60 — déficit crônico desde Out/25"},
        {"indicador": "Reações transfusionais",            "valor": 1,    "meta": 0,   "unidade": "un", "status": "atencao",  "observacao": "1 reação febril não-hemolítica em Mar/26"},
        {"indicador": "Taxa de reprovação na triagem",     "valor": 18.4, "meta": 15,  "unidade": "%",  "status": "atencao",  "observacao": "Principal causa: anemia (31.8%) — carências nutricionais locais"},
        {"indicador": "Descarte de hemocomponentes",       "valor": 3.4,  "meta": 3,   "unidade": "%",  "status": "ok",       "observacao": "Mar/26 abaixo da média semestral (4.0%)"},
    ]
