"""
Saúde Mental Ampliada — NASF-AB / CAPS / REDE — Apuí/AM
Portaria GM/MS nº 3.088/2011 — Rede de Atenção Psicossocial (RAPS)
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-mental", tags=["Saúde Mental"])

_ATENDIMENTOS_NASF = [
    {"mes":"Out/25","atend_individual":84,"atend_grupo":6,"matriciamento":14,"apoio_matricial_esf":9,"interconsulta":8},
    {"mes":"Nov/25","atend_individual":91,"atend_grupo":7,"matriciamento":16,"apoio_matricial_esf":10,"interconsulta":9},
    {"mes":"Dez/25","atend_individual":78,"atend_grupo":5,"matriciamento":12,"apoio_matricial_esf":8, "interconsulta":7},
    {"mes":"Jan/26","atend_individual":96,"atend_grupo":8,"matriciamento":18,"apoio_matricial_esf":11,"interconsulta":10},
    {"mes":"Fev/26","atend_individual":102,"atend_grupo":9,"matriciamento":19,"apoio_matricial_esf":12,"interconsulta":11},
    {"mes":"Mar/26","atend_individual":108,"atend_grupo":9,"matriciamento":21,"apoio_matricial_esf":12,"interconsulta":12},
]

_INDICADORES = [
    {"indicador":"Cobertura CAPS I (referência)",          "valor":72.4,"meta":100.0,"unidade":"%","status":"atencao","observacao":"Conforme Portaria 3.088/2011"},
    {"indicador":"PHQ-9 aplicado na APS",                  "valor":28.4,"meta":60.0,"unidade":"%","status":"critico","observacao":"Rastreio depressão/ansiedade"},
    {"indicador":"Retorno pós-crise em 7 dias",            "valor":61.5,"meta":80.0,"unidade":"%","status":"atencao"},
    {"indicador":"Usuários em Projeto Terapêutico (PTS)",  "valor":83.3,"meta":100.0,"unidade":"%","status":"atencao"},
    {"indicador":"Internação psiquiátrica evitada",        "valor":8,   "meta":5,   "unidade":"casos","status":"atencao","invertido":True},
    {"indicador":"Álcool/drogas — triagem AUDIT/ASSIST",   "valor":24.1,"meta":50.0,"unidade":"%","status":"critico","observacao":"Triagem sistemática pendente"},
    {"indicador":"Acolhimento crise < 24h",                "valor":91.7,"meta":100.0,"unidade":"%","status":"atencao"},
    {"indicador":"Ações de redução de danos ativas",       "valor":3,   "meta":4,   "unidade":"ações","status":"atencao"},
]

_USUARIOS_PRIORITARIOS = [
    {"id":1,"codigo":"SM-001","diagnostico":"Esquizofrenia paranoide (F20.0)","dispositivo":"CAPS I","pts":True,"medicacao_depot":True,"retorno_regular":True,"alerta":None},
    {"id":2,"codigo":"SM-002","diagnostico":"Transtorno bipolar I (F31.1)",   "dispositivo":"CAPS I","pts":True,"medicacao_depot":False,"retorno_regular":False,"alerta":"faltou 2 consultas consecutivas"},
    {"id":3,"codigo":"SM-003","diagnostico":"Depressão grave rec. (F33.2)",   "dispositivo":"NASF-AB","pts":True,"medicacao_depot":False,"retorno_regular":True,"alerta":None},
    {"id":4,"codigo":"SM-004","diagnostico":"Dependência álcool (F10.2)",     "dispositivo":"CAPS AD","pts":False,"medicacao_depot":False,"retorno_regular":False,"alerta":"CAPS AD - referência Humaitá"},
    {"id":5,"codigo":"SM-005","diagnostico":"Psicose NE (F29)",               "dispositivo":"CAPS I","pts":True,"medicacao_depot":True,"retorno_regular":True,"alerta":None},
    {"id":6,"codigo":"SM-006","diagnostico":"TOC grave (F42.2)",              "dispositivo":"NASF-AB","pts":True,"medicacao_depot":False,"retorno_regular":True,"alerta":None},
    {"id":7,"codigo":"SM-007","diagnostico":"TEPT (F43.1)",                   "dispositivo":"NASF-AB","pts":True,"medicacao_depot":False,"retorno_regular":False,"alerta":"evento traumático recente"},
    {"id":8,"codigo":"SM-008","diagnostico":"Retardo mental mod. (F71)",      "dispositivo":"CAPS I","pts":True,"medicacao_depot":False,"retorno_regular":True,"alerta":None},
    {"id":9,"codigo":"SM-009","diagnostico":"Esquizofrenia (F20.0)",          "dispositivo":"CAPS I","pts":True,"medicacao_depot":True,"retorno_regular":True,"alerta":None},
    {"id":10,"codigo":"SM-010","diagnostico":"Depressão c/ risco suicídio",   "dispositivo":"CAPS I","pts":True,"medicacao_depot":False,"retorno_regular":False,"alerta":"risco suicídio — monitorar"},
]

_GRUPOS_TERAPEUTICOS = [
    {"grupo":"Grupo de Convivência CAPS I",     "freq":"Semanal","participantes":14,"facilitador":"Psicólogo / Terapeuta Ocup.","status":"ativo"},
    {"grupo":"Grupo Álcool e Drogas",           "freq":"Semanal","participantes":8, "facilitador":"Assistente Social","status":"ativo"},
    {"grupo":"Grupo de Mulheres (depressão/ansiedade)","freq":"Quinzenal","participantes":11,"facilitador":"Psicólogo NASF","status":"ativo"},
    {"grupo":"Grupo de Família",                "freq":"Mensal","participantes":9,  "facilitador":"Psiquiatra itinerante","status":"ativo"},
    {"grupo":"Grupo Geração de Renda / Oficina","freq":"Semanal","participantes":7, "facilitador":"Terapeuta Ocup.","status":"ativo"},
    {"grupo":"Grupo Prevenção ao Suicídio",     "freq":"Quinzenal","participantes":6,"facilitador":"Psicólogo NASF","status":"ativo"},
]

@router.get("/dashboard")
async def dashboard():
    ult = _ATENDIMENTOS_NASF[-1]
    alertas = [u for u in _USUARIOS_PRIORITARIOS if u["alerta"]]
    return {
        "competencia":         "Mar/2026",
        "atend_individual_mes": ult["atend_individual"],
        "matriciamento_mes":   ult["matriciamento"],
        "usuarios_priorizados": len(_USUARIOS_PRIORITARIOS),
        "usuarios_alerta":     len(alertas),
        "grupos_ativos":       len([g for g in _GRUPOS_TERAPEUTICOS if g["status"]=="ativo"]),
        "indicadores_criticos":sum(1 for i in _INDICADORES if i["status"]=="critico"),
        "historico":           _ATENDIMENTOS_NASF,
    }

@router.get("/indicadores")
async def indicadores():
    return _INDICADORES

@router.get("/usuarios")
async def usuarios():
    return sorted(_USUARIOS_PRIORITARIOS, key=lambda u: (u["alerta"] is None, u["retorno_regular"]))

@router.get("/grupos")
async def grupos():
    return _GRUPOS_TERAPEUTICOS

@router.get("/producao")
async def producao():
    return _ATENDIMENTOS_NASF
