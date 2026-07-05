"""PICS — Práticas Integrativas e Complementares · Acupuntura · Fitoterapia · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/pics", tags=["pics"])

@router.get("/dashboard")
async def dashboard():
    return {
        "atendimentos_mes": 284,
        "modalidades_ativas": 6,
        "profissionais_habilitados": 8,
        "pacientes_cadastrados": 486,
        "satisfacao_pct": 94.2,
        "encaminhamentos_recebidos_mes": 124,
        "acupuntura_sessoes_mes": 148,
        "fitoterapia_prescricoes_mes": 86,
        "aumento_atendimentos_pct": 12.4,
        "reducao_encaminhamentos_especialidade_pct": 18.6,
        "status_geral": "ok",
    }

@router.get("/modalidades")
async def modalidades():
    return [
        {"modalidade": "Acupuntura",                    "profissional": "Dr. Carlos Lima (médico)",       "atendimentos_mes": 148, "pacientes_ativos": 124, "status": "ok",     "carga_semanal_h": 20, "observacao": None},
        {"modalidade": "Fitoterapia / Plantas medicinais","profissional": "Enf. Ana Paula (fitoterapia)", "atendimentos_mes": 86,  "pacientes_ativos": 68,  "status": "ok",     "carga_semanal_h": 12, "observacao": None},
        {"modalidade": "Homeopatia",                    "profissional": "Dra. Márcia Souza (médica)",     "atendimentos_mes": 22,  "pacientes_ativos": 38,  "status": "ok",     "carga_semanal_h": 8,  "observacao": None},
        {"modalidade": "Meditação / Mindfulness",       "profissional": "Psic. Rodrigo Alves",           "atendimentos_mes": 14,  "pacientes_ativos": 24,  "status": "atencao","carga_semanal_h": 4,  "observacao": "Grupos suspensos — sala em reforma"},
        {"modalidade": "Auriculoterapia",               "profissional": "Enf. Juliana Costa",            "atendimentos_mes": 9,   "pacientes_ativos": 18,  "status": "ok",     "carga_semanal_h": 4,  "observacao": None},
        {"modalidade": "Yoga / Lian Gong",             "profissional": "Fisio. Paulo Mendes",            "atendimentos_mes": 5,   "pacientes_ativos": 12,  "status": "atencao","carga_semanal_h": 2,  "observacao": "Apenas 1 turma/semana — demanda reprimida"},
    ]

@router.get("/condicoes")
async def condicoes():
    return [
        {"condicao": "Dor crônica (lombalgia, cervicalgia)", "pacientes": 124, "modalidade_principal": "Acupuntura",    "melhora_pct": 72.4},
        {"condicao": "Ansiedade / Transtorno de ansiedade",  "pacientes": 68,  "modalidade_principal": "Acupuntura + Meditação", "melhora_pct": 64.8},
        {"condicao": "Hipertensão (complementar)",           "pacientes": 48,  "modalidade_principal": "Fitoterapia",   "melhora_pct": 58.2},
        {"condicao": "Diabetes (complementar)",              "pacientes": 42,  "modalidade_principal": "Fitoterapia",   "melhora_pct": 52.6},
        {"condicao": "Insônia / distúrbios do sono",         "pacientes": 38,  "modalidade_principal": "Auriculoterapia","melhora_pct": 68.4},
        {"condicao": "Depressão leve a moderada",            "pacientes": 28,  "modalidade_principal": "Acupuntura + Yoga","melhora_pct": 56.8},
        {"condicao": "Sobrepeso / obesidade",                "pacientes": 24,  "modalidade_principal": "Auriculoterapia","melhora_pct": 38.4},
        {"condicao": "Tabagismo (cessação)",                 "pacientes": 18,  "modalidade_principal": "Acupuntura",    "melhora_pct": 44.2},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Out/25", "atendimentos": 218, "acupuntura": 112, "fitoterapia": 64, "satisfacao_pct": 92.4},
        {"mes": "Nov/25", "atendimentos": 236, "acupuntura": 122, "fitoterapia": 72, "satisfacao_pct": 93.6},
        {"mes": "Dez/25", "atendimentos": 198, "acupuntura": 104, "fitoterapia": 58, "satisfacao_pct": 94.2},
        {"mes": "Jan/26", "atendimentos": 248, "acupuntura": 130, "fitoterapia": 74, "satisfacao_pct": 93.8},
        {"mes": "Fev/26", "atendimentos": 262, "acupuntura": 138, "fitoterapia": 80, "satisfacao_pct": 94.0},
        {"mes": "Mar/26", "atendimentos": 284, "acupuntura": 148, "fitoterapia": 86, "satisfacao_pct": 94.2},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Satisfação dos usuários",               "valor": 94.2, "meta": 90,  "unidade": "%", "status": "ok",      "observacao": "NPS positivo — redução de dor relatada"},
        {"indicador": "Crescimento de atendimentos",           "valor": 12.4, "meta": 10,  "unidade": "%", "status": "ok",      "observacao": "Crescimento sustentado nos últimos 6 meses"},
        {"indicador": "Redução de encaminhamentos para esp.",  "valor": 18.6, "meta": 15,  "unidade": "%", "status": "ok",      "observacao": "PICS como alternativa resolutiva na APS"},
        {"indicador": "Modalidades sem demanda reprimida",     "valor": 4,    "meta": 6,   "unidade": "un","status": "atencao", "observacao": "Meditação e Yoga com capacidade limitada"},
        {"indicador": "Profissionais habilitados",             "valor": 8,    "meta": 10,  "unidade": "un","status": "atencao", "observacao": "2 vagas em processo seletivo"},
    ]
