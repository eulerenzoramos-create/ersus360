"""
Rastreio de Câncer — Apuí/AM
Câncer do colo do útero · Mama · Próstata (PSA) · Pele · Cólon
INCA · SISCAN · Linha de Cuidado Oncológica
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/cancer-rastreio", tags=["Rastreio de Câncer"])

_DASHBOARD = {
    "competencia": "Mar/2026",
    "colo_utero_cobertura_pct": 38.1,
    "colo_utero_status": "critico",
    "mama_cobertura_pct": 32.4,
    "mama_status": "critico",
    "prostata_psa_pct": 42.8,
    "prostata_status": "critico",
    "alteracoes_detectadas": 12,
    "encaminhamentos_referencia": 8,
    "exames_aguardando_resultado": 23,
}

_COLO_UTERO = [
    {"competencia":"Out/25","elegiveis":312,"coletados":98, "cobertura_pct":31.4,"alteracoes":2,"encaminhados":2},
    {"competencia":"Nov/25","coletados":104,"elegiveis":314,"cobertura_pct":33.1,"alteracoes":1,"encaminhados":1},
    {"competencia":"Dez/25","coletados":88, "elegiveis":312,"cobertura_pct":28.2,"alteracoes":0,"encaminhados":0},
    {"competencia":"Jan/26","coletados":112,"elegiveis":316,"cobertura_pct":35.4,"alteracoes":3,"encaminhados":3},
    {"competencia":"Fev/26","coletados":118,"elegiveis":316,"cobertura_pct":37.3,"alteracoes":1,"encaminhados":1},
    {"competencia":"Mar/26","coletados":122,"elegiveis":320,"cobertura_pct":38.1,"alteracoes":2,"encaminhados":1},
]

_MAMA = [
    {"competencia":"Out/25","elegiveis":284,"exames":82, "cobertura_pct":28.9,"alteracoes":1,"encaminhados":1},
    {"competencia":"Nov/25","elegiveis":284,"exames":88, "cobertura_pct":31.0,"alteracoes":0,"encaminhados":0},
    {"competencia":"Dez/25","elegiveis":286,"exames":76, "cobertura_pct":26.6,"alteracoes":1,"encaminhados":1},
    {"competencia":"Jan/26","elegiveis":288,"exames":92, "cobertura_pct":31.9,"alteracoes":2,"encaminhados":2},
    {"competencia":"Fev/26","elegiveis":288,"exames":94, "cobertura_pct":32.6,"alteracoes":0,"encaminhados":0},
    {"competencia":"Mar/26","elegiveis":290,"exames":94, "cobertura_pct":32.4,"alteracoes":1,"encaminhados":1},
]

_CASOS_ALTERADOS = [
    {"id":"CR-001","tipo":"Colo do útero","resultado":"ASCUS","esf":"ESF Apuí Centro","encaminhamento":"Ginecologia ref.","situacao":"encaminhado","data":"Jan/26"},
    {"id":"CR-002","tipo":"Colo do útero","resultado":"NIC II","esf":"ESF São Francisco","encaminhamento":"Ginecologia ref.","situacao":"em acompanhamento","data":"Fev/26","alerta":"NIC II — colposcopia pendente"},
    {"id":"CR-003","tipo":"Colo do útero","resultado":"NIC I","esf":"ESF Apuí Centro","encaminhamento":"UBS seguimento","situacao":"acompanhamento","data":"Mar/26"},
    {"id":"CR-004","tipo":"Mama","resultado":"BIRADS 4","esf":"ESF Matupi","encaminhamento":"Mastologia ref.","situacao":"encaminhado","data":"Jan/26","alerta":"BIRADS 4 — biópsia indicada"},
    {"id":"CR-005","tipo":"Mama","resultado":"BIRADS 3","esf":"ESF São Francisco","encaminhamento":"Seguimento 6m","situacao":"acompanhamento","data":"Mar/26"},
    {"id":"CR-006","tipo":"Próstata","resultado":"PSA 5.8 ng/mL","esf":"ESF Apuí Centro","encaminhamento":"Urologia ref.","situacao":"encaminhado","data":"Fev/26","alerta":"PSA elevado — encaminhar urologia"},
    {"id":"CR-007","tipo":"Próstata","resultado":"PSA 4.2 ng/mL","esf":"ESF Matupi","encaminhamento":"Repetir em 6m","situacao":"acompanhamento","data":"Mar/26"},
    {"id":"CR-008","tipo":"Colo do útero","resultado":"ASCUS","esf":"ESF Matupi","encaminhamento":"UBS retorno","situacao":"aguardando retorno","data":"Mar/26"},
]

_INDICADORES = [
    {"indicador":"Cobertura citologia colo (25-64a)",   "valor":38.1,"meta":80.0,"unidade":"%","status":"critico","observacao":"INCA meta biênio 2024-25"},
    {"indicador":"Cobertura mamografia (50-69a)",        "valor":32.4,"meta":70.0,"unidade":"%","status":"critico","observacao":"Rastreio biênio"},
    {"indicador":"PSA (homens 50-70a) anual",            "valor":42.8,"meta":60.0,"unidade":"%","status":"critico","observacao":"PNAISH"},
    {"indicador":"Encaminhados/alterações detectadas",   "valor":66.7,"meta":100.0,"unidade":"%","status":"atencao","observacao":"8 de 12 casos encaminhados"},
    {"indicador":"Resultados pendentes >30 dias",        "valor":23,  "meta":5,    "unidade":"exames","status":"atencao","observacao":"Mar/26","invertido":True},
    {"indicador":"Alta por cura / seguimento ok",        "valor":42.0,"meta":70.0,"unidade":"%","status":"atencao","observacao":"Casos encaminhados com desfecho"},
]

@router.get("/dashboard")
async def dashboard():
    return _DASHBOARD

@router.get("/colo-utero")
async def colo_utero():
    return _COLO_UTERO

@router.get("/mama")
async def mama():
    return _MAMA

@router.get("/casos-alterados")
async def casos_alterados():
    return _CASOS_ALTERADOS

@router.get("/indicadores")
async def indicadores():
    return _INDICADORES
