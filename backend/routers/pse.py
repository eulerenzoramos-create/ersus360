"""PSE — Programa Saúde na Escola · Avaliações · Ações · Cobertura · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/pse", tags=["pse"])

@router.get("/dashboard")
async def dashboard():
    return {
        "escolas_cadastradas": 14,
        "escolas_com_acao_mes": 11,
        "cobertura_escolas_pct": 78.6,
        "meta_cobertura_pct": 100,
        "alunos_avaliados_mes": 468,
        "total_alunos_matriculados": 2840,
        "cobertura_alunos_pct": 16.5,
        "acoes_realizadas_mes": 38,
        "acoes_planejadas_mes": 48,
        "proporcao_acoes_pct": 79.2,
        "alteracoes_encontradas_pct": 22.4,
        "encaminhamentos_mes": 68,
        "status_geral": "atencao",
    }

@router.get("/escolas")
async def escolas():
    return [
        {"escola": "E.M. Prof. Raimundo Pereira",  "alunos": 386, "avaliados_mes": 86,  "acoes_mes": 4, "equipe_responsavel": "ESF Centro",    "status": "ok"},
        {"escola": "E.M. Dom Pedro II",             "alunos": 312, "avaliados_mes": 62,  "acoes_mes": 3, "equipe_responsavel": "ESF Centro",    "status": "ok"},
        {"escola": "E.M. Tiradentes",               "alunos": 284, "avaliados_mes": 72,  "acoes_mes": 4, "equipe_responsavel": "ESF Bela Vista", "status": "ok"},
        {"escola": "E.E. Prof. Antônio Rodrigues",  "alunos": 448, "avaliados_mes": 84,  "acoes_mes": 5, "equipe_responsavel": "ESF Centro",    "status": "ok"},
        {"escola": "E.M. Matupi I",                 "alunos": 182, "avaliados_mes": 48,  "acoes_mes": 3, "equipe_responsavel": "ESF Matupi",    "status": "ok"},
        {"escola": "E.M. Matupi II",                "alunos": 124, "avaliados_mes": 38,  "acoes_mes": 2, "equipe_responsavel": "ESF Matupi",    "status": "ok"},
        {"escola": "E.M. Rio Itaparana",            "alunos": 68,  "avaliados_mes": 28,  "acoes_mes": 2, "equipe_responsavel": "ESF Itaparana", "status": "ok"},
        {"escola": "E.M. Vila Nova",                "alunos": 96,  "avaliados_mes": 18,  "acoes_mes": 1, "equipe_responsavel": "ESF Bela Vista", "status": "atencao"},
        {"escola": "Creche Infante",                "alunos": 84,  "avaliados_mes": 32,  "acoes_mes": 3, "equipe_responsavel": "ESF Centro",    "status": "ok"},
        {"escola": "E.M. São Francisco",            "alunos": 124, "avaliados_mes": 0,   "acoes_mes": 0, "equipe_responsavel": "Sem equipe",    "status": "critico"},
        {"escola": "E.M. Área Rural I",             "alunos": 48,  "avaliados_mes": 0,   "acoes_mes": 0, "equipe_responsavel": "Sem equipe",    "status": "critico"},
        {"escola": "E.M. Área Rural II",            "alunos": 36,  "avaliados_mes": 0,   "acoes_mes": 0, "equipe_responsavel": "Sem equipe",    "status": "critico"},
        {"escola": "E.M. Poço de Paciência",        "alunos": 424, "avaliados_mes": 0,   "acoes_mes": 0, "equipe_responsavel": "Não aderida",   "status": "critico"},
        {"escola": "E.E. Cícero Bezerra",           "alunos": 224, "avaliados_mes": 0,   "acoes_mes": 0, "equipe_responsavel": "Não aderida",   "status": "critico"},
    ]

@router.get("/acoes")
async def acoes():
    return [
        {"acao": "Avaliação antropométrica",              "realizadas": 6, "planejadas": 6, "alunos": 168, "alteracoes": 28},
        {"acao": "Triagem visual",                        "realizadas": 5, "planejadas": 6, "alunos": 146, "alteracoes": 32},
        {"acao": "Triagem auditiva",                      "realizadas": 4, "planejadas": 6, "alunos": 118, "alteracoes": 8},
        {"acao": "Saúde bucal — triagem",                 "realizadas": 5, "planejadas": 6, "alunos": 124, "alteracoes": 56},
        {"acao": "Vacinação em escola",                   "realizadas": 3, "planejadas": 4, "alunos": 204, "alteracoes": 0},
        {"acao": "Promoção alimentação saudável",         "realizadas": 4, "planejadas": 4, "alunos": 312, "alteracoes": 0},
        {"acao": "Prevenção doenças negligenciadas",      "realizadas": 3, "planejadas": 4, "alunos": 186, "alteracoes": 0},
        {"acao": "Saúde sexual e reprodutiva (EF/EM)",   "realizadas": 2, "planejadas": 4, "alunos": 86,  "alteracoes": 0},
        {"acao": "Saúde mental / bullying",               "realizadas": 3, "planejadas": 4, "alunos": 248, "alteracoes": 0},
        {"acao": "Prevenção violência / drogas",          "realizadas": 3, "planejadas": 4, "alunos": 198, "alteracoes": 0},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Out/25", "acoes": 28, "alunos_avaliados": 324, "encaminhamentos": 48, "cobertura_pct": 11.4},
        {"mes": "Nov/25", "acoes": 32, "alunos_avaliados": 386, "encaminhamentos": 54, "cobertura_pct": 13.6},
        {"mes": "Dez/25", "acoes": 14, "alunos_avaliados": 148, "encaminhamentos": 22, "cobertura_pct":  5.2},
        {"mes": "Jan/26", "acoes": 36, "alunos_avaliados": 402, "encaminhamentos": 58, "cobertura_pct": 14.2},
        {"mes": "Fev/26", "acoes": 42, "alunos_avaliados": 438, "encaminhamentos": 62, "cobertura_pct": 15.4},
        {"mes": "Mar/26", "acoes": 38, "alunos_avaliados": 468, "encaminhamentos": 68, "cobertura_pct": 16.5},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Cobertura de escolas com ações",     "valor": 78.6, "meta": 100, "unidade": "%", "status": "atencao", "observacao": "3 escolas rurais sem equipe vinculada"},
        {"indicador": "Cobertura de alunos avaliados",      "valor": 16.5, "meta": 50,  "unidade": "%", "status": "critico", "observacao": "Meta PSE: ≥50% dos alunos/ciclo"},
        {"indicador": "Execução de ações planejadas",       "valor": 79.2, "meta": 90,  "unidade": "%", "status": "atencao", "observacao": "10 ações não realizadas"},
        {"indicador": "Encaminhamentos realizados",         "valor": 68,   "meta": None, "unidade": "un","status": "ok",      "observacao": "Triagem visual + saúde bucal — maiores demandas"},
        {"indicador": "Escolas sem equipe PSE",             "valor": 3,    "meta": 0,   "unidade": "un","status": "critico", "observacao": "E.M. S.Francisco, Área Rural I e II"},
        {"indicador": "Escolas não aderidas",               "valor": 2,    "meta": 0,   "unidade": "un","status": "atencao", "observacao": "Poço de Paciência + Cícero Bezerra — negociar adesão"},
    ]
