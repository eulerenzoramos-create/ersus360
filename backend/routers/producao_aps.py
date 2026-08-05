from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/producao-aps", tags=["producao-aps"])

@lru_cache(maxsize=1)
def _ATENDIMENTOS():
    return [
        {"mes": "Jan/2026", "medico": 892, "enfermeiro": 640, "odontologia": 312, "outros": 148, "total": 1992},
        {"mes": "Fev/2026", "medico": 810, "enfermeiro": 608, "odontologia": 288, "outros": 132, "total": 1838},
        {"mes": "Mar/2026", "medico": 948, "enfermeiro": 672, "odontologia": 340, "outros": 160, "total": 2120},
        {"mes": "Abr/2026", "medico": 876, "enfermeiro": 620, "odontologia": 298, "outros": 140, "total": 1934},
        {"mes": "Mai/2026", "medico": 920, "enfermeiro": 658, "odontologia": 322, "outros": 152, "total": 2052},
        {"mes": "Jun/2026", "medico": 904, "enfermeiro": 644, "odontologia": 310, "outros": 144, "total": 2002},
        {"mes": "Jul/2026", "medico": 862, "enfermeiro": 618, "odontologia": 295, "outros": 138, "total": 1913},
    ]


@lru_cache(maxsize=1)
def _CIDS():
    return [
        {"codigo": "I10",   "descricao": "Hipertensão essencial (primária)",            "categoria": "Doenças Crônicas",   "atendimentos": 412, "internacoes_evitaveis": 8},
        {"codigo": "E11",   "descricao": "Diabetes mellitus tipo 2",                    "categoria": "Doenças Crônicas",   "atendimentos": 287, "internacoes_evitaveis": 6},
        {"codigo": "J06",   "descricao": "Infecção aguda das vias aéreas superiores",   "categoria": "Infecção Aguda",     "atendimentos": 264, "internacoes_evitaveis": None},
        {"codigo": "B54",   "descricao": "Malária não especificada",                    "categoria": "Doenças Infecciosas","atendimentos": 218, "internacoes_evitaveis": 4},
        {"codigo": "Z34",   "descricao": "Supervisão de gravidez normal",               "categoria": "Saúde da Mulher",    "atendimentos": 196, "internacoes_evitaveis": None},
        {"codigo": "J18",   "descricao": "Pneumonia não especificada",                  "categoria": "Infecção Aguda",     "atendimentos": 148, "internacoes_evitaveis": 12},
        {"codigo": "N39",   "descricao": "Infecção do trato urinário",                  "categoria": "Infecção Aguda",     "atendimentos": 142, "internacoes_evitaveis": None},
        {"codigo": "K21",   "descricao": "Doença do refluxo gastroesofágico",           "categoria": "Gastroenterologia",  "atendimentos": 118, "internacoes_evitaveis": None},
        {"codigo": "F32",   "descricao": "Episódios depressivos",                       "categoria": "Saúde Mental",       "atendimentos": 112, "internacoes_evitaveis": None},
        {"codigo": "Z00",   "descricao": "Exame geral de saúde",                        "categoria": "Prevenção",          "atendimentos": 108, "internacoes_evitaveis": None},
        {"codigo": "A09",   "descricao": "Diarreia e gastroenterite infecciosa",        "categoria": "Infecção Aguda",     "atendimentos": 98,  "internacoes_evitaveis": 3},
        {"codigo": "L30",   "descricao": "Outras dermatites",                           "categoria": "Dermatologia",       "atendimentos": 88,  "internacoes_evitaveis": None},
        {"codigo": "E46",   "descricao": "Desnutrição proteico-calórica",               "categoria": "Nutrição",           "atendimentos": 72,  "internacoes_evitaveis": 2},
        {"codigo": "Z36",   "descricao": "Exame de rastreamento pré-natal",             "categoria": "Saúde da Mulher",    "atendimentos": 68,  "internacoes_evitaveis": None},
        {"codigo": "J45",   "descricao": "Asma",                                        "categoria": "Doenças Crônicas",   "atendimentos": 64,  "internacoes_evitaveis": 5},
    ]


@lru_cache(maxsize=1)
def _FICHAS():
    return [
        {"tipo": "Ficha de Atendimento Individual",              "registros": 1913, "meta_mensal": 1900, "pct": 101},
        {"tipo": "Ficha de Atendimento Odontológico",            "registros": 295,  "meta_mensal": 310,  "pct": 95},
        {"tipo": "Ficha de Visita Domiciliar e Territorial",     "registros": 1240, "meta_mensal": 1300, "pct": 95},
        {"tipo": "Ficha de Cadastro Individual",                 "registros": 148,  "meta_mensal": 120,  "pct": 123},
        {"tipo": "Ficha de Cadastro Domiciliar e Territorial",   "registros": 62,   "meta_mensal": 60,   "pct": 103},
        {"tipo": "Ficha de Atividade Coletiva",                  "registros": 18,   "meta_mensal": 24,   "pct": 75},
        {"tipo": "Ficha de Procedimentos",                       "registros": 412,  "meta_mensal": 400,  "pct": 103},
        {"tipo": "Ficha de Consumo Alimentar",                   "registros": 38,   "meta_mensal": 60,   "pct": 63},
    ]


@router.get("/resumo")
def resumo():
    ultimo = _ATENDIMENTOS()[-1]
    meta   = 1900
    return {
        "atendimentos_mes":                  ultimo["total"],
        "meta_mensal":                       meta,
        "pct_meta":                          round(ultimo["total"] / meta * 100, 1),
        "atendimentos_medico":               ultimo["medico"],
        "atendimentos_enfermeiro":           ultimo["enfermeiro"],
        "consultas_retorno_pct":             64.2,
        "atend_demanda_espontanea_pct":      58.7,
        "fichas_pendentes":                  3,
        "registros_pec_pct":                 96.8,
    }

@router.get("/atendimentos")
def atendimentos():
    return _ATENDIMENTOS

@router.get("/cids")
def cids():
    return _CIDS

@router.get("/fichas")
def fichas():
    return _FICHAS
