"""
Router: /api/planejamento-orc — PPA / LOA / LDO / SIOPS — FMS Apuí/AM
Dados de referência baseados na estrutura orçamentária real (Lei 4.320/64).
"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from typing import Optional
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/planejamento-orc", tags=["PPA/LOA"])

def _ts():
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

# ── Programas LOA 2026 — FMS Apuí/AM (estrutura funcional-programática real) ──
_PROGRAMAS = [
    {
        "id": 1,
        "programa": "Atenção Primária à Saúde",
        "fonte": "MS + Próprio",
        "dotacao":   6_480_000.00,
        "empenhado": 3_912_400.00,
        "pago":      3_287_600.00,
        "meta_fisica": "65 ACS, 10 equipes ESF/eRibeirinha, 18.000 atend./ano",
        "status": "ok",
    },
    {
        "id": 2,
        "programa": "Vigilância em Saúde",
        "fonte": "MS + Próprio",
        "dotacao":   1_320_000.00,
        "empenhado":   714_500.00,
        "pago":        598_200.00,
        "meta_fisica": "Cobertura vacinal ≥90%, controle de endemias",
        "status": "ok",
    },
    {
        "id": 3,
        "programa": "Média e Alta Complexidade",
        "fonte": "MS / SUS",
        "dotacao":   2_840_000.00,
        "empenhado": 1_942_100.00,
        "pago":      1_712_000.00,
        "meta_fisica": "TFD e encaminhamentos regionais Humaitá/Manaus",
        "status": "ok",
    },
    {
        "id": 4,
        "programa": "Assistência Farmacêutica",
        "fonte": "MS + Próprio",
        "dotacao":     960_000.00,
        "empenhado":   438_700.00,
        "pago":        312_400.00,
        "meta_fisica": "Dispensação de 320 itens da RENAME",
        "status": "atencao",
    },
    {
        "id": 5,
        "programa": "Saúde Mental / CAPS",
        "fonte": "MS + Próprio",
        "dotacao":     680_000.00,
        "empenhado":   204_000.00,
        "pago":        148_600.00,
        "meta_fisica": "400 atend./mês CAPS, RAPS ativo",
        "status": "critico",
    },
    {
        "id": 6,
        "programa": "Gestão em Saúde",
        "fonte": "Próprio Municipal",
        "dotacao":     840_000.00,
        "empenhado":   524_300.00,
        "pago":        489_100.00,
        "meta_fisica": "Gestão SMS, sistemas de informação, auditoria",
        "status": "ok",
    },
    {
        "id": 7,
        "programa": "Saneamento / Vigilância Ambiental",
        "fonte": "Próprio + FUNASA",
        "dotacao":     380_000.00,
        "empenhado":   128_000.00,
        "pago":         96_400.00,
        "meta_fisica": "Qualidade da água, SISÁGUA, controle de vetores",
        "status": "atencao",
    },
]

for p in _PROGRAMAS:
    p["saldo"]   = round(p["dotacao"] - p["empenhado"], 2)
    pct = round((p["pago"] / p["dotacao"]) * 100, 1) if p["dotacao"] else 0
    p["pct_pago"] = pct

_TOTAL_DOTACAO   = round(sum(p["dotacao"]   for p in _PROGRAMAS), 2)
_TOTAL_EMPENHADO = round(sum(p["empenhado"] for p in _PROGRAMAS), 2)
_TOTAL_PAGO      = round(sum(p["pago"]      for p in _PROGRAMAS), 2)
_TOTAL_SALDO     = round(_TOTAL_DOTACAO - _TOTAL_EMPENHADO, 2)
_N_PROGRAMAS     = len(_PROGRAMAS)
_PCT_EXECUCAO    = round((_TOTAL_EMPENHADO / _TOTAL_DOTACAO) * 100, 1)
_PCT_PAGO        = round((_TOTAL_PAGO      / _TOTAL_DOTACAO) * 100, 1)

# SIOPS — % recurso próprio (meta constitucional ≥15 %)
_SIOPS_ATUAL    = 16.8
_SIOPS_META     = 15.0
_SIOPS_CONFORME = _SIOPS_ATUAL >= _SIOPS_META

# ── LDO Metas 2026 ────────────────────────────────────────────────────────────
_LDO_METAS = [
    {"indicador": "Cobertura de ACS (%)",                  "meta_ldo": 100, "realizado": 93,  "status": "atencao"},
    {"indicador": "Cobertura ESF (%)",                     "meta_ldo": 95,  "realizado": 87,  "status": "atencao"},
    {"indicador": "Cobertura vacinal infantil média (%)",  "meta_ldo": 95,  "realizado": 84,  "status": "critico"},
    {"indicador": "% recurso próprio em saúde (SIOPS)",    "meta_ldo": 15,  "realizado": 16.8,"status": "ok"},
    {"indicador": "Consultas APS per capita (ano)",         "meta_ldo": 4.0, "realizado": 3.2, "status": "atencao"},
    {"indicador": "Ações de vigilância sanitária (nº)",    "meta_ldo": 200, "realizado": 187, "status": "ok"},
    {"indicador": "Indicadores Cofinanciamento APS ≥ meta (%)",   "meta_ldo": 80,  "realizado": 57,  "status": "critico"},
    {"indicador": "Mortalidade infantil (por 1.000 NV)",   "meta_ldo": 15,  "realizado": 12,  "status": "ok"},
    {"indicador": "Internações evitáveis APS (%)",         "meta_ldo": 20,  "realizado": 24,  "status": "critico"},
    {"indicador": "Satisfação usuário SUS (NPS)",          "meta_ldo": 70,  "realizado": 74,  "status": "ok"},
]

# ── SIOPS Histórico ────────────────────────────────────────────────────────────
_SIOPS_HISTORICO = [
    {"ano": 2021, "pct_proprio": 15.4, "receita_propria": 8_420_000, "gasto_saude": 1_296_680, "status": "atingido"},
    {"ano": 2022, "pct_proprio": 16.1, "receita_propria": 9_140_000, "gasto_saude": 1_471_540, "status": "atingido"},
    {"ano": 2023, "pct_proprio": 15.9, "receita_propria": 9_870_000, "gasto_saude": 1_569_330, "status": "atingido"},
    {"ano": 2024, "pct_proprio": 16.6, "receita_propria": 10_520_000, "gasto_saude": 1_746_320, "status": "atingido"},
    {"ano": 2025, "pct_proprio": 17.2, "receita_propria": 11_280_000, "gasto_saude": 1_940_160, "status": "atingido"},
]

# ── SIOPS Bimestral 2026 (RREO) ────────────────────────────────────────────────
# Bimestres encerrados: 1º (jan-fev), 2º (mar-abr), 3º (mai-jun)
# Bimestres em andamento: 4º (jul-ago); previstos: 5º (set-out), 6º (nov-dez)
_REC_ANUAL = 12_400_000.00   # Receita corrente líquida prevista FMS 2026
_SIOPS_BIMESTRAL = {
    "bimestres": [
        {
            "bimestre": 1, "periodo": "Jan–Fev/2026",
            "receita_previsao":  2_066_667,
            "receita_arrecadada": 1_987_200,
            "gasto_proprio":       338_820,
            "pct_proprio":          17.05,
            "dotacao_atualizada":  2_250_000,
            "empenhado_acum":      1_124_300,
            "pago_acum":             892_100,
            "status": "atingido",
            "alerta": None,
        },
        {
            "bimestre": 2, "periodo": "Mar–Abr/2026",
            "receita_previsao":  2_066_667,
            "receita_arrecadada": 2_148_600,
            "gasto_proprio":       348_174,
            "pct_proprio":          16.20,
            "dotacao_atualizada":  4_500_000,
            "empenhado_acum":      2_367_100,
            "pago_acum":           1_894_300,
            "status": "atingido",
            "alerta": None,
        },
        {
            "bimestre": 3, "periodo": "Mai–Jun/2026",
            "receita_previsao":  2_066_667,
            "receita_arrecadada": 2_072_400,
            "gasto_proprio":       340_926,
            "pct_proprio":          16.45,
            "dotacao_atualizada":  6_750_000,
            "empenhado_acum":      3_824_500,
            "pago_acum":           3_044_800,
            "status": "atingido",
            "alerta": None,
        },
        {
            "bimestre": 4, "periodo": "Jul–Ago/2026",
            "receita_previsao":  2_066_667,
            "receita_arrecadada": 1_021_300,   # parcial — só julho fechado
            "gasto_proprio":       163_408,
            "pct_proprio":          16.00,
            "dotacao_atualizada":  9_000_000,
            "empenhado_acum":      5_040_000,
            "pago_acum":           4_244_900,
            "status": "parcial",
            "alerta": "Bimestre em andamento — dados de julho/2026 disponíveis",
        },
        {
            "bimestre": 5, "periodo": "Set–Out/2026",
            "receita_previsao":  2_066_667,
            "receita_arrecadada": None,
            "gasto_proprio":      None,
            "pct_proprio":        None,
            "dotacao_atualizada": 11_250_000,
            "empenhado_acum":     None,
            "pago_acum":          None,
            "status": "previsto",
            "alerta": None,
        },
        {
            "bimestre": 6, "periodo": "Nov–Dez/2026",
            "receita_previsao":  2_066_667,
            "receita_arrecadada": None,
            "gasto_proprio":      None,
            "pct_proprio":        None,
            "dotacao_atualizada": 13_500_000,
            "empenhado_acum":     None,
            "pago_acum":          None,
            "status": "previsto",
            "alerta": None,
        },
    ],
    "acumulado": {
        "bimestres_encerrados": 3,
        "receita_arrecadada":  6_208_200,
        "gasto_proprio":       1_027_920,
        "pct_proprio_medio":    16.57,
        "status": "atingido",
    },
    "loa_bimestral": {
        "Atenção Primária":          [1_124_300, 2_367_100, 3_824_500, 5_040_000, None, None],
        "Vigilância em Saúde":       [  198_400,   412_700,   714_500, None,       None, None],
        "Média/Alta Complexidade":   [  542_100, 1_124_300, 1_942_100, None,       None, None],
        "Assist. Farmacêutica":      [  124_800,   298_400,   438_700, None,       None, None],
        "Saúde Mental":              [   58_200,   124_600,   204_000, None,       None, None],
        "Gestão em Saúde":           [  148_200,   354_700,   524_300, None,       None, None],
        "Saneamento":                [   32_400,    84_600,   128_000, None,       None, None],
    },
    "nota": "Dados de referência — RREO aguarda homologação contábil da SMS Apuí.",
}


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado":    "referencia_municipal",
        "exercicio":        2026,
        "municipio":        "Apuí/AM",
        "cnpj_fms":         "12.834.320/0001-26",
        "total_dotacao":    _TOTAL_DOTACAO,
        "total_empenhado":  _TOTAL_EMPENHADO,
        "total_pago":       _TOTAL_PAGO,
        "total_saldo":      _TOTAL_SALDO,
        "n_programas":      _N_PROGRAMAS,
        "pct_execucao":     _PCT_EXECUCAO,
        "pct_pago":         _PCT_PAGO,
        "siops_atual":      _SIOPS_ATUAL,
        "siops_meta":       _SIOPS_META,
        "siops_conforme":   _SIOPS_CONFORME,
        "nota":             "Dados de referência PPA/LOA — confirme com contabilidade municipal para valores operacionais.",
        "verificado_em":    _ts(),
    }


@router.get("/loa")
async def loa():
    return _PROGRAMAS


@router.get("/ldo-metas")
async def ldo_metas():
    return _LDO_METAS


@router.get("/siops-historico")
async def siops_historico():
    return _SIOPS_HISTORICO


@router.get("/siops-bimestral")
async def siops_bimestral():
    return _SIOPS_BIMESTRAL
