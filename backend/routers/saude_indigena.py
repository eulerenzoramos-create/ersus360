"""
Saúde Indígena — SESAI / DSEI Alto Rio Purus — Apuí/AM
Articulação municipal com DSEI, referência hospitalar, POLI Indígena
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-indigena", tags=["Saúde Indígena"])

_ALDEIAS = [
    {"id":1,"aldeia":"Aldeia Apuí-Mirim",     "etnia":"Apurinã",   "populacao":148,"polo_base":"Polo Base Apuí","distancia_km":42,"acesso":"fluvial","acs_indigena":"Raimundo Apurinã","consultas_mes":12,"encaminhamentos":3,"status":"ativo"},
    {"id":2,"aldeia":"Aldeia Rio Sucunduri",   "etnia":"Mura",      "populacao":92, "polo_base":"Polo Base Apuí","distancia_km":78,"acesso":"fluvial","acs_indigena":"Josefa Mura",    "consultas_mes":8, "encaminhamentos":2,"status":"ativo"},
    {"id":3,"aldeia":"Aldeia Serra do Apuí",   "etnia":"Tenharim",  "populacao":214,"polo_base":"Polo Base Apuí","distancia_km":115,"acesso":"fluvial+terrestre","acs_indigena":"Paulo Tenharim","consultas_mes":18,"encaminhamentos":5,"status":"ativo"},
    {"id":4,"aldeia":"Aldeia Castanhal",       "etnia":"Tenharim",  "populacao":167,"polo_base":"Polo Base Apuí","distancia_km":98, "acesso":"fluvial","acs_indigena":"Maria Tenharim","consultas_mes":14,"encaminhamentos":4,"status":"ativo"},
    {"id":5,"aldeia":"Aldeia Lago Capanã",     "etnia":"Pirahã",    "populacao":76, "polo_base":"Polo Base Apuí","distancia_km":132,"acesso":"fluvial","acs_indigena":"—","consultas_mes":6,"encaminhamentos":1,"status":"alerta_acesso"},
    {"id":6,"aldeia":"Aldeia Igarapé Grande",  "etnia":"Apurinã",   "populacao":103,"polo_base":"Polo Base Apuí","distancia_km":61, "acesso":"fluvial","acs_indigena":"Carlos Apurinã","consultas_mes":9,"encaminhamentos":2,"status":"ativo"},
]

_INDICADORES = [
    {"indicador":"Cobertura vacinal indígena",           "valor":72.4,"meta":95.0,"unidade":"%","status":"critico","observacao":"Pirahã sem acesso regular — campanha pendente"},
    {"indicador":"Pré-natal (≥6 consultas)",             "valor":61.5,"meta":75.0,"unidade":"%","status":"critico","observacao":"Distância dificulta adesão"},
    {"indicador":"Mortalidade infantil indígena",        "valor":28.4,"meta":15.0,"unidade":"/1.000 NV","status":"critico","invertido":True,"observacao":"3× maior que média municipal"},
    {"indicador":"Desnutrição infantil < 5a",            "valor":22.7,"meta":10.0,"unidade":"%","status":"critico","invertido":True,"observacao":"Alta prevalência etnia Pirahã"},
    {"indicador":"Cobertura ACS indígena",               "valor":83.3,"meta":100.0,"unidade":"%","status":"atencao","observacao":"Aldeia Pirahã sem ACS treinado"},
    {"indicador":"Atend. odontológico indígena",         "valor":38.2,"meta":60.0,"unidade":"%","status":"critico","observacao":"Equipe odontológica itinerante 1×/bimestre"},
    {"indicador":"Internações evitáveis",                "valor":14,"meta":8,"unidade":"casos","status":"atencao","invertido":True,"observacao":"Principalmente IVAS e GEA"},
    {"indicador":"Encaminhamentos para Manaus",          "valor":17,"meta":12,"unidade":"TFD","status":"atencao","invertido":True,"observacao":"Casos oncológicos e cardíacos"},
]

_REFERENCIAS_HOSPITALARES = [
    {"destino":"Hospital 28 de Agosto — Manaus","especialidade":"Oncologia / Cardiologia","casos_2026":6,"distancia_km":830,"transporte":"aéreo/fluvial"},
    {"destino":"HPSC — Humaitá","especialidade":"Cirurgia geral / Ortopedia","casos_2026":5,"distancia_km":280,"transporte":"fluvial"},
    {"destino":"UPA Apuí","especialidade":"Urgência/emergência","casos_2026":32,"distancia_km":0,"transporte":"terrestre"},
    {"destino":"Hospital Regional de Apuí","especialidade":"Internação clínica","casos_2026":18,"distancia_km":0,"transporte":"terrestre"},
]

_HISTORICO = [
    {"mes":"Out/25","consultas":58,"encaminhamentos":12,"vacinacoes":34,"partos":1},
    {"mes":"Nov/25","consultas":62,"encaminhamentos":10,"vacinacoes":41,"partos":2},
    {"mes":"Dez/25","consultas":55,"encaminhamentos":14,"vacinacoes":28,"partos":1},
    {"mes":"Jan/26","consultas":67,"encaminhamentos":13,"vacinacoes":52,"partos":3},
    {"mes":"Fev/26","consultas":71,"encaminhamentos":15,"vacinacoes":47,"partos":2},
    {"mes":"Mar/26","consultas":67,"encaminhamentos":17,"vacinacoes":38,"partos":2},
]

@router.get("/dashboard")
async def dashboard():
    pop_total = sum(a["populacao"] for a in _ALDEIAS)
    crit = sum(1 for i in _INDICADORES if i["status"] == "critico")
    return {
        "competencia":       "Mar/2026",
        "populacao_indigena": pop_total,
        "aldeias":           len(_ALDEIAS),
        "etnias":            len(set(a["etnia"] for a in _ALDEIAS)),
        "consultas_mes":     sum(a["consultas_mes"] for a in _ALDEIAS),
        "encaminhamentos_mes": sum(a["encaminhamentos"] for a in _ALDEIAS),
        "indicadores_criticos": crit,
        "cobertura_vacinal_pct": next(i["valor"] for i in _INDICADORES if "vacinal" in i["indicador"]),
        "historico":         _HISTORICO,
    }

@router.get("/aldeias")
async def aldeias():
    return sorted(_ALDEIAS, key=lambda a: (a["status"]!="alerta_acesso", -a["populacao"]))

@router.get("/indicadores")
async def indicadores():
    return _INDICADORES

@router.get("/referencias")
async def referencias():
    return _REFERENCIAS_HOSPITALARES
