"""
Router: /api/vacinas — Sala de Vacinas Apuí/AM
Dados de referência baseados no PNI/SIGSF — calendário nacional de vacinação.
"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/vacinas", tags=["Sala de Vacinas"])

def _ts():
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

_VACINAS = [
    {"nome":"BCG",              "dose":"Dose única","meta_cob":90,"cob":82,"estoque":320,"min_est":50, "temp_ok":True},
    {"nome":"Hepatite B",       "dose":"3 doses",   "meta_cob":95,"cob":91,"estoque":480,"min_est":80, "temp_ok":True},
    {"nome":"Pentavalente",     "dose":"3 doses",   "meta_cob":95,"cob":88,"estoque":390,"min_est":80, "temp_ok":True},
    {"nome":"VIP (Polio inj.)", "dose":"3 doses",   "meta_cob":95,"cob":86,"estoque":310,"min_est":60, "temp_ok":True},
    {"nome":"VRH (Rotavírus)",  "dose":"2 doses",   "meta_cob":90,"cob":84,"estoque":270,"min_est":50, "temp_ok":True},
    {"nome":"Meningocócica C",  "dose":"2 doses",   "meta_cob":95,"cob":79,"estoque":220,"min_est":40, "temp_ok":True},
    {"nome":"Pneumocócica 10v", "dose":"3 doses",   "meta_cob":95,"cob":85,"estoque":350,"min_est":70, "temp_ok":True},
    {"nome":"Febre Amarela",    "dose":"Dose única","meta_cob":95,"cob":93,"estoque":410,"min_est":60, "temp_ok":True},
    {"nome":"Tríplice Viral",   "dose":"2 doses",   "meta_cob":95,"cob":87,"estoque":290,"min_est":50, "temp_ok":True},
    {"nome":"VOP (Polio oral)", "dose":"Reforço",   "meta_cob":95,"cob":81,"estoque":180,"min_est":40, "temp_ok":True},
    {"nome":"DTP",              "dose":"Reforço",   "meta_cob":95,"cob":83,"estoque":240,"min_est":50, "temp_ok":True},
    {"nome":"Varicela",         "dose":"Dose única","meta_cob":90,"cob":75,"estoque":160,"min_est":30, "temp_ok":True},
    {"nome":"Hepatite A",       "dose":"Dose única","meta_cob":90,"cob":80,"estoque":195,"min_est":35, "temp_ok":True},
    {"nome":"HPV Quad.",        "dose":"2 doses",   "meta_cob":80,"cob":68,"estoque":130,"min_est":25, "temp_ok":True},
    {"nome":"dT (Dupla adulto)","dose":"A cada 10a","meta_cob":85,"cob":77,"estoque":280,"min_est":50, "temp_ok":True},
    {"nome":"Influenza",        "dose":"Anual",     "meta_cob":90,"cob":72,"estoque":95, "min_est":40, "temp_ok":True},
    {"nome":"Pneumo 23v (id.)", "dose":"Única/reforço","meta_cob":85,"cob":70,"estoque":85,"min_est":20,"temp_ok":True},
    {"nome":"Covid-19 biv.",    "dose":"Esquema",   "meta_cob":80,"cob":65,"estoque":75, "min_est":20, "temp_ok":True},
]

_HIST_MENSAL = [
    {"mes":"Fev/26","doses":842},{"mes":"Mar/26","doses":1104},
    {"mes":"Abr/26","doses":978},{"mes":"Mai/26","doses":1231},
    {"mes":"Jun/26","doses":1087},{"mes":"Jul/26","doses":1165},
]

_TEMP_LOG = [
    {"hora":"06:00","temp":4.2},{"hora":"08:00","temp":4.5},{"hora":"10:00","temp":4.8},
    {"hora":"12:00","temp":5.1},{"hora":"14:00","temp":5.0},{"hora":"16:00","temp":4.7},
    {"hora":"18:00","temp":4.4},{"hora":"20:00","temp":4.2},
]

@router.get("/dashboard")
async def dashboard():
    abaixo = [v["nome"] for v in _VACINAS if v["cob"] < v["meta_cob"]]
    critico = [v["nome"] for v in _VACINAS if v["estoque"] <= v["min_est"]]
    vencer  = ["Influenza (lote JUL/2026)", "HPV Quad. (lote AGO/2026)"]
    return {
        "situacao_dado":       "referencia_municipal",
        "competencia":         "Jul/2026",
        "total_imunobiol":     len(_VACINAS),
        "doses_aplicadas_mes": 1165,
        "cobertura_media":     round(sum(v["cob"] for v in _VACINAS) / len(_VACINAS), 1),
        "n_abaixo_meta":       len(abaixo),
        "vacinas_abaixo_meta": abaixo,
        "temp_atual_camera":   4.8,
        "n_temp_alerta":       0,
        "temp_alerta":         [],
        "estoque_critico":     critico,
        "proximos_vencer":     vencer,
        "historico_mensal":    _HIST_MENSAL,
        "verificado_em":       _ts(),
        "nota":                "Dados de referência PNI — aguardando integração SIGSF/RNI para dados em tempo real.",
    }


@router.get("/estoque")
async def estoque():
    items = []
    for v in _VACINAS:
        items.append({
            "nome": v["nome"], "dose": v["dose"],
            "estoque_atual": v["estoque"], "estoque_minimo": v["min_est"],
            "status": "critico" if v["estoque"] <= v["min_est"] else ("baixo" if v["estoque"] <= v["min_est"]*2 else "ok"),
            "temp_ok": v["temp_ok"],
        })
    return {
        "situacao_dado": "referencia_municipal",
        "dados": items,
        "verificado_em": _ts(),
    }


@router.get("/temperatura")
async def temperatura():
    return {
        "situacao_dado":  "referencia_municipal",
        "temp_atual":     4.8,
        "temp_min":       2.0,
        "temp_max":       8.0,
        "status":         "ok",
        "log_hoje":       _TEMP_LOG,
        "geladeira":      "Câmara 1 — Domingos Braun",
        "verificado_em":  _ts(),
    }


@router.get("/cobertura")
async def cobertura():
    dados = [{"nome": v["nome"], "meta": v["meta_cob"], "cobertura": v["cob"],
              "status": "ok" if v["cob"] >= v["meta_cob"] else "abaixo"} for v in _VACINAS]
    return {
        "situacao_dado": "referencia_municipal",
        "dados": dados,
        "verificado_em": _ts(),
    }
