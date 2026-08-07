"""
Notificações Compulsórias — SINAN / e-SUS Notifica
FMS Apuí/AM · Vigilância Epidemiológica
"""
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/sinan", tags=["SINAN"])

@lru_cache(maxsize=1)
def _NOTIFICACOES():
    return [
        # id, agravo, cid, caso, data_notif, bairro/localidade, status, investigado, encerrado, classificacao
        {"id":1,  "agravo":"Dengue",                   "cid":"A90",  "casos":14,"data":"2026-04-01","local":"Centro",        "status":"encerrado",   "investigados":14,"confirmados":12,"descartados":2, "obitos":0, "semana":14},
        {"id":2,  "agravo":"Dengue",                   "cid":"A90",  "casos":8, "data":"2026-04-08","local":"Kennedy",       "status":"encerrado",   "investigados":8, "confirmados":7, "descartados":1, "obitos":0, "semana":15},
        {"id":3,  "agravo":"Dengue",                   "cid":"A90",  "casos":11,"data":"2026-04-15","local":"Liberdade",     "status":"em_invest",   "investigados":9, "confirmados":8, "descartados":1, "obitos":0, "semana":16},
        {"id":4,  "agravo":"Dengue",                   "cid":"A90",  "casos":6, "data":"2026-04-22","local":"Estrada Nova",  "status":"em_invest",   "investigados":4, "confirmados":4, "descartados":0, "obitos":0, "semana":17},
        {"id":5,  "agravo":"Chikungunya",              "cid":"A92.0","casos":3, "data":"2026-03-20","local":"Centro",        "status":"encerrado",   "investigados":3, "confirmados":2, "descartados":1, "obitos":0, "semana":12},
        {"id":6,  "agravo":"Leptospirose",             "cid":"A27",  "casos":2, "data":"2026-02-10","local":"Acari",         "status":"encerrado",   "investigados":2, "confirmados":1, "descartados":1, "obitos":0, "semana":7},
        {"id":7,  "agravo":"Hepatite A",               "cid":"B15",  "casos":1, "data":"2026-01-25","local":"Kennedy",       "status":"encerrado",   "investigados":1, "confirmados":1, "descartados":0, "obitos":0, "semana":4},
        {"id":8,  "agravo":"Tuberculose",              "cid":"A15",  "casos":4, "data":"2026-01-10","local":"Diversas",      "status":"em_invest",   "investigados":4, "confirmados":3, "descartados":1, "obitos":0, "semana":2},
        {"id":9,  "agravo":"Hanseníase",               "cid":"A30",  "casos":2, "data":"2026-02-18","local":"Liberdade",     "status":"encerrado",   "investigados":2, "confirmados":2, "descartados":0, "obitos":0, "semana":8},
        {"id":10, "agravo":"Leishmaniose Visceral",    "cid":"B55.0","casos":1, "data":"2026-03-05","local":"Área Rural",    "status":"encerrado",   "investigados":1, "confirmados":1, "descartados":0, "obitos":0, "semana":10},
        {"id":11, "agravo":"Malária (P. vivax)",       "cid":"B51",  "casos":18,"data":"2026-01-05","local":"Área Rural",    "status":"encerrado",   "investigados":18,"confirmados":18,"descartados":0, "obitos":0, "semana":1},
        {"id":12, "agravo":"Malária (P. vivax)",       "cid":"B51",  "casos":12,"data":"2026-02-02","local":"Área Rural",    "status":"encerrado",   "investigados":12,"confirmados":12,"descartados":0, "obitos":0, "semana":5},
        {"id":13, "agravo":"Malária (P. vivax)",       "cid":"B51",  "casos":9, "data":"2026-03-02","local":"Área Rural",    "status":"encerrado",   "investigados":9, "confirmados":9, "descartados":0, "obitos":0, "semana":9},
        {"id":14, "agravo":"Malária (P. falciparum)",  "cid":"B50",  "casos":2, "data":"2026-02-28","local":"Área Rural",    "status":"encerrado",   "investigados":2, "confirmados":2, "descartados":0, "obitos":0, "semana":9},
        {"id":15, "agravo":"Sífilis Gestacional",      "cid":"A53.9","casos":3, "data":"2026-01-15","local":"Diversas",      "status":"em_invest",   "investigados":3, "confirmados":3, "descartados":0, "obitos":0, "semana":3},
        {"id":16, "agravo":"Sífilis Congênita",        "cid":"A50",  "casos":1, "data":"2026-02-20","local":"UBS Central",   "status":"em_invest",   "investigados":1, "confirmados":1, "descartados":0, "obitos":0, "semana":8},
        {"id":17, "agravo":"HIV/AIDS",                 "cid":"B24",  "casos":2, "data":"2026-03-10","local":"Diversas",      "status":"em_invest",   "investigados":2, "confirmados":2, "descartados":0, "obitos":0, "semana":11},
        {"id":18, "agravo":"Violência Interpessoal",   "cid":"T74",  "casos":5, "data":"2026-04-02","local":"Diversas",      "status":"em_invest",   "investigados":5, "confirmados":5, "descartados":0, "obitos":0, "semana":14},
        {"id":19, "agravo":"Intoxicação Exógena",      "cid":"T65",  "casos":2, "data":"2026-03-18","local":"Centro",        "status":"encerrado",   "investigados":2, "confirmados":2, "descartados":0, "obitos":0, "semana":12},
        {"id":20, "agravo":"COVID-19",                 "cid":"U07.1","casos":8, "data":"2026-04-10","local":"Diversas",      "status":"em_invest",   "investigados":6, "confirmados":5, "descartados":1, "obitos":0, "semana":15},
    ]


@lru_cache(maxsize=1)
def _HISTORICO_SEMANAL():
    return [
        {"semana":"SE 01","malaria":18,"dengue":0,"outros":3},
        {"semana":"SE 04","malaria":10,"dengue":0,"outros":4},
        {"semana":"SE 07","malaria":8, "dengue":2,"outros":5},
        {"semana":"SE 09","malaria":11,"dengue":4,"outros":3},
        {"semana":"SE 12","malaria":5, "dengue":8,"outros":6},
        {"semana":"SE 14","malaria":3, "dengue":14,"outros":7},
        {"semana":"SE 15","malaria":2, "dengue":8,"outros":4},
        {"semana":"SE 16","malaria":1, "dengue":11,"outros":3},
        {"semana":"SE 17","malaria":0, "dengue":6,"outros":2},
    ]


@lru_cache(maxsize=1)
def _ALERTAS():
    return [
        {"tipo":"surto",    "agravo":"Dengue",        "descricao":"Surto ativo — 39 casos confirmados nas últimas 4 semanas. UIs acima da média histórica.", "nivel":"critico"},
        {"tipo":"alerta",   "agravo":"Malária",       "descricao":"Sazonalidade alta jan-mar/26 com 41 casos P. vivax. Borrifação em área rural pendente.", "nivel":"atencao"},
        {"tipo":"critico",  "agravo":"Sífilis Congênita","descricao":"1 caso SC notificado — investigação em andamento. Rastrear pré-natal da mãe.", "nivel":"critico"},
        {"tipo":"alerta",   "agravo":"Tuberculose",   "descricao":"3 casos confirmados em 2026. Completar investigação de contatos.", "nivel":"atencao"},
    ]


@router.get("/dashboard")
async def dashboard():
    total_casos    = sum(n["casos"] for n in _NOTIFICACOES())
    confirmados    = sum(n["confirmados"] for n in _NOTIFICACOES())
    em_invest      = sum(1 for n in _NOTIFICACOES() if n["status"] == "em_invest")
    por_agravo: dict = {}
    for n in _NOTIFICACOES():
        por_agravo[n["agravo"]] = por_agravo.get(n["agravo"], 0) + n["confirmados"]
    top5 = sorted(por_agravo.items(), key=lambda x: -x[1])[:5]
    return {
        "competencia":     "2026 (SE 01–17)",
        "total_casos":     total_casos,
        "confirmados":     confirmados,
        "descartados":     sum(n["descartados"] for n in _NOTIFICACOES()),
        "em_investigacao": em_invest,
        "obitos":          sum(n["obitos"] for n in _NOTIFICACOES()),
        "agravos_distintos": len(set(n["agravo"] for n in _NOTIFICACOES())),
        "top_agravos":     [{"agravo":k,"n":v} for k,v in top5],
        "historico_semanal": _HISTORICO_SEMANAL(),
        "n_alertas_criticos": sum(1 for a in _ALERTAS() if a["nivel"]=="critico"),
    }

@router.get("/notificacoes")
async def notificacoes():
    return _NOTIFICACOES()

@router.get("/alertas")
async def alertas():
    return _ALERTAS()

@router.get("/por-agravo")
async def por_agravo():
    agrupado: dict = {}
    for n in _NOTIFICACOES():
        if n["agravo"] not in agrupado:
            agrupado[n["agravo"]] = {"agravo":n["agravo"],"cid":n["cid"],"casos":0,"confirmados":0,"descartados":0,"obitos":0,"em_invest":0}
        agrupado[n["agravo"]]["casos"]      += n["casos"]
        agrupado[n["agravo"]]["confirmados"]+= n["confirmados"]
        agrupado[n["agravo"]]["descartados"]+= n["descartados"]
        agrupado[n["agravo"]]["obitos"]     += n["obitos"]
        agrupado[n["agravo"]]["em_invest"]  += 1 if n["status"]=="em_invest" else 0
    return sorted(agrupado.values(), key=lambda x: -x["confirmados"])