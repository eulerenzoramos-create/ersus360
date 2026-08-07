"""
PPA / LDO / LOA — Instrumentos de Planejamento Orçamentário
FMS Apuí/AM · 2026
"""
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/planejamento-orc", tags=["PPA/LOA"])

# ── Dados 2026 Apuí/AM ────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def _LOA_PROGRAMAS():
    return [
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


@lru_cache(maxsize=1)
def _META_SIOPS_HIST():
    return [
        {"ano":2022,"pct_proprio":15.8,"meta":15.0,"conforme":True},
        {"ano":2023,"pct_proprio":16.2,"meta":15.0,"conforme":True},
        {"ano":2024,"pct_proprio":15.5,"meta":15.0,"conforme":True},
        {"ano":2025,"pct_proprio":16.8,"meta":15.0,"conforme":True},
        {"ano":2026,"pct_proprio":17.16,"meta":15.0,"conforme":True},
    ]


# RREO — Relatório Resumido da Execução Orçamentária (bimestral) 2026
# Fonte: SIOPS / STN · FMS Apuí/AM · Lei 4.320/64 art. 165 §3º
@lru_cache(maxsize=1)
def _SIOPS_BIMESTRAL():
    return [
        {
            "bimestre": "1º Bimestre", "periodo": "Jan–Fev/2026", "encerrado": True,
            "receita_arrecadada":     3_104_000.0,
            "receita_previsao":       3_090_000.0,
            "gasto_proprio_saude":      421_000.0,
            "pct_proprio":                  13.56,
            "transferencias_sus":       1_903_000.0,
            "gasto_total_saude":        2_324_000.0,
            # Execução LOA acumulada no bimestre
            "dotacao_atualizada":      10_510_000.0,
            "empenhado_acum":           1_180_000.0,
            "liquidado_acum":             740_000.0,
            "pago_acum":                  740_000.0,
            "pct_exec":                      11.23,
            "alerta": "Abaixo do mínimo constitucional (15%) — será compensado nos bimestres seguintes (art. 25 LC 141/2012).",
            "status": "pendente",
        },
        {
            "bimestre": "2º Bimestre", "periodo": "Mar–Abr/2026", "encerrado": True,
            "receita_arrecadada":     3_288_000.0,
            "receita_previsao":       3_210_000.0,
            "gasto_proprio_saude":      598_000.0,
            "pct_proprio":                  18.19,
            "transferencias_sus":       2_142_000.0,
            "gasto_total_saude":        2_740_000.0,
            "dotacao_atualizada":      10_510_000.0,
            "empenhado_acum":           3_240_000.0,
            "liquidado_acum":           2_100_000.0,
            "pago_acum":                2_100_000.0,
            "pct_exec":                      30.83,
            "alerta": None,
            "status": "atingido",
        },
        {
            "bimestre": "3º Bimestre", "periodo": "Mai–Jun/2026", "encerrado": True,
            "receita_arrecadada":     3_197_000.0,
            "receita_previsao":       3_180_000.0,
            "gasto_proprio_saude":      574_000.0,
            "pct_proprio":                  17.95,
            "transferencias_sus":       1_986_000.0,
            "gasto_total_saude":        2_560_000.0,
            "dotacao_atualizada":      10_510_000.0,
            "empenhado_acum":           5_620_000.0,
            "liquidado_acum":           3_690_000.0,
            "pago_acum":                3_690_000.0,
            "pct_exec":                      53.47,
            "alerta": None,
            "status": "atingido",
        },
        {
            "bimestre": "4º Bimestre", "periodo": "Jul–Ago/2026", "encerrado": False,
            "receita_arrecadada":     1_640_000.0,   # parcial (até 03/ago)
            "receita_previsao":       3_250_000.0,
            "gasto_proprio_saude":      206_000.0,   # parcial
            "pct_proprio":                  12.56,   # parcial — em andamento
            "transferencias_sus":       1_050_000.0,
            "gasto_total_saude":        1_256_000.0,
            "dotacao_atualizada":      10_510_000.0,
            "empenhado_acum":           7_160_000.0,
            "liquidado_acum":           4_930_000.0,
            "pago_acum":                4_930_000.0,
            "pct_exec":                      68.13,
            "alerta": "Bimestre em andamento (até 03/ago/2026). Percentual parcial — apuração encerra em 31/ago.",
            "status": "parcial",
        },
        {
            "bimestre": "5º Bimestre", "periodo": "Set–Out/2026", "encerrado": False,
            "receita_arrecadada":     None,
            "receita_previsao":       3_310_000.0,
            "gasto_proprio_saude":    None,
            "pct_proprio":            None,
            "transferencias_sus":     None,
            "gasto_total_saude":      None,
            "dotacao_atualizada":      10_510_000.0,
            "empenhado_acum":         None,
            "liquidado_acum":         None,
            "pago_acum":              None,
            "pct_exec":               None,
            "alerta": None,
            "status": "previsto",
        },
        {
            "bimestre": "6º Bimestre", "periodo": "Nov–Dez/2026", "encerrado": False,
            "receita_arrecadada":     None,
            "receita_previsao":       3_368_000.0,
            "gasto_proprio_saude":    None,
            "pct_proprio":            None,
            "transferencias_sus":     None,
            "gasto_total_saude":      None,
            "dotacao_atualizada":      10_510_000.0,
            "empenhado_acum":         None,
            "liquidado_acum":         None,
            "pago_acum":              None,
            "pct_exec":               None,
            "alerta": None,
            "status": "previsto",
        },
    ]


# Execução LOA por programa — evolução bimestral (empenhado acumulado)
@lru_cache(maxsize=1)
def _LOA_BIMESTRAL():
    return {
        "Atenção Básica em Saúde":       [210_000, 620_000, 980_000, 1_320_000, None, None],
        "Média e Alta Complexidade":     [ 62_000, 180_000, 340_000,   492_000, None, None],
        "Assistência Farmacêutica":      [ 75_000, 210_000, 350_000,   480_000, None, None],
        "Vigilância em Saúde":           [ 38_000, 110_000, 185_000,   245_000, None, None],
        "Infraestrutura e Equipamentos": [ 82_000, 240_000, 480_000,   680_000, None, None],
        "Recursos Humanos em Saúde":     [460_000,1_380_000,2_100_000,2_800_000,None, None],
        "Gestão e Administração":        [ 46_000, 130_000, 205_000,   280_000, None, None],
        "Saúde Bucal":                   [ 42_000, 122_000, 195_000,   260_000, None, None],
        "Transporte Sanitário":          [ 55_000, 158_000, 242_000,   324_000, None, None],
        "Tecnologia da Informação":      [ 46_000, 136_000, 204_000,   276_000, None, None],
    }


@lru_cache(maxsize=1)
def _LDO_METAS():
    return [
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
    total_dotacao  = sum(p["dotacao"] for p in _LOA_PROGRAMAS())
    total_empenh   = sum(p["empenhado"] for p in _LOA_PROGRAMAS())
    total_pago     = sum(p["pago"] for p in _LOA_PROGRAMAS())
    total_saldo    = total_dotacao - total_empenh
    criticos       = [p["programa"] for p in _LOA_PROGRAMAS() if p["status"] == "critico"]
    metas_criticas = [m["indicador"] for m in _LDO_METAS() if m["status"] == "critico"]

    return {
        "competencia":      "2026",
        "municipio":        "Apuí/AM",
        "total_dotacao":    round(total_dotacao, 2),
        "total_empenhado":  round(total_empenh, 2),
        "total_pago":       round(total_pago, 2),
        "total_saldo":      round(total_saldo, 2),
        "pct_execucao":     round(total_empenh / total_dotacao * 100, 1),
        "pct_pago":         round(total_pago / total_dotacao * 100, 1),
        "n_programas":      len(_LOA_PROGRAMAS()),
        "criticos":         criticos,
        "metas_criticas":   metas_criticas,
        "siops_atual":      17.16,
        "siops_meta":       15.0,
        "siops_conforme":   True,
    }


@router.get("/loa")
async def loa():
    return [_enriquecer(p) for p in _LOA_PROGRAMAS()]


@router.get("/ldo-metas")
async def ldo_metas():
    return _LDO_METAS


@router.get("/siops-historico")
async def siops_historico():
    return _META_SIOPS_HIST


@router.get("/siops-bimestral")
async def siops_bimestral():
    """RREO — Relatório Resumido da Execução Orçamentária (bimestral) 2026."""
    encerrados = [b for b in _SIOPS_BIMESTRAL() if b["encerrado"]]
    receita_acum = sum(b["receita_arrecadada"] for b in encerrados)
    gasto_acum   = sum(b["gasto_proprio_saude"] for b in encerrados)
    pct_acum     = round(gasto_acum / receita_acum * 100, 2) if receita_acum else 0
    return {
        "municipio":        "Apuí/AM",
        "exercicio":        2026,
        "competencia_atual":"4º Bimestre (Jul–Ago/2026) — em andamento",
        "bimestres":        _SIOPS_BIMESTRAL(),
        "acumulado": {
            "receita_arrecadada": receita_acum,
            "gasto_proprio":      gasto_acum,
            "pct_proprio_acum":   pct_acum,
            "status":             "atingido" if pct_acum >= 15.0 else "pendente",
        },
        "loa_bimestral":    _LOA_BIMESTRAL(),
        "fonte":            "SIOPS/STN · RREO · referencia",
    }
