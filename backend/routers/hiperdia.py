"""
HiperDia / DCNT — Apuí/AM
Hipertensão · Diabetes · Obesidade · DPOC · Doença Renal
PNAO · Linha de Cuidado DCNT
"""
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/hiperdia", tags=["HiperDia / DCNT"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "competencia": "Mar/2026",
        "has_cadastrados": 748,
        "has_controlados_pct": 41.2,
        "has_controlados_status": "critico",
        "dm_cadastrados": 312,
        "dm_controlados_pct": 34.6,
        "dm_controlados_status": "critico",
        "obesidade_adultos_pct": 28.4,
        "obesidade_status": "atencao",
        "dpoc_acompanhados": 38,
        "renal_cronico_acompanhados": 22,
        "internacoes_dcnt_mes": 14,
        "internacoes_dcnt_status": "atencao",
    }


@lru_cache(maxsize=1)
def _HIPERTENSOS():
    return [
        {"id":"H-001","classificacao":"Estágio 1","pa_sistolica":148,"pa_diastolica":92, "uso_medicacao":True, "controle":"parcial","consulta_dias":45,"alerta":None},
        {"id":"H-002","classificacao":"Estágio 2","pa_sistolica":162,"pa_diastolica":98, "uso_medicacao":True, "controle":"nao",    "consulta_dias":62,"alerta":"PA não controlada — revisar esquema"},
        {"id":"H-003","classificacao":"Estágio 3","pa_sistolica":184,"pa_diastolica":112,"uso_medicacao":True, "controle":"nao",    "consulta_dias":31,"alerta":"Risco cardiovascular alto — encaminhar cardiologia"},
        {"id":"H-004","classificacao":"Estágio 1","pa_sistolica":138,"pa_diastolica":88, "uso_medicacao":False,"controle":"parcial","consulta_dias":90,"alerta":"Sem medicação — reforçar adesão"},
        {"id":"H-005","classificacao":"Estágio 2","pa_sistolica":155,"pa_diastolica":96, "uso_medicacao":True, "controle":"nao",    "consulta_dias":54,"alerta":None},
        {"id":"H-006","classificacao":"Normal-alto","pa_sistolica":132,"pa_diastolica":84,"uso_medicacao":True,"controle":"sim",    "consulta_dias":28,"alerta":None},
        {"id":"H-007","classificacao":"Estágio 1","pa_sistolica":142,"pa_diastolica":90, "uso_medicacao":True, "controle":"parcial","consulta_dias":35,"alerta":None},
        {"id":"H-008","classificacao":"Estágio 2","pa_sistolica":168,"pa_diastolica":102,"uso_medicacao":False,"controle":"nao",    "consulta_dias":120,"alerta":"Sem retorno há 4 meses"},
    ]


@lru_cache(maxsize=1)
def _DIABETICOS():
    return [
        {"id":"D-001","tipo":"DM2","hba1c":8.4,"glicemia_jejum":182,"uso_insulina":False,"controle":"nao",    "complicacao":"Nefropatia incipiente","consulta_dias":42},
        {"id":"D-002","tipo":"DM2","hba1c":7.1,"glicemia_jejum":148,"uso_insulina":False,"controle":"parcial","complicacao":None,                   "consulta_dias":30},
        {"id":"D-003","tipo":"DM1","hba1c":9.2,"glicemia_jejum":204,"uso_insulina":True, "controle":"nao",    "complicacao":"Retinopatia leve",      "consulta_dias":21,"alerta":"HbA1c>9 — intensificar"},
        {"id":"D-004","tipo":"DM2","hba1c":6.8,"glicemia_jejum":138,"uso_insulina":True, "controle":"sim",    "complicacao":None,                   "consulta_dias":28},
        {"id":"D-005","tipo":"DM2","hba1c":10.1,"glicemia_jejum":241,"uso_insulina":False,"controle":"nao",   "complicacao":"Pé diabético grau I",   "consulta_dias":14,"alerta":"Pé diabético — avaliar semanalmente"},
        {"id":"D-006","tipo":"DM2","hba1c":7.8,"glicemia_jejum":162,"uso_insulina":False,"controle":"parcial","complicacao":None,                   "consulta_dias":35},
    ]


@lru_cache(maxsize=1)
def _INTERNACOES_MENSAIS():
    return [
        {"mes":"Out/25","has":5,"dm":3,"dpoc":2,"renal":1,"obesidade":0,"total":11},
        {"mes":"Nov/25","has":4,"dm":4,"dpoc":1,"renal":2,"obesidade":1,"total":12},
        {"mes":"Dez/25","has":6,"dm":3,"dpoc":3,"renal":1,"obesidade":0,"total":13},
        {"mes":"Jan/26","has":7,"dm":4,"dpoc":2,"renal":2,"obesidade":1,"total":16},
        {"mes":"Fev/26","has":5,"dm":3,"dpoc":1,"renal":1,"obesidade":0,"total":10},
        {"mes":"Mar/26","has":6,"dm":4,"dpoc":2,"renal":2,"obesidade":0,"total":14},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador":"HAS controlada (PA<140/90)",       "valor":41.2,"meta":60.0,"unidade":"%","status":"critico","observacao":"748 cadastrados"},
        {"indicador":"DM controlada (HbA1c<7%)",         "valor":34.6,"meta":55.0,"unidade":"%","status":"critico","observacao":"312 cadastrados"},
        {"indicador":"Obesidade adultos (IMC≥30)",        "valor":28.4,"meta":20.0,"unidade":"%","status":"atencao","observacao":"VIGITEL AM ref.","invertido":True},
        {"indicador":"Pé diabético avaliado (semestral)", "valor":58.3,"meta":80.0,"unidade":"%","status":"atencao","observacao":"DM2 com neuropatia"},
        {"indicador":"Fundo de olho DM (anual)",          "valor":32.1,"meta":70.0,"unidade":"%","status":"critico","observacao":"Rastreio retinopatia"},
        {"indicador":"Creatinina/proteinúria anual HAS",  "valor":44.6,"meta":75.0,"unidade":"%","status":"critico","observacao":"Rastreio renal"},
        {"indicador":"ECG anual (HAS estágio≥2)",         "valor":28.4,"meta":60.0,"unidade":"%","status":"critico","observacao":"Risco cardiovascular"},
        {"indicador":"DCNT internação evitável",          "valor":14,  "meta":8,   "unidade":"casos/mês","status":"atencao","observacao":"Mar/26","invertido":True},
    ]


@router.get("/dashboard")
async def dashboard():
    return _DASHBOARD()

@router.get("/hipertensos")
async def hipertensos():
    return _HIPERTENSOS()

@router.get("/diabeticos")
async def diabeticos():
    return _DIABETICOS()

@router.get("/internacoes")
async def internacoes():
    return _INTERNACOES_MENSAIS()

@router.get("/indicadores")
async def indicadores():
    return _INDICADORES()