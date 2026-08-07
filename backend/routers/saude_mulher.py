"""
Saúde da Mulher — Pré-natal, Puerpério, Preventivo
FMS Apuí/AM · SISPRENATAL / e-SUS
"""
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-mulher", tags=["Saúde da Mulher"])

@lru_cache(maxsize=1)
def _GESTANTES():
    return [
        # dados anonimizados por iniciais
        {"id":1, "iniciais":"A.S.F.", "equipe":"ESF Liberdade",    "ig_atual":28,"consultas":6,"consultas_meta":6,"odonto":True, "hiv_sifilis":True, "risco":"baixo","acs":"M1","proximo_retorno":"2026-04-28"},
        {"id":2, "iniciais":"B.R.O.", "equipe":"ESF Kennedy",      "ig_atual":14,"consultas":2,"consultas_meta":6,"odonto":False,"hiv_sifilis":True, "risco":"habitual","acs":"M2","proximo_retorno":"2026-05-05"},
        {"id":3, "iniciais":"C.P.M.", "equipe":"ESF Cachoeira",    "ig_atual":36,"consultas":8,"consultas_meta":6,"odonto":True, "hiv_sifilis":True, "risco":"alto",  "acs":"M3","proximo_retorno":"2026-04-22"},
        {"id":4, "iniciais":"D.N.T.", "equipe":"ESF JK",           "ig_atual":20,"consultas":4,"consultas_meta":6,"odonto":True, "hiv_sifilis":True, "risco":"baixo","acs":"M4","proximo_retorno":"2026-05-10"},
        {"id":5, "iniciais":"E.L.V.", "equipe":"ESF Liberdade",    "ig_atual":32,"consultas":7,"consultas_meta":6,"odonto":True, "hiv_sifilis":True, "risco":"baixo","acs":"M1","proximo_retorno":"2026-04-30"},
        {"id":6, "iniciais":"F.K.W.", "equipe":"ESF Estrada Nova", "ig_atual":8, "consultas":1,"consultas_meta":6,"odonto":False,"hiv_sifilis":False,"risco":"habitual","acs":"M5","proximo_retorno":"2026-05-18"},
        {"id":7, "iniciais":"G.J.X.", "equipe":"ESF Kennedy",      "ig_atual":24,"consultas":5,"consultas_meta":6,"odonto":True, "hiv_sifilis":True, "risco":"baixo","acs":"M2","proximo_retorno":"2026-05-02"},
        {"id":8, "iniciais":"H.I.Y.", "equipe":"ESF Acari",        "ig_atual":18,"consultas":3,"consultas_meta":6,"odonto":False,"hiv_sifilis":True, "risco":"habitual","acs":"M6","proximo_retorno":"2026-05-08"},
        {"id":9, "iniciais":"I.H.Z.", "equipe":"ESF JK",           "ig_atual":38,"consultas":9,"consultas_meta":6,"odonto":True, "hiv_sifilis":True, "risco":"alto",  "acs":"M4","proximo_retorno":"2026-04-20"},
        {"id":10,"iniciais":"J.G.A.", "equipe":"ESF Cachoeira",    "ig_atual":12,"consultas":2,"consultas_meta":6,"odonto":False,"hiv_sifilis":True, "risco":"baixo","acs":"M3","proximo_retorno":"2026-05-12"},
        {"id":11,"iniciais":"K.F.B.", "equipe":"ESF Liberdade",    "ig_atual":22,"consultas":5,"consultas_meta":6,"odonto":True, "hiv_sifilis":True, "risco":"baixo","acs":"M1","proximo_retorno":"2026-05-06"},
        {"id":12,"iniciais":"L.E.C.", "equipe":"ESF Três Estados", "ig_atual":16,"consultas":2,"consultas_meta":6,"odonto":False,"hiv_sifilis":False,"risco":"alto",  "acs":"M7","proximo_retorno":"2026-05-15"},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador":"Pré-natal 1ª consulta até 12ª semana",  "valor":72.4,"meta":80.0,"status":"atencao","fonte":"e-SUS"},
        {"indicador":"Pré-natal ≥ 6 consultas",               "valor":65.8,"meta":75.0,"status":"atencao","fonte":"e-SUS"},
        {"indicador":"Gestantes com exames 1º trimestre",      "valor":78.2,"meta":80.0,"status":"atencao","fonte":"e-SUS"},
        {"indicador":"Rastreamento HIV/Sífilis gestante",      "valor":88.4,"meta":90.0,"status":"atencao","fonte":"e-SUS"},
        {"indicador":"Consulta odontológica no pré-natal",     "valor":58.3,"meta":70.0,"status":"critico","fonte":"SISAB"},
        {"indicador":"Coleta citopatológico (25-64a)",         "valor":42.1,"meta":70.0,"status":"critico","fonte":"SISAB"},
        {"indicador":"Cobertura mamografia (50-69a)",           "valor":38.6,"meta":60.0,"status":"critico","fonte":"SISMAMA"},
        {"indicador":"Puerpério 1ª consulta até 42 dias",      "valor":81.2,"meta":75.0,"status":"ok",    "fonte":"e-SUS"},
        {"indicador":"Sífilis gestacional (taxa/1000 NV)",     "valor":12.8,"meta":0.5, "status":"critico","fonte":"SINAN","invertido":True},
        {"indicador":"Sífilis congênita (taxa/1000 NV)",       "valor":4.2, "meta":0.5, "status":"critico","fonte":"SINAN","invertido":True},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"mes":"Out/25","gestantes_ativas":48,"consultas":142,"partos":4,"partos_normal":3},
        {"mes":"Nov/25","gestantes_ativas":50,"consultas":148,"partos":5,"partos_normal":4},
        {"mes":"Dez/25","gestantes_ativas":46,"consultas":135,"partos":3,"partos_normal":3},
        {"mes":"Jan/26","gestantes_ativas":52,"consultas":158,"partos":5,"partos_normal":4},
        {"mes":"Fev/26","gestantes_ativas":49,"consultas":144,"partos":4,"partos_normal":3},
        {"mes":"Mar/26","gestantes_ativas":53,"consultas":161,"partos":6,"partos_normal":5},
    ]


@lru_cache(maxsize=1)
def _PUERPERAS():
    return [
        {"id":1,"iniciais":"M.A.P.","equipe":"ESF Liberdade","data_parto":"2026-03-28","consulta_puerp":True, "dias_puerp":16,"risco":"baixo"},
        {"id":2,"iniciais":"N.B.Q.","equipe":"ESF Kennedy",  "data_parto":"2026-04-01","consulta_puerp":False,"dias_puerp":12,"risco":"habitual"},
        {"id":3,"iniciais":"O.C.R.","equipe":"ESF Cachoeira","data_parto":"2026-04-05","consulta_puerp":True, "dias_puerp":8, "risco":"baixo"},
        {"id":4,"iniciais":"P.D.S.","equipe":"ESF JK",       "data_parto":"2026-03-20","consulta_puerp":True, "dias_puerp":24,"risco":"alto"},
        {"id":5,"iniciais":"Q.E.T.","equipe":"ESF Liberdade","data_parto":"2026-04-08","consulta_puerp":False,"dias_puerp":5, "risco":"baixo"},
        {"id":6,"iniciais":"R.F.U.","equipe":"ESF Acari",    "data_parto":"2026-03-15","consulta_puerp":True, "dias_puerp":29,"risco":"habitual"},
    ]


@router.get("/dashboard")
async def dashboard():
    alto_risco   = sum(1 for g in _GESTANTES() if g["risco"]=="alto")
    sem_hiv_sif  = sum(1 for g in _GESTANTES() if not g["hiv_sifilis"])
    sem_odonto   = sum(1 for g in _GESTANTES() if not g["odonto"])
    return {
        "competencia":       "Abr/2026",
        "gestantes_ativas":  len(_GESTANTES()),
        "alto_risco":        alto_risco,
        "sem_teste_hiv_sif": sem_hiv_sif,
        "sem_odonto":        sem_odonto,
        "puerperas_ativas":  len(_PUERPERAS()),
        "puerperas_sem_consulta": sum(1 for p in _PUERPERAS() if not p["consulta_puerp"]),
        "indicadores_criticos": sum(1 for i in _INDICADORES() if i["status"]=="critico"),
        "historico":         _HISTORICO(),
    }

@router.get("/gestantes")
async def gestantes():
    return sorted(_GESTANTES(), key=lambda x: (-["alto","habitual","baixo"].index(x["risco"]) if x["risco"] in ["alto","habitual","baixo"] else 0, x["ig_atual"]))

@router.get("/indicadores")
async def indicadores():
    return _INDICADORES()

@router.get("/puerperas")
async def puerperas():
    return _PUERPERAS()