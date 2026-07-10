"""Acesso a Especialidades Médicas — TFD / Regulação / Fila de Espera · Apuí/AM"""
from fastapi import APIRouter
router = APIRouter(prefix="/api/acesso-especialidades-apui", tags=["Acesso Especialidades Apuí"])

DASHBOARD = {
    "total_aguardando_consulta": 487,
    "total_aguardando_exame": 312,
    "tempo_espera_medio_dias": 184,
    "meta_espera_dias": 60,
    "especialidades_disponiveis_municipio": 2,
    "especialidades_via_tfd": 18,
    "tfd_processos_ativos": 94,
    "tfd_processos_deferidos_pct": 78.7,
    "status": "critico",
}

ESPECIALIDADES = [
    {"especialidade": "Cardiologia",     "fila": 84, "espera_media_dias": 240, "disponivel_municipio": False, "referencia": "Manaus — HPS"},
    {"especialidade": "Ortopedia",       "fila": 76, "espera_media_dias": 210, "disponivel_municipio": False, "referencia": "Manaus — HGT"},
    {"especialidade": "Neurologia",      "fila": 48, "espera_media_dias": 280, "disponivel_municipio": False, "referencia": "Manaus — HFMCA"},
    {"especialidade": "Oftalmologia",    "fila": 62, "espera_media_dias": 168, "disponivel_municipio": False, "referencia": "Lábrea (parcial)"},
    {"especialidade": "Endocrinologia",  "fila": 41, "espera_media_dias": 310, "disponivel_municipio": False, "referencia": "Manaus"},
    {"especialidade": "Urologia",        "fila": 38, "espera_media_dias": 260, "disponivel_municipio": False, "referencia": "Manaus"},
    {"especialidade": "Ginecologia",     "fila": 54, "espera_media_dias": 120, "disponivel_municipio": True,  "referencia": "UBS Central (parcial)"},
    {"especialidade": "Pediatria",       "fila": 28, "espera_media_dias": 90,  "disponivel_municipio": True,  "referencia": "UBS Central"},
    {"especialidade": "Dermatologia",    "fila": 34, "espera_media_dias": 220, "disponivel_municipio": False, "referencia": "Manaus"},
    {"especialidade": "Reumatologia",    "fila": 22, "espera_media_dias": 340, "disponivel_municipio": False, "referencia": "Manaus"},
]

TFD = [
    {"mes": "Jan/25", "solicitacoes": 14, "deferidos": 11, "indeferidos": 2, "pendentes": 1, "custo_transporte": 28400},
    {"mes": "Fev/25", "solicitacoes": 16, "deferidos": 13, "indeferidos": 1, "pendentes": 2, "custo_transporte": 32800},
    {"mes": "Mar/25", "solicitacoes": 18, "deferidos": 14, "indeferidos": 2, "pendentes": 2, "custo_transporte": 36200},
    {"mes": "Abr/25", "solicitacoes": 15, "deferidos": 12, "indeferidos": 2, "pendentes": 1, "custo_transporte": 30600},
    {"mes": "Mai/25", "solicitacoes": 17, "deferidos": 13, "indeferidos": 2, "pendentes": 2, "custo_transporte": 34400},
    {"mes": "Jun/25", "solicitacoes": 19, "deferidos": 15, "indeferidos": 2, "pendentes": 2, "custo_transporte": 38400},
]

HISTORICO = [
    {"mes": "Jan/25", "fila_consultas": 420, "fila_exames": 268, "tempo_espera": 196, "tfd_viagens": 11},
    {"mes": "Fev/25", "fila_consultas": 438, "fila_exames": 280, "tempo_espera": 192, "tfd_viagens": 13},
    {"mes": "Mar/25", "fila_consultas": 452, "fila_exames": 290, "tempo_espera": 188, "tfd_viagens": 14},
    {"mes": "Abr/25", "fila_consultas": 464, "fila_exames": 298, "tempo_espera": 186, "tfd_viagens": 12},
    {"mes": "Mai/25", "fila_consultas": 474, "fila_exames": 306, "tempo_espera": 185, "tfd_viagens": 13},
    {"mes": "Jun/25", "fila_consultas": 487, "fila_exames": 312, "tempo_espera": 184, "tfd_viagens": 15},
]

INDICADORES = [
    {"indicador": "Fila total consultas",             "valor": 487,   "meta": "≤ 200",  "status": "critico"},
    {"indicador": "Tempo espera médio",               "valor": "184d","meta": "≤ 60d",  "status": "critico"},
    {"indicador": "Especialidades no município",       "valor": 2,     "meta": 6,        "status": "critico"},
    {"indicador": "Taxa deferimento TFD",             "valor": "78.7%","meta": "85%",   "status": "atencao"},
    {"indicador": "Custo TFD/mês (médio)",            "valor": "R$ 33,5k","meta": "—",  "status": "atencao"},
    {"indicador": "Telessaúde segunda opinião",       "valor": "Parcial","meta": "Pleno","status": "atencao"},
]

@router.get("/dashboard")
def dashboard():       return DASHBOARD
@router.get("/especialidades")
def especialidades():  return ESPECIALIDADES
@router.get("/tfd")
def tfd():             return TFD
@router.get("/historico")
def historico():       return HISTORICO
@router.get("/indicadores")
def indicadores():     return INDICADORES
