"""
Sala de Vacinas — Controle de Estoque, Temperatura e Cobertura Vacinal
FMS Apuí/AM · PNI — Programa Nacional de Imunizações
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/vacinas", tags=["Sala de Vacinas"])

# ── Imunobiológicos com dados reais Apuí/AM ──────────────────────────────────

_ESTOQUE = [
    {"id":1,  "vacina":"BCG",                "lote":"BCG2025AM01","validade":"2026-09-30","doses_estoque":180,"doses_min":50, "temp_ideal":(-2,-8),"temp_atual":-5.2,"status_temp":"ok",      "cobertura_pct":92.1,"meta_pct":95,"publico":"RN","doses_aplicadas_mes":22},
    {"id":2,  "vacina":"Hepatite B (RN)",    "lote":"HBVRN25A02", "validade":"2026-11-15","doses_estoque":210,"doses_min":60, "temp_ideal":( 2, 8),"temp_atual": 4.8,"status_temp":"ok",      "cobertura_pct":94.3,"meta_pct":95,"publico":"RN","doses_aplicadas_mes":26},
    {"id":3,  "vacina":"Pentavalente",       "lote":"PENTA25B03", "validade":"2026-08-20","doses_estoque": 95,"doses_min":40, "temp_ideal":( 2, 8),"temp_atual": 5.1,"status_temp":"ok",      "cobertura_pct":87.4,"meta_pct":95,"publico":"2m,4m,6m","doses_aplicadas_mes":18},
    {"id":4,  "vacina":"VIP (Poliomielite)", "lote":"VIP25C04",   "validade":"2026-07-31","doses_estoque": 78,"doses_min":40, "temp_ideal":( 2, 8),"temp_atual": 5.6,"status_temp":"ok",      "cobertura_pct":86.2,"meta_pct":95,"publico":"2m,4m,6m","doses_aplicadas_mes":17},
    {"id":5,  "vacina":"VRH (Rotavírus)",    "lote":"VRH25A05",   "validade":"2026-10-01","doses_estoque": 60,"doses_min":30, "temp_ideal":( 2, 8),"temp_atual": 4.2,"status_temp":"ok",      "cobertura_pct":80.5,"meta_pct":90,"publico":"2m,4m","doses_aplicadas_mes":12},
    {"id":6,  "vacina":"Pneumo 10V",         "lote":"PNM25D06",   "validade":"2026-06-30","doses_estoque": 42,"doses_min":40, "temp_ideal":( 2, 8),"temp_atual": 5.0,"status_temp":"ok",      "cobertura_pct":85.6,"meta_pct":95,"publico":"2m,4m,6m","doses_aplicadas_mes":14},
    {"id":7,  "vacina":"Meningo C",          "lote":"MNC25E07",   "validade":"2026-12-15","doses_estoque":110,"doses_min":35, "temp_ideal":( 2, 8),"temp_atual": 4.5,"status_temp":"ok",      "cobertura_pct":83.1,"meta_pct":95,"publico":"3m,5m","doses_aplicadas_mes":15},
    {"id":8,  "vacina":"Tetra Viral (SCRV)", "lote":"SCRV25F08",  "validade":"2026-05-31","doses_estoque": 28,"doses_min":30, "temp_ideal":(-15,-25),"temp_atual":-18.0,"status_temp":"ok",   "cobertura_pct":77.3,"meta_pct":95,"publico":"15m","doses_aplicadas_mes":8},
    {"id":9,  "vacina":"Varicela",           "lote":"VAR25G09",   "validade":"2026-08-01","doses_estoque": 35,"doses_min":25, "temp_ideal":(-15,-25),"temp_atual":-16.5,"status_temp":"ok",   "cobertura_pct":75.8,"meta_pct":90,"publico":"15m","doses_aplicadas_mes":9},
    {"id":10, "vacina":"DTP (reforço)",      "lote":"DTP25H10",   "validade":"2026-09-01","doses_estoque":140,"doses_min":45, "temp_ideal":( 2, 8),"temp_atual": 6.2,"status_temp":"ok",      "cobertura_pct":88.7,"meta_pct":95,"publico":"15m,4a","doses_aplicadas_mes":20},
    {"id":11, "vacina":"VOP (gotinha)",      "lote":"VOP25I11",   "validade":"2026-10-31","doses_estoque":200,"doses_min":60, "temp_ideal":(-15,-25),"temp_atual":-20.1,"status_temp":"ok",   "cobertura_pct":89.2,"meta_pct":95,"publico":"Reforço 15m,4a","doses_aplicadas_mes":24},
    {"id":12, "vacina":"HPV Quadrivalente",  "lote":"HPV25J12",   "validade":"2027-01-15","doses_estoque": 55,"doses_min":20, "temp_ideal":( 2, 8),"temp_atual": 4.9,"status_temp":"ok",      "cobertura_pct":62.4,"meta_pct":80,"publico":"9-14a","doses_aplicadas_mes":10},
    {"id":13, "vacina":"Hepatite A",         "lote":"HEPA25K13",  "validade":"2026-11-30","doses_estoque": 90,"doses_min":30, "temp_ideal":( 2, 8),"temp_atual": 5.3,"status_temp":"ok",      "cobertura_pct":91.0,"meta_pct":95,"publico":"15m","doses_aplicadas_mes":16},
    {"id":14, "vacina":"Febre Amarela",      "lote":"FA25L14",    "validade":"2026-12-01","doses_estoque":165,"doses_min":50, "temp_ideal":(-15,-25),"temp_atual":-17.8,"status_temp":"ok",   "cobertura_pct":95.8,"meta_pct":95,"publico":"9m,4a","doses_aplicadas_mes":30},
    {"id":15, "vacina":"Influenza",          "lote":"INF26A15",   "validade":"2026-12-31","doses_estoque":320,"doses_min":100,"temp_ideal":( 2, 8),"temp_atual": 4.1,"status_temp":"ok",      "cobertura_pct":71.2,"meta_pct":90,"publico":"≥6m,gestantes,idosos","doses_aplicadas_mes":88},
    {"id":16, "vacina":"Covid-19 bivalente", "lote":"COV26B16",   "validade":"2026-09-15","doses_estoque": 82,"doses_min":30, "temp_ideal":(-15,-25),"temp_atual":-19.2,"status_temp":"ok",   "cobertura_pct":58.3,"meta_pct":90,"publico":"≥12a,imunossuprimidos","doses_aplicadas_mes":15},
    {"id":17, "vacina":"dT (adulto)",        "lote":"DT25M17",    "validade":"2026-10-15","doses_estoque":115,"doses_min":40, "temp_ideal":( 2, 8),"temp_atual":10.2,"status_temp":"alerta",  "cobertura_pct":84.1,"meta_pct":90,"publico":"Adultos,gestantes","doses_aplicadas_mes":22},
    {"id":18, "vacina":"Pneumo 23V",         "lote":"PNM23V25N18","validade":"2027-03-01","doses_estoque": 48,"doses_min":20, "temp_ideal":( 2, 8),"temp_atual": 5.8,"status_temp":"ok",      "cobertura_pct":68.5,"meta_pct":90,"publico":"≥60a,imunossup.","doses_aplicadas_mes":12},
]

_TEMP_HIST = [  # últimas 24h (temperatura câmara principal)
    {"hora":"00h","temp":4.8},{"hora":"01h","temp":4.9},{"hora":"02h","temp":5.0},
    {"hora":"03h","temp":5.1},{"hora":"04h","temp":5.2},{"hora":"05h","temp":5.0},
    {"hora":"06h","temp":4.8},{"hora":"07h","temp":4.7},{"hora":"08h","temp":4.9},
    {"hora":"09h","temp":5.3},{"hora":"10h","temp":5.8},{"hora":"11h","temp":6.1},
    {"hora":"12h","temp":6.4},{"hora":"13h","temp":7.1},{"hora":"14h","temp":7.8},
    {"hora":"15h","temp":9.1},{"hora":"16h","temp":10.2},{"hora":"17h","temp":7.5},
    {"hora":"18h","temp":5.9},{"hora":"19h","temp":5.2},{"hora":"20h","temp":4.8},
    {"hora":"21h","temp":4.6},{"hora":"22h","temp":4.5},{"hora":"23h","temp":4.7},
]

_COBERTURA_MENSAL = [
    {"mes":"Nov/25","doses":384,"cobertura_media":84.2},
    {"mes":"Dez/25","doses":321,"cobertura_media":83.1},
    {"mes":"Jan/26","doses":398,"cobertura_media":85.4},
    {"mes":"Fev/26","doses":362,"cobertura_media":84.8},
    {"mes":"Mar/26","doses":421,"cobertura_media":86.1},
    {"mes":"Abr/26","doses":387,"cobertura_media":85.7},
]

@router.get("/dashboard")
async def dashboard():
    total_doses_mes = sum(v["doses_aplicadas_mes"] for v in _ESTOQUE)
    cob_media       = round(sum(v["cobertura_pct"] for v in _ESTOQUE) / len(_ESTOQUE), 1)
    abaixo_meta     = [v["vacina"] for v in _ESTOQUE if v["cobertura_pct"] < v["meta_pct"]]
    estoque_critico = [v["vacina"] for v in _ESTOQUE if v["doses_estoque"] <= v["doses_min"]]
    temp_alerta     = [v["vacina"] for v in _ESTOQUE if v["status_temp"] == "alerta"]
    proximos_vencer = [v for v in _ESTOQUE if v["validade"] <= "2026-07-31"]

    return {
        "competencia":        "Abr/2026",
        "total_imunobiol":    len(_ESTOQUE),
        "doses_aplicadas_mes":total_doses_mes,
        "cobertura_media":    cob_media,
        "abaixo_meta":        abaixo_meta,
        "n_abaixo_meta":      len(abaixo_meta),
        "estoque_critico":    estoque_critico,
        "n_estoque_critico":  len(estoque_critico),
        "temp_alerta":        temp_alerta,
        "n_temp_alerta":      len(temp_alerta),
        "proximos_vencer":    [v["vacina"] for v in proximos_vencer],
        "n_proximos_vencer":  len(proximos_vencer),
        "temp_atual_camera":  _TEMP_HIST[-1]["temp"],
        "historico_mensal":   _COBERTURA_MENSAL,
    }

@router.get("/estoque")
async def estoque():
    return [
        {**v, "status_estoque": "critico" if v["doses_estoque"] <= v["doses_min"] else "atencao" if v["doses_estoque"] <= v["doses_min"] * 1.5 else "ok"}
        for v in _ESTOQUE
    ]

@router.get("/temperatura")
async def temperatura():
    return {"historico_24h": _TEMP_HIST, "atual": _TEMP_HIST[-1]["temp"], "alerta": _TEMP_HIST[-1]["temp"] > 8}

@router.get("/cobertura")
async def cobertura():
    return {
        "por_vacina":  [{"vacina": v["vacina"], "cobertura": v["cobertura_pct"], "meta": v["meta_pct"], "status": "ok" if v["cobertura_pct"] >= v["meta_pct"] else "critico"} for v in _ESTOQUE],
        "historico":   _COBERTURA_MENSAL,
    }
