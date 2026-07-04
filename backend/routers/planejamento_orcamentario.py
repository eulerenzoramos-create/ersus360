"""
PPA / LDO / LOA — Instrumentos de Planejamento Orçamentário
FMS Apuí/AM · 2026
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/planejamento-orc", tags=["PPA/LOA"])

# ── Dados 2026 Apuí/AM ────────────────────────────────────────────────────────

_LOA_PROGRAMAS = [
    {"id":1,  "programa":"Atenção Básica em Saúde",             "acao":"Manutenção da APS e ESF",                      "funcao":"Saúde",   "dotacao":1_850_000.00, "empenhado":1_320_000.00, "liquidado":980_000.00,  "pago":980_000.00,  "meta_fisica":"9 equipes eSF",                 "status":"em_execucao"},
    {"id":2,  "programa":"Média e Alta Complexidade",            "acao":"Custeio MAC — Regulação e Referência",          "funcao":"Saúde",   "dotacao":1_200_000.00, "empenhado":492_000.00,  "liquidado":320_000.00,  "pago":320_000.00,  "meta_fisica":"66 aut. amb./mês",              "status":"critico"},
    {"id":3,  "programa":"Assistência Farmacêutica",             "acao":"Aquisição e distribuição de medicamentos",      "funcao":"Saúde",   "dotacao":620_000.00,   "empenhado":480_000.00,  "liquidado":380_000.00,  "pago":380_000.00,  "meta_fisica":"≥ 98% dispensação",             "status":"em_execucao"},
    {"id":4,  "programa":"Vigilância em Saúde",                  "acao":"Ações de Vigilância Epidemiológica e Sanitária","funcao":"Saúde",   "dotacao":480_000.00,   "empenhado":245_000.00,  "liquidado":180_000.00,  "pago":180_000.00,  "meta_fisica":"100% notif. compulsórias",      "status":"em_execucao"},
    {"id":5,  "programa":"Infraestrutura e Equipamentos",        "acao":"Obras e reformas UBS",                          "funcao":"Saúde",   "dotacao":1_600_000.00, "empenhado":680_000.00,  "liquidado":204_000.00,  "pago":204_000.00,  "meta_fisica":"Reform. UBS Kennedy + nova UBS","status":"em_execucao"},
    {"id":6,  "programa":"Recursos Humanos em Saúde",            "acao":"Contratação e capacitação de servidores",       "funcao":"Saúde",   "dotacao":3_200_000.00, "empenhado":2_800_000.00,"liquidado":2_100_000.00,"pago":2_100_000.00,"meta_fisica":"≤ 8% absenteísmo",             "status":"em_execucao"},
    {"id":7,  "programa":"Gestão e Administração da Saúde",      "acao":"Custeio administrativo FMS",                   "funcao":"Saúde",   "dotacao":420_000.00,   "empenhado":280_000.00,  "liquidado":210_000.00,  "pago":210_000.00,  "meta_fisica":"Gestão eficiente FMS",          "status":"em_execucao"},
    {"id":8,  "programa":"Saúde Bucal",                          "acao":"Manutenção das equipes eSB",                    "funcao":"Saúde",   "dotacao":380_000.00,   "empenhado":260_000.00,  "liquidado":195_000.00,  "pago":195_000.00,  "meta_fisica":"10 equipes eSB ativas",         "status":"em_execucao"},
    {"id":9,  "programa":"Transporte Sanitário",                 "acao":"Locação de veículos e TFD",                     "funcao":"Saúde",   "dotacao":480_000.00,   "empenhado":324_000.00,  "liquidado":162_000.00,  "pago":162_000.00,  "meta_fisica":"100% solicitações TFD atendidas","status":"em_execucao"},
    {"id":10, "programa":"Tecnologia da Informação",             "acao":"Sistemas informatizados em saúde",              "funcao":"Saúde",   "dotacao":280_000.00,   "empenhado":276_000.00,  "liquidado":196_000.00,  "pago":196_000.00,  "meta_fisica":"100% UBS com RNDS/SISAB",       "status":"em_execucao"},
]

_META_SIOPS_HIST = [
    {"ano":2022,"pct_proprio":15.8,"meta":15.0,"conforme":True},
    {"ano":2023,"pct_proprio":16.2,"meta":15.0,"conforme":True},
    {"ano":2024,"pct_proprio":15.5,"meta":15.0,"conforme":True},
    {"ano":2025,"pct_proprio":16.8,"meta":15.0,"conforme":True},
    {"ano":2026,"pct_proprio":17.16,"meta":15.0,"conforme":True},
]

_LDO_METAS = [
    {"indicador":"Cobertura ESF (%)",              "meta_ldo":85.0,  "realizado":82.4, "status":"atencao"},
    {"indicador":"Vacinas (cobertura média %)",     "meta_ldo":95.0,  "realizado":88.4, "status":"atencao"},
    {"indicador":"Pré-natal (≥6 consultas %)",      "meta_ldo":80.0,  "realizado":78.5, "status":"atencao"},
    {"indicador":"Tempo médio TFD (dias)",          "meta_ldo":15.0,  "realizado":22.0, "status":"critico"},
    {"indicador":"Execução MAC (%)",               "meta_ldo":80.0,  "realizado":41.0, "status":"critico"},
    {"indicador":"Dispensação farmácia (%)",        "meta_ldo":98.0,  "realizado":92.0, "status":"atencao"},
    {"indicador":"Absenteísmo RH (%)",             "meta_ldo":8.0,   "realizado":6.2,  "status":"ok"},
    {"indicador":"Rec. próprios saúde SIOPS (%)", "meta_ldo":15.0,  "realizado":17.16,"status":"ok"},
]

# ── Helpers ───────────────────────────────────────────────────────────────────

def _pct(emp, dot): return round(emp/dot*100, 1) if dot else 0.0

def _enriquecer(p: dict) -> dict:
    return {
        **p,
        "pct_empenhado":  _pct(p["empenhado"], p["dotacao"]),
        "pct_pago":       _pct(p["pago"], p["dotacao"]),
        "saldo":          round(p["dotacao"] - p["empenhado"], 2),
    }

# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def dashboard():
    total_dotacao  = sum(p["dotacao"] for p in _LOA_PROGRAMAS)
    total_empenh   = sum(p["empenhado"] for p in _LOA_PROGRAMAS)
    total_pago     = sum(p["pago"] for p in _LOA_PROGRAMAS)
    total_saldo    = total_dotacao - total_empenh
    criticos       = [p["programa"] for p in _LOA_PROGRAMAS if p["status"] == "critico"]
    metas_criticas = [m["indicador"] for m in _LDO_METAS if m["status"] == "critico"]

    return {
        "competencia":      "2026",
        "municipio":        "Apuí/AM",
        "total_dotacao":    round(total_dotacao, 2),
        "total_empenhado":  round(total_empenh, 2),
        "total_pago":       round(total_pago, 2),
        "total_saldo":      round(total_saldo, 2),
        "pct_execucao":     round(total_empenh / total_dotacao * 100, 1),
        "pct_pago":         round(total_pago / total_dotacao * 100, 1),
        "n_programas":      len(_LOA_PROGRAMAS),
        "criticos":         criticos,
        "metas_criticas":   metas_criticas,
        "siops_atual":      17.16,
        "siops_meta":       15.0,
        "siops_conforme":   True,
    }


@router.get("/loa")
async def loa():
    return [_enriquecer(p) for p in _LOA_PROGRAMAS]


@router.get("/ldo-metas")
async def ldo_metas():
    return _LDO_METAS


@router.get("/siops-historico")
async def siops_historico():
    return _META_SIOPS_HIST
