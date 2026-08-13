"""
Router: /api/pse — Programa Saúde na Escola — ERSUS 360
Dados de referência municipal — Apuí/AM 2026.
situacao_dado = referencia_municipal
9 escolas municipais/estaduais cadastradas no PSE.
4 equipes de saúde com escolas de referência.
"""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(prefix="/api/pse", tags=["pse"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "escolas_cadastradas": 9,
        "escolas_com_acao_mes": 7,
        "cobertura_escolas_pct": 78,
        "total_alunos_matriculados": 2847,
        "alunos_avaliados_mes": 1241,
        "cobertura_alunos_pct": 44,
        "acoes_planejadas_mes": 28,
        "acoes_realizadas_mes": 24,
        "proporcao_acoes_pct": 86,
        "encaminhamentos_mes": 87,
        "alteracoes_encontradas_pct": 31,
        "municipio": "Apuí/AM",
        "competencia": "Jun/2026",
    }


@router.get("/historico")
async def historico():
    return [
        {"mes": "Jan", "acoes": 19, "encaminhamentos": 61, "cobertura_pct": 37},
        {"mes": "Fev", "acoes": 21, "encaminhamentos": 68, "cobertura_pct": 39},
        {"mes": "Mar", "acoes": 23, "encaminhamentos": 74, "cobertura_pct": 41},
        {"mes": "Abr", "acoes": 23, "encaminhamentos": 79, "cobertura_pct": 42},
        {"mes": "Mai", "acoes": 24, "encaminhamentos": 83, "cobertura_pct": 43},
        {"mes": "Jun", "acoes": 24, "encaminhamentos": 87, "cobertura_pct": 44},
    ]


@router.get("/escolas")
async def escolas():
    return [
        {
            "escola": "E.M. João XXIII",
            "equipe_responsavel": "ESF Centro",
            "alunos": 487,
            "avaliados_mes": 312,
            "acoes_mes": 6,
            "status": "ok",
            "encaminhamentos_mes": 24,
            "principais_achados": ["Sobrepeso/obesidade 18%", "Acuidade visual reduzida 12%"],
        },
        {
            "escola": "E.E. Antônio Bento",
            "equipe_responsavel": "ESF Cidade Nova",
            "alunos": 523,
            "avaliados_mes": 298,
            "acoes_mes": 5,
            "status": "ok",
            "encaminhamentos_mes": 19,
            "principais_achados": ["Cárie dentária 24%", "Pediculose 9%"],
        },
        {
            "escola": "E.M. Raimundo Nonato",
            "equipe_responsavel": "ESF Cidade Nova",
            "alunos": 341,
            "avaliados_mes": 187,
            "acoes_mes": 4,
            "status": "ok",
            "encaminhamentos_mes": 14,
            "principais_achados": ["Baixo peso 7%", "Atraso vacinação 11%"],
        },
        {
            "escola": "E.M. Dom Pedro II",
            "equipe_responsavel": "ESF Colônia",
            "alunos": 278,
            "avaliados_mes": 144,
            "acoes_mes": 3,
            "status": "ok",
            "encaminhamentos_mes": 11,
            "principais_achados": ["Saúde bucal precária 29%"],
        },
        {
            "escola": "E.M. Floresta Verde",
            "equipe_responsavel": "ESF Colônia",
            "alunos": 187,
            "avaliados_mes": 98,
            "acoes_mes": 2,
            "status": "atencao",
            "encaminhamentos_mes": 8,
            "principais_achados": ["Helmintíases 14%", "Desnutrição risco 5%"],
        },
        {
            "escola": "E.M. Rural Rio Juma",
            "equipe_responsavel": "ESF Rural",
            "alunos": 124,
            "avaliados_mes": 98,
            "acoes_mes": 2,
            "status": "ok",
            "encaminhamentos_mes": 6,
            "principais_achados": ["Malária recente 3%", "Acuidade auditiva reduzida 8%"],
        },
        {
            "escola": "E.M. PA Realidade",
            "equipe_responsavel": "ESF Rural",
            "alunos": 98,
            "avaliados_mes": 104,
            "acoes_mes": 2,
            "status": "ok",
            "encaminhamentos_mes": 5,
            "principais_achados": ["Desnutrição 4%", "Helmintíases 18%"],
        },
        {
            "escola": "E.M. Boa Esperança",
            "equipe_responsavel": "ESF Rural",
            "alunos": 512,
            "avaliados_mes": 0,
            "acoes_mes": 0,
            "status": "critico",
            "encaminhamentos_mes": 0,
            "principais_achados": ["Escola sem ação no mês — acesso fluvial prejudicado (chuvas)"],
        },
        {
            "escola": "E.E. Estadual Apuí",
            "equipe_responsavel": "ESF Centro",
            "alunos": 297,
            "avaliados_mes": 0,
            "acoes_mes": 0,
            "status": "atencao",
            "encaminhamentos_mes": 0,
            "principais_achados": ["Ação reagendada — conflito com ENEM simulado"],
        },
    ]


@router.get("/acoes")
async def acoes():
    return {
        "situacao_dado": "referencia_municipal",
        "por_tipo": [
            {"tipo": "Avaliação antropométrica e nutricional", "n": 7, "cobertura_escolas": 7},
            {"tipo": "Saúde bucal — escovação supervisionada", "n": 6, "cobertura_escolas": 6},
            {"tipo": "Atualização de cartão de vacinas",       "n": 6, "cobertura_escolas": 6},
            {"tipo": "Avaliação de acuidade visual",           "n": 5, "cobertura_escolas": 5},
            {"tipo": "Controle de helmintíases (vermifugação)","n": 4, "cobertura_escolas": 4},
            {"tipo": "Educação em saúde — DST/HIV",            "n": 3, "cobertura_escolas": 3},
            {"tipo": "Educação em saúde — Drogas e álcool",    "n": 3, "cobertura_escolas": 3},
            {"tipo": "Saúde mental e bem-estar",               "n": 2, "cobertura_escolas": 2},
        ],
        "encaminhamentos_por_agravo": [
            {"agravo": "Saúde ocular (acuidade visual)",       "n": 23},
            {"agravo": "Saúde bucal (triagem odontológica)",   "n": 21},
            {"agravo": "Nutrição (sobrepeso / baixo peso)",    "n": 18},
            {"agravo": "Vacinação (esquema incompleto)",       "n": 12},
            {"agravo": "Saúde mental",                         "n": 8},
            {"agravo": "Dermatologia / pediculose",            "n": 5},
        ],
    }


@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Cobertura de escolas com ação PSE no mês",   "valor": 78,  "meta": 100, "unidade": "%",   "status": "atencao",  "observacao": "2 escolas sem ação: acesso fluvial e conflito agenda."},
        {"indicador": "Cobertura de alunos avaliados no ciclo",     "valor": 44,  "meta": 50,  "unidade": "%",   "status": "atencao",  "observacao": "Abaixo da meta PSE — zona rural dificulta cobertura."},
        {"indicador": "Proporção ações realizadas / planejadas",    "valor": 86,  "meta": 90,  "unidade": "%",   "status": "atencao",  "observacao": "4 ações pendentes — reagendamento em Jul/26."},
        {"indicador": "Proporção alunos com sobrepeso/obesidade",   "valor": 18,  "meta": 15,  "unidade": "%",   "status": "critico",  "observacao": "Acima da média nacional (17%). PICS integrado às escolas."},
        {"indicador": "Proporção cárie dentária em escolares",      "valor": 24,  "meta": 20,  "unidade": "%",   "status": "critico",  "observacao": "Sem fluoretação da água urbana. Escovação supervisionada."},
        {"indicador": "Encaminhamentos com retorno registrado",     "valor": 41,  "meta": 60,  "unidade": "%",   "status": "critico",  "observacao": "Baixa contrarreferência — necessita integração SISAB."},
        {"indicador": "Atualização vacinal dos escolares",          "valor": 89,  "meta": 95,  "unidade": "%",   "status": "atencao",  "observacao": "Busca ativa integrada com SIPNI em 6 escolas."},
    ]
