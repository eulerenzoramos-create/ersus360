"""
Planejamento Familiar — Métodos · DIU · Laqueadura · Vasectomia · FMS Apuí/AM
Dados de referência municipal — situacao_dado = referencia_municipal
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/planejamento-familiar", tags=["planejamento_familiar"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "Jan–Jun 2026",
        "usuarios_planfam_total": 1840,
        "mulheres_idade_fertil_estimadas": 5200,
        "cobertura_pct": 35.4,
        "metodo_mais_usado": "Anticoncepcional oral (ACO)",
        "gravidezes_nao_planejadas_estimadas_ano": 142,
        "consultas_planfam_mes": 184,
        "vasectomias_ano": 2,
        "laqueaduras_ano": 8,
        "diu_inseridos_ano": 14,
        "nota": "Referência baseada em parâmetros típicos para municípios amazônicos ~20 mil hab.",
    }


@router.get("/metodos")
async def metodos():
    return [
        {"situacao_dado": "referencia_municipal", "metodo": "Anticoncepcional Oral (ACO)",     "usuarios": 820, "pct_usuarios": 44.6, "disponivel_sus": True,  "status": "ok"},
        {"situacao_dado": "referencia_municipal", "metodo": "Injetável Mensal",                 "usuarios": 380, "pct_usuarios": 20.7, "disponivel_sus": True,  "status": "ok"},
        {"situacao_dado": "referencia_municipal", "metodo": "Injetável Trimestral (DMPA)",     "usuarios": 240, "pct_usuarios": 13.0, "disponivel_sus": True,  "status": "ok"},
        {"situacao_dado": "referencia_municipal", "metodo": "DIU de Cobre",                    "usuarios": 120, "pct_usuarios": 6.5,  "disponivel_sus": True,  "status": "ok"},
        {"situacao_dado": "referencia_municipal", "metodo": "Preservativo Masculino",          "usuarios": 180, "pct_usuarios": 9.8,  "disponivel_sus": True,  "status": "ok"},
        {"situacao_dado": "referencia_municipal", "metodo": "Implante Etonogestrel",           "usuarios": 48,  "pct_usuarios": 2.6,  "disponivel_sus": True,  "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "metodo": "Laqueadura Tubária (BTLA)",       "usuarios": 42,  "pct_usuarios": 2.3,  "disponivel_sus": True,  "status": "ok"},
        {"situacao_dado": "referencia_municipal", "metodo": "Vasectomia",                      "usuarios": 10,  "pct_usuarios": 0.5,  "disponivel_sus": True,  "status": "atencao"},
    ]


@router.get("/producao")
async def producao():
    return [
        {"situacao_dado": "referencia_municipal", "mes": "Jan/26", "consultas": 162, "diu_inseridos": 2, "vasectomias": 0, "laqueaduras": 1, "implantes": 4},
        {"situacao_dado": "referencia_municipal", "mes": "Fev/26", "consultas": 171, "diu_inseridos": 2, "vasectomias": 0, "laqueaduras": 1, "implantes": 6},
        {"situacao_dado": "referencia_municipal", "mes": "Mar/26", "consultas": 188, "diu_inseridos": 3, "vasectomias": 1, "laqueaduras": 2, "implantes": 8},
        {"situacao_dado": "referencia_municipal", "mes": "Abr/26", "consultas": 194, "diu_inseridos": 2, "vasectomias": 0, "laqueaduras": 2, "implantes": 9},
        {"situacao_dado": "referencia_municipal", "mes": "Mai/26", "consultas": 180, "diu_inseridos": 3, "vasectomias": 1, "laqueaduras": 1, "implantes": 8},
        {"situacao_dado": "referencia_municipal", "mes": "Jun/26", "consultas": 184, "diu_inseridos": 2, "vasectomias": 0, "laqueaduras": 1, "implantes": 7},
    ]


@router.get("/indicadores")
async def indicadores():
    return [
        {"situacao_dado": "referencia_municipal", "indicador": "Cobertura Planejamento Familiar (%)", "valor": 35.4, "meta": 60,  "unidade": "%",      "status": "critico", "observacao": "64,6% das mulheres em idade fértil sem método registrado."},
        {"situacao_dado": "referencia_municipal", "indicador": "Gravidez Não Planejada (estimada/ano)", "valor": 142, "meta": 70, "unidade": "casos",  "status": "critico", "observacao": "Alta taxa — 2× acima do esperado. Necessidade de busca ativa."},
        {"situacao_dado": "referencia_municipal", "indicador": "Vasectomia/ano",                      "valor": 2,   "meta": 10,  "unidade": "proced.", "status": "critico", "observacao": "Procedimento realizado em Humaitá — logística dificulta acesso."},
        {"situacao_dado": "referencia_municipal", "indicador": "DIU inseridos/ano",                   "valor": 14,  "meta": 40,  "unidade": "proced.", "status": "critico", "observacao": "Baixa oferta — capacitar médicos UBS para inserção."},
        {"situacao_dado": "referencia_municipal", "indicador": "Consultas Planfam/mês",               "valor": 184, "meta": 200, "unidade": "cons.",   "status": "atencao", "observacao": "Ampliação da oferta com eMulti (ginecologista teleconsulta)."},
    ]
