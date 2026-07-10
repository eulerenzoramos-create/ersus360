"""Saúde da População em Situação de Rua — Consultório na Rua / CnaR · Apuí/AM"""
from fastapi import APIRouter
router = APIRouter(prefix="/api/saude-populacao-rua-apui", tags=["Saúde Pop. Rua Apuí"])

DASHBOARD = {
    "populacao_estimada_rua": 48,
    "cadastrados_cnar": 31,
    "cobertura_pct": 64.6,
    "equipe_cnar": False,
    "atendimentos_mes": 22,
    "vinculados_rede_psicossocial": 14,
    "situacao": "critico",
    "nota_tecnica": "Apuí não possui eCnaR formal. Atendimentos realizados por ESF I mediante busca ativa mensal.",
}

PERFIL = [
    {"faixa_etaria": "18-29 anos", "qtd": 8,  "sexo_masc_pct": 87.5, "uso_substancias_pct": 62.5},
    {"faixa_etaria": "30-44 anos", "qtd": 16, "sexo_masc_pct": 93.8, "uso_substancias_pct": 81.3},
    {"faixa_etaria": "45-59 anos", "qtd": 5,  "sexo_masc_pct": 100.0,"uso_substancias_pct": 80.0},
    {"faixa_etaria": "60+ anos",   "qtd": 2,  "sexo_masc_pct": 100.0,"uso_substancias_pct": 50.0},
]

ACOES = [
    {"acao": "Busca ativa mensal ESF I",              "frequencia": "Mensal",   "alcance": 22, "status": "ativo"},
    {"acao": "Distribuição kit higiene + preservativos","frequencia": "Mensal",  "alcance": 31, "status": "ativo"},
    {"acao": "Testagem rápida HIV/Sífilis",            "frequencia": "Trimestral","alcance": 28,"status": "ativo"},
    {"acao": "Vacinação in loco (Influenza)",          "frequencia": "Anual",    "alcance": 18, "status": "ativo"},
    {"acao": "Acolhimento CAPS AD",                    "frequencia": "Demanda",  "alcance": 9,  "status": "parcial"},
    {"acao": "Equipe eCnaR formal",                    "frequencia": "—",        "alcance": 0,  "status": "ausente"},
]

HISTORICO = [
    {"mes": "Jan/25", "cadastrados": 24, "atendimentos": 16, "encaminhamentos": 3},
    {"mes": "Fev/25", "cadastrados": 26, "atendimentos": 18, "encaminhamentos": 4},
    {"mes": "Mar/25", "cadastrados": 28, "atendimentos": 19, "encaminhamentos": 5},
    {"mes": "Abr/25", "cadastrados": 29, "atendimentos": 20, "encaminhamentos": 4},
    {"mes": "Mai/25", "cadastrados": 30, "atendimentos": 21, "encaminhamentos": 6},
    {"mes": "Jun/25", "cadastrados": 31, "atendimentos": 22, "encaminhamentos": 5},
]

INDICADORES = [
    {"indicador": "Cobertura cadastral eCnaR",       "valor": "64.6%", "meta": "80%",  "status": "atencao"},
    {"indicador": "Atendimentos/mês",                "valor": 22,      "meta": 35,     "status": "atencao"},
    {"indicador": "Taxa testagem HIV (12m)",          "valor": "90.3%", "meta": "90%",  "status": "ok"},
    {"indicador": "Vinculados ao CAPS AD",            "valor": "45.2%", "meta": "60%",  "status": "atencao"},
    {"indicador": "Equipe eCnaR implantada",          "valor": "Não",   "meta": "Sim",  "status": "critico"},
    {"indicador": "Acesso a abrigo/casa de passagem", "valor": "Não",   "meta": "Sim",  "status": "critico"},
]

@router.get("/dashboard")
def dashboard():    return DASHBOARD
@router.get("/perfil")
def perfil():        return PERFIL
@router.get("/acoes")
def acoes():         return ACOES
@router.get("/historico")
def historico():     return HISTORICO
@router.get("/indicadores")
def indicadores():   return INDICADORES
