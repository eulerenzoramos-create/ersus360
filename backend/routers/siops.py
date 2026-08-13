"""
Router: /api/siops — SIOPS / Minimo Constitucional em Saude
Dados de referencia municipal para Apui/AM (~21.781 hab, LOA ~R$14M).
situacao_dado = "referencia_municipal" em todos os endpoints.
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/siops", tags=["SIOPS"])

_ANO = 2026


@router.get("/apuracao")
async def apuracao_minimo(
    ano: int = Query(_ANO),
    _: UserOut = Depends(get_current_user),
):
    """Apuracao do minimo constitucional em saude — dados de referencia municipal."""
    return {
        "situacao_dado":                  "referencia_municipal",
        "municipio":                      "Apuí",
        "uf":                             "AM",
        "ibge":                           "1300144",
        "ano":                            ano,
        "receita_base_calculo":           14_280_000.0,
        "minimo_constitucional_reais":     2_784_600.0,
        "minimo_constitucional_pct_aplic": 19.5,
        "minimo_constitucional_pct_aplicado": 19.5,
        "meta_minima_pct":                15.0,
        "conforme":                       True,
        "margem_seguranca":               4.5,
        "recursos_proprios_saude":         2_784_600.0,
        "transferencias_sus_federal":     1_915_703.8,
        "total_gasto_saude":              4_700_303.8,
        "gasto_per_capita":               215.8,
        "fonte":                          "referencia_municipal",
        "competencia":                    f"{ano}",
        "nota": (
            f"Dados de referencia municipal para Apui/AM {ano}. "
            "Receita base: IRRF + ITR + FPM + ICMS. "
            "Minimo constitucional saude: EC 29/2000 e LC 141/2012."
        ),
    }


@router.get("/trimestral")
async def execucao_trimestral(_: UserOut = Depends(get_current_user)):
    """Execucao trimestral do minimo constitucional — referencia municipal."""
    return {
        "situacao_dado": "referencia_municipal",
        "ano":           _ANO,
        "municipio":     "Apuí/AM",
        "trimestres": [
            {
                "trimestre":     "1T/2026",
                "meses":         ["Jan", "Fev", "Mar"],
                "gasto_saude":   1_175_075.95,
                "receita_base":  3_570_000.0,
                "pct_aplicado":  32.9,
                "meta_pct":      15.0,
                "conforme":      True,
                "fns_recebido":  478_925.97,
            },
            {
                "trimestre":     "2T/2026",
                "meses":         ["Abr", "Mai", "Jun"],
                "gasto_saude":   1_175_075.95,
                "receita_base":  3_570_000.0,
                "pct_aplicado":  32.9,
                "meta_pct":      15.0,
                "conforme":      True,
                "fns_recebido":  478_777.93,
            },
            {
                "trimestre":     "3T/2026",
                "meses":         ["Jul", "Ago", "Set"],
                "gasto_saude":   None,
                "receita_base":  None,
                "pct_aplicado":  None,
                "meta_pct":      15.0,
                "conforme":      None,
                "fns_recebido":  None,
                "pendente":      True,
            },
            {
                "trimestre":     "4T/2026",
                "meses":         ["Out", "Nov", "Dez"],
                "gasto_saude":   None,
                "receita_base":  None,
                "pct_aplicado":  None,
                "meta_pct":      15.0,
                "conforme":      None,
                "fns_recebido":  None,
                "pendente":      True,
            },
        ],
        "acumulado": {
            "gasto_saude":  2_350_151.90,
            "receita_base": 7_140_000.0,
            "pct_aplicado": 32.9,
            "conforme":     True,
        },
    }


@router.get("/blocos")
async def execucao_blocos(_: UserOut = Depends(get_current_user)):
    """Execucao por bloco de financiamento FNS — referencia municipal."""
    return {
        "situacao_dado": "referencia_municipal",
        "ano":           _ANO,
        "municipio":     "Apuí/AM",
        "blocos": [
            {
                "bloco":           "Atenção Primária (AB)",
                "codigo":          "AB",
                "cor":             "#2563eb",
                "fns_recebido":    619_572.0,
                "proprio_saude":   1_420_000.0,
                "total_gasto":     2_039_572.0,
                "pct_total_saude": 43.4,
                "conforme":        True,
                "competencia":     "Jan–Jun/2026",
            },
            {
                "bloco":           "Média e Alta Complexidade (MAC)",
                "codigo":          "MAC",
                "cor":             "#dc2626",
                "fns_recebido":    312_343.9,
                "proprio_saude":   620_000.0,
                "total_gasto":     932_343.9,
                "pct_total_saude": 19.8,
                "conforme":        True,
                "competencia":     "Jan–Jun/2026",
            },
            {
                "bloco":           "Vigilância em Saúde (VIGI)",
                "codigo":          "VIGI",
                "cor":             "#d97706",
                "fns_recebido":    25_936.0,
                "proprio_saude":   180_000.0,
                "total_gasto":     205_936.0,
                "pct_total_saude": 4.4,
                "conforme":        True,
                "competencia":     "Jan–Jun/2026",
            },
            {
                "bloco":           "Assistência Farmacêutica (FAF)",
                "codigo":          "FAF",
                "cor":             "#7c3aed",
                "fns_recebido":    0.0,
                "proprio_saude":   280_000.0,
                "total_gasto":     280_000.0,
                "pct_total_saude": 6.0,
                "conforme":        True,
                "obs":             "Sem repasse federal em 2026",
                "competencia":     "Jan–Jun/2026",
            },
        ],
        "total_gasto_saude": 3_457_851.9,
        "total_fns":          957_851.9,
        "total_proprio":      2_500_000.0,
    }


@router.get("/historico")
async def historico_minimo(_: UserOut = Depends(get_current_user)):
    """Historico do minimo constitucional — ultimos anos, referencia municipal."""
    return {
        "situacao_dado": "referencia_municipal",
        "municipio":     "Apuí/AM",
        "historico": [
            {"ano": 2020, "pct_aplicado": 18.2, "meta": 15.0, "conforme": True,  "gasto_saude": 2_100_000.0,  "receita_base": 11_538_462.0, "parcial": False},
            {"ano": 2021, "pct_aplicado": 17.8, "meta": 15.0, "conforme": True,  "gasto_saude": 2_320_000.0,  "receita_base": 13_033_708.0, "parcial": False},
            {"ano": 2022, "pct_aplicado": 18.6, "meta": 15.0, "conforme": True,  "gasto_saude": 2_580_000.0,  "receita_base": 13_870_968.0, "parcial": False},
            {"ano": 2023, "pct_aplicado": 19.1, "meta": 15.0, "conforme": True,  "gasto_saude": 2_720_000.0,  "receita_base": 14_241_623.0, "parcial": False},
            {"ano": 2024, "pct_aplicado": 19.3, "meta": 15.0, "conforme": True,  "gasto_saude": 2_760_000.0,  "receita_base": 14_300_518.0, "parcial": False},
            {"ano": 2025, "pct_aplicado": 19.4, "meta": 15.0, "conforme": True,  "gasto_saude": 2_770_000.0,  "receita_base": 14_278_351.0, "parcial": False},
            {"ano": 2026, "pct_aplicado": 19.5, "meta": 15.0, "conforme": True,  "gasto_saude": 2_784_600.0,  "receita_base": 14_280_000.0, "parcial": True},
        ],
        "tendencia": "crescente",
        "media_5anos": 19.18,
        "nota": "Referencia municipal — Apui/AM historicamente acima do minimo constitucional de 15%.",
    }
