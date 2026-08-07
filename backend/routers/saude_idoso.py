"""
Saúde do Idoso — Caderneta / IVCF / Fragilidade — Apuí/AM
Portaria GM/MS nº 2.528/2006 — Política Nacional de Saúde da Pessoa Idosa
"""
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-idoso", tags=["Saúde do Idoso"])

@lru_cache(maxsize=1)
def _IDOSOS():
    return [
        {"id":1, "codigo":"IDO-001","idade":78,"sexo":"F","esf":"ESF Central",      "ivcf":14,"fragilidade":"pre_fragil",  "quedas_ultimo_ano":1,"polifarmacia":True, "caderneta":True, "visita_domiciliar":False,"cuidador":True, "alerta":None},
        {"id":2, "codigo":"IDO-002","idade":83,"sexo":"M","esf":"ESF Central",      "ivcf":22,"fragilidade":"fragil",      "quedas_ultimo_ano":3,"polifarmacia":True, "caderneta":True, "visita_domiciliar":True, "cuidador":True, "alerta":"fragilidade grave + 3 quedas"},
        {"id":3, "codigo":"IDO-003","idade":71,"sexo":"F","esf":"ESF Alto Apuí",    "ivcf":6, "fragilidade":"robusto",     "quedas_ultimo_ano":0,"polifarmacia":False,"caderneta":True, "visita_domiciliar":False,"cuidador":False,"alerta":None},
        {"id":4, "codigo":"IDO-004","idade":89,"sexo":"F","esf":"ESF São Cristóvão","ivcf":28,"fragilidade":"fragil",      "quedas_ultimo_ano":4,"polifarmacia":True, "caderneta":False,"visita_domiciliar":True, "cuidador":True, "alerta":"sem caderneta + 4 quedas"},
        {"id":5, "codigo":"IDO-005","idade":74,"sexo":"M","esf":"ESF Bela Vista",   "ivcf":10,"fragilidade":"pre_fragil",  "quedas_ultimo_ano":0,"polifarmacia":True, "caderneta":True, "visita_domiciliar":False,"cuidador":False,"alerta":"polifarmácia sem revisão"},
        {"id":6, "codigo":"IDO-006","idade":82,"sexo":"M","esf":"ESF Linha 1",      "ivcf":18,"fragilidade":"pre_fragil",  "quedas_ultimo_ano":2,"polifarmacia":True, "caderneta":True, "visita_domiciliar":False,"cuidador":True, "alerta":None},
        {"id":7, "codigo":"IDO-007","idade":77,"sexo":"F","esf":"ESF Estrada Nova", "ivcf":8, "fragilidade":"robusto",     "quedas_ultimo_ano":0,"polifarmacia":False,"caderneta":True, "visita_domiciliar":False,"cuidador":False,"alerta":None},
        {"id":8, "codigo":"IDO-008","idade":91,"sexo":"F","esf":"ESF Km 20",        "ivcf":31,"fragilidade":"fragil",      "quedas_ultimo_ano":5,"polifarmacia":True, "caderneta":True, "visita_domiciliar":True, "cuidador":True, "alerta":"IVCF crítico — risco alto"},
        {"id":9, "codigo":"IDO-009","idade":68,"sexo":"M","esf":"ESF Cotovelo",     "ivcf":4, "fragilidade":"robusto",     "quedas_ultimo_ano":0,"polifarmacia":False,"caderneta":False,"visita_domiciliar":False,"cuidador":False,"alerta":"sem caderneta"},
        {"id":10,"codigo":"IDO-010","idade":80,"sexo":"F","esf":"ESF Central",      "ivcf":19,"fragilidade":"pre_fragil",  "quedas_ultimo_ano":1,"polifarmacia":True, "caderneta":True, "visita_domiciliar":False,"cuidador":True, "alerta":None},
        {"id":11,"codigo":"IDO-011","idade":75,"sexo":"M","esf":"ESF Alto Apuí",    "ivcf":12,"fragilidade":"pre_fragil",  "quedas_ultimo_ano":1,"polifarmacia":False,"caderneta":True, "visita_domiciliar":False,"cuidador":False,"alerta":None},
        {"id":12,"codigo":"IDO-012","idade":86,"sexo":"F","esf":"ESF São Cristóvão","ivcf":24,"fragilidade":"fragil",      "quedas_ultimo_ano":2,"polifarmacia":True, "caderneta":True, "visita_domiciliar":True, "cuidador":True, "alerta":None},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador":"Idosos com IVCF aplicado",         "valor":72.4,"meta":85.0,"unidade":"%","status":"atencao"},
        {"indicador":"Caderneta do Idoso entregue",       "valor":75.0,"meta":90.0,"unidade":"%","status":"atencao"},
        {"indicador":"Fragilidade identificada",          "valor":100.0,"meta":100.0,"unidade":"%","status":"ok","observacao":"Dos que tiveram IVCF aplicado"},
        {"indicador":"Idosos frágeis c/ visita domiciliar","valor":80.0,"meta":100.0,"unidade":"%","status":"atencao"},
        {"indicador":"Revisão medicamentosa (polifarmácia)","valor":45.8,"meta":80.0,"unidade":"%","status":"critico"},
        {"indicador":"Vacinação influenza ≥60a",          "valor":84.6,"meta":90.0,"unidade":"%","status":"atencao"},
        {"indicador":"Internações por quedas",            "valor":8,"meta":5,"unidade":"casos","status":"atencao","invertido":True},
        {"indicador":"Cobertura fisioterapia idoso frágil","valor":33.3,"meta":60.0,"unidade":"%","status":"critico","observacao":"Fisioterap. em manutenção (75 dias parado)"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"mes":"Out/25","consultas":142,"visitas_dom":18,"quedas_atend":3,"internacoes":2},
        {"mes":"Nov/25","consultas":148,"visitas_dom":20,"quedas_atend":2,"internacoes":1},
        {"mes":"Dez/25","consultas":138,"visitas_dom":17,"quedas_atend":4,"internacoes":2},
        {"mes":"Jan/26","consultas":155,"visitas_dom":22,"quedas_atend":3,"internacoes":2},
        {"mes":"Fev/26","consultas":161,"visitas_dom":21,"quedas_atend":2,"internacoes":1},
        {"mes":"Mar/26","consultas":168,"visitas_dom":24,"quedas_atend":5,"internacoes":2},
    ]


@router.get("/dashboard")
async def dashboard():
    frageis = [i for i in _IDOSOS() if i["fragilidade"] == "fragil"]
    alertas = [i for i in _IDOSOS() if i["alerta"]]
    return {
        "competencia":       "Mar/2026",
        "total_idosos":      len(_IDOSOS()),
        "frageis":           len(frageis),
        "pre_frageis":       sum(1 for i in _IDOSOS() if i["fragilidade"] == "pre_fragil"),
        "robustos":          sum(1 for i in _IDOSOS() if i["fragilidade"] == "robusto"),
        "com_alerta":        len(alertas),
        "polifarmacia":      sum(1 for i in _IDOSOS() if i["polifarmacia"]),
        "quedas_acumuladas": sum(i["quedas_ultimo_ano"] for i in _IDOSOS()),
        "historico":         _HISTORICO(),
    }

@router.get("/idosos")
async def idosos():
    return sorted(_IDOSOS, key=lambda i: (i["fragilidade"]!="fragil", i["ivcf"]*-1))

@router.get("/indicadores")
async def indicadores():
    return _INDICADORES

@router.get("/historico")
async def historico():
    return _HISTORICO
