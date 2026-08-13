"""
Router: /api/producao-aps — Producao APS (e-SUS PEC / SISAB)
Dados de referencia municipal para Apui/AM (~21.781 hab).
situacao_dado = "referencia_municipal" em todos os endpoints.
"""
from __future__ import annotations
from fastapi import APIRouter, Depends
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/producao-aps", tags=["producao-aps"])


@router.get("/resumo")
async def resumo(_: UserOut = Depends(get_current_user)):
    """Resumo producao APS — referencia municipal Apui/AM."""
    return {
        "situacao_dado":                   "referencia_municipal",
        "municipio":                       "Apui/AM",
        "competencia":                     "Jun/2026",
        "atendimentos_mes":                3_847,
        "meta_mensal":                     4_200,
        "pct_meta":                        91.6,
        "atendimentos_medico":             1_542,
        "atendimentos_enfermeiro":         1_204,
        "atendimentos_odontologia":         612,
        "atendimentos_outros":               489,
        "consultas_retorno_pct":           34.2,
        "atend_demanda_espontanea_pct":    58.7,
        "fichas_pendentes":                 143,
        "registros_pec_pct":               84.3,
        "nota": "Referencia municipal — valores plausíveis para 4 equipes ESF em Apui/AM (21.781 hab).",
    }


@router.get("/atendimentos")
async def atendimentos(_: UserOut = Depends(get_current_user)):
    """Atendimentos mensais por profissional — referencia municipal 2026."""
    return [
        {"mes": "Jan/26", "medico": 1_480, "enfermeiro": 1_160, "odontologia":  588, "outros": 384, "total": 3_612},
        {"mes": "Fev/26", "medico": 1_402, "enfermeiro": 1_104, "odontologia":  571, "outros": 411, "total": 3_488},
        {"mes": "Mar/26", "medico": 1_521, "enfermeiro": 1_189, "odontologia":  601, "outros": 430, "total": 3_741},
        {"mes": "Abr/26", "medico": 1_498, "enfermeiro": 1_175, "odontologia":  598, "outros": 424, "total": 3_695},
        {"mes": "Mai/26", "medico": 1_531, "enfermeiro": 1_198, "odontologia":  614, "outros": 477, "total": 3_820},
        {"mes": "Jun/26", "medico": 1_542, "enfermeiro": 1_204, "odontologia":  612, "outros": 489, "total": 3_847},
    ]


@router.get("/cids")
async def cids(_: UserOut = Depends(get_current_user)):
    """CIDs mais frequentes na APS — referencia municipal Apui/AM."""
    return [
        {"codigo": "Z00",  "descricao": "Exame geral de saude",                       "categoria": "Preventivo",          "atendimentos": 612, "internacoes_evitaveis": None},
        {"codigo": "J06",  "descricao": "Infeccoes agudas das vias aereas superiores", "categoria": "Respiratorio",        "atendimentos": 487, "internacoes_evitaveis": None},
        {"codigo": "I10",  "descricao": "Hipertensao essencial",                       "categoria": "DCNT",                "atendimentos": 421, "internacoes_evitaveis": 28},
        {"codigo": "K21",  "descricao": "Doenca de refluxo gastroesofagico",           "categoria": "Gastrointestinal",    "atendimentos": 318, "internacoes_evitaveis": None},
        {"codigo": "E11",  "descricao": "Diabetes mellitus tipo 2",                    "categoria": "DCNT",                "atendimentos": 297, "internacoes_evitaveis": 19},
        {"codigo": "Z34",  "descricao": "Supervisao de gestacao normal",               "categoria": "Materno-infantil",    "atendimentos": 289, "internacoes_evitaveis": None},
        {"codigo": "J18",  "descricao": "Pneumonia nao especificada",                  "categoria": "Respiratorio",        "atendimentos": 184, "internacoes_evitaveis": 42},
        {"codigo": "A90",  "descricao": "Dengue",                                      "categoria": "Endemias",            "atendimentos": 176, "internacoes_evitaveis": None},
        {"codigo": "K59",  "descricao": "Outros transtornos funcionais do intestino",  "categoria": "Gastrointestinal",    "atendimentos": 162, "internacoes_evitaveis": None},
        {"codigo": "F41",  "descricao": "Outros transtornos ansiosos",                 "categoria": "Saude Mental",        "atendimentos": 148, "internacoes_evitaveis": None},
        {"codigo": "N39",  "descricao": "Outros transtornos do aparelho urinario",     "categoria": "Urogenital",          "atendimentos": 134, "internacoes_evitaveis": None},
        {"codigo": "B54",  "descricao": "Malaria nao especificada",                    "categoria": "Endemias",            "atendimentos": 121, "internacoes_evitaveis": 8},
        {"codigo": "Z12",  "descricao": "Exame especial de rastreamento de neoplasias","categoria": "Preventivo",          "atendimentos": 118, "internacoes_evitaveis": None},
        {"codigo": "L30",  "descricao": "Outras dermatites",                           "categoria": "Dermatologico",       "atendimentos":  97, "internacoes_evitaveis": None},
        {"codigo": "M54",  "descricao": "Dorsalgia",                                   "categoria": "Musculoesqueletico",  "atendimentos":  89, "internacoes_evitaveis": None},
    ]


@router.get("/fichas")
async def fichas(_: UserOut = Depends(get_current_user)):
    """Fichas SISAB/CAP — referencia municipal Apui/AM."""
    return [
        {"tipo": "Ficha de Atendimento Individual",          "registros": 3_847, "meta_mensal": 4_200, "pct": 91.6},
        {"tipo": "Ficha de Atendimento Odontologico",        "registros":   612, "meta_mensal":   700, "pct": 87.4},
        {"tipo": "Ficha de Atividade Coletiva",              "registros":   214, "meta_mensal":   200, "pct": 107.0},
        {"tipo": "Ficha de Cadastro Individual (CDS)",       "registros":   328, "meta_mensal":   350, "pct": 93.7},
        {"tipo": "Ficha de Cadastro Domiciliar",             "registros":   184, "meta_mensal":   200, "pct": 92.0},
        {"tipo": "Ficha de Visita Domiciliar",               "registros": 1_842, "meta_mensal": 2_000, "pct": 92.1},
        {"tipo": "Ficha de Procedimentos",                   "registros":   541, "meta_mensal":   600, "pct": 90.2},
        {"tipo": "Marcadores de Consumo Alimentar",          "registros":   187, "meta_mensal":   200, "pct": 93.5},
        {"tipo": "Ficha de Vacinacao",                       "registros":   412, "meta_mensal":   450, "pct": 91.6},
    ]
