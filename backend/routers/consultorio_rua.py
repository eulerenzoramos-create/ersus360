"""Consultório na Rua — Pop. em Situação de Rua · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/consultorio-rua", tags=["consultorio_rua"])

@router.get("/dashboard")
async def dashboard():
    return {
        "pessoas_cadastradas": 84,
        "atendimentos_mes": 128,
        "media_atendimentos_pessoa": 1.5,
        "novos_cadastros_mes": 8,
        "usuarios_com_cns": 68,
        "usuarios_com_cns_pct": 81.0,
        "encaminhamentos_mes": 28,
        "encaminhamentos_saude_mental_mes": 12,
        "encaminhamentos_caps_mes": 8,
        "testagens_ists_mes": 18,
        "reagentes_ists_mes": 4,
        "reducao_danos_materiais_entregues": 284,
        "equipe_profissionais": 5,
        "abordagens_rua_mes": 48,
        "competencia": "Jun/2026",
        "status_geral": "atencao",
    }

@router.get("/perfil-populacional")
async def perfil_populacional():
    return {
        "total": 84,
        "por_sexo": [
            {"sexo": "Masculino", "n": 64, "pct": 76.2},
            {"sexo": "Feminino",  "n": 20, "pct": 23.8},
        ],
        "por_faixa_etaria": [
            {"faixa": "18–29 anos", "n": 18, "pct": 21.4},
            {"faixa": "30–39 anos", "n": 24, "pct": 28.6},
            {"faixa": "40–49 anos", "n": 22, "pct": 26.2},
            {"faixa": "50–59 anos", "n": 12, "pct": 14.3},
            {"faixa": "60+ anos",   "n": 8,  "pct": 9.5},
        ],
        "por_tempo_rua": [
            {"tempo": "< 6 meses",   "n": 12, "pct": 14.3},
            {"tempo": "6–12 meses",  "n": 18, "pct": 21.4},
            {"tempo": "1–3 anos",    "n": 28, "pct": 33.3},
            {"tempo": "> 3 anos",    "n": 26, "pct": 31.0},
        ],
        "por_motivacao_rua": [
            {"motivo": "Uso de álcool/drogas",        "n": 32, "pct": 38.1},
            {"motivo": "Conflito familiar",            "n": 24, "pct": 28.6},
            {"motivo": "Perda de emprego/moradia",     "n": 16, "pct": 19.0},
            {"motivo": "Saúde mental sem suporte",     "n": 8,  "pct": 9.5},
            {"motivo": "Outros/Não informado",         "n": 4,  "pct": 4.8},
        ],
        "condicoes_saude_prevalentes": [
            {"condicao": "Uso prejudicial de álcool/drogas", "n": 52, "pct": 61.9},
            {"condicao": "Transtornos mentais",              "n": 40, "pct": 47.6},
            {"condicao": "Feridas crônicas/traumas",         "n": 28, "pct": 33.3},
            {"condicao": "IST ativas",                       "n": 18, "pct": 21.4},
            {"condicao": "HAS/DM não controlados",           "n": 16, "pct": 19.0},
            {"condicao": "TB ativa ou suspeita",             "n": 8,  "pct": 9.5},
            {"condicao": "HIV positivo (em TARV ou não)",    "n": 6,  "pct": 7.1},
        ],
    }

@router.get("/encaminhamentos")
async def encaminhamentos():
    return [
        {"servico": "CAPS AD III",                   "encaminhamentos_mes": 8,  "aceitos": 6,  "em_espera": 2,  "tempo_medio_espera_dias": 12},
        {"servico": "UBS — HAS/DM/acompanhamento",   "encaminhamentos_mes": 6,  "aceitos": 6,  "em_espera": 0,  "tempo_medio_espera_dias": 3},
        {"servico": "COAS — IST/HIV",                "encaminhamentos_mes": 4,  "aceitos": 4,  "em_espera": 0,  "tempo_medio_espera_dias": 2},
        {"servico": "CREAS — assistência social",    "encaminhamentos_mes": 4,  "aceitos": 3,  "em_espera": 1,  "tempo_medio_espera_dias": 8},
        {"servico": "Hospital — urgência/internação","encaminhamentos_mes": 3,  "aceitos": 3,  "em_espera": 0,  "tempo_medio_espera_dias": 0},
        {"servico": "NASF/Reabilitação",             "encaminhamentos_mes": 2,  "aceitos": 1,  "em_espera": 1,  "tempo_medio_espera_dias": 22},
        {"servico": "Programa Habita Mais SL (SEMAS)","encaminhamentos_mes": 1, "aceitos": 0,  "em_espera": 1,  "tempo_medio_espera_dias": 48},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Jan/26", "atendimentos": 108, "abordagens": 40, "novos_cadastros": 6, "testagens_ist": 14, "reagentes": 3, "encaminhamentos": 22},
        {"mes": "Fev/26", "atendimentos": 112, "abordagens": 42, "novos_cadastros": 7, "testagens_ist": 15, "reagentes": 3, "encaminhamentos": 24},
        {"mes": "Mar/26", "atendimentos": 118, "abordagens": 44, "novos_cadastros": 8, "testagens_ist": 16, "reagentes": 4, "encaminhamentos": 25},
        {"mes": "Abr/26", "atendimentos": 120, "abordagens": 45, "novos_cadastros": 7, "testagens_ist": 17, "reagentes": 3, "encaminhamentos": 26},
        {"mes": "Mai/26", "atendimentos": 124, "abordagens": 46, "novos_cadastros": 8, "testagens_ist": 18, "reagentes": 4, "encaminhamentos": 27},
        {"mes": "Jun/26", "atendimentos": 128, "abordagens": 48, "novos_cadastros": 8, "testagens_ist": 18, "reagentes": 4, "encaminhamentos": 28},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Pessoas cadastradas — SISRUA",             "valor": 84,  "meta": None, "unidade": "n",  "status": "ok",      "observacao": "Estimativa populacional PSR Apuí: 80–120 — cobertura estimada 70–100%"},
        {"indicador": "Pessoas com CNS vinculado",                "valor": 81.0,"meta": 100,  "unidade": "%",  "status": "atencao", "observacao": "16 sem CNS — maioria homens em situação de rua há >3 anos sem documentação"},
        {"indicador": "Testagem IST/HIV por mês",                 "valor": 18,  "meta": 20,   "unidade": "n",  "status": "atencao", "observacao": "4 reagentes em Jun/26 — todos vinculados ao COAS para tratamento"},
        {"indicador": "Encaminhamentos com resposta/mês",         "valor": 85.7,"meta": 90.0, "unidade": "%",  "status": "atencao", "observacao": "CAPS AD: 6/8 aceitos — SEMAS com maior tempo de espera (48 dias)"},
        {"indicador": "Usuários em redução de danos ativa",       "valor": 32,  "meta": None, "unidade": "n",  "status": "ok",      "observacao": "Kit redução danos: 284 entregues/mês — insumos garantidos Sesa/AM"},
        {"indicador": "Abordagens de rua/mês",                    "valor": 48,  "meta": 60,   "unidade": "n",  "status": "atencao", "observacao": "Equipe de 5 profissionais — expansão prevista no orçamento 2027"},
    ]
