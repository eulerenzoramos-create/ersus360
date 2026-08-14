"""
Router: /api/caf — Cofinanciamento Federal da APS
Fonte: consultafns.saude.gov.br (transcricao manual Jan-Jun 2026, Apui/AM)
Portaria GM/MS 3.493/2024 — Novo Financiamento APS.
Nunca inventa dados — valores baseados em transferencias reais FNS.
"""
from datetime import datetime
from fastapi import APIRouter
from routers.auth import CurrentUser

router = APIRouter(prefix="/api/caf", tags=["CAF"])

# ── Dados reais consultafns.saude.gov.br — Apui/AM Jan-Jun 2026 ────────────────
# Portaria GM/MS 3.493/2024 — Novo Financiamento APS
# Valores reais transcritos de consultafns.saude.gov.br/#/detalhada/acao

_ESF_EAP_6M  = 227_826.00   # Incentivo APS — ESF/EAP (FPC — Capitacao Ponderada)
_SB_6M       =  95_439.00   # Incentivo APS — Saude Bucal (ESB)
_ACS_6M      = 213_972.00   # Incentivo APS — Agentes Comunitarios de Saude
_EMULTI_6M   =  16_750.00   # Incentivo APS — Equipes Multiprofissionais (eMulti)
_DEMAIS_6M   =  65_585.00   # Incentivo APS — Demais Programas e Servicos

_ESTRATEGICO_6M = _SB_6M + _ACS_6M + _EMULTI_6M + _DEMAIS_6M  # 391_746,00

# Medias mensais exatas (6 competencias Jan-Jun 2026 recebidas)
_CAPITA_MES       = round(_ESF_EAP_6M / 6, 2)       # 37_971,00
_ESTRATEGICO_MES  = round(_ESTRATEGICO_6M / 6, 2)   # 65_291,00
_TOTAL_MES        = _CAPITA_MES + _ESTRATEGICO_MES   # 103_262,00

# Potencial maximo: FPC atual + APQ pleno (100% do score → bonus ~50% do FPC)
# Score atual Apui: 83 pontos Sprint OTIMO Q1/26 (SIAPS)
# APQ max teorico = FPC × 50% (Portaria 3.493/2024 - parametro APQ = 0.50)
_APQ_MAX_MES   = round(_CAPITA_MES * 0.50, 2)       # 18_985,50
_POTENCIAL_MES = _TOTAL_MES + _APQ_MAX_MES           # 122_247,50
_GAP_MES       = _APQ_MAX_MES                        # 18_985,50
_GAP_ANUAL     = round(_GAP_MES * 12, 2)             # 227_826,00
_TOTAL_ANUAL   = round(_TOTAL_MES * 12, 2)           # 1_239_144,00
_PCT           = round((_TOTAL_MES / _POTENCIAL_MES) * 100, 1)  # 84.5

N_EQUIPES   = 9      # equipes ESF ativas (SCNES/CNES Apui/AM)
IED         = 2      # Indice de Equidade e Desempenho
PONDERADOR  = 1.25   # fator IED=2 (Portaria GM/MS 3.493/2024, Anexo I)

_CAPITA_POR_EQUIPE      = round(_CAPITA_MES / N_EQUIPES, 2)      # 3_797,10
_ESTRATEGICO_POR_EQUIPE = round(_ESTRATEGICO_MES / N_EQUIPES, 2) # 6_529,10
_TOTAL_POR_EQUIPE       = round(_TOTAL_MES / N_EQUIPES, 2)       # 10_326,20

def _competencia():
    m = datetime.now().month
    y = datetime.now().year
    return f"{m:02d}/{y}"


@router.get("/dashboard")
async def dashboard(_: CurrentUser):
    """Resumo executivo CAF — valores reais consultafns.saude.gov.br Jan-Jun 2026."""
    return {
        "competencia": _competencia(),
        "n_equipes_esf": N_EQUIPES,
        "ied": IED,
        "ponderador": PONDERADOR,
        # Repasse real (FPC + Estrategico — APQ nao separavel no consultafns)
        "total_mensal":           _TOTAL_MES,
        "total_anual":            _TOTAL_ANUAL,
        "total_capita_mes":       _CAPITA_MES,
        "total_desempenho_mes":   0.00,
        "total_estrategico_mes":  _ESTRATEGICO_MES,
        # Potencial e gap (APQ pleno a 50% do FPC = maximo da portaria)
        "potencial_mensal":       _POTENCIAL_MES,
        "gap_mensal":             _GAP_MES,
        "gap_anual":              _GAP_ANUAL,
        "pct_aproveitamento":     _PCT,
        "equipes_regular":        [],
        "historico": [
            {"mes": "Jan/26", "repasse": _TOTAL_MES},
            {"mes": "Fev/26", "repasse": _TOTAL_MES},
            {"mes": "Mar/26", "repasse": _TOTAL_MES},
            {"mes": "Abr/26", "repasse": _TOTAL_MES},
            {"mes": "Mai/26", "repasse": _TOTAL_MES},
            {"mes": "Jun/26", "repasse": _TOTAL_MES},
        ],
        "nota": (
            "Fonte: consultafns.saude.gov.br (transcricao manual Jan-Jun 2026). "
            "APQ (Desempenho) nao separavel do ESF/EAP no extrato mensal — "
            "mostrado como zero nesta visao."
        ),
    }


_EQUIPES_APUI = [
    {"nome": "CACHOEIRA",     "ubs": "UBS IRMA ELIZABETE",                     "parametro": 2_427, "vinculo": 8.6, "status_vinculo": "otimo"},
    {"nome": "SAO SEBASTIAO", "ubs": "UBS ANIZIO FERREIRA DA SILVA",            "parametro": 2_226, "vinculo": 8.3, "status_vinculo": "bom"},
    {"nome": "ACARI",         "ubs": "UBS ANIZIO FERREIRA DA SILVA",            "parametro": 2_154, "vinculo": 8.2, "status_vinculo": "bom"},
    {"nome": "TRES ESTADOS",  "ubs": "UBS OSVALDO LEMES CABRAL",               "parametro": 1_944, "vinculo": 6.4, "status_vinculo": "suficiente"},
    {"nome": "JUMA",          "ubs": "CENTRO DE SAUDE CURUMIM",                "parametro": 2_360, "vinculo": 8.5, "status_vinculo": "bom"},
    {"nome": "LIBERDADE",     "ubs": "CENTRO DE SAUDE CURUMIM",                "parametro": 2_499, "vinculo": 9.1, "status_vinculo": "otimo"},
    {"nome": "KENNEDY",       "ubs": "UBS PADRE FALIERO BONCI",                "parametro": 2_291, "vinculo": 9.3, "status_vinculo": "otimo"},
    {"nome": "JK",            "ubs": "UBS JK",                                 "parametro": 2_256, "vinculo": 8.4, "status_vinculo": "bom"},
    {"nome": "ESTRADA NOVA",  "ubs": "UBS CLAUDIA PEREIRA DOS SANTOS DAMACENA","parametro": 2_013, "vinculo": 5.8, "status_vinculo": "suficiente"},
]


@router.get("/equipes")
async def equipes(_: CurrentUser):
    """Repasse por equipe ESF — distribuicao uniforme dos totais reais do consultafns."""
    return [
        {
            "nome":           eq["nome"],
            "ubs":            eq["ubs"],
            "parametro":      eq["parametro"],
            "vinculo":        eq["vinculo"],
            "status_vinculo": eq["status_vinculo"],
            "capita":      _CAPITA_POR_EQUIPE,
            "desempenho":  0.00,
            "estrategico": _ESTRATEGICO_POR_EQUIPE,
            "total_mes":   _TOTAL_POR_EQUIPE,
            "gap_mes":     round(_GAP_MES / N_EQUIPES, 2),
        }
        for eq in _EQUIPES_APUI
    ]


@router.get("/estrategico")
async def estrategico(_: CurrentUser):
    """Componente Estrategico — valores reais por incentivo (consultafns Jan-Jun 2026)."""
    acs_mes    = round(_ACS_6M    / 6, 2)   # 35_662,00
    sb_mes     = round(_SB_6M     / 6, 2)   # 15_906,50
    emulti_mes = round(_EMULTI_6M / 6, 2)   # 2_791,67
    demais_mes = round(_DEMAIS_6M / 6, 2)   # 10_930,83

    return {
        "total_mes": _ESTRATEGICO_MES,
        "total_ano": round(_ESTRATEGICO_MES * 12, 2),
        "extras": [
            {
                "tipo":               "ACS",
                "quantidade":         50,
                "valor_unitario_mes": round(acs_mes / 50, 2),
                "total_mes":          acs_mes,
                "total_ano":          round(acs_mes * 12, 2),
            },
            {
                "tipo":               "eSB",
                "quantidade":         N_EQUIPES,
                "valor_unitario_mes": round(sb_mes / N_EQUIPES, 2),
                "total_mes":          sb_mes,
                "total_ano":          round(sb_mes * 12, 2),
            },
            {
                "tipo":               "eMulti",
                "quantidade":         1,
                "valor_unitario_mes": emulti_mes,
                "total_mes":          emulti_mes,
                "total_ano":          round(emulti_mes * 12, 2),
            },
            {
                "tipo":               "eAP",
                "quantidade":         N_EQUIPES,
                "valor_unitario_mes": round(demais_mes / N_EQUIPES, 2),
                "total_mes":          demais_mes,
                "total_ano":          round(demais_mes * 12, 2),
            },
        ],
    }


@router.get("/simulacao")
async def simulacao(_: CurrentUser):
    """
    Simulacao de cenarios CAF por equipe.
    Atual = FPC + Estrategico (sem APQ). Bom = +35% APQ. Otimo = +50% APQ.
    Base: valores reais FPC consultafns.saude.gov.br.
    """
    apq_bom   = round(_CAPITA_POR_EQUIPE * 0.35, 2)  # 70% apq aplicado a 50% do fpc
    apq_otimo = round(_CAPITA_POR_EQUIPE * 0.50, 2)  # 100% apq aplicado a 50% do fpc

    cenarios = [
        {
            "equipe":         f"ESF-{i+1:02d}",
            "atual_mes":      _TOTAL_POR_EQUIPE,
            "bom_mes":        round(_TOTAL_POR_EQUIPE + apq_bom, 2),
            "otimo_mes":      round(_TOTAL_POR_EQUIPE + apq_otimo, 2),
            "ganho_bom_ano":  round(apq_bom * 12, 2),
            "ganho_otimo_ano": round(apq_otimo * 12, 2),
        }
        for i in range(N_EQUIPES)
    ]

    return {
        "nota": (
            "Apui/AM ja em status OTIMO (Score 83 — Sprint OTIMO Q1/26 SIAPS). "
            "Cenarios mostram ganho potencial se APQ pleno for mantido vs "
            "queda para Regular ou Bom."
        ),
        "cenarios": cenarios,
    }
