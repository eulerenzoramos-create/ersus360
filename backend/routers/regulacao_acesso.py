"""
Regulação de Acesso / SISREG — Apuí/AM
Referências ambulatoriais e hospitalares · Especialidades · Exames
Central de Regulação · TFD · Linha de Cuidado
"""
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/regulacao-acesso", tags=["Regulação de Acesso"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "competencia": "Mar/2026",
        "solicitacoes_mes": 184,
        "solicitacoes_pendentes": 312,
        "autorizadas_mes_pct": 68.4,
        "negadas_mes_pct": 8.2,
        "espera_media_dias": 38,
        "espera_media_status": "atencao",
        "tfd_ativos": 12,
        "tfd_status": "atencao",
        "solicitacoes_criticas": 18,
    }


@lru_cache(maxsize=1)
def _ESPECIALIDADES():
    return [
        {"especialidade":"Cardiologia",          "pendentes":48,"espera_media_dias":52,"autorizados_mes":18,"negados_mes":2,"status":"critico","observacao":"Único cardiologista em Humaitá"},
        {"especialidade":"Ortopedia",            "pendentes":42,"espera_media_dias":44,"autorizados_mes":22,"negados_mes":1,"status":"atencao","observacao":"Agendamento via SISREG Humaitá"},
        {"especialidade":"Oftalmologia",         "pendentes":38,"espera_media_dias":68,"autorizados_mes":12,"negados_mes":0,"status":"critico","observacao":"Cirurgia catarata fila 6 meses"},
        {"especialidade":"Urologia",             "pendentes":24,"espera_media_dias":41,"autorizados_mes":14,"negados_mes":1,"status":"atencao","observacao":"PSA elevado — prioridade oncológica"},
        {"especialidade":"Neurologia",           "pendentes":18,"espera_media_dias":74,"autorizados_mes":8, "negados_mes":2,"status":"critico","observacao":"Epilepsia / AVC sem controle"},
        {"especialidade":"Endocrinologia",       "pendentes":22,"espera_media_dias":58,"autorizados_mes":10,"negados_mes":0,"status":"critico","observacao":"DM + HAS descompensados"},
        {"especialidade":"Gastroenterologia",    "pendentes":16,"espera_media_dias":38,"autorizados_mes":12,"negados_mes":1,"status":"atencao","observacao":"Colonoscopia rastreio câncer"},
        {"especialidade":"Ginecologia/Obstet.","pendentes":28,"espera_media_dias":22,"autorizados_mes":24,"negados_mes":0,"status":"ok",    "observacao":"Pré-natal alto risco"},
        {"especialidade":"Psiquiatria",          "pendentes":14,"espera_media_dias":82,"autorizados_mes":6, "negados_mes":3,"status":"critico","observacao":"CAPS sem psiquiatra fixo"},
        {"especialidade":"Oncologia",            "pendentes":8, "espera_media_dias":18,"autorizados_mes":8, "negados_mes":0,"status":"atencao","observacao":"Prioridade oncológica"},
    ]


@lru_cache(maxsize=1)
def _EXAMES_COMPLEMENTARES():
    return [
        {"exame":"Tomografia computadorizada",  "pendentes":32,"espera_media_dias":28,"status":"atencao"},
        {"exame":"Ressonância magnética",       "pendentes":18,"espera_media_dias":62,"status":"critico"},
        {"exame":"Ecocardiograma",              "pendentes":24,"espera_media_dias":44,"status":"atencao"},
        {"exame":"Endoscopia digestiva alta",   "pendentes":14,"espera_media_dias":38,"status":"atencao"},
        {"exame":"Colonoscopia",               "pendentes":12,"espera_media_dias":54,"status":"critico"},
        {"exame":"Cateterismo cardíaco",        "pendentes":4, "espera_media_dias":72,"status":"critico"},
        {"exame":"Mamografia",                 "pendentes":22,"espera_media_dias":32,"status":"atencao"},
        {"exame":"Densitometria óssea",        "pendentes":10,"espera_media_dias":48,"status":"atencao"},
    ]


@lru_cache(maxsize=1)
def _TFD():
    return [
        {"id":"TFD-001","especialidade":"Oncologia","destino":"Manaus","frequencia":"Mensal","custo_viagem":1240.0,"status":"ativo","alerta":None},
        {"id":"TFD-002","especialidade":"Cardiologia intervencionista","destino":"Manaus","frequencia":"Eventual","custo_viagem":1240.0,"status":"ativo","alerta":"Cateterismo cardíaco urgente"},
        {"id":"TFD-003","especialidade":"Neurologia","destino":"Manaus","frequencia":"Trimestral","custo_viagem":1240.0,"status":"ativo","alerta":None},
        {"id":"TFD-004","especialidade":"Hematologia (leucemia)","destino":"Manaus","frequencia":"Semanal","custo_viagem":1240.0,"status":"ativo","alerta":"Paciente em QT — custo elevado"},
        {"id":"TFD-005","especialidade":"Nefrologia/Diálise","destino":"Humaitá","frequencia":"3x/semana","custo_viagem":480.0,"status":"ativo","alerta":"Diálise — deslocamento crítico"},
        {"id":"TFD-006","especialidade":"Oftalmologia","destino":"Humaitá","frequencia":"Semestral","custo_viagem":480.0,"status":"ativo","alerta":None},
        {"id":"TFD-007","especialidade":"Cirurgia cardiovascular","destino":"Manaus","frequencia":"Eventual","custo_viagem":1240.0,"status":"pendente","alerta":"Aguardando autorização SES/AM"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO_MENSAL():
    return [
        {"mes":"Out/25","solicitacoes":162,"autorizadas":112,"negadas":14,"pendentes":280,"espera_media":36},
        {"mes":"Nov/25","solicitacoes":168,"autorizadas":116,"negadas":12,"pendentes":288,"espera_media":37},
        {"mes":"Dez/25","solicitacoes":148,"autorizadas":102,"negadas":10,"pendentes":276,"espera_media":35},
        {"mes":"Jan/26","solicitacoes":174,"autorizadas":122,"negadas":14,"pendentes":298,"espera_media":38},
        {"mes":"Fev/26","solicitacoes":178,"autorizadas":124,"negadas":16,"pendentes":306,"espera_media":37},
        {"mes":"Mar/26","solicitacoes":184,"autorizadas":126,"negadas":15,"pendentes":312,"espera_media":38},
    ]


@router.get("/dashboard")
async def dashboard():
    return _DASHBOARD

@router.get("/especialidades")
async def especialidades():
    return _ESPECIALIDADES

@router.get("/exames")
async def exames():
    return _EXAMES_COMPLEMENTARES

@router.get("/tfd")
async def tfd():
    return _TFD

@router.get("/historico")
async def historico():
    return _HISTORICO_MENSAL
