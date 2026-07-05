"""Gestão de Leitos — Ocupação · Espera · Causas · SISREG · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/gestao-leitos", tags=["gestao_leitos"])

@router.get("/dashboard")
async def dashboard():
    return {
        "leitos_total": 48,
        "leitos_ocupados": 42,
        "taxa_ocupacao_pct": 87.5,
        "meta_ocupacao_max_pct": 85,
        "leitos_clinica_medica": 24,
        "leitos_cirurgicos": 12,
        "leitos_obstetricia": 8,
        "leitos_pediatria": 4,
        "internacoes_mes": 124,
        "media_permanencia_dias": 4.8,
        "meta_permanencia_dias": 4.0,
        "alta_hospitalar_mes": 118,
        "obitos_hospitalares_mes": 4,
        "taxa_obito_hospitalar_pct": 3.2,
        "lista_espera_eletiva": 68,
        "transferencias_manaus_mes": 12,
        "status_geral": "atencao",
    }

@router.get("/leitos-clinica")
async def leitos_clinica():
    return [
        {"clinica": "Clínica Médica",       "total": 24, "ocupados": 22, "disponíveis": 2,  "taxa_pct": 91.7, "media_perm_dias": 5.2, "meta_perm": 4.0, "internacoes_mes": 56, "status": "critico"},
        {"clinica": "Cirurgia Geral",        "total": 12, "ocupados": 10, "disponíveis": 2,  "taxa_pct": 83.3, "media_perm_dias": 4.4, "meta_perm": 3.5, "internacoes_mes": 28, "status": "atencao"},
        {"clinica": "Obstetrícia",           "total": 8,  "ocupados": 7,  "disponíveis": 1,  "taxa_pct": 87.5, "media_perm_dias": 2.8, "meta_perm": 2.5, "internacoes_mes": 28, "status": "atencao"},
        {"clinica": "Pediatria",             "total": 4,  "ocupados": 3,  "disponíveis": 1,  "taxa_pct": 75.0, "media_perm_dias": 4.2, "meta_perm": 3.0, "internacoes_mes": 12, "status": "ok"},
    ]

@router.get("/lista-espera")
async def lista_espera():
    return [
        {"especialidade": "Ortopedia",             "espera": 18, "tempo_medio_dias": 28, "urgentes": 2, "eletivos": 16, "status": "atencao"},
        {"especialidade": "Cirurgia Geral",        "espera": 14, "tempo_medio_dias": 22, "urgentes": 3, "eletivos": 11, "status": "atencao"},
        {"especialidade": "Ginecologia",           "espera": 12, "tempo_medio_dias": 18, "urgentes": 1, "eletivos": 11, "status": "atencao"},
        {"especialidade": "Urologia",              "espera": 10, "tempo_medio_dias": 35, "urgentes": 0, "eletivos": 10, "status": "atencao"},
        {"especialidade": "Neurologia (TFD)",      "espera": 8,  "tempo_medio_dias": 45, "urgentes": 2, "eletivos": 6,  "status": "critico"},
        {"especialidade": "Cardiologia (TFD)",     "espera": 6,  "tempo_medio_dias": 38, "urgentes": 2, "eletivos": 4,  "status": "critico"},
    ]

@router.get("/causas")
async def causas():
    return [
        {"cid_grupo": "J00-J99", "descricao": "Doenças resp. (pneumonia, bronquite)",  "internacoes": 28, "pct": 22.6, "media_perm": 5.8, "obitos": 1, "transferencias": 2},
        {"cid_grupo": "K00-K93", "descricao": "Doenças digestivas",                    "internacoes": 22, "pct": 17.7, "media_perm": 4.2, "obitos": 0, "transferencias": 1},
        {"cid_grupo": "O00-O99", "descricao": "Gravidez, parto e puerpério",           "internacoes": 28, "pct": 22.6, "media_perm": 2.8, "obitos": 0, "transferencias": 0},
        {"cid_grupo": "S00-T98", "descricao": "Lesões e causas externas (traumas)",    "internacoes": 18, "pct": 14.5, "media_perm": 5.4, "obitos": 1, "transferencias": 4},
        {"cid_grupo": "A00-B99", "descricao": "Doenças infecciosas (malária, diarr.)", "internacoes": 14, "pct": 11.3, "media_perm": 4.6, "obitos": 1, "transferencias": 2},
        {"cid_grupo": "I00-I99", "descricao": "Doenças cardiovasculares (IAM/AVC)",   "internacoes": 8,  "pct": 6.5,  "media_perm": 6.8, "obitos": 1, "transferencias": 3},
        {"cid_grupo": "Outros",  "descricao": "Outros CID",                            "internacoes": 6,  "pct": 4.8,  "media_perm": 3.8, "obitos": 0, "transferencias": 0},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Out/25", "internacoes": 112, "alta": 108, "obitos": 3, "taxa_ocup": 82.4, "media_perm": 4.4, "espera": 58, "transferencias": 10},
        {"mes": "Nov/25", "internacoes": 116, "alta": 112, "obitos": 3, "taxa_ocup": 84.6, "media_perm": 4.6, "espera": 60, "transferencias": 11},
        {"mes": "Dez/25", "internacoes": 118, "alta": 114, "obitos": 4, "taxa_ocup": 85.4, "media_perm": 4.8, "espera": 62, "transferencias": 11},
        {"mes": "Jan/26", "internacoes": 120, "alta": 115, "obitos": 3, "taxa_ocup": 86.0, "media_perm": 4.8, "espera": 64, "transferencias": 11},
        {"mes": "Fev/26", "internacoes": 122, "alta": 116, "obitos": 4, "taxa_ocup": 87.0, "media_perm": 4.8, "espera": 66, "transferencias": 12},
        {"mes": "Mar/26", "internacoes": 124, "alta": 118, "obitos": 4, "taxa_ocup": 87.5, "media_perm": 4.8, "espera": 68, "transferencias": 12},
    ]
