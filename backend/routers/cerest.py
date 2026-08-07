"""CEREST — Centro de Referência em Saúde do Trabalhador · FMS Apuí/AM"""
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/cerest", tags=["cerest"])

@lru_cache(maxsize=1)
def _AGRAVOS():
    return [
        {"agravo": "LER/DORT",                        "casos_novos": 8,  "em_acompanhamento": 42, "alta_reabilitacao": 4,  "afastados": 12, "cat_emitidas": 6,  "status": "atencao"},
        {"agravo": "Acidente de trabalho grave",       "casos_novos": 3,  "em_acompanhamento": 12, "alta_reabilitacao": 2,  "afastados": 8,  "cat_emitidas": 3,  "status": "atencao"},
        {"agravo": "Intoxicação por agrotóxico",       "casos_novos": 5,  "em_acompanhamento": 18, "alta_reabilitacao": 3,  "afastados": 4,  "cat_emitidas": 4,  "status": "critico"},
        {"agravo": "Perda auditiva induzida por ruído","casos_novos": 4,  "em_acompanhamento": 28, "alta_reabilitacao": 2,  "afastados": 6,  "cat_emitidas": 2,  "status": "atencao"},
        {"agravo": "Transtorno mental relacionado ao trabalho","casos_novos": 6,"em_acompanhamento": 22,"alta_reabilitacao": 3,"afastados": 14,"cat_emitidas": 5, "status": "critico"},
        {"agravo": "Dermatose ocupacional",            "casos_novos": 2,  "em_acompanhamento": 8,  "alta_reabilitacao": 2,  "afastados": 2,  "cat_emitidas": 1,  "status": "ok"},
        {"agravo": "Dorsalgia/lombalgia ocupacional",  "casos_novos": 7,  "em_acompanhamento": 36, "alta_reabilitacao": 4,  "afastados": 9,  "cat_emitidas": 5,  "status": "atencao"},
    ]


@lru_cache(maxsize=1)
def _SETORES():
    return [
        {"setor": "Extrativismo mineral/madeireiro", "trabalhadores": 2840, "casos_mes": 12, "risco_predominante": "Acidente/agrotóxico", "status": "critico"},
        {"setor": "Agropecuária/pequenos produtores", "trabalhadores": 1680, "casos_mes": 8,  "risco_predominante": "Intoxicação agrotóxico/LER","status": "critico"},
        {"setor": "Serviço público municipal",        "trabalhadores": 1240, "casos_mes": 6,  "risco_predominante": "LER/DORT/TM",          "status": "atencao"},
        {"setor": "Comércio local",                   "trabalhadores": 820,  "casos_mes": 4,  "risco_predominante": "LER/Dorsalgia",         "status": "atencao"},
        {"setor": "Construção civil",                 "trabalhadores": 480,  "casos_mes": 5,  "risco_predominante": "Acidente grave",        "status": "atencao"},
        {"setor": "Pesca artesanal/ribeirinha",       "trabalhadores": 640,  "casos_mes": 3,  "risco_predominante": "Acidente/PAIR",         "status": "atencao"},
        {"setor": "Saúde (trabalhadores da saúde)",   "trabalhadores": 420,  "casos_mes": 4,  "risco_predominante": "TM/LER/biológico",      "status": "atencao"},
    ]


@router.get("/dashboard")
async def dashboard():
    return {
        "casos_novos_mes": 35,
        "em_acompanhamento": 166,
        "cat_emitidas_mes": 26,
        "afastados_inss": 55,
        "alta_reabilitacao_mes": 20,
        "agravos_criticos": 2,
        "pop_trabalhadora_estimada": 8120,
        "setores_monitorados": 7,
        "inspeccoes_ambientais_mes": 4,
        "notificacoes_sinan_mes": 18,
        "intoxicacoes_agrotoxico_mes": 5,
        "acidentes_graves_mes": 3,
        "status_geral": "atencao",
        "competencia": "Jun/2026",
    }

@router.get("/agravos")
async def agravos():
    return _AGRAVOS()

@router.get("/setores")
async def setores():
    return _SETORES()

@router.get("/historico")
async def historico():
    return [
        {"mes": "Jan/26", "casos_novos": 28, "cat_emitidas": 20, "afastados": 48, "intoxicacoes_agrotox": 3, "acidentes_graves": 2},
        {"mes": "Fev/26", "casos_novos": 30, "cat_emitidas": 22, "afastados": 50, "intoxicacoes_agrotox": 4, "acidentes_graves": 2},
        {"mes": "Mar/26", "casos_novos": 32, "cat_emitidas": 24, "afastados": 52, "intoxicacoes_agrotox": 4, "acidentes_graves": 3},
        {"mes": "Abr/26", "casos_novos": 31, "cat_emitidas": 23, "afastados": 51, "intoxicacoes_agrotox": 5, "acidentes_graves": 2},
        {"mes": "Mai/26", "casos_novos": 33, "cat_emitidas": 25, "afastados": 53, "intoxicacoes_agrotox": 4, "acidentes_graves": 3},
        {"mes": "Jun/26", "casos_novos": 35, "cat_emitidas": 26, "afastados": 55, "intoxicacoes_agrotox": 5, "acidentes_graves": 3},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Notificações de acidentes de trabalho/mês",          "valor": 26,  "meta": None, "unidade": "n",  "status": "atencao", "observacao": "CAT emitidas pelo CEREST — subnotificação estimada 60% no extrativismo"},
        {"indicador": "Intoxicações por agrotóxico — notificação SINAN",    "valor": 5,   "meta": None, "unidade": "n",  "status": "critico", "observacao": "5 casos em Jun/26 — extrativismo e agropecuária; 3 hospitalizados"},
        {"indicador": "Trabalhadores em acompanhamento reabilitação",       "valor": 166, "meta": None, "unidade": "n",  "status": "atencao", "observacao": "LER/DORT e dorsalgia lideram — equipe com 1 fisioterapeuta insuficiente"},
        {"indicador": "Transtornos mentais relacionados ao trabalho",       "valor": 6,   "meta": None, "unidade": "casos novos/mês", "status": "critico", "observacao": "22 em acompanhamento — subnotificação provável no setor de saúde"},
        {"indicador": "Inspeções sanitárias em ambientes de trabalho/mês", "valor": 4,   "meta": 8,    "unidade": "n",  "status": "atencao", "observacao": "Meta não atingida por déficit de ASAVS no CEREST municipal"},
        {"indicador": "Setores com risco crítico monitorados",              "valor": 2,   "meta": 0,    "unidade": "n",  "status": "critico", "observacao": "Extrativismo e agropecuária com maior incidência — plano de ação em elaboração"},
    ]