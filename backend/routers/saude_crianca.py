"""
Saúde da Criança — Crescimento e Desenvolvimento / Caderneta / SISVAN
FMS Apuí/AM
"""
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-crianca", tags=["Saúde da Criança"])

@lru_cache(maxsize=1)
def _CRIANCAS_ACOMP():
    return [
        # amostra representativa por equipe
        {"id":1, "iniciais":"A.S.",  "equipe":"ESF Liberdade",   "idade_meses":6,  "peso_kg":7.2,"altura_cm":66.5,"perimetro_cefalico":42.0,"estado_nutricional":"eutrofico","caderneta_atualizada":True, "vacinas_dia":True, "desenvolvimento":"adequado","risco":"baixo"},
        {"id":2, "iniciais":"B.O.",  "equipe":"ESF Kennedy",     "idade_meses":12, "peso_kg":9.1,"altura_cm":74.0,"perimetro_cefalico":46.0,"estado_nutricional":"eutrofico","caderneta_atualizada":True, "vacinas_dia":True, "desenvolvimento":"adequado","risco":"baixo"},
        {"id":3, "iniciais":"C.N.",  "equipe":"ESF Cachoeira",   "idade_meses":4,  "peso_kg":5.8,"altura_cm":60.0,"perimetro_cefalico":40.5,"estado_nutricional":"eutrofico","caderneta_atualizada":True, "vacinas_dia":False,"desenvolvimento":"adequado","risco":"medio"},
        {"id":4, "iniciais":"D.M.",  "equipe":"ESF Liberdade",   "idade_meses":18, "peso_kg":11.2,"altura_cm":82.0,"perimetro_cefalico":48.0,"estado_nutricional":"sobrepeso","caderneta_atualizada":False,"vacinas_dia":True, "desenvolvimento":"adequado","risco":"medio"},
        {"id":5, "iniciais":"E.L.",  "equipe":"ESF JK",          "idade_meses":8,  "peso_kg":6.8,"altura_cm":69.0,"perimetro_cefalico":43.5,"estado_nutricional":"eutrofico","caderneta_atualizada":True, "vacinas_dia":True, "desenvolvimento":"adequado","risco":"baixo"},
        {"id":6, "iniciais":"F.K.",  "equipe":"ESF Estrada Nova","idade_meses":24, "peso_kg":10.8,"altura_cm":85.0,"perimetro_cefalico":49.0,"estado_nutricional":"eutrofico","caderneta_atualizada":True, "vacinas_dia":True, "desenvolvimento":"adequado","risco":"baixo"},
        {"id":7, "iniciais":"G.J.",  "equipe":"ESF Kennedy",     "idade_meses":3,  "peso_kg":5.2,"altura_cm":58.5,"perimetro_cefalico":39.0,"estado_nutricional":"risco_baixo_peso","caderneta_atualizada":True,"vacinas_dia":True,"desenvolvimento":"adequado","risco":"alto"},
        {"id":8, "iniciais":"H.I.",  "equipe":"ESF Liberdade",   "idade_meses":36, "peso_kg":13.5,"altura_cm":94.0,"perimetro_cefalico":51.0,"estado_nutricional":"eutrofico","caderneta_atualizada":True, "vacinas_dia":True, "desenvolvimento":"adequado","risco":"baixo"},
        {"id":9, "iniciais":"I.H.",  "equipe":"ESF Cachoeira",   "idade_meses":10, "peso_kg":7.4,"altura_cm":72.0,"perimetro_cefalico":45.0,"estado_nutricional":"eutrofico","caderneta_atualizada":False,"vacinas_dia":False,"desenvolvimento":"vigilancia","risco":"alto"},
        {"id":10,"iniciais":"J.G.",  "equipe":"ESF JK",          "idade_meses":15, "peso_kg":9.8,"altura_cm":78.5,"perimetro_cefalico":47.0,"estado_nutricional":"eutrofico","caderneta_atualizada":True, "vacinas_dia":True, "desenvolvimento":"adequado","risco":"baixo"},
        {"id":11,"iniciais":"K.F.",  "equipe":"ESF Três Estados","idade_meses":5,  "peso_kg":6.0,"altura_cm":62.5,"perimetro_cefalico":41.0,"estado_nutricional":"eutrofico","caderneta_atualizada":True, "vacinas_dia":True, "desenvolvimento":"adequado","risco":"baixo"},
        {"id":12,"iniciais":"L.E.",  "equipe":"ESF Acari",       "idade_meses":20, "peso_kg":10.2,"altura_cm":83.5,"perimetro_cefalico":48.5,"estado_nutricional":"desnutricao_risco","caderneta_atualizada":True,"vacinas_dia":True,"desenvolvimento":"vigilancia","risco":"alto"},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador":"Crianças <5a acompanhadas pelo SISVAN",       "valor":82.4,"meta":75.0,"status":"ok",    "unidade":"%"},
        {"indicador":"Cobertura de consulta de puericultura (0-1a)","valor":68.2,"meta":80.0,"status":"atencao","unidade":"%"},
        {"indicador":"Prevalência de aleitamento materno exclusivo (≤6m)","valor":42.1,"meta":60.0,"status":"critico","unidade":"%"},
        {"indicador":"Desnutrição crônica (<5a, altura/idade)",      "valor":8.2, "meta":5.0, "status":"atencao","unidade":"%","invertido":True},
        {"indicador":"Cobertura vacinal infantil (1a dose esquema)", "valor":88.5,"meta":95.0,"status":"atencao","unidade":"%"},
        {"indicador":"Triagem neonatal (PKU/TSH) — cobertura",       "valor":94.2,"meta":95.0,"status":"atencao","unidade":"%"},
        {"indicador":"Mortalidade infantil (taxa/1000 NV)",          "valor":9.8, "meta":10.0,"status":"ok",    "unidade":"/1000 NV","invertido":True},
        {"indicador":"Crianças com caderneta em dia",                "valor":71.4,"meta":80.0,"status":"atencao","unidade":"%"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"mes":"Out/25","criancas_acomp":412,"consultas_puericultura":188,"novos_casos_desnutricao":2},
        {"mes":"Nov/25","criancas_acomp":418,"consultas_puericultura":194,"novos_casos_desnutricao":1},
        {"mes":"Dez/25","criancas_acomp":408,"consultas_puericultura":182,"novos_casos_desnutricao":2},
        {"mes":"Jan/26","criancas_acomp":424,"consultas_puericultura":200,"novos_casos_desnutricao":1},
        {"mes":"Fev/26","criancas_acomp":420,"consultas_puericultura":196,"novos_casos_desnutricao":0},
        {"mes":"Mar/26","criancas_acomp":428,"consultas_puericultura":202,"novos_casos_desnutricao":1},
    ]


@lru_cache(maxsize=1)
def _BOLSA_FAMILIA():
    return [
        {"equipe":"ESF Liberdade",   "familias_bf":218,"acomp_saude":198,"pct":90.8,"criancas_vacinas_dia":185,"criancas_crescimento":194},
        {"equipe":"ESF Kennedy",     "familias_bf":196,"acomp_saude":174,"pct":88.8,"criancas_vacinas_dia":162,"criancas_crescimento":168},
        {"equipe":"ESF Cachoeira",   "familias_bf":184,"acomp_saude":158,"pct":85.9,"criancas_vacinas_dia":148,"criancas_crescimento":152},
        {"equipe":"ESF JK",          "familias_bf":172,"acomp_saude":162,"pct":94.2,"criancas_vacinas_dia":158,"criancas_crescimento":160},
        {"equipe":"ESF Estrada Nova","familias_bf":94, "acomp_saude":72, "pct":76.6,"criancas_vacinas_dia":64, "criancas_crescimento":68},
        {"equipe":"ESF Três Estados","familias_bf":82, "acomp_saude":60, "pct":73.2,"criancas_vacinas_dia":55, "criancas_crescimento":58},
        {"equipe":"ESF Acari",       "familias_bf":76, "acomp_saude":68, "pct":89.5,"criancas_vacinas_dia":64, "criancas_crescimento":66},
        {"equipe":"ESF Maravilha",   "familias_bf":68, "acomp_saude":58, "pct":85.3,"criancas_vacinas_dia":54, "criancas_crescimento":56},
        {"equipe":"ESF Bela Vista",  "familias_bf":54, "acomp_saude":38, "pct":70.4,"criancas_vacinas_dia":34, "criancas_crescimento":36},
    ]


@router.get("/dashboard")
async def dashboard():
    alto_risco  = sum(1 for c in _CRIANCAS_ACOMP() if c["risco"]=="alto")
    sem_vacinas = sum(1 for c in _CRIANCAS_ACOMP() if not c["vacinas_dia"])
    nutri_critica = sum(1 for c in _CRIANCAS_ACOMP() if "desnutricao" in c["estado_nutricional"] or "baixo_peso" in c["estado_nutricional"])
    return {
        "competencia":       "Mar/2026",
        "criancas_acompanhadas": _HISTORICO()[-1]["criancas_acomp"],
        "consultas_puericultura_mes": _HISTORICO()[-1]["consultas_puericultura"],
        "alto_risco":        alto_risco,
        "sem_vacinas_dia":   sem_vacinas,
        "nutricao_critica":  nutri_critica,
        "indicadores_criticos": sum(1 for i in _INDICADORES() if i["status"]=="critico"),
        "familias_bf_total": sum(e["familias_bf"] for e in _BOLSA_FAMILIA()),
        "familias_bf_acomp": sum(e["acomp_saude"] for e in _BOLSA_FAMILIA()),
        "historico":         _HISTORICO(),
    }

@router.get("/criancas")
async def criancas():
    return sorted(_CRIANCAS_ACOMP, key=lambda x: (x["risco"]!="alto", x["risco"]!="medio"))

@router.get("/indicadores")
async def indicadores():
    return _INDICADORES

@router.get("/bolsa-familia")
async def bolsa_familia():
    return _BOLSA_FAMILIA
