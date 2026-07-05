"""
Saúde do Homem — PNAISH — Apuí/AM
Portaria GM/MS nº 1.944/2009 — Política Nacional de Atenção Integral à Saúde do Homem
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-homem", tags=["Saúde do Homem"])

_INDICADORES = [
    {"indicador":"Consultas masculinas na APS",           "valor":31.4,"meta":50.0,"unidade":"%","status":"critico","observacao":"Homens representam 31% das consultas APS"},
    {"indicador":"PSA solicitado (≥50 anos)",             "valor":42.8,"meta":70.0,"unidade":"%","status":"critico","observacao":"Rastreamento câncer próstata"},
    {"indicador":"Hipertensão controlada (homens)",       "valor":58.3,"meta":75.0,"unidade":"%","status":"atencao"},
    {"indicador":"Diabetes controlado (homens)",          "valor":51.7,"meta":70.0,"unidade":"%","status":"critico"},
    {"indicador":"Cobertura vacinação hepatite B (hom.)", "valor":77.2,"meta":90.0,"unidade":"%","status":"atencao"},
    {"indicador":"Testagem HIV homens",                   "valor":62.4,"meta":80.0,"unidade":"%","status":"atencao"},
    {"indicador":"Exame clínico próstata realizados",     "valor":38.5,"meta":60.0,"unidade":"%","status":"critico"},
    {"indicador":"Saúde mental masculina — rastreio",     "valor":24.8,"meta":50.0,"unidade":"%","status":"critico","observacao":"PHQ-9 aplicado em consultas"},
    {"indicador":"Tabagismo identificado e aconselhado",  "valor":68.9,"meta":80.0,"unidade":"%","status":"atencao"},
    {"indicador":"Circuncisão / fimose atend. APS",       "valor":100.0,"meta":100.0,"unidade":"%","status":"ok"},
]

_PRODUCAO_MENSAL = [
    {"mes":"Out/25","consultas_medicas":184,"consultas_enf":97, "preventivo_psa":18,"testagem_ist":28,"saude_mental":12,"acidente_trabalho":3},
    {"mes":"Nov/25","consultas_medicas":191,"consultas_enf":102,"preventivo_psa":22,"testagem_ist":31,"saude_mental":14,"acidente_trabalho":2},
    {"mes":"Dez/25","consultas_medicas":174,"consultas_enf":88, "preventivo_psa":15,"testagem_ist":25,"saude_mental":10,"acidente_trabalho":4},
    {"mes":"Jan/26","consultas_medicas":198,"consultas_enf":108,"preventivo_psa":24,"testagem_ist":36,"saude_mental":16,"acidente_trabalho":3},
    {"mes":"Fev/26","consultas_medicas":203,"consultas_enf":112,"preventivo_psa":26,"testagem_ist":38,"saude_mental":18,"acidente_trabalho":2},
    {"mes":"Mar/26","consultas_medicas":211,"consultas_enf":118,"preventivo_psa":28,"testagem_ist":41,"saude_mental":19,"acidente_trabalho":3},
]

_CAUSAS_INTERNACAO = [
    {"causa":"Doenças cardiovasculares","casos":14,"pct":29.2,"variacao_12m":"+8%"},
    {"causa":"Traumatismos / acidentes","casos":11,"pct":22.9,"variacao_12m":"+15%"},
    {"causa":"Neoplasias",               "casos":8, "pct":16.7,"variacao_12m":"+5%"},
    {"causa":"Aparelho respiratório",    "casos":6, "pct":12.5,"variacao_12m":"-3%"},
    {"causa":"Saúde mental / SPA",       "casos":5, "pct":10.4,"variacao_12m":"+22%"},
    {"causa":"Outras causas",            "casos":4, "pct":8.3, "variacao_12m":"—"},
]

_ACOES_PNAISH = [
    {"acao":"Sala de espera temática saúde homem",   "realizado":True,  "frequencia":"Mensal",    "ultimo":"Mar/26"},
    {"acao":"Campanha Novembro Azul",                "realizado":True,  "frequencia":"Anual",     "ultimo":"Nov/25"},
    {"acao":"Mutirão PSA + toque retal",             "realizado":True,  "frequencia":"Semestral", "ultimo":"Nov/25"},
    {"acao":"Grupo de homens (saúde mental/álcool)", "realizado":False, "frequencia":"Mensal",    "ultimo":"—"},
    {"acao":"Consulta masculina horário estendido",  "realizado":True,  "frequencia":"Semanal",   "ultimo":"Mar/26"},
    {"acao":"Parceria com CRAS — vulnerabilidade",   "realizado":True,  "frequencia":"Bimestral", "ultimo":"Fev/26"},
]

@router.get("/dashboard")
async def dashboard():
    ult = _PRODUCAO_MENSAL[-1]
    crit = sum(1 for i in _INDICADORES if i["status"] == "critico")
    return {
        "competencia":          "Mar/2026",
        "consultas_mes":        ult["consultas_medicas"] + ult["consultas_enf"],
        "psa_mes":              ult["preventivo_psa"],
        "testagem_ist_mes":     ult["testagem_ist"],
        "indicadores_criticos": crit,
        "acoes_ativas":         sum(1 for a in _ACOES_PNAISH if a["realizado"]),
        "acoes_total":          len(_ACOES_PNAISH),
        "historico":            _PRODUCAO_MENSAL,
    }

@router.get("/indicadores")
async def indicadores():
    return _INDICADORES

@router.get("/producao")
async def producao():
    return _PRODUCAO_MENSAL

@router.get("/internacoes")
async def internacoes():
    return _CAUSAS_INTERNACAO

@router.get("/acoes")
async def acoes():
    return _ACOES_PNAISH
