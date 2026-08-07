"""
IST / HIV / AIDS — DIAHV / Departamento de Doenças Crônicas — Apuí/AM
SINAN · SAE · PrEP · Testagem
"""
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/ist-hiv", tags=["IST / HIV / AIDS"])

@lru_cache(maxsize=1)
def _INDICADORES_IST():
    return [
        {"indicador":"Sífilis adquirida — casos 2026",         "valor":12,"meta":8, "unidade":"casos","status":"critico","invertido":True},
        {"indicador":"Sífilis gestacional — casos 2026",       "valor":8, "meta":4, "unidade":"casos","status":"critico","invertido":True},
        {"indicador":"Sífilis congênita — casos 2026",         "valor":3, "meta":0, "unidade":"casos","status":"critico","invertido":True},
        {"indicador":"HIV — testagem pré-natal",               "valor":94.2,"meta":95.0,"unidade":"%","status":"atencao"},
        {"indicador":"HIV — testagem 1ª consulta",             "valor":88.7,"meta":95.0,"unidade":"%","status":"atencao"},
        {"indicador":"HIV — casos em TARV",                    "valor":100.0,"meta":100.0,"unidade":"%","status":"ok"},
        {"indicador":"Gonorreia — casos 2026",                 "valor":7, "meta":5, "unidade":"casos","status":"atencao","invertido":True},
        {"indicador":"HPV — vacinação adol. 9-14a",            "valor":68.4,"meta":80.0,"unidade":"%","status":"atencao"},
    ]


@lru_cache(maxsize=1)
def _PACIENTES_HIV():
    return [
        {"id":1,"codigo":"HIV-001","situacao":"TARV","esquema":"TDF+3TC+DTG","adesao":"boa",     "cv_detectavel":False,"cd4_atual":542,"ult_consulta":"Mar/26","prox_consulta":"Jun/26","alerta":None},
        {"id":2,"codigo":"HIV-002","situacao":"TARV","esquema":"TDF+3TC+DTG","adesao":"irregular","cv_detectavel":True, "cd4_atual":214,"ult_consulta":"Fev/26","prox_consulta":"Abr/26","alerta":"CV detectável — revisar adesão"},
        {"id":3,"codigo":"HIV-003","situacao":"TARV","esquema":"TDF+3TC+EFV","adesao":"boa",     "cv_detectavel":False,"cd4_atual":718,"ult_consulta":"Jan/26","prox_consulta":"Jul/26","alerta":None},
        {"id":4,"codigo":"HIV-004","situacao":"TARV","esquema":"TDF+3TC+DTG","adesao":"boa",     "cv_detectavel":False,"cd4_atual":489,"ult_consulta":"Mar/26","prox_consulta":"Jun/26","alerta":None},
        {"id":5,"codigo":"HIV-005","situacao":"TARV","esquema":"TDF+3TC+DTG","adesao":"irregular","cv_detectavel":False,"cd4_atual":310,"ult_consulta":"Jan/26","prox_consulta":"Mar/26","alerta":"atraso consulta — busca ativa"},
        {"id":6,"codigo":"HIV-006","situacao":"TARV","esquema":"AZT+3TC+NVP","adesao":"boa",     "cv_detectavel":False,"cd4_atual":621,"ult_consulta":"Fev/26","prox_consulta":"Mai/26","alerta":None},
        {"id":7,"codigo":"HIV-007","situacao":"TARV","esquema":"TDF+3TC+DTG","adesao":"boa",     "cv_detectavel":False,"cd4_atual":830,"ult_consulta":"Mar/26","prox_consulta":"Set/26","alerta":None},
        {"id":8,"codigo":"HIV-008","situacao":"TARV","esquema":"TDF+3TC+DTG","adesao":"boa",     "cv_detectavel":False,"cd4_atual":402,"ult_consulta":"Fev/26","prox_consulta":"Mai/26","alerta":None},
    ]


@lru_cache(maxsize=1)
def _TESTAGEM_MENSAL():
    return [
        {"mes":"Out/25","hiv_rapido":78,"sifilis_rapido":72,"hepatite_b":65,"hepatite_c":64,"hiv_positivos":0,"sifilis_positivos":4},
        {"mes":"Nov/25","hiv_rapido":82,"sifilis_rapido":80,"hepatite_b":71,"hepatite_c":70,"hiv_positivos":1,"sifilis_positivos":5},
        {"mes":"Dez/25","hiv_rapido":68,"sifilis_rapido":63,"hepatite_b":58,"hepatite_c":57,"hiv_positivos":0,"sifilis_positivos":3},
        {"mes":"Jan/26","hiv_rapido":91,"sifilis_rapido":88,"hepatite_b":80,"hepatite_c":79,"hiv_positivos":0,"sifilis_positivos":6},
        {"mes":"Fev/26","hiv_rapido":87,"sifilis_rapido":84,"hepatite_b":76,"hepatite_c":75,"hiv_positivos":0,"sifilis_positivos":4},
        {"mes":"Mar/26","hiv_rapido":94,"sifilis_rapido":91,"hepatite_b":83,"hepatite_c":82,"hiv_positivos":0,"sifilis_positivos":5},
    ]


@lru_cache(maxsize=1)
def _PREP_PREP():
    return {
        "usuarios_prep_ativos":    12,
        "novas_iniciaciones_2026":  4,
        "adesao_pct":              83.3,
        "prep_disponivel":         True,
        "profilaxia_pep_2026":      3,
    }


@router.get("/dashboard")
async def dashboard():
    alertas_hiv = [p for p in _PACIENTES_HIV() if p["alerta"]]
    ult_test = _TESTAGEM_MENSAL()[-1]
    return {
        "competencia":          "Mar/2026",
        "hiv_em_tarv":          len(_PACIENTES_HIV()),
        "hiv_alertas":          len(alertas_hiv),
        "sifilis_casos_2026":   next(i["valor"] for i in _INDICADORES_IST() if "adquirida" in i["indicador"]),
        "sifilis_congenita_2026": next(i["valor"] for i in _INDICADORES_IST() if "cong" in i["indicador"]),
        "testagens_mes":        ult_test["hiv_rapido"],
        "prep_usuarios":        _PREP_PREP()["usuarios_prep_ativos"],
        "indicadores_criticos": sum(1 for i in _INDICADORES_IST() if i["status"]=="critico"),
        "historico_testagem":   _TESTAGEM_MENSAL(),
    }

@router.get("/indicadores")
async def indicadores():
    return _INDICADORES_IST

@router.get("/hiv-pacientes")
async def hiv_pacientes():
    return sorted(_PACIENTES_HIV, key=lambda p: (p["alerta"] is None, p["adesao"]!="irregular"))

@router.get("/testagem")
async def testagem():
    return _TESTAGEM_MENSAL

@router.get("/prep")
async def prep():
    return _PREP_PREP
