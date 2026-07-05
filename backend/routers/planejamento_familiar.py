"""Planejamento Familiar — Métodos · DIU · Laqueadura · Vasectomia · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/planejamento-familiar", tags=["planejamento_familiar"])

@router.get("/dashboard")
async def dashboard():
    return {
        "mulheres_em_metodo_ativo": 1284,
        "cobertura_pct": 68.4,
        "meta_cobertura_pct": 80,
        "consultas_mes": 284,
        "diu_inseridos_mes": 28,
        "injecaveis_mes": 186,
        "pilula_dispensada_ciclos_mes": 648,
        "preservativos_distribuidos_mes": 2840,
        "laqueaduras_ano": 8,
        "vasectomias_ano": 3,
        "gestacoes_nao_planejadas_pct": 42.8,
        "adolescentes_em_metodo_pct": 34.6,
        "status_geral": "atencao",
    }

@router.get("/metodos")
async def metodos():
    return [
        {"metodo": "Pílula combinada",              "usuarios_ativos": 486, "pct": 37.8, "dispensado_mes": 648,  "continuidade_pct": 84.2, "adequado": True},
        {"metodo": "Injetável trimestral",          "usuarios_ativos": 284, "pct": 22.1, "dispensado_mes": 186,  "continuidade_pct": 88.6, "adequado": True},
        {"metodo": "DIU cobre",                     "usuarios_ativos": 168, "pct": 13.1, "dispensado_mes": 28,   "continuidade_pct": 96.4, "adequado": True},
        {"metodo": "Preservativo masculino",        "usuarios_ativos": 186, "pct": 14.5, "dispensado_mes": 2840, "continuidade_pct": 62.4, "adequado": True},
        {"metodo": "Implante subdérmico",           "usuarios_ativos": 48,  "pct": 3.7,  "dispensado_mes": 4,    "continuidade_pct": 98.2, "adequado": True},
        {"metodo": "Laqueadura tubária",            "usuarios_ativos": 68,  "pct": 5.3,  "dispensado_mes": 0,    "continuidade_pct": 100,  "adequado": True},
        {"metodo": "Vasectomia",                    "usuarios_ativos": 18,  "pct": 1.4,  "dispensado_mes": 0,    "continuidade_pct": 100,  "adequado": True},
        {"metodo": "Pílula somente progestogênio",  "usuarios_ativos": 26,  "pct": 2.0,  "dispensado_mes": 34,   "continuidade_pct": 78.4, "adequado": True},
    ]

@router.get("/faixa-etaria")
async def faixa_etaria():
    return [
        {"faixa": "10–14 anos", "em_metodo": 4,   "gestantes_nao_planejadas": 2,  "consultas_mes": 8,  "metodo_principal": "Preservativo"},
        {"faixa": "15–19 anos", "em_metodo": 124,  "gestantes_nao_planejadas": 24, "consultas_mes": 48, "metodo_principal": "Pílula / Injetável"},
        {"faixa": "20–24 anos", "em_metodo": 284,  "gestantes_nao_planejadas": 38, "consultas_mes": 72, "metodo_principal": "Injetável / Pílula"},
        {"faixa": "25–34 anos", "em_metodo": 486,  "gestantes_nao_planejadas": 48, "consultas_mes": 84, "metodo_principal": "DIU / Injetável"},
        {"faixa": "35–44 anos", "em_metodo": 286,  "gestantes_nao_planejadas": 18, "consultas_mes": 48, "metodo_principal": "Laqueadura / DIU"},
        {"faixa": "45–49 anos", "em_metodo": 100,  "gestantes_nao_planejadas": 4,  "consultas_mes": 24, "metodo_principal": "Pílula / Barreira"},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Out/25", "consultas": 236, "diu": 22, "injetaveis": 158, "pilula": 584, "gestacoes_nao_plan_pct": 44.8},
        {"mes": "Nov/25", "consultas": 248, "diu": 24, "injetaveis": 164, "pilula": 604, "gestacoes_nao_plan_pct": 43.6},
        {"mes": "Dez/25", "consultas": 214, "diu": 18, "injetaveis": 148, "pilula": 548, "gestacoes_nao_plan_pct": 44.2},
        {"mes": "Jan/26", "consultas": 262, "diu": 26, "injetaveis": 172, "pilula": 618, "gestacoes_nao_plan_pct": 43.8},
        {"mes": "Fev/26", "consultas": 272, "diu": 26, "injetaveis": 178, "pilula": 634, "gestacoes_nao_plan_pct": 43.2},
        {"mes": "Mar/26", "consultas": 284, "diu": 28, "injetaveis": 186, "pilula": 648, "gestacoes_nao_plan_pct": 42.8},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Cobertura de métodos contraceptivos",   "valor": 68.4, "meta": 80,  "unidade": "%", "status": "atencao", "observacao": "Meta PAISM: ≥80% das mulheres em idade fértil"},
        {"indicador": "Gestações não planejadas",              "valor": 42.8, "meta": 25,  "unidade": "%", "status": "critico", "observacao": "Alta entre adolescentes 15–19 anos (19.4%)"},
        {"indicador": "Adolescentes em método contraceptivo",  "valor": 34.6, "meta": 60,  "unidade": "%", "status": "critico", "observacao": "Necessidade de ações de educação sexual nas escolas (PSE)"},
        {"indicador": "Continuidade do método (DIU)",          "valor": 96.4, "meta": 95,  "unidade": "%", "status": "ok",      "observacao": "Melhor continuidade — método de longa duração"},
        {"indicador": "Vasectomia — acesso (oferta/ano)",      "valor": 3,    "meta": None, "unidade": "un","status": "atencao", "observacao": "Demanda reprimida — lista de espera 18 homens"},
        {"indicador": "Implante subdérmico — oferta",          "valor": 4,    "meta": None, "unidade": "un","status": "atencao", "observacao": "Alto custo — repassar pleito à SES-AM"},
    ]
