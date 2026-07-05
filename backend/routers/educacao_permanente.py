"""Educação Permanente em Saúde — EPS · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/educacao-permanente", tags=["educacao_permanente"])

@router.get("/dashboard")
async def dashboard():
    return {
        "capacitacoes_mes": 8,
        "trabalhadores_capacitados_mes": 124,
        "carga_horaria_mes": 486,
        "total_trabalhadores": 284,
        "cobertura_eps_pct": 43.7,
        "meta_cobertura_pct": 60,
        "capacitacoes_obrigatorias_pendentes": 3,
        "instrutores_habilitados": 12,
        "modalidade_ead_pct": 38.5,
        "modalidade_presencial_pct": 61.5,
        "satisfacao_media_pct": 87.2,
        "status_geral": "atencao",
        "trilhas_ativas": 5,
        "certificados_emitidos_mes": 98,
    }

@router.get("/capacitacoes")
async def capacitacoes():
    return [
        {"titulo": "Manejo clínico da dengue",              "categoria": "Vigilância", "carga_h": 8,  "turmas": 2, "inscritos": 42, "concluintes": 38, "modalidade": "Presencial", "status": "concluida", "satisfacao": 91.2},
        {"titulo": "Suporte Básico de Vida — SBV",          "categoria": "Urgência",   "carga_h": 16, "turmas": 1, "inscritos": 18, "concluintes": 18, "modalidade": "Presencial", "status": "concluida", "satisfacao": 94.4},
        {"titulo": "Protocolo Manchester atualizado",       "categoria": "Urgência",   "carga_h": 4,  "turmas": 1, "inscritos": 22, "concluintes": 20, "modalidade": "Presencial", "status": "concluida", "satisfacao": 88.6},
        {"titulo": "Biossegurança e PGRSS",                 "categoria": "Hospitalar", "carga_h": 4,  "turmas": 3, "inscritos": 54, "concluintes": 46, "modalidade": "EAD",        "status": "concluida", "satisfacao": 82.4, "pendente_obrigatorio": True},
        {"titulo": "Atenção integral à mulher — PHPN",      "categoria": "APS",        "carga_h": 8,  "turmas": 1, "inscritos": 16, "concluintes": 14, "modalidade": "Presencial", "status": "concluida", "satisfacao": 86.8},
        {"titulo": "Notificação compulsória — SINAN",       "categoria": "Vigilância", "carga_h": 2,  "turmas": 4, "inscritos": 68, "concluintes": 0,  "modalidade": "EAD",        "status": "em_andamento"},
        {"titulo": "Saúde mental na APS — matriciamento",   "categoria": "APS",        "carga_h": 12, "turmas": 1, "inscritos": 14, "concluintes": 0,  "modalidade": "Presencial", "status": "em_andamento"},
        {"titulo": "Higienização das mãos — WHO 5 momentos","categoria": "Hospitalar", "carga_h": 2,  "turmas": 0, "inscritos": 0,  "concluintes": 0,  "modalidade": "EAD",        "status": "planejada",  "pendente_obrigatorio": True},
        {"titulo": "Preenchimento correto DN/DO — SINASC",  "categoria": "Vigilância", "carga_h": 4,  "turmas": 0, "inscritos": 0,  "concluintes": 0,  "modalidade": "Presencial", "status": "planejada",  "pendente_obrigatorio": True},
    ]

@router.get("/por-categoria")
async def por_categoria():
    return [
        {"categoria": "APS / ESF",               "capacitacoes": 12, "trabalhadores": 82, "horas_per_capita": 18.4, "cobertura_pct": 62.1, "status": "ok"},
        {"categoria": "Urgência e Emergência",    "capacitacoes": 8,  "trabalhadores": 34, "horas_per_capita": 22.6, "cobertura_pct": 74.8, "status": "ok"},
        {"categoria": "Vigilância em Saúde",      "capacitacoes": 10, "trabalhadores": 28, "horas_per_capita": 14.2, "cobertura_pct": 58.6, "status": "atencao"},
        {"categoria": "Apoio Hospitalar",         "capacitacoes": 6,  "trabalhadores": 64, "horas_per_capita": 8.4,  "cobertura_pct": 32.4, "status": "critico"},
        {"categoria": "Gestão e Administrativo",  "capacitacoes": 4,  "trabalhadores": 38, "horas_per_capita": 6.8,  "cobertura_pct": 28.4, "status": "critico"},
        {"categoria": "Farmácia",                 "capacitacoes": 3,  "trabalhadores": 14, "horas_per_capita": 12.4, "cobertura_pct": 50.0, "status": "atencao"},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Out/25", "capacitacoes": 6,  "trabalhadores": 98,  "horas": 362, "cobertura_pct": 34.5, "satisfacao": 85.4},
        {"mes": "Nov/25", "capacitacoes": 7,  "trabalhadores": 108, "horas": 402, "cobertura_pct": 38.0, "satisfacao": 86.2},
        {"mes": "Dez/25", "capacitacoes": 4,  "trabalhadores": 72,  "horas": 264, "cobertura_pct": 25.4, "satisfacao": 84.8},
        {"mes": "Jan/26", "capacitacoes": 8,  "trabalhadores": 118, "horas": 448, "cobertura_pct": 41.5, "satisfacao": 86.8},
        {"mes": "Fev/26", "capacitacoes": 8,  "trabalhadores": 120, "horas": 472, "cobertura_pct": 42.3, "satisfacao": 87.0},
        {"mes": "Mar/26", "capacitacoes": 8,  "trabalhadores": 124, "horas": 486, "cobertura_pct": 43.7, "satisfacao": 87.2},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Cobertura EPS mensal",                "valor": 43.7, "meta": 60,  "unidade": "%",  "status": "atencao", "observacao": "Apoio hospitalar e administrativo abaixo"},
        {"indicador": "Capacitações obrigatórias pendentes", "valor": 3,    "meta": 0,   "unidade": "un", "status": "atencao", "observacao": "PGRSS, Higienização mãos, DN/DO"},
        {"indicador": "Horas de formação per capita/mês",    "valor": 1.7,  "meta": 2.0, "unidade": "h",  "status": "atencao", "observacao": "Meta OMS: 2h/profissional/mês"},
        {"indicador": "Satisfação dos participantes",        "valor": 87.2, "meta": 80,  "unidade": "%",  "status": "ok",      "observacao": "Boa receptividade"},
        {"indicador": "% em modalidade EAD",                 "valor": 38.5, "meta": 30,  "unidade": "%",  "status": "ok",      "observacao": "Plataforma Avasus + Google Classroom"},
        {"indicador": "Instrutores internos habilitados",    "valor": 12,   "meta": 15,  "unidade": "un", "status": "atencao", "observacao": "3 em processo de habilitação"},
    ]
