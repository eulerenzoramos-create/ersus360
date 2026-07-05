"""
Gestão de Leitos — Apuí/AM
Taxa de ocupação · Rotatividade · Internações · UTI · Alta
Portaria GM/MS nº 1.101/2002 (parâmetros assistenciais)
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/gestao-leitos", tags=["Gestão de Leitos"])

_DASHBOARD = {
    "competencia": "Mar/2026",
    "leitos_total": 28,
    "leitos_ocupados": 19,
    "taxa_ocupacao_pct": 67.9,
    "taxa_ocupacao_status": "ok",
    "media_permanencia_dias": 4.2,
    "giro_cama": 6.8,
    "internacoes_mes": 112,
    "altas_mes": 108,
    "transferencias_saida_mes": 17,
    "obitos_internacao_mes": 2,
    "lista_espera_cirurgia": 24,
    "lista_espera_status": "atencao",
}

_LEITOS_POR_CLINICA = [
    {"clinica":"Clínica Médica",         "total":12,"ocupados":9, "taxa_pct":75.0,"permanencia_med":4.8,"status":"atencao"},
    {"clinica":"Cirúrgico",              "total":6, "ocupados":4, "taxa_pct":66.7,"permanencia_med":3.6,"status":"ok"},
    {"clinica":"Obstetrícia",            "total":4, "ocupados":3, "taxa_pct":75.0,"permanencia_med":2.4,"status":"atencao"},
    {"clinica":"Pediátrico",             "total":4, "ocupados":2, "taxa_pct":50.0,"permanencia_med":3.1,"status":"ok"},
    {"clinica":"Isolamento / Infecto",   "total":2, "ocupados":1, "taxa_pct":50.0,"permanencia_med":8.2,"status":"ok"},
]

_INTERNACOES_HISTORICO = [
    {"mes":"Out/25","internacoes":98, "altas":94, "transferencias":14,"obitos":2,"permanencia_med":3.9,"taxa_ocupacao":64.3},
    {"mes":"Nov/25","internacoes":102,"altas":99, "transferencias":15,"obitos":1,"permanencia_med":4.1,"taxa_ocupacao":65.8},
    {"mes":"Dez/25","internacoes":88, "altas":85, "transferencias":12,"obitos":1,"permanencia_med":4.4,"taxa_ocupacao":62.1},
    {"mes":"Jan/26","internacoes":108,"altas":104,"transferencias":16,"obitos":2,"permanencia_med":4.0,"taxa_ocupacao":66.2},
    {"mes":"Fev/26","internacoes":104,"altas":101,"transferencias":15,"obitos":1,"permanencia_med":4.3,"taxa_ocupacao":65.4},
    {"mes":"Mar/26","internacoes":112,"altas":108,"transferencias":17,"obitos":2,"permanencia_med":4.2,"taxa_ocupacao":67.9},
]

_CAUSAS_INTERNACAO = [
    {"capitulo_cid":"J — Respiratório",     "internacoes":24,"pct":21.4,"permanencia_med":4.8},
    {"capitulo_cid":"K — Digestivo",        "internacoes":18,"pct":16.1,"permanencia_med":3.6},
    {"capitulo_cid":"S/T — Traumatismos",   "internacoes":16,"pct":14.3,"permanencia_med":5.2},
    {"capitulo_cid":"O — Gravidez/Parto",   "internacoes":14,"pct":12.5,"permanencia_med":2.4},
    {"capitulo_cid":"I — Cardiovascular",   "internacoes":12,"pct":10.7,"permanencia_med":6.1},
    {"capitulo_cid":"A/B — Infecciosas",    "internacoes":11,"pct":9.8, "permanencia_med":7.4},
    {"capitulo_cid":"N — Geniturinário",    "internacoes":8, "pct":7.1, "permanencia_med":3.8},
    {"capitulo_cid":"Outras causas",        "internacoes":9, "pct":8.0, "permanencia_med":3.2},
]

_LISTA_ESPERA_CIRURGIA = [
    {"procedimento":"Herniorrafia inguinal",  "aguardando":8, "espera_media_dias":48,"prioridade":"eletiva"},
    {"procedimento":"Colecistectomia",        "aguardando":6, "espera_media_dias":62,"prioridade":"eletiva"},
    {"procedimento":"Apendicectomia (aguda)", "aguardando":0, "espera_media_dias":0, "prioridade":"urgencia"},
    {"procedimento":"Cesariana eletiva",      "aguardando":4, "espera_media_dias":28,"prioridade":"eletiva"},
    {"procedimento":"Postectomia",            "aguardando":3, "espera_media_dias":74,"prioridade":"eletiva"},
    {"procedimento":"Amputação MMII (DM)",   "aguardando":2, "espera_media_dias":18,"prioridade":"urgencia","alerta":"DM descompensado — avaliar urgência"},
    {"procedimento":"Tireoidectomia",        "aguardando":1, "espera_media_dias":92,"prioridade":"eletiva"},
]

@router.get("/dashboard")
async def dashboard():
    return _DASHBOARD

@router.get("/leitos-clinica")
async def leitos_clinica():
    return _LEITOS_POR_CLINICA

@router.get("/historico")
async def historico():
    return _INTERNACOES_HISTORICO

@router.get("/causas")
async def causas():
    return _CAUSAS_INTERNACAO

@router.get("/lista-espera")
async def lista_espera():
    return _LISTA_ESPERA_CIRURGIA
