"""
Atenção Domiciliar — SAD / EMAD — Apuí/AM
Portaria GM/MS nº 825/2016
"""
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/atencao-domiciliar", tags=["Atenção Domiciliar"])

@lru_cache(maxsize=1)
def _PACIENTES():
    return [
        {"id":1, "nome":"Benedito S. Lima",    "idade":78,"cid":"I50.0","modalidade":"AD2","equipe":"EMAD I","situacao":"ativo",    "dias_programa":142,"visitas_mes":4,"cuidador":"Filha","alerta":None},
        {"id":2, "nome":"Maria Aparecida F.",  "idade":82,"cid":"G30.9","modalidade":"AD2","equipe":"EMAD I","situacao":"ativo",    "dias_programa":98, "visitas_mes":5,"cuidador":"Cônjuge","alerta":"cognitivo grave"},
        {"id":3, "nome":"João Raimundo O.",    "idade":65,"cid":"C18.9","modalidade":"AD3","equipe":"EMAD I","situacao":"ativo",    "dias_programa":47, "visitas_mes":8,"cuidador":"Filho","alerta":"oncológico terminal"},
        {"id":4, "nome":"Francisca N. Costa",  "idade":71,"cid":"J44.1","modalidade":"AD2","equipe":"EMAD I","situacao":"ativo",    "dias_programa":203,"visitas_mes":3,"cuidador":"Filha","alerta":None},
        {"id":5, "nome":"Antônio B. Ferreira", "idade":59,"cid":"G82.2","modalidade":"AD2","equipe":"EMAD I","situacao":"ativo",    "dias_programa":315,"visitas_mes":4,"cuidador":"Cônjuge","alerta":"úlcera por pressão"},
        {"id":6, "nome":"Raimunda S. Nunes",   "idade":88,"cid":"I63.9","modalidade":"AD2","equipe":"EMAD I","situacao":"ativo",    "dias_programa":66, "visitas_mes":5,"cuidador":"Neta","alerta":None},
        {"id":7, "nome":"Pedro A. Mendes",     "idade":74,"cid":"N18.5","modalidade":"AD3","equipe":"EMAD I","situacao":"ativo",    "dias_programa":29, "visitas_mes":10,"cuidador":"Filha","alerta":"IRC estágio 5"},
        {"id":8, "nome":"Luíza R. Pacheco",    "idade":67,"cid":"C50.9","modalidade":"AD2","equipe":"EMAD I","situacao":"ativo",    "dias_programa":88, "visitas_mes":4,"cuidador":"Cônjuge","alerta":"oncológico"},
        {"id":9, "nome":"Sebastião F. Cruz",   "idade":80,"cid":"I64"  ,"modalidade":"AD2","equipe":"EMAD I","situacao":"ativo",    "dias_programa":171,"visitas_mes":3,"cuidador":"Filho","alerta":None},
        {"id":10,"nome":"Conceição B. Matos",  "idade":76,"cid":"G20"  ,"modalidade":"AD2","equipe":"EMAD I","situacao":"ativo",    "dias_programa":253,"visitas_mes":4,"cuidador":"Filha","alerta":"Parkinson avançado"},
        {"id":11,"nome":"Valdomiro T. Lima",   "idade":61,"cid":"J45.5","modalidade":"AD1","equipe":"ESF Central","situacao":"ativo","dias_programa":12,"visitas_mes":1,"cuidador":"Cônjuge","alerta":None},
        {"id":12,"nome":"Isabel M. Rocha",     "idade":83,"cid":"M81.0","modalidade":"AD1","equipe":"ESF Alto Apuí","situacao":"ativo","dias_programa":34,"visitas_mes":2,"cuidador":"Filha","alerta":None},
        {"id":13,"nome":"Carlos A. Figueiredo","idade":69,"cid":"I10"  ,"modalidade":"AD1","equipe":"ESF São Cristóvão","situacao":"ativo","dias_programa":58,"visitas_mes":1,"cuidador":"Cônjuge","alerta":None},
        {"id":14,"nome":"Ana Célia P. Santos", "idade":77,"cid":"E11.9","modalidade":"AD1","equipe":"ESF Bela Vista","situacao":"ativo","dias_programa":41,"visitas_mes":2,"cuidador":"Filho","alerta":None},
        {"id":15,"nome":"Roque N. Barbosa",    "idade":72,"cid":"I50.9","modalidade":"AD2","equipe":"EMAD I","situacao":"ativo",    "dias_programa":19, "visitas_mes":5,"cuidador":"Filha","alerta":None},
        {"id":16,"nome":"Tereza C. Almeida",   "idade":85,"cid":"G30.0","modalidade":"AD2","equipe":"EMAD I","situacao":"ativo",    "dias_programa":128,"visitas_mes":4,"cuidador":"Neto","alerta":"risco queda alto"},
        {"id":17,"nome":"Domingos L. Ribeiro", "idade":78,"cid":"J96.0","modalidade":"AD3","equipe":"EMAD I","situacao":"ativo",    "dias_programa":7,  "visitas_mes":12,"cuidador":"Cônjuge","alerta":"traqueostomia"},
        {"id":18,"nome":"Nilda F. Vasconcelos","idade":91,"cid":"F03"  ,"modalidade":"AD2","equipe":"EMAD I","situacao":"ativo",    "dias_programa":382,"visitas_mes":3,"cuidador":"Filha","alerta":"demência grave"},
    ]


@lru_cache(maxsize=1)
def _PRODUCAO_MENSAL():
    return [
        {"mes":"Out/25","visitas_domiciliares":124,"procedimentos":96, "ad1":4,"ad2":11,"ad3":2,"altas":1,"obitos":0},
        {"mes":"Nov/25","visitas_domiciliares":131,"procedimentos":104,"ad1":4,"ad2":11,"ad3":2,"altas":2,"obitos":0},
        {"mes":"Dez/25","visitas_domiciliares":118,"procedimentos":88, "ad1":4,"ad2":11,"ad3":2,"altas":0,"obitos":1},
        {"mes":"Jan/26","visitas_domiciliares":128,"procedimentos":98, "ad1":4,"ad2":12,"ad3":2,"altas":1,"obitos":0},
        {"mes":"Fev/26","visitas_domiciliares":135,"procedimentos":108,"ad1":4,"ad2":13,"ad3":2,"altas":0,"obitos":0},
        {"mes":"Mar/26","visitas_domiciliares":142,"procedimentos":114,"ad1":4,"ad2":13,"ad3":3,"altas":1,"obitos":0},
    ]


@lru_cache(maxsize=1)
def _EMAD():
    return {
        "nome": "EMAD I — Apuí",
        "composicao": [
            {"profissional":"Médico",          "carga_horaria":"20h/sem","vinculo":"efetivo"},
            {"profissional":"Enfermeiro",       "carga_horaria":"40h/sem","vinculo":"efetivo"},
            {"profissional":"Fisioterapeuta",   "carga_horaria":"20h/sem","vinculo":"efetivo"},
            {"profissional":"Assistente Social","carga_horaria":"20h/sem","vinculo":"efetivo"},
            {"profissional":"Técnico Enferm.",  "carga_horaria":"40h/sem","vinculo":"efetivo"},
            {"profissional":"Técnico Enferm.",  "carga_horaria":"40h/sem","vinculo":"efetivo"},
        ],
        "transporte": "veículo próprio",
        "area_abrangencia": "sede urbana + ramal Linha 1",
    }


@router.get("/dashboard")
async def dashboard():
    ativos = [p for p in _PACIENTES() if p["situacao"] == "ativo"]
    alertas = [p for p in ativos if p["alerta"]]
    ult = _PRODUCAO_MENSAL()[-1]
    return {
        "competencia":       "Mar/2026",
        "pacientes_ativos":  len(ativos),
        "ad1":               sum(1 for p in ativos if p["modalidade"] == "AD1"),
        "ad2":               sum(1 for p in ativos if p["modalidade"] == "AD2"),
        "ad3":               sum(1 for p in ativos if p["modalidade"] == "AD3"),
        "com_alerta":        len(alertas),
        "visitas_mes":       ult["visitas_domiciliares"],
        "procedimentos_mes": ult["procedimentos"],
        "historico":         _PRODUCAO_MENSAL(),
    }

@router.get("/pacientes")
async def pacientes():
    return sorted(_PACIENTES, key=lambda p: (p["modalidade"] != "AD3", p["modalidade"] != "AD2", p["alerta"] is None))

@router.get("/equipe")
async def equipe():
    return _EMAD

@router.get("/producao")
async def producao():
    return _PRODUCAO_MENSAL
