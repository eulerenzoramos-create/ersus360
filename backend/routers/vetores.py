"""
Controle de Vetores e Zoonoses — Apuí/AM
Dengue, Malária, Leishmaniose, Raiva Animal
"""
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/vetores", tags=["Controle de Vetores"])

@lru_cache(maxsize=1)
def _CICLOS_DENGUE():
    return [
        {"ciclo":"1/26","periodo":"Jan 01-14","imoveis_prog":620,"imoveis_insp":598,"pct_insp":96.5,"foco_A1":4,"foco_A2":7,"foco_B":2,"foco_C":0,"foco_D":1,"iip":0.85,"ibp":1.03,"situacao":"satisfatorio"},
        {"ciclo":"2/26","periodo":"Jan 15-28","imoveis_prog":620,"imoveis_insp":602,"pct_insp":97.1,"foco_A1":5,"foco_A2":8,"foco_B":3,"foco_C":0,"foco_D":2,"iip":0.99,"ibp":1.18,"situacao":"satisfatorio"},
        {"ciclo":"3/26","periodo":"Fev 01-14","imoveis_prog":620,"imoveis_insp":588,"pct_insp":94.8,"foco_A1":8,"foco_A2":14,"foco_B":4,"foco_C":1,"foco_D":3,"iip":1.67,"ibp":2.07,"situacao":"alerta"},
        {"ciclo":"4/26","periodo":"Fev 15-28","imoveis_prog":620,"imoveis_insp":572,"pct_insp":92.3,"foco_A1":12,"foco_A2":18,"foco_B":6,"foco_C":2,"foco_D":4,"iip":2.44,"ibp":3.15,"situacao":"risco"},
        {"ciclo":"5/26","periodo":"Mar 01-14","imoveis_prog":620,"imoveis_insp":540,"pct_insp":87.1,"foco_A1":22,"foco_A2":31,"foco_B":9,"foco_C":3,"foco_D":6,"iip":4.07,"ibp":5.37,"situacao":"risco"},
        {"ciclo":"6/26","periodo":"Mar 15-28","imoveis_prog":620,"imoveis_insp":556,"pct_insp":89.7,"foco_A1":19,"foco_A2":26,"foco_B":7,"foco_C":2,"foco_D":4,"iip":3.42,"ibp":4.50,"situacao":"risco"},
    ]


@lru_cache(maxsize=1)
def _MALARIA_MENSAL():
    return [
        {"mes":"Out/25","exames":48,"positivos":6,"ivpv":1.4,"p_vivax":6,"p_falciparum":0,"ipa":28.5},
        {"mes":"Nov/25","exames":52,"positivos":9,"ivpv":2.1,"p_vivax":9,"p_falciparum":0,"ipa":42.8},
        {"mes":"Dez/25","exames":61,"positivos":14,"ivpv":3.3,"p_vivax":13,"p_falciparum":1,"ipa":66.5},
        {"mes":"Jan/26","exames":74,"positivos":21,"ivpv":5.0,"p_vivax":20,"p_falciparum":1,"ipa":99.8},
        {"mes":"Fev/26","exames":89,"positivos":28,"ivpv":6.7,"p_vivax":26,"p_falciparum":2,"ipa":133.0},
        {"mes":"Mar/26","exames":95,"positivos":35,"ivpv":8.3,"p_vivax":32,"p_falciparum":3,"ipa":166.2},
    ]


@lru_cache(maxsize=1)
def _ZOONOSES():
    return {
        "campanha_antirabica_2025": {"meta":4200,"vacinados":3847,"cobertura_pct":91.6,"cao":2980,"gato":867,"status":"atingido"},
        "leptospirose_casos_2026": 3,
        "leishmaniose_caes_positivos": 8,
        "leishmaniose_caes_tratados": 2,
        "leishmaniose_caes_eutanasiados": 6,
        "raiva_animais_2026": 0,
        "caes_capturados_2026": 47,
        "caes_adotados": 14,
        "caes_eutanasiados_saude_publica": 5,
    }


@router.get("/dashboard")
async def dashboard():
    ult = _CICLOS_DENGUE()[-1]
    mal_ult = _MALARIA_MENSAL()[-1]
    return {
        "competencia": "Mar/2026",
        "dengue_iip_atual": ult["iip"],
        "dengue_situacao": ult["situacao"],
        "dengue_focos_ativos": ult["foco_A1"] + ult["foco_A2"] + ult["foco_B"] + ult["foco_C"] + ult["foco_D"],
        "dengue_inspecao_pct": ult["pct_insp"],
        "malaria_ivpv_atual": mal_ult["ivpv"],
        "malaria_positivos_mes": mal_ult["positivos"],
        "malaria_ipa": mal_ult["ipa"],
        "zoonoses_cobertura_antirabica": _ZOONOSES()["campanha_antirabica_2025"]["cobertura_pct"],
        "historico_dengue_iip": [{"ciclo": c["ciclo"], "iip": c["iip"], "ibp": c["ibp"]} for c in _CICLOS_DENGUE()],
        "historico_malaria": _MALARIA_MENSAL(),
    }

@router.get("/dengue")
async def dengue():
    return {
        "ciclos": _CICLOS_DENGUE(),
        "limites": {"iip_satisfatorio": 1.0, "iip_alerta": 3.9, "ibp_satisfatorio": 2.0, "ibp_alerta": 5.0},
    }

@router.get("/malaria")
async def malaria():
    return {
        "historico": _MALARIA_MENSAL(),
        "limite_alerta_ivpv": 5.0,
        "limite_critico_ivpv": 10.0,
        "ipa_alto_risco": 50,
        "populacao_risco": 21_057,
    }

@router.get("/zoonoses")
async def zoonoses():
    return _ZOONOSES
