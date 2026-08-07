"""
Manutenção de Equipamentos — FMS Apuí/AM
Gestão de manutenção preventiva e corretiva das UBSs
"""
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/manutencao", tags=["Manutenção"])

@lru_cache(maxsize=1)
def _EQUIPAMENTOS():
    return [
        {"id":1,  "equipamento":"Autoclave 21L",              "n_serie":"AC-2021-001","unidade":"UBS Cachoeira",    "fabricante":"Sercon",     "status":"operante",      "ultima_prev":"2026-01-15","proxima_prev":"2026-07-15","ultima_corr":None,         "dias_parado":0, "criticidade":"alta"},
        {"id":2,  "equipamento":"Autoclave 21L",              "n_serie":"AC-2021-002","unidade":"UBS Kennedy",      "fabricante":"Sercon",     "status":"em_manutencao", "ultima_prev":"2025-12-10","proxima_prev":"2026-06-10","ultima_corr":"2026-04-02", "dias_parado":8, "criticidade":"alta"},
        {"id":3,  "equipamento":"Aparelho de Raios-X",        "n_serie":"RX-2019-001","unidade":"UBS Central",      "fabricante":"Siemens",    "status":"operante",      "ultima_prev":"2026-02-20","proxima_prev":"2026-08-20","ultima_corr":None,         "dias_parado":0, "criticidade":"alta"},
        {"id":4,  "equipamento":"Eletrocardiógrafo",          "n_serie":"ECG-2022-001","unidade":"ESF Liberdade",   "fabricante":"Cardiocare", "status":"operante",      "ultima_prev":"2026-01-08","proxima_prev":"2026-07-08","ultima_corr":None,         "dias_parado":0, "criticidade":"media"},
        {"id":5,  "equipamento":"Eletrocardiógrafo",          "n_serie":"ECG-2022-002","unidade":"ESF JK",          "fabricante":"Cardiocare", "status":"aguardando_peca","ultima_prev":"2025-11-01","proxima_prev":"2026-05-01","ultima_corr":"2026-03-15","dias_parado":21,"criticidade":"media"},
        {"id":6,  "equipamento":"Cadeira Odontológica",       "n_serie":"CO-2020-001","unidade":"ESB Cachoeira",    "fabricante":"Kavo",       "status":"operante",      "ultima_prev":"2026-03-01","proxima_prev":"2026-09-01","ultima_corr":None,         "dias_parado":0, "criticidade":"alta"},
        {"id":7,  "equipamento":"Cadeira Odontológica",       "n_serie":"CO-2020-002","unidade":"ESB Kennedy",      "fabricante":"Kavo",       "status":"operante",      "ultima_prev":"2026-02-14","proxima_prev":"2026-08-14","ultima_corr":None,         "dias_parado":0, "criticidade":"alta"},
        {"id":8,  "equipamento":"Compressor Odontológico",    "n_serie":"CP-2020-001","unidade":"ESB JK",           "fabricante":"Schulz",     "status":"em_manutencao", "ultima_prev":"2025-10-20","proxima_prev":"2026-04-20","ultima_corr":"2026-04-08","dias_parado":2, "criticidade":"alta"},
        {"id":9,  "equipamento":"Aparelho de Ultrassom",      "n_serie":"US-2021-001","unidade":"UBS Acari",        "fabricante":"Medline",    "status":"operante",      "ultima_prev":"2026-01-25","proxima_prev":"2026-07-25","ultima_corr":None,         "dias_parado":0, "criticidade":"media"},
        {"id":10, "equipamento":"Geladeira de vacinas",       "n_serie":"GV-2023-001","unidade":"Sala de Vacinas",  "fabricante":"Consul",     "status":"operante",      "ultima_prev":"2026-03-15","proxima_prev":"2026-09-15","ultima_corr":None,         "dias_parado":0, "criticidade":"critica"},
        {"id":11, "equipamento":"Geladeira de vacinas",       "n_serie":"GV-2023-002","unidade":"Sala de Vacinas",  "fabricante":"Consul",     "status":"operante",      "ultima_prev":"2026-03-15","proxima_prev":"2026-09-15","ultima_corr":None,         "dias_parado":0, "criticidade":"critica"},
        {"id":12, "equipamento":"Câmara fria",                "n_serie":"CF-2022-001","unidade":"Sala de Vacinas",  "fabricante":"Icestar",    "status":"operante",      "ultima_prev":"2026-02-01","proxima_prev":"2026-08-01","ultima_corr":None,         "dias_parado":0, "criticidade":"critica"},
        {"id":13, "equipamento":"Aparelho de Fisioterapia",   "n_serie":"FT-2018-001","unidade":"UBS Central",      "fabricante":"HTM",        "status":"aguardando_peca","ultima_prev":"2025-08-10","proxima_prev":"2026-02-10","ultima_corr":"2026-01-20","dias_parado":75,"criticidade":"media"},
        {"id":14, "equipamento":"Monitor Multiparamétrico",   "n_serie":"MM-2020-001","unidade":"UBS Central",      "fabricante":"Mindray",    "status":"operante",      "ultima_prev":"2026-01-10","proxima_prev":"2026-07-10","ultima_corr":None,         "dias_parado":0, "criticidade":"alta"},
        {"id":15, "equipamento":"Bomba de Infusão",           "n_serie":"BI-2021-001","unidade":"UBS Central",      "fabricante":"B.Braun",    "status":"operante",      "ultima_prev":"2026-02-05","proxima_prev":"2026-08-05","ultima_corr":None,         "dias_parado":0, "criticidade":"alta"},
        {"id":16, "equipamento":"Desfibrilador DEA",          "n_serie":"DEA-2022-001","unidade":"UBS Kennedy",     "fabricante":"Zoll",       "status":"operante",      "ultima_prev":"2026-03-20","proxima_prev":"2026-09-20","ultima_corr":None,         "dias_parado":0, "criticidade":"critica"},
        {"id":17, "equipamento":"Nebulizador",                "n_serie":"NB-2023-001","unidade":"ESF Três Estados", "fabricante":"NS",         "status":"em_manutencao", "ultima_prev":"2025-12-01","proxima_prev":"2026-06-01","ultima_corr":"2026-04-05","dias_parado":5, "criticidade":"media"},
        {"id":18, "equipamento":"Microscópio",                "n_serie":"MC-2019-001","unidade":"Laboratório",      "fabricante":"Olympus",    "status":"operante",      "ultima_prev":"2026-01-30","proxima_prev":"2026-07-30","ultima_corr":None,         "dias_parado":0, "criticidade":"alta"},
        {"id":19, "equipamento":"Centrífuga",                 "n_serie":"CG-2020-001","unidade":"Laboratório",      "fabricante":"Fanem",      "status":"operante",      "ultima_prev":"2026-02-18","proxima_prev":"2026-08-18","ultima_corr":None,         "dias_parado":0, "criticidade":"media"},
        {"id":20, "equipamento":"Forno de Esterilização",     "n_serie":"FE-2021-001","unidade":"Central Esteriliz.","fabricante":"Sercon",    "status":"preventiva_vencida","ultima_prev":"2025-10-05","proxima_prev":"2026-04-05","ultima_corr":None,    "dias_parado":0, "criticidade":"alta"},
    ]


@lru_cache(maxsize=1)
def _ORDENS():
    return [
        {"id":1,"equip_id":2, "tipo":"corretiva", "descricao":"Falha na vedação da câmara — vapor escapando","solicitante":"Enf. UBS Kennedy",   "data_aber":"2026-04-02","status":"em_execucao","empresa":"TechMed","prev_conclusao":"2026-04-18","custo_est":2_800.00},
        {"id":2,"equip_id":5, "tipo":"corretiva", "descricao":"Cabo do eletrodo rompido, traçado sem sinal",  "solicitante":"Méd. ESF JK",        "data_aber":"2026-03-15","status":"aguard_peca", "empresa":"Cardiocare","prev_conclusao":"2026-04-30","custo_est":980.00},
        {"id":3,"equip_id":8, "tipo":"corretiva", "descricao":"Compressor não pressuriza acima de 60psi",     "solicitante":"Dentista ESB JK",    "data_aber":"2026-04-08","status":"em_execucao","empresa":"TechMed","prev_conclusao":"2026-04-15","custo_est":1_500.00},
        {"id":4,"equip_id":13,"tipo":"corretiva", "descricao":"Placa eletrônica queimada — sem funcionamento", "solicitante":"Fisioterapeuta",    "data_aber":"2026-01-20","status":"aguard_peca", "empresa":"HTM Serviços","prev_conclusao":"2026-05-10","custo_est":4_200.00},
        {"id":5,"equip_id":17,"tipo":"corretiva", "descricao":"Nebulizador sem pressão — válvula defeituosa",  "solicitante":"Enf. ESF Três Est.","data_aber":"2026-04-05","status":"em_execucao","empresa":"TechMed","prev_conclusao":"2026-04-14","custo_est":450.00},
        {"id":6,"equip_id":20,"tipo":"preventiva","descricao":"Calibração e revisão geral — vencida há 5 dias","solicitante":"Central Esteriliz.","data_aber":"2026-04-10","status":"agendada",    "empresa":"Sercon","prev_conclusao":"2026-04-22","custo_est":1_200.00},
    ]


COR_STATUS = {"operante":"ok","em_manutencao":"critico","aguardando_peca":"critico","preventiva_vencida":"atencao"}

@router.get("/dashboard")
async def dashboard():
    operantes  = sum(1 for e in _EQUIPAMENTOS() if e["status"] == "operante")
    manut      = sum(1 for e in _EQUIPAMENTOS() if e["status"] == "em_manutencao")
    ag_peca    = sum(1 for e in _EQUIPAMENTOS() if e["status"] == "aguardando_peca")
    prev_venc  = sum(1 for e in _EQUIPAMENTOS() if e["status"] == "preventiva_vencida")
    criticas   = [e["equipamento"] + " — " + e["unidade"] for e in _EQUIPAMENTOS() if e["criticidade"] == "critica" and e["status"] != "operante"]
    custo_mes  = sum(o["custo_est"] for o in _ORDENS() if o["status"] not in ("concluida",))
    return {
        "competencia":      "Abr/2026",
        "total_equipamentos": len(_EQUIPAMENTOS()),
        "operantes":        operantes,
        "em_manutencao":    manut,
        "aguardando_peca":  ag_peca,
        "preventiva_vencida":prev_venc,
        "taxa_disponibilidade": round(operantes / len(_EQUIPAMENTOS()) * 100, 1),
        "ordens_abertas":   len([o for o in _ORDENS() if o["status"] != "concluida"]),
        "custo_estimado_aberto": custo_mes,
        "equipamentos_criticos_parados": criticas,
        "maior_tempo_parado": max((e["dias_parado"] for e in _EQUIPAMENTOS()), default=0),
    }

@router.get("/equipamentos")
async def equipamentos():
    return [
        {**e, "status_class": COR_STATUS.get(e["status"], "ok")}
        for e in sorted(_EQUIPAMENTOS(), key=lambda x: (-x["dias_parado"], x["criticidade"] != "critica"))
    ]

@router.get("/ordens")
async def ordens():
    equip_map = {e["id"]: e["equipamento"] + " — " + e["unidade"] for e in _EQUIPAMENTOS()}
    return [
        {**o, "equipamento_nome": equip_map.get(o["equip_id"], "?")}
        for o in sorted(_ORDENS(), key=lambda x: x["status"] == "concluida")
    ]