"""
SISVAN — Vigilância Alimentar e Nutricional — Apuí/AM
Crianças < 5 anos, Gestantes, Adultos/Idosos
"""
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/sisvan", tags=["SISVAN"])

@lru_cache(maxsize=1)
def _CRIANCAS():
    return [
        {"faixa":"< 6 meses","acomp":38,"eutrofico_pct":57.9,"sob_pct":21.1,"obe_pct":5.3,"desnut_pct":15.8,"risco_desnut_pct":10.5},
        {"faixa":"6-11 meses","acomp":42,"eutrofico_pct":54.8,"sob_pct":23.8,"obe_pct":4.8,"desnut_pct":16.7,"risco_desnut_pct":11.9},
        {"faixa":"1-2 anos","acomp":95,"eutrofico_pct":52.6,"sob_pct":26.3,"obe_pct":6.3,"desnut_pct":14.7,"risco_desnut_pct":9.5},
        {"faixa":"2-5 anos","acomp":124,"eutrofico_pct":49.2,"sob_pct":28.2,"obe_pct":8.9,"desnut_pct":13.7,"risco_desnut_pct":8.9},
    ]


@lru_cache(maxsize=1)
def _GESTANTES():
    return [
        {"trimestre":"1º trim.","acomp":24,"baixo_peso_pct":8.3,"eutrofica_pct":66.7,"sobrepeso_pct":20.8,"obesidade_pct":4.2},
        {"trimestre":"2º trim.","acomp":28,"baixo_peso_pct":7.1,"eutrofica_pct":60.7,"sobrepeso_pct":25.0,"obesidade_pct":7.1},
        {"trimestre":"3º trim.","acomp":22,"baixo_peso_pct":9.1,"eutrofica_pct":54.5,"sobrepeso_pct":27.3,"obesidade_pct":9.1},
    ]


@lru_cache(maxsize=1)
def _ADULTOS_IDOSOS():
    return [
        {"grupo":"Adulto 20-59 F","acomp":312,"normal_pct":29.5,"sobrepeso_pct":34.6,"obesidade_pct":22.4,"baixo_peso_pct":13.5},
        {"grupo":"Adulto 20-59 M","acomp":194,"normal_pct":32.5,"sobrepeso_pct":37.1,"obesidade_pct":18.6,"baixo_peso_pct":11.9},
        {"grupo":"Idoso ≥ 60 F", "acomp":87, "normal_pct":30.0,"sobrepeso_pct":36.8,"obesidade_pct":18.4,"baixo_peso_pct":14.9},
        {"grupo":"Idoso ≥ 60 M", "acomp":58, "normal_pct":29.3,"sobrepeso_pct":34.5,"obesidade_pct":13.8,"baixo_peso_pct":22.4},
    ]


@lru_cache(maxsize=1)
def _HISTORICO_ACOMP():
    return [
        {"mes":"Out/25","criancas":262,"gestantes":65,"adultos_idosos":598},
        {"mes":"Nov/25","criancas":275,"gestantes":68,"adultos_idosos":612},
        {"mes":"Dez/25","criancas":268,"gestantes":62,"adultos_idosos":594},
        {"mes":"Jan/26","criancas":281,"gestantes":70,"adultos_idosos":622},
        {"mes":"Fev/26","criancas":290,"gestantes":73,"adultos_idosos":635},
        {"mes":"Mar/26","criancas":299,"gestantes":74,"adultos_idosos":651},
    ]


@lru_cache(maxsize=1)
def _BOLSA_FAMILIA_NUTRI():
    return [
        {"equipe":"ESF Central",       "beneficiarios":118,"acomp_criancas_pct":82.2,"acomp_gestantes_pct":91.7,"inadimplentes":21},
        {"equipe":"ESF Alto Apuí",     "beneficiarios":94, "acomp_criancas_pct":77.7,"acomp_gestantes_pct":88.2,"inadimplentes":21},
        {"equipe":"ESF São Cristóvão", "beneficiarios":107,"acomp_criancas_pct":79.4,"acomp_gestantes_pct":86.7,"inadimplentes":22},
        {"equipe":"ESF Bela Vista",    "beneficiarios":86, "acomp_criancas_pct":69.8,"acomp_gestantes_pct":80.0,"inadimplentes":26},
        {"equipe":"ESF Estrada Nova",  "beneficiarios":72, "acomp_criancas_pct":65.3,"acomp_gestantes_pct":75.0,"inadimplentes":25},
        {"equipe":"ESF Linha 1",       "beneficiarios":91, "acomp_criancas_pct":71.4,"acomp_gestantes_pct":83.3,"inadimplentes":26},
        {"equipe":"ESF Linha 2",       "beneficiarios":83, "acomp_criancas_pct":73.5,"acomp_gestantes_pct":85.7,"inadimplentes":22},
        {"equipe":"ESF Km 20",         "beneficiarios":68, "acomp_criancas_pct":66.2,"acomp_gestantes_pct":78.6,"inadimplentes":23},
        {"equipe":"ESF Cotovelo",      "beneficiarios":79, "acomp_criancas_pct":68.4,"acomp_gestantes_pct":81.3,"inadimplentes":25},
    ]


@router.get("/dashboard")
async def dashboard():
    total_criancas = sum(g["acomp"] for g in _CRIANCAS())
    desnut_global  = sum(g["acomp"] * g["desnut_pct"] / 100 for g in _CRIANCAS()) / total_criancas * 100
    sob_global     = sum(g["acomp"] * (g["sob_pct"] + g["obe_pct"]) / 100 for g in _CRIANCAS()) / total_criancas * 100
    return {
        "competencia":           "Mar/2026",
        "criancas_acompanhadas": total_criancas,
        "gestantes_acompanhadas": sum(g["acomp"] for g in _GESTANTES()),
        "adultos_acompanhados":  sum(g["acomp"] for g in _ADULTOS_IDOSOS()),
        "desnutricao_criancas_pct": round(desnut_global, 1),
        "sobrepeso_criancas_pct":   round(sob_global, 1),
        "historico_acompanhamento": _HISTORICO_ACOMP(),
        "bf_inadimplentes_total":   sum(e["inadimplentes"] for e in _BOLSA_FAMILIA_NUTRI()),
    }

@router.get("/criancas")
async def criancas():
    return _CRIANCAS

@router.get("/gestantes")
async def gestantes():
    return _GESTANTES

@router.get("/adultos")
async def adultos():
    return _ADULTOS_IDOSOS

@router.get("/bolsa-familia")
async def bolsa_familia():
    return _BOLSA_FAMILIA_NUTRI
