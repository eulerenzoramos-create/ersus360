"""
Controle de Tabaco — Apuí/AM
PNCT · Grupos de cessação · TRN · Medição CO · VIGITEL
Portaria GM/MS nº 571/2013 (Programa Nacional de Controle do Tabagismo)
"""
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/controle-tabaco", tags=["Controle de Tabaco"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "competencia": "Mar/2026",
        "fumantes_estimados": 2840,
        "prevalencia_tabagismo_pct": 14.8,
        "em_cessacao_ativa": 68,
        "taxa_cessacao_12m_pct": 24.6,
        "taxa_cessacao_status": "atencao",
        "grupos_ativos": 4,
        "trn_dispensados_mes": 142,
        "co_medido_consultas_mes": 38,
        "recaidas_mes": 7,
    }


@lru_cache(maxsize=1)
def _GRUPOS_CESSACAO():
    return [
        {"grupo":"Grupo A — Apuí Centro",    "esf":"ESF Apuí Centro",    "fase":"Manutenção","participantes":14,"sessoes_realizadas":8,"taxa_adesao_pct":78.6,"status":"ok"},
        {"grupo":"Grupo B — São Francisco",  "esf":"ESF São Francisco",  "fase":"Intensiva", "participantes":12,"sessoes_realizadas":4,"taxa_adesao_pct":83.3,"status":"ok"},
        {"grupo":"Grupo C — Matupi",         "esf":"ESF Matupi",         "fase":"Intensiva", "participantes":10,"sessoes_realizadas":3,"taxa_adesao_pct":70.0,"status":"atencao"},
        {"grupo":"Grupo D — Zona Rural",     "esf":"ESF Zona Rural",     "fase":"Preparação","participantes":8, "sessoes_realizadas":1,"taxa_adesao_pct":87.5,"status":"ok"},
    ]


@lru_cache(maxsize=1)
def _USUARIOS():
    return [
        {"id":"TAB-001","carga_tabagica":"25 anos-maço","dependencia":"Alta (Fagerström 8)","trn":"Adesivo 21mg","co_ppm":12,"cessacao":False,"meses_tentativa":3,"alerta":None},
        {"id":"TAB-002","carga_tabagica":"15 anos-maço","dependencia":"Moderada (Fagerström 5)","trn":"Goma 4mg","co_ppm":6,"cessacao":True,"meses_tentativa":5,"alerta":None},
        {"id":"TAB-003","carga_tabagica":"30 anos-maço","dependencia":"Alta (Fagerström 9)","trn":"Adesivo 21mg + Bupropiona","co_ppm":18,"cessacao":False,"meses_tentativa":2,"alerta":"CO elevado — verificar adesão ao TRN"},
        {"id":"TAB-004","carga_tabagica":"10 anos-maço","dependencia":"Baixa (Fagerström 3)","trn":"Nenhum","co_ppm":2,"cessacao":True,"meses_tentativa":7,"alerta":None},
        {"id":"TAB-005","carga_tabagica":"20 anos-maço","dependencia":"Alta (Fagerström 7)","trn":"Vareniclina","co_ppm":0,"cessacao":True,"meses_tentativa":4,"alerta":None},
        {"id":"TAB-006","carga_tabagica":"18 anos-maço","dependencia":"Moderada (Fagerström 6)","trn":"Adesivo 14mg","co_ppm":9,"cessacao":False,"meses_tentativa":1,"alerta":None},
    ]


@lru_cache(maxsize=1)
def _HISTORICO_MENSAL():
    return [
        {"mes":"Out/25","em_cessacao":58,"novos_ingressos":12,"cessacoes_confirmadas":4,"recaidas":6,"co_medidos":31,"trn_dispensados":118},
        {"mes":"Nov/25","em_cessacao":60,"novos_ingressos":10,"cessacoes_confirmadas":5,"recaidas":7,"co_medidos":34,"trn_dispensados":124},
        {"mes":"Dez/25","em_cessacao":56,"novos_ingressos":8, "cessacoes_confirmadas":4,"recaidas":8,"co_medidos":28,"trn_dispensados":108},
        {"mes":"Jan/26","em_cessacao":62,"novos_ingressos":14,"cessacoes_confirmadas":6,"recaidas":5,"co_medidos":36,"trn_dispensados":132},
        {"mes":"Fev/26","em_cessacao":65,"novos_ingressos":11,"cessacoes_confirmadas":5,"recaidas":6,"co_medidos":38,"trn_dispensados":138},
        {"mes":"Mar/26","em_cessacao":68,"novos_ingressos":12,"cessacoes_confirmadas":7,"recaidas":7,"co_medidos":38,"trn_dispensados":142},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador":"Prevalência tabagismo adultos",       "valor":14.8,"meta":12.0,"unidade":"%","status":"atencao","observacao":"Meta PNS 2030","invertido":True},
        {"indicador":"Taxa cessação 12 meses",              "valor":24.6,"meta":35.0,"unidade":"%","status":"atencao","observacao":"Meta PNCT"},
        {"indicador":"Cobertura grupos cessação",           "valor":2.4, "meta":5.0, "unidade":"%","status":"critico","observacao":"68/2840 fumantes estimados"},
        {"indicador":"Adesão ao tratamento (TRN/fármaco)",  "valor":78.6,"meta":80.0,"unidade":"%","status":"atencao","observacao":"Média grupos ativos"},
        {"indicador":"Abordagem mínima APS (5A)",           "valor":44.2,"meta":80.0,"unidade":"%","status":"critico","observacao":"Perguntar + aconselhar na consulta"},
        {"indicador":"CO medido nas consultas de cessação", "valor":38,  "meta":None,"unidade":"medições","status":"ok","observacao":"Mar/26"},
    ]


@router.get("/dashboard")
async def dashboard():
    return _DASHBOARD()

@router.get("/grupos")
async def grupos():
    return _GRUPOS_CESSACAO()

@router.get("/usuarios")
async def usuarios():
    return _USUARIOS()

@router.get("/historico")
async def historico():
    return _HISTORICO_MENSAL()

@router.get("/indicadores")
async def indicadores():
    return _INDICADORES()