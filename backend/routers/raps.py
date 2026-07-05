"""
RAPS — Rede de Atenção Psicossocial / Saúde Mental
FMS Apuí/AM · CAPS · NASF · Leitos psiquiátricos
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/raps", tags=["RAPS"])

_CAPS_DADOS = {
    "nome":       "CAPS I Apuí",
    "tipo":       "CAPS I",
    "responsavel":"Psicóloga Dra. M.S.",
    "capacidade": 30,
    "usuarios_ativos": 24,
    "usuarios_novos_mes": 3,
    "altas_mes": 1,
    "grupos_semana": 4,
    "profissionais": [
        {"cargo":"Psicóloga",              "nome":"Dra. M.S.",   "ch":40, "status":"ativo"},
        {"cargo":"Assistente Social",      "nome":"A.C.B.",      "ch":40, "status":"ativo"},
        {"cargo":"Técnico Enfermagem",     "nome":"P.Q.R.",      "ch":40, "status":"ativo"},
        {"cargo":"Coordenador",            "nome":"L.O.N.",      "ch":20, "status":"ativo"},
        {"cargo":"Psiquiatra (itinerante)","nome":"Dr. F.T.",    "ch": 8, "status":"ativo"},
        {"cargo":"Auxiliar Administrativo","nome":"K.M.S.",      "ch":40, "status":"ativo"},
    ],
}

_USUARIOS = [
    {"id":1,  "iniciais":"A.S.",  "diagnostico":"F20 — Esquizofrenia",          "frequencia":"semanal",  "status":"estavel",   "meses_acomp":18, "risco":"baixo",  "acs":"M1"},
    {"id":2,  "iniciais":"B.C.",  "diagnostico":"F31 — Transtorno Bipolar",      "frequencia":"quinzenal","status":"atencao",   "meses_acomp":9,  "risco":"medio",  "acs":"M2"},
    {"id":3,  "iniciais":"D.E.",  "diagnostico":"F32 — Episódio Depressivo",     "frequencia":"mensal",   "status":"estavel",   "meses_acomp":5,  "risco":"baixo",  "acs":"M3"},
    {"id":4,  "iniciais":"F.G.",  "diagnostico":"F41 — Transtorno Ansiedade",    "frequencia":"quinzenal","status":"estavel",   "meses_acomp":3,  "risco":"baixo",  "acs":"M1"},
    {"id":5,  "iniciais":"H.I.",  "diagnostico":"F10 — Transtorno Álcool",       "frequencia":"semanal",  "status":"critico",   "meses_acomp":22, "risco":"alto",   "acs":"M4"},
    {"id":6,  "iniciais":"J.K.",  "diagnostico":"F20 — Esquizofrenia",           "frequencia":"semanal",  "status":"estavel",   "meses_acomp":36, "risco":"medio",  "acs":"M5"},
    {"id":7,  "iniciais":"L.M.",  "diagnostico":"F33 — Depressão Recorrente",    "frequencia":"mensal",   "status":"atencao",   "meses_acomp":7,  "risco":"medio",  "acs":"M2"},
    {"id":8,  "iniciais":"N.O.",  "diagnostico":"F11 — Transtorno Opioide",      "frequencia":"semanal",  "status":"critico",   "meses_acomp":4,  "risco":"alto",   "acs":"M6"},
    {"id":9,  "iniciais":"P.Q.",  "diagnostico":"F43 — Reação Estresse Agudo",   "frequencia":"quinzenal","status":"estavel",   "meses_acomp":2,  "risco":"baixo",  "acs":"M7"},
    {"id":10, "iniciais":"R.S.",  "diagnostico":"F70 — Retardo Mental Leve",     "frequencia":"mensal",   "status":"estavel",   "meses_acomp":48, "risco":"baixo",  "acs":"M3"},
    {"id":11, "iniciais":"T.U.",  "diagnostico":"F90 — TDAH",                    "frequencia":"mensal",   "status":"estavel",   "meses_acomp":6,  "risco":"baixo",  "acs":"M8"},
    {"id":12, "iniciais":"V.W.",  "diagnostico":"F32 — Episódio Depressivo",     "frequencia":"quinzenal","status":"atencao",   "meses_acomp":1,  "risco":"medio",  "acs":"M1"},
    {"id":13, "iniciais":"X.Y.",  "diagnostico":"F20 — Esquizofrenia",           "frequencia":"semanal",  "status":"critico",   "meses_acomp":60, "risco":"alto",   "acs":"M4"},
    {"id":14, "iniciais":"Z.A.",  "diagnostico":"F10 — Transtorno Álcool",       "frequencia":"semanal",  "status":"atencao",   "meses_acomp":8,  "risco":"medio",  "acs":"M5"},
    {"id":15, "iniciais":"B.D.",  "diagnostico":"F41 — Transtorno Ansiedade",    "frequencia":"mensal",   "status":"estavel",   "meses_acomp":4,  "risco":"baixo",  "acs":"M6"},
    {"id":16, "iniciais":"E.G.",  "diagnostico":"F31 — Transtorno Bipolar",      "frequencia":"quinzenal","status":"estavel",   "meses_acomp":14, "risco":"baixo",  "acs":"M2"},
    {"id":17, "iniciais":"H.J.",  "diagnostico":"F50 — Transt. Alimentar",       "frequencia":"semanal",  "status":"atencao",   "meses_acomp":3,  "risco":"medio",  "acs":"M7"},
    {"id":18, "iniciais":"K.N.",  "diagnostico":"F19 — Transt. Múltiplas Subst.","frequencia":"semanal",  "status":"critico",   "meses_acomp":10, "risco":"alto",   "acs":"M8"},
    {"id":19, "iniciais":"P.R.",  "diagnostico":"F32 — Episódio Depressivo",     "frequencia":"mensal",   "status":"estavel",   "meses_acomp":2,  "risco":"baixo",  "acs":"M3"},
    {"id":20, "iniciais":"S.V.",  "diagnostico":"F22 — Transtorno Delirante",    "frequencia":"semanal",  "status":"atencao",   "meses_acomp":12, "risco":"medio",  "acs":"M1"},
    {"id":21, "iniciais":"T.X.",  "diagnostico":"F33 — Depressão Recorrente",    "frequencia":"quinzenal","status":"estavel",   "meses_acomp":6,  "risco":"baixo",  "acs":"M4"},
    {"id":22, "iniciais":"U.Z.",  "diagnostico":"F20 — Esquizofrenia",           "frequencia":"semanal",  "status":"estavel",   "meses_acomp":28, "risco":"medio",  "acs":"M5"},
    {"id":23, "iniciais":"W.B.",  "diagnostico":"F43 — Estresse Pós-traumático", "frequencia":"mensal",   "status":"atencao",   "meses_acomp":5,  "risco":"medio",  "acs":"M6"},
    {"id":24, "iniciais":"Y.C.",  "diagnostico":"F41 — Transtorno Ansiedade",    "frequencia":"mensal",   "status":"estavel",   "meses_acomp":3,  "risco":"baixo",  "acs":"M7"},
]

_GRUPOS = [
    {"id":1,"nome":"Grupo de Convivência",         "dia":"Segunda","horario":"14h","n_usuarios":8, "facilitador":"Assistente Social"},
    {"id":2,"nome":"Grupo de Álcool e Drogas (GAD)","dia":"Terça",  "horario":"09h","n_usuarios":6, "facilitador":"Psicóloga"},
    {"id":3,"nome":"Grupo de Depressão e Ansiedade","dia":"Quarta", "horario":"10h","n_usuarios":7, "facilitador":"Psicóloga"},
    {"id":4,"nome":"Assembleia de Usuários",        "dia":"Sexta",  "horario":"14h","n_usuarios":18,"facilitador":"Equipe CAPS"},
]

_LEITOS_REF = [
    {"tipo":"Leito psiquiátrico hospital geral", "hospital":"Hospital Regional Apuí","total":4,"disponiveis":1,"internacoes_mes":3},
    {"tipo":"Leito referência Manaus",           "hospital":"HPGV Manaus",           "total":6,"disponiveis":2,"internacoes_mes":2},
]

_HISTORICO = [
    {"mes":"Nov/25","atend":82,"novos":2,"crises":1,"internacoes":1},
    {"mes":"Dez/25","atend":78,"novos":1,"crises":2,"internacoes":1},
    {"mes":"Jan/26","atend":85,"novos":3,"crises":1,"internacoes":0},
    {"mes":"Fev/26","atend":80,"novos":2,"crises":0,"internacoes":1},
    {"mes":"Mar/26","atend":88,"novos":3,"crises":2,"internacoes":2},
    {"mes":"Abr/26","atend":91,"novos":3,"crises":1,"internacoes":1},
]

@router.get("/dashboard")
async def dashboard():
    alto_risco = sum(1 for u in _USUARIOS if u["risco"] == "alto")
    criticos   = sum(1 for u in _USUARIOS if u["status"] == "critico")
    por_diag: dict = {}
    for u in _USUARIOS:
        base = u["diagnostico"].split(" — ")[1]
        por_diag[base] = por_diag.get(base, 0) + 1
    return {
        "competencia":       "Abr/2026",
        "usuarios_ativos":   len(_USUARIOS),
        "capacidade":        _CAPS_DADOS["capacidade"],
        "taxa_ocupacao":     round(len(_USUARIOS) / _CAPS_DADOS["capacidade"] * 100, 1),
        "novos_mes":         _CAPS_DADOS["usuarios_novos_mes"],
        "alto_risco":        alto_risco,
        "status_critico":    criticos,
        "grupos_semana":     len(_GRUPOS),
        "profissionais":     len(_CAPS_DADOS["profissionais"]),
        "leitos_disponiveis":sum(l["disponiveis"] for l in _LEITOS_REF),
        "internacoes_mes":   sum(l["internacoes_mes"] for l in _LEITOS_REF),
        "por_diagnostico":   [{"diag":k,"n":v} for k,v in sorted(por_diag.items(), key=lambda x:-x[1])],
        "historico":         _HISTORICO,
    }

@router.get("/caps")
async def caps():
    return _CAPS_DADOS

@router.get("/usuarios")
async def usuarios():
    return _USUARIOS

@router.get("/grupos")
async def grupos():
    return _GRUPOS

@router.get("/leitos")
async def leitos():
    return _LEITOS_REF
