"""
Saúde Bucal — ESB / Procedimentos Odontológicos
FMS Apuí/AM · SISAB / e-SUS
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-bucal", tags=["Saúde Bucal"])

_EQUIPES_ESB = [
    {"equipe":"ESB Liberdade",   "cd":"Dr. R.A.S.","tss":"T.B.C.","pop_coberta":1420,"1a_consulta_mes":58,"cons_total_mes":142,"extracao_mes":12,"restauracao_mes":38,"escovacao_mes":80,"urgencia_mes":8, "meta_1a":55,"status":"ok"},
    {"equipe":"ESB Kennedy",     "cd":"Dra. M.P.L.","tss":"K.D.E.","pop_coberta":1380,"1a_consulta_mes":42,"cons_total_mes":118,"extracao_mes":10,"restauracao_mes":28,"escovacao_mes":62,"urgencia_mes":6, "meta_1a":55,"status":"atencao"},
    {"equipe":"ESB Cachoeira",   "cd":"Dr. F.O.N.","tss":"L.I.M.","pop_coberta":1250,"1a_consulta_mes":51,"cons_total_mes":128,"extracao_mes":9, "restauracao_mes":32,"escovacao_mes":70,"urgencia_mes":5, "meta_1a":55,"status":"atencao"},
    {"equipe":"ESB JK",          "cd":"Dra. C.V.T.","tss":"P.U.S.","pop_coberta":1180,"1a_consulta_mes":62,"cons_total_mes":155,"extracao_mes":14,"restauracao_mes":42,"escovacao_mes":88,"urgencia_mes":9, "meta_1a":55,"status":"ok"},
]

_INDICADORES = [
    {"indicador":"Média de 1ª consulta odontológica programática/hab",  "valor":0.28,"meta":0.40,"status":"atencao","unidade":"/hab/ano"},
    {"indicador":"Cobertura de ação coletiva escovação dental supervisionada","valor":18.4,"meta":30.0,"status":"critico","unidade":"% pop"},
    {"indicador":"Razão de procedimentos odontológicos especializados",  "valor":0.08,"meta":0.15,"status":"critico","unidade":"/hab"},
    {"indicador":"% extrações em relação ao total de procedimentos",      "valor":12.2,"meta":8.0, "status":"atencao","unidade":"%","invertido":True},
    {"indicador":"Urgências odontológicas resolvidas na APS",             "valor":88.5,"meta":80.0,"status":"ok",    "unidade":"%"},
    {"indicador":"% gestantes com consulta odontológica no pré-natal",    "valor":58.3,"meta":70.0,"status":"critico","unidade":"%"},
]

_HISTORICO = [
    {"mes":"Out/25","1a_consulta":196,"procedimentos":482,"urgencias":26},
    {"mes":"Nov/25","1a_consulta":204,"procedimentos":510,"urgencias":24},
    {"mes":"Dez/25","1a_consulta":178,"procedimentos":445,"urgencias":28},
    {"mes":"Jan/26","1a_consulta":218,"procedimentos":538,"urgencias":22},
    {"mes":"Fev/26","1a_consulta":198,"procedimentos":490,"urgencias":25},
    {"mes":"Mar/26","1a_consulta":213,"procedimentos":543,"urgencias":28},
]

_PROCEDIMENTOS_MES = [
    {"procedimento":"1ª consulta programática",   "qtd":213,"tipo":"preventivo"},
    {"procedimento":"Restauração simples",          "qtd":140,"tipo":"restaurador"},
    {"procedimento":"Extração dentária",            "qtd":45, "tipo":"cirurgico"},
    {"procedimento":"Escovação supervisionada",     "qtd":300,"tipo":"preventivo"},
    {"procedimento":"Urgência odontológica",        "qtd":28, "tipo":"urgencia"},
    {"procedimento":"Aplicação de flúor tópico",    "qtd":180,"tipo":"preventivo"},
    {"procedimento":"Raspagem/alisamento radicular","qtd":38, "tipo":"periodontia"},
    {"procedimento":"Tratamento canal (PACS)",      "qtd":12, "tipo":"endodontia"},
    {"procedimento":"Prótese dentária (encam.)",    "qtd":8,  "tipo":"reabilitacao"},
]

@router.get("/dashboard")
async def dashboard():
    total_1a    = sum(e["1a_consulta_mes"] for e in _EQUIPES_ESB)
    total_proc  = sum(e["cons_total_mes"]  for e in _EQUIPES_ESB)
    criticos    = sum(1 for i in _INDICADORES if i["status"]=="critico")
    return {
        "competencia":       "Mar/2026",
        "equipes_esb":       len(_EQUIPES_ESB),
        "total_1a_consulta": total_1a,
        "total_procedimentos":total_proc,
        "indicadores_criticos":criticos,
        "historico":         _HISTORICO,
        "pop_coberta":       sum(e["pop_coberta"] for e in _EQUIPES_ESB),
    }

@router.get("/equipes")
async def equipes():
    return _EQUIPES_ESB

@router.get("/indicadores")
async def indicadores():
    return _INDICADORES

@router.get("/procedimentos")
async def procedimentos():
    return _PROCEDIMENTOS_MES

@router.get("/historico")
async def historico():
    return _HISTORICO
