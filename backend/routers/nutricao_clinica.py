"""Nutrição Clínica — EMTN · Terapia Nutricional · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/nutricao-clinica", tags=["nutricao_clinica"])

@router.get("/dashboard")
async def dashboard():
    return {
        "pacientes_internados": 28,
        "triados_nrs2002": 26,
        "triagem_cobertura_pct": 92.9,
        "risco_nutricional": 11,
        "risco_nutricional_pct": 42.3,
        "em_terapia_nutricional": 8,
        "terapia_enteral": 5,
        "terapia_parenteral": 3,
        "desnutridos_admissao_pct": 38.5,
        "complicacoes_tn_mes": 2,
        "status_geral": "atencao",
        "emtn_ativa": True,
        "avaliacao_nutricional_48h_pct": 84.6,
    }

@router.get("/pacientes")
async def pacientes():
    return [
        {"id": "NUT-001", "setor": "Clínica Médica",  "diagnostico": "Sepse abdominal",      "triagem": "NRS≥3", "tipo_tn": "Enteral",    "formula": "Peptamen 1.5 — 1400 kcal/d", "dias_tn": 8,  "complicacao": None,                         "status": "ok"},
        {"id": "NUT-002", "setor": "UTI",              "diagnostico": "TCE moderado",         "triagem": "NRS≥5", "tipo_tn": "Enteral",    "formula": "Diason HP 1.5 — 1600 kcal/d","dias_tn": 12, "complicacao": "Diarreia osmótica",          "status": "atencao"},
        {"id": "NUT-003", "setor": "Cirúrgico",        "diagnostico": "Ca cólon pós-op",      "triagem": "NRS≥4", "tipo_tn": "Parenteral", "formula": "Aminomix 2 — 1800 kcal/d",   "dias_tn": 5,  "complicacao": None,                         "status": "ok"},
        {"id": "NUT-004", "setor": "Clínica Médica",  "diagnostico": "Insuf. cardíaca",       "triagem": "NRS≥3", "tipo_tn": "Oral+supl.", "formula": "Ensure Plus — 400 kcal extra","dias_tn": 3,  "complicacao": None,                         "status": "ok"},
        {"id": "NUT-005", "setor": "UTI",              "diagnostico": "Pancreatite grave",    "triagem": "NRS≥5", "tipo_tn": "Enteral",    "formula": "Peptamen AF 1.2 — 1600 kcal/d","dias_tn":6, "complicacao": "Distensão abdominal",        "status": "atencao"},
        {"id": "NUT-006", "setor": "Pediátrico",       "diagnostico": "Desnutrição grave",    "triagem": "STRONGkids≥3","tipo_tn": "Enteral","formula":"Infatrini 1.0 — 900 kcal/d","dias_tn": 14, "complicacao": None,                         "status": "ok"},
        {"id": "NUT-007", "setor": "Cirúrgico",        "diagnostico": "Fístula enterocutânea","triagem": "NRS≥5", "tipo_tn": "Parenteral", "formula": "Clinimix N9G20E — 2000 kcal", "dias_tn": 18, "complicacao": "Hiperglicemia (>180 mg/dL)", "status": "critico"},
        {"id": "NUT-008", "setor": "Clínica Médica",  "diagnostico": "IRC terminal",          "triagem": "NRS≥4", "tipo_tn": "Enteral",    "formula": "Rena Pro — 1800 kcal/d",     "dias_tn": 7,  "complicacao": None,                         "status": "ok"},
    ]

@router.get("/triagem-setores")
async def triagem():
    return [
        {"setor": "UTI",            "internados": 6,  "triados": 6,  "risco": 5, "cobertura_pct": 100.0, "risco_pct": 83.3},
        {"setor": "Clínica Médica", "internados": 12, "triados": 11, "risco": 4, "cobertura_pct": 91.7,  "risco_pct": 36.4},
        {"setor": "Cirúrgico",      "internados": 6,  "triados": 6,  "risco": 3, "cobertura_pct": 100.0, "risco_pct": 50.0},
        {"setor": "Pediátrico",     "internados": 4,  "triados": 3,  "risco": 2, "cobertura_pct": 75.0,  "risco_pct": 66.7},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Out/25", "internados": 24, "triados_pct": 87.5, "risco_pct": 37.5, "em_tn": 7, "complicacoes": 1},
        {"mes": "Nov/25", "internados": 26, "triados_pct": 88.5, "risco_pct": 38.5, "em_tn": 7, "complicacoes": 2},
        {"mes": "Dez/25", "internados": 22, "triados_pct": 86.4, "risco_pct": 40.9, "em_tn": 6, "complicacoes": 1},
        {"mes": "Jan/26", "internados": 28, "triados_pct": 89.3, "risco_pct": 39.3, "em_tn": 8, "complicacoes": 3},
        {"mes": "Fev/26", "internados": 26, "triados_pct": 92.3, "risco_pct": 42.3, "em_tn": 8, "complicacoes": 2},
        {"mes": "Mar/26", "internados": 28, "triados_pct": 92.9, "risco_pct": 42.3, "em_tn": 8, "complicacoes": 2},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Cobertura de triagem nutricional",  "valor": 92.9, "meta": 100,  "unidade": "%", "status": "ok",      "observacao": "NRS-2002 e STRONGkids"},
        {"indicador": "Avaliação nutricional em 48h",      "valor": 84.6, "meta": 90,   "unidade": "%", "status": "atencao", "observacao": "Limitação de nutricionista único"},
        {"indicador": "Prevalência desnutrição admissão",  "valor": 38.5, "meta": 30,   "unidade": "%", "status": "critico", "observacao": "Elevada — triagem precoce na APS necessária"},
        {"indicador": "Complicações da TN",                "valor": 2,    "meta": 1,    "unidade": "casos","status": "atencao","observacao": "Diarreia e hiperglicemia"},
        {"indicador": "Pacientes em TN com meta calórica", "valor": 75.0, "meta": 80,   "unidade": "%", "status": "atencao", "observacao": "Progressão lenta na UTI"},
        {"indicador": "Registro EMTN em prontuário",       "valor": 87.5, "meta": 95,   "unidade": "%", "status": "atencao", "observacao": "Evolução nutricional em atraso"},
    ]
