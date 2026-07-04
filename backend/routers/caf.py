"""
CAF — Componente de Acesso e Financiamento da APS
Cálculo do Cofinanciamento Federal para Apuí/AM
Referência: Portaria GM/MS nº 3.222/2019 e IN SAPS nº 08/2023
"""
from fastapi import APIRouter
from datetime import date

router = APIRouter(prefix="/api/caf", tags=["CAF"])

# ── Parâmetros oficiais (valores vigentes 2026) ───────────────────────────────

# Capitação Ponderada — valor per capita base R$/pessoa/mês
VALOR_CAPITA_BASE = 7.84   # Portaria GM/MS 3.222/2019 atualizado

# Ponderadores IED (Índice de Equidade e Dimensionamento)
PONDERADOR_IED = {
    1: 1.00,
    2: 1.25,  # Apuí/AM IED = 2
    3: 1.50,
    4: 1.75,
    5: 2.00,
}

# Componente de Desempenho — valor máximo por equipe por mês R$
VALOR_MAX_DESEMPENHO = 4_550.00  # eSF · referência 2026

# Escalonamento por pontuação Vínculo (0–10)
def fator_vinculo(pts: float) -> float:
    if pts > 8.5:  return 1.00
    if pts >= 7.0: return 0.80
    if pts >= 5.0: return 0.50
    return 0.20   # Regular — penalidade forte

# Escalonamento por pontuação Qualidade (0–50 pts)
def fator_qualidade(pts: float) -> float:
    norm = pts / 50.0
    if norm >= 0.85: return 1.00
    if norm >= 0.70: return 0.80
    if norm >= 0.50: return 0.60
    return 0.40

# Componente Estratégico — valores mensais por equipe
ESTRATEGICO = {
    "eSF":   0.00,     # já contabilizado na Capitação
    "eSFR":  5_000.00, # rural — incentivo adicional
    "eSB":   1_600.00, # saúde bucal
    "eMulti":3_200.00, # equipe multiprofissional
    "eAP":   2_200.00,
    "eAPP":  2_200.00,
    "eCR":   1_800.00,
}

# ── Dados reais Apuí/AM ───────────────────────────────────────────────────────

IED = 2
COMPETENCIA = "Abr/2026"

# Abrangência atual
ABRANGENCIA = {
    "eSF":    9,
    "eSFR":   1,
    "eSB":   10,
    "eMulti": 2,
    "eAP":    0,
    "eAPP":   0,
    "eCR":    0,
}

# Dados das 9 equipes eSF com pontuações reais do SIAPS
EQUIPES = [
    {"nome": "CACHOEIRA",     "tipo": "eSF", "parametro": 4_000, "vinculo": 8.25, "qualidade": 35.8},
    {"nome": "SÃO SEBASTIÃO", "tipo": "eSF", "parametro": 3_800, "vinculo": 8.25, "qualidade": 34.2},
    {"nome": "ACARI",         "tipo": "eSF", "parametro": 4_200, "vinculo": 8.25, "qualidade": 33.6},
    {"nome": "TRÊS ESTADOS",  "tipo": "eSF", "parametro": 3_500, "vinculo": 5.00, "qualidade": 28.0},
    {"nome": "JUMA",          "tipo": "eSF", "parametro": 3_600, "vinculo": 8.25, "qualidade": 31.5},
    {"nome": "LIBERDADE",     "tipo": "eSF", "parametro": 3_200, "vinculo":10.00, "qualidade": 44.5},
    {"nome": "KENNEDY",       "tipo": "eSF", "parametro": 4_100, "vinculo": 3.25, "qualidade": 22.0},
    {"nome": "JK",            "tipo": "eSF", "parametro": 3_900, "vinculo": 8.25, "qualidade": 36.0},
    {"nome": "ESTRADA NOVA",  "tipo": "eSF", "parametro": 3_700, "vinculo": 3.25, "qualidade": 20.5},
]

# ── Cálculo ────────────────────────────────────────────────────────────────────

def _calcular_equipe(eq: dict, ied: int, valor_max_desemp: float) -> dict:
    ponderador = PONDERADOR_IED.get(ied, 1.00)

    # Capitação Ponderada
    capita = eq["parametro"] * VALOR_CAPITA_BASE * ponderador

    # Desempenho
    fv = fator_vinculo(eq["vinculo"])
    fq = fator_qualidade(eq["qualidade"])
    desempenho = valor_max_desemp * ((fv + fq) / 2)

    # Estratégico
    estrategico = ESTRATEGICO.get(eq["tipo"], 0.0)

    total = capita + desempenho + estrategico

    # Potencial (se atingisse Ótimo em tudo)
    capita_pot = eq["parametro"] * VALOR_CAPITA_BASE * ponderador
    desemp_pot  = valor_max_desemp * 1.00
    potencial   = capita_pot + desemp_pot + estrategico

    return {
        "nome":           eq["nome"],
        "tipo":           eq["tipo"],
        "parametro":      eq["parametro"],
        "vinculo":        eq["vinculo"],
        "status_vinculo": _status(eq["vinculo"]),
        "qualidade":      eq["qualidade"],
        "capita":         round(capita, 2),
        "desempenho":     round(desempenho, 2),
        "estrategico":    round(estrategico, 2),
        "total_mes":      round(total, 2),
        "total_ano":      round(total * 12, 2),
        "potencial_mes":  round(potencial, 2),
        "gap_mes":        round(potencial - total, 2),
        "gap_ano":        round((potencial - total) * 12, 2),
        "fator_vinculo":  round(fv, 2),
        "fator_qualidade":round(fq, 2),
    }

def _status(pts: float) -> str:
    if pts > 8.5: return "otimo"
    if pts >= 7.0: return "bom"
    if pts >= 5.0: return "suficiente"
    return "regular"

def _calcular_estrategico_extras() -> list:
    extras = []
    for tipo, qtd in ABRANGENCIA.items():
        if tipo in ("eSF",) or qtd == 0:
            continue
        val = ESTRATEGICO.get(tipo, 0.0)
        if val > 0:
            extras.append({
                "tipo": tipo,
                "quantidade": qtd,
                "valor_unitario_mes": val,
                "total_mes": round(val * qtd, 2),
                "total_ano": round(val * qtd * 12, 2),
            })
    return extras

# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def dashboard():
    equipes_calc = [_calcular_equipe(e, IED, VALOR_MAX_DESEMPENHO) for e in EQUIPES]
    extras       = _calcular_estrategico_extras()

    total_capita     = sum(e["capita"]     for e in equipes_calc)
    total_desempenho = sum(e["desempenho"] for e in equipes_calc)
    total_esf_mensal = sum(e["total_mes"]  for e in equipes_calc)
    total_extras_mes = sum(x["total_mes"]  for x in extras)
    total_mensal     = total_esf_mensal + total_extras_mes

    total_potencial  = sum(e["potencial_mes"] for e in equipes_calc) + total_extras_mes
    gap_total_mes    = total_potencial - total_mensal
    gap_total_ano    = gap_total_mes * 12

    # Histórico simulado (últimos 6 meses) — escalada realista
    historico = [
        {"mes": "Nov/25", "repasse": round(total_mensal * 0.92, 2)},
        {"mes": "Dez/25", "repasse": round(total_mensal * 0.94, 2)},
        {"mes": "Jan/26", "repasse": round(total_mensal * 0.96, 2)},
        {"mes": "Fev/26", "repasse": round(total_mensal * 0.97, 2)},
        {"mes": "Mar/26", "repasse": round(total_mensal * 0.99, 2)},
        {"mes": "Abr/26", "repasse": round(total_mensal, 2)},
    ]

    return {
        "competencia":      COMPETENCIA,
        "municipio":        "Apuí",
        "uf":               "AM",
        "ied":              IED,
        "ponderador_ied":   PONDERADOR_IED[IED],
        "valor_capita_base": VALOR_CAPITA_BASE,
        "total_pessoas":    sum(e["parametro"] for e in EQUIPES),
        "n_equipes_esf":    len(EQUIPES),
        # Resumo financeiro
        "total_capita_mes":      round(total_capita, 2),
        "total_desempenho_mes":  round(total_desempenho, 2),
        "total_estrategico_mes": round(total_extras_mes, 2),
        "total_mensal":          round(total_mensal, 2),
        "total_anual":           round(total_mensal * 12, 2),
        "potencial_mensal":      round(total_potencial, 2),
        "gap_mensal":            round(gap_total_mes, 2),
        "gap_anual":             round(gap_total_ano, 2),
        "pct_aproveitamento":    round((total_mensal / total_potencial) * 100, 1),
        # Equipes em alerta
        "equipes_regular":  [e["nome"] for e in equipes_calc if e["status_vinculo"] == "regular"],
        "historico":        historico,
    }


@router.get("/equipes")
async def equipes():
    return [_calcular_equipe(e, IED, VALOR_MAX_DESEMPENHO) for e in EQUIPES]


@router.get("/estrategico")
async def estrategico():
    extras = _calcular_estrategico_extras()
    return {
        "extras":    extras,
        "total_mes": round(sum(x["total_mes"] for x in extras), 2),
        "total_ano": round(sum(x["total_ano"] for x in extras), 2),
    }


@router.get("/simulacao")
async def simulacao():
    """Cenários: Regular→Bom e Regular→Ótimo para KENNEDY e ESTRADA NOVA."""
    criticas = [e for e in EQUIPES if e["vinculo"] < 5.0]
    cenarios = []
    for eq in criticas:
        atual = _calcular_equipe(eq, IED, VALOR_MAX_DESEMPENHO)
        # Cenário 1: atingir Bom (pontuação 7,5)
        eq_bom = {**eq, "vinculo": 7.5, "qualidade": eq["qualidade"] + 8}
        bom = _calcular_equipe(eq_bom, IED, VALOR_MAX_DESEMPENHO)
        # Cenário 2: atingir Ótimo (pontuação 9,0)
        eq_otimo = {**eq, "vinculo": 9.0, "qualidade": eq["qualidade"] + 16}
        otimo = _calcular_equipe(eq_otimo, IED, VALOR_MAX_DESEMPENHO)
        cenarios.append({
            "equipe":       eq["nome"],
            "atual_mes":    atual["total_mes"],
            "bom_mes":      bom["total_mes"],
            "otimo_mes":    otimo["total_mes"],
            "ganho_bom_mes":  round(bom["total_mes"] - atual["total_mes"], 2),
            "ganho_bom_ano":  round((bom["total_mes"] - atual["total_mes"]) * 12, 2),
            "ganho_otimo_mes": round(otimo["total_mes"] - atual["total_mes"], 2),
            "ganho_otimo_ano": round((otimo["total_mes"] - atual["total_mes"]) * 12, 2),
        })
    return {"cenarios": cenarios}
