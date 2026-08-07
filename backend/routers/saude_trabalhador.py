"""
Saúde do Trabalhador — CEREST / RENAST — Apuí/AM
Portaria GM/MS nº 1.823/2012 — Política Nacional de Saúde do Trabalhador e da Trabalhadora
"""
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-trabalhador", tags=["Saúde do Trabalhador"])

@lru_cache(maxsize=1)
def _AGRAVOS_2026():
    return [
        {"id":1,"mes":"Jan","agravo":"Acidente trabalho típico",    "setor":"Agropecuária","nexo_causal":True, "afastamento_dias":14,"cat_emitida":True, "investigado":True, "alerta":None},
        {"id":2,"mes":"Jan","agravo":"LER/DORT",                   "setor":"Comércio",    "nexo_causal":True, "afastamento_dias":30,"cat_emitida":False,"investigado":True, "alerta":"CAT não emitida"},
        {"id":3,"mes":"Jan","agravo":"Acidente trabalho típico",    "setor":"Construção",  "nexo_causal":True, "afastamento_dias":21,"cat_emitida":True, "investigado":True, "alerta":None},
        {"id":4,"mes":"Fev","agravo":"Intoxicação por agrotóxico",  "setor":"Agropecuária","nexo_causal":True, "afastamento_dias":7, "cat_emitida":True, "investigado":True, "alerta":"notif. SINAN obrigatória"},
        {"id":5,"mes":"Fev","agravo":"Acidente trabalho trajeto",   "setor":"Saúde",       "nexo_causal":True, "afastamento_dias":5, "cat_emitida":True, "investigado":True, "alerta":None},
        {"id":6,"mes":"Fev","agravo":"Transtorno mental trabalho",  "setor":"Agropecuária","nexo_causal":False,"afastamento_dias":45,"cat_emitida":False,"investigado":False,"alerta":"nexo causal a investigar"},
        {"id":7,"mes":"Mar","agravo":"Acidente trabalho típico",    "setor":"Madeireiro",  "nexo_causal":True, "afastamento_dias":62,"cat_emitida":True, "investigado":True, "alerta":"grave — amputação parcial"},
        {"id":8,"mes":"Mar","agravo":"Dermatose ocupacional",       "setor":"Agropecuária","nexo_causal":True, "afastamento_dias":8, "cat_emitida":True, "investigado":True, "alerta":None},
        {"id":9,"mes":"Mar","agravo":"Intoxicação por agrotóxico",  "setor":"Agropecuária","nexo_causal":True, "afastamento_dias":3, "cat_emitida":True, "investigado":True, "alerta":None},
        {"id":10,"mes":"Mar","agravo":"LER/DORT",                  "setor":"Saúde",       "nexo_causal":True, "afastamento_dias":20,"cat_emitida":True, "investigado":True, "alerta":None},
    ]


@lru_cache(maxsize=1)
def _SETORES():
    return [
        {"setor":"Agropecuária",  "trabalhadores_est":1840,"acidentes_2026":4,"doencas_2026":2,"taxa_acidente":2.17,"risco":"alto"},
        {"setor":"Madeireiro",    "trabalhadores_est":320, "acidentes_2026":1,"doencas_2026":0,"taxa_acidente":3.13,"risco":"alto"},
        {"setor":"Construção",    "trabalhadores_est":285, "acidentes_2026":1,"doencas_2026":0,"taxa_acidente":3.51,"risco":"alto"},
        {"setor":"Comércio",      "trabalhadores_est":612, "acidentes_2026":0,"doencas_2026":1,"taxa_acidente":0.00,"risco":"medio"},
        {"setor":"Saúde",         "trabalhadores_est":247, "acidentes_2026":1,"doencas_2026":1,"taxa_acidente":4.05,"risco":"medio"},
        {"setor":"Educação",      "trabalhadores_est":310, "acidentes_2026":0,"doencas_2026":0,"taxa_acidente":0.00,"risco":"baixo"},
        {"setor":"Administração", "trabalhadores_est":184, "acidentes_2026":0,"doencas_2026":0,"taxa_acidente":0.00,"risco":"baixo"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano":"2021","acidentes_tipicos":12,"doencas_trab":5,"intox_agrotox":6,"obitos_trabalho":1},
        {"ano":"2022","acidentes_tipicos":14,"doencas_trab":4,"intox_agrotox":8,"obitos_trabalho":0},
        {"ano":"2023","acidentes_tipicos":11,"doencas_trab":6,"intox_agrotox":5,"obitos_trabalho":1},
        {"ano":"2024","acidentes_tipicos":13,"doencas_trab":5,"intox_agrotox":7,"obitos_trabalho":0},
        {"ano":"2025","acidentes_tipicos":15,"doencas_trab":7,"intox_agrotox":9,"obitos_trabalho":1},
        {"ano":"2026*","acidentes_tipicos":5,"doencas_trab":3,"intox_agrotox":2,"obitos_trabalho":0},
    ]


@lru_cache(maxsize=1)
def _ACOES_CEREST():
    return [
        {"acao":"Vigilância em estabelecimentos — visitas",      "realizadas_2026":12,"meta_ano":24,"status":"atencao"},
        {"acao":"Capacitação rede APS — agrotóxico",             "realizadas_2026":2, "meta_ano":4, "status":"atencao"},
        {"acao":"Notificações SINAN Trabalho inseridas",         "realizadas_2026":10,"meta_ano":10,"status":"ok"},
        {"acao":"Análise acidentes com afastamento >15d",        "realizadas_2026":2, "meta_ano":2, "status":"ok"},
        {"acao":"Parceria INSS — nexo previdenciário",           "realizadas_2026":1, "meta_ano":2, "status":"atencao"},
        {"acao":"Reunião Comissão Municipal Saúde Trab.",        "realizadas_2026":1, "meta_ano":4, "status":"critico"},
    ]


@router.get("/dashboard")
async def dashboard():
    alertas = [a for a in _AGRAVOS_2026() if a["alerta"]]
    total_af = sum(a["afastamento_dias"] for a in _AGRAVOS_2026())
    return {
        "competencia":      "Mar/2026",
        "agravos_2026":     len(_AGRAVOS_2026()),
        "acidentes_tipicos":sum(1 for a in _AGRAVOS_2026() if "típico" in a["agravo"]),
        "intox_agrotox":    sum(1 for a in _AGRAVOS_2026() if "agrotóxico" in a["agravo"]),
        "alertas":          len(alertas),
        "dias_afastamento": total_af,
        "cat_pendentes":    sum(1 for a in _AGRAVOS_2026() if not a["cat_emitida"]),
        "historico":        _HISTORICO(),
    }

@router.get("/agravos")
async def agravos():
    return sorted(_AGRAVOS_2026, key=lambda a: (a["alerta"] is None, -a["afastamento_dias"]))

@router.get("/setores")
async def setores():
    return sorted(_SETORES, key=lambda s: -s["taxa_acidente"])

@router.get("/acoes")
async def acoes():
    return _ACOES_CEREST
