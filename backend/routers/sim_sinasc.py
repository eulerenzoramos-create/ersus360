"""
SIM / SINASC — Mortalidade e Nascidos Vivos — Apuí/AM
Sistema de Informação sobre Mortalidade / Sistema de Informações sobre Nascidos Vivos
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/sim-sinasc", tags=["SIM / SINASC"])

_OBITOS_2026 = [
    {"id":1, "mes":"Jan","capitulo_cid":"IX — Doenças cardiovasculares","causa_basica":"Infarto agudo do miocárdio","sexo":"M","idade":72,"local_ocorrencia":"hospital","evitavel":False,"investigado":True},
    {"id":2, "mes":"Jan","capitulo_cid":"X — Doenças respiratórias",    "causa_basica":"DPOC exacerbação",           "sexo":"M","idade":68,"local_ocorrencia":"hospital","evitavel":False,"investigado":True},
    {"id":3, "mes":"Fev","capitulo_cid":"IX — Doenças cardiovasculares","causa_basica":"AVC hemorrágico",             "sexo":"F","idade":81,"local_ocorrencia":"hospital","evitavel":False,"investigado":True},
    {"id":4, "mes":"Fev","capitulo_cid":"XX — Causas externas",         "causa_basica":"Acidente trânsito (moto)",   "sexo":"M","idade":24,"local_ocorrencia":"via_publica","evitavel":True,"investigado":True},
    {"id":5, "mes":"Fev","capitulo_cid":"II — Neoplasias",              "causa_basica":"Câncer pulmão",              "sexo":"M","idade":59,"local_ocorrencia":"hospital","evitavel":False,"investigado":True},
    {"id":6, "mes":"Mar","capitulo_cid":"IX — Doenças cardiovasculares","causa_basica":"Insuficiência cardíaca",     "sexo":"F","idade":88,"local_ocorrencia":"domicilio","evitavel":False,"investigado":True},
    {"id":7, "mes":"Mar","capitulo_cid":"I — Doenças infecciosas",      "causa_basica":"Sepse por foco urinário",    "sexo":"F","idade":76,"local_ocorrencia":"hospital","evitavel":True, "investigado":True},
    {"id":8, "mes":"Mar","capitulo_cid":"XX — Causas externas",         "causa_basica":"Afogamento — Rio Sucunduri", "sexo":"M","idade":17,"local_ocorrencia":"via_publica","evitavel":True,"investigado":True},
]

_OBITOS_INFANTIS_2026 = [
    {"id":1,"mes":"Jan","tipo":"neonatal_precoce","causa":"Prematuridade extrema","ig_semanas":26,"peso_nasc":680,  "local":"hospital","evitavel":True, "investigado":True},
    {"id":2,"mes":"Fev","tipo":"pos_neonatal",    "causa":"Pneumonia — baixo peso","ig_semanas":34,"peso_nasc":1980,"local":"domicilio","evitavel":True, "investigado":True},
    {"id":3,"mes":"Mar","tipo":"neonatal_tardio", "causa":"Malformação congênita cardíaca","ig_semanas":39,"peso_nasc":3100,"local":"hospital","evitavel":False,"investigado":True},
]

_NASCIDOS_VIVOS_2026 = [
    {"mes":"Jan","nascimentos":21,"parto_normal_pct":57.1,"cesarea_pct":42.9,"prematuros":2,"baixo_peso":1,"apgar1_menor7":1,"apgar5_menor7":0},
    {"mes":"Fev","nascimentos":19,"parto_normal_pct":63.2,"cesarea_pct":36.8,"prematuros":1,"baixo_peso":2,"apgar1_menor7":1,"apgar5_menor7":0},
    {"mes":"Mar","nascimentos":23,"parto_normal_pct":60.9,"cesarea_pct":39.1,"prematuros":2,"baixo_peso":1,"apgar1_menor7":2,"apgar5_menor7":1},
]

_HISTORICO_MORTALIDADE = [
    {"ano":"2021","obitos_gerais":78,"obitos_infantis":5,"tmi":21.3,"causas_externas_pct":18.0,"cardiovasc_pct":32.0},
    {"ano":"2022","obitos_gerais":82,"obitos_infantis":4,"tmi":17.8,"causas_externas_pct":20.0,"cardiovasc_pct":30.0},
    {"ano":"2023","obitos_gerais":75,"obitos_infantis":6,"tmi":24.8,"causas_externas_pct":22.0,"cardiovasc_pct":28.0},
    {"ano":"2024","obitos_gerais":80,"obitos_infantis":3,"tmi":13.2,"causas_externas_pct":19.0,"cardiovasc_pct":31.0},
    {"ano":"2025","obitos_gerais":79,"obitos_infantis":4,"tmi":17.4,"causas_externas_pct":21.0,"cardiovasc_pct":29.0},
]

@router.get("/dashboard")
async def dashboard():
    nv_total = sum(n["nascimentos"] for n in _NASCIDOS_VIVOS_2026)
    oi_total = len(_OBITOS_INFANTIS_2026)
    tmi_2026 = round(oi_total / nv_total * 1000, 1)
    evitaveis = sum(1 for o in _OBITOS_2026 if o["evitavel"])
    return {
        "competencia":      "Mar/2026",
        "obitos_gerais_2026": len(_OBITOS_2026),
        "obitos_infantis_2026": oi_total,
        "nascidos_vivos_2026": nv_total,
        "tmi_2026":         tmi_2026,
        "obitos_evitaveis": evitaveis,
        "cesarea_pct_media": round(sum(n["cesarea_pct"] for n in _NASCIDOS_VIVOS_2026)/len(_NASCIDOS_VIVOS_2026), 1),
        "historico":        _HISTORICO_MORTALIDADE,
    }

@router.get("/obitos")
async def obitos():
    return _OBITOS_2026

@router.get("/obitos-infantis")
async def obitos_infantis():
    return _OBITOS_INFANTIS_2026

@router.get("/nascidos-vivos")
async def nascidos_vivos():
    return _NASCIDOS_VIVOS_2026

@router.get("/historico")
async def historico():
    return _HISTORICO_MORTALIDADE
