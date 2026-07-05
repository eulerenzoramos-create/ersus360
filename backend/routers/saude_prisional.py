"""Saúde Prisional — PNAISP · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-prisional", tags=["saude_prisional"])

@router.get("/dashboard")
async def dashboard():
    return {
        "populacao_privada_liberdade": 148,
        "capacidade_unidade": 120,
        "superlotacao_pct": 23.3,
        "cobertura_aps_pct": 81.8,
        "consultas_mes": 94,
        "atendimentos_enfermagem_mes": 186,
        "casos_tb_ativos": 4,
        "casos_hiv": 8,
        "casos_hepatite_b": 3,
        "casos_hepatite_c": 5,
        "saude_mental_acompanhados": 24,
        "status_geral": "atencao",
        "equipe_pnaisp": True,
        "medico_horas_semanais": 20,
        "enfermeiro_horas_semanais": 40,
    }

@router.get("/doencas-prevalentes")
async def doencas():
    return [
        {"doenca": "Tuberculose ativa",         "casos": 4,  "prevalencia_1000": 27.0, "meta_tratamento_pct": 85, "em_tratamento_pct": 75.0, "status": "critico",  "observacao": "Prevalência 27x maior que pop. geral"},
        {"doenca": "HIV/AIDS",                  "casos": 8,  "prevalencia_1000": 54.1, "meta_tratamento_pct": 90, "em_tratamento_pct": 87.5, "status": "atencao",  "observacao": "6 em TARV; 2 aguardando início"},
        {"doenca": "Hepatite C",                "casos": 5,  "prevalencia_1000": 33.8, "meta_tratamento_pct": 80, "em_tratamento_pct": 60.0, "status": "atencao",  "observacao": "3 em sofosbuvir; 2 aguardando"}   ,
        {"doenca": "Hepatite B",                "casos": 3,  "prevalencia_1000": 20.3, "meta_tratamento_pct": 70, "em_tratamento_pct": 66.7, "status": "atencao",  "observacao": "Vacinação em andamento"},
        {"doenca": "Sífilis",                   "casos": 6,  "prevalencia_1000": 40.5, "meta_tratamento_pct": 95, "em_tratamento_pct": 100.0,"status": "ok",       "observacao": "Todos em penicilina benzatina"},
        {"doenca": "Transtorno mental (grave)", "casos": 12, "prevalencia_1000": 81.1, "meta_tratamento_pct": 80, "em_tratamento_pct": 83.3, "status": "ok",       "observacao": "Em acompanhamento RAPS"},
        {"doenca": "Uso de drogas (ativo)",     "casos": 38, "prevalencia_1000": 256.8,"meta_tratamento_pct": 60, "em_tratamento_pct": 42.1, "status": "critico",  "observacao": "Demanda supera oferta de CAPS AD"},
        {"doenca": "Hipertensão arterial",      "casos": 22, "prevalencia_1000": 148.6,"meta_tratamento_pct": 70, "em_tratamento_pct": 77.3, "status": "ok",       "observacao": "Controlados com medicação"},
    ]

@router.get("/producao")
async def producao():
    return [
        {"mes": "Out/25", "consultas_medicas": 84, "enfermagem": 172, "odonto": 18, "saude_mental": 22, "exames": 48},
        {"mes": "Nov/25", "consultas_medicas": 88, "enfermagem": 178, "odonto": 20, "saude_mental": 24, "exames": 52},
        {"mes": "Dez/25", "consultas_medicas": 78, "enfermagem": 162, "odonto": 14, "saude_mental": 18, "exames": 42},
        {"mes": "Jan/26", "consultas_medicas": 90, "enfermagem": 184, "odonto": 22, "saude_mental": 26, "exames": 54},
        {"mes": "Fev/26", "consultas_medicas": 92, "enfermagem": 182, "odonto": 20, "saude_mental": 24, "exames": 50},
        {"mes": "Mar/26", "consultas_medicas": 94, "enfermagem": 186, "odonto": 24, "saude_mental": 24, "exames": 56},
    ]

@router.get("/acoes-saude")
async def acoes():
    return [
        {"acao": "Rastreio de TB (Mantoux + RX)",   "realizados": 148, "positivos": 4,  "cobertura_pct": 100.0, "periodicidade": "Anual",     "status": "ok"},
        {"acao": "Testagem rápida HIV/Sífilis",      "realizados": 138, "positivos": 6,  "cobertura_pct": 93.2,  "periodicidade": "Semestral",  "status": "ok"},
        {"acao": "Testagem Hepatite B/C",            "realizados": 132, "positivos": 7,  "cobertura_pct": 89.2,  "periodicidade": "Semestral",  "status": "ok"},
        {"acao": "Vacinação (hepatite B + dT)",      "realizados": 112, "positivos": None,"cobertura_pct": 75.7, "periodicidade": "Contínua",   "status": "atencao", "alerta": "25 recusas ou sem documentação"},
        {"acao": "Triagem saúde mental (MINI/AUDIT)","realizados": 124, "positivos": 36, "cobertura_pct": 83.8,  "periodicidade": "Anual",     "status": "ok"},
        {"acao": "Consulta odontológica inicial",    "realizados": 98,  "positivos": None,"cobertura_pct": 66.2, "periodicidade": "Admissão",   "status": "atencao", "alerta": "Acesso limitado — sem consultório fixo"},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Cobertura APS prisional",        "valor": 81.8, "meta": 100,  "unidade": "%",   "status": "atencao"},
        {"indicador": "Rastreio TB (anual)",             "valor": 100,  "meta": 100,  "unidade": "%",   "status": "ok"},
        {"indicador": "PVHA em TARV",                   "valor": 75.0, "meta": 90,   "unidade": "%",   "status": "atencao"},
        {"indicador": "Vacinação hepatite B",           "valor": 75.7, "meta": 90,   "unidade": "%",   "status": "atencao"},
        {"indicador": "Internação psiquiátrica evitada","valor": 92.0, "meta": 85,   "unidade": "%",   "status": "ok"},
        {"indicador": "Superlotação carcerária",        "valor": 23.3, "meta": 0,    "unidade": "%",   "status": "critico", "observacao": "123% da capacidade"},
    ]
