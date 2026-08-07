"""
Router: /api/siops — SIOPS / Mínimo Constitucional em Saúde
Apuramento do gasto em saúde conforme EC 29/2000 e LC 141/2012
API pública: https://apidadosabertos.saude.gov.br/siops/
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut
from services import siops_service
from functools import lru_cache

router = APIRouter(prefix="/api/siops", tags=["SIOPS"])

# ── Referência Apuí/AM 2026 ───────────────────────────────────────────────────

@lru_cache(maxsize=1)
def _SIOPS_ANUAL():
    return {
        "municipio": "Apuí",
        "uf": "AM",
        "ibge": "1300144",
        "ano": 2026,
        "receita_impostos": 18_540_000.0,
        "minimo_constitucional_pct_obrigatorio": 15.0,
        "minimo_constitucional_valor_obrigatorio": 2_781_000.0,
        "gasto_total_saude": 14_623_000.0,
        "gasto_proprio_saude": 3_182_000.0,
        "minimo_constitucional_pct_aplicado": 17.16,
        "superavit_minimo_pct": 2.16,
        "status_minimo": "atingido",
        "transferencias_sus": 11_441_000.0,
        "atenção_basica_gasto": 5_840_000.0,
        "media_alta_complex_gasto": 2_920_000.0,
        "vigilancia_gasto": 1_460_000.0,
        "assistencia_farmaceutica_gasto": 876_000.0,
        "gestao_saude_gasto": 1_527_000.0,
        "fonte": "referencia",
    }


@lru_cache(maxsize=1)
def _SIOPS_TRIMESTRAL():
    return [
        { "trimestre": "1T/2026", "receita_imp": 4_370_000, "gasto_proprio": 632_000, "minimo_pct": 14.46, "status": "pendente" },
        { "trimestre": "2T/2026", "receita_imp": 4_680_000, "gasto_proprio": 825_000, "minimo_pct": 17.63, "status": "atingido" },
        { "trimestre": "3T/2026", "receita_imp": 4_920_000, "gasto_proprio": 892_000, "minimo_pct": 18.13, "status": "atingido" },
        { "trimestre": "4T/2026", "receita_imp": 4_570_000, "gasto_proprio": 833_000, "minimo_pct": 18.23, "status": "atingido" },
    ]


@lru_cache(maxsize=1)
def _BLOCOS():
    return [
        { "bloco": "Atenção Básica (PAB Fixo + Variável)", "transferido": 2_016_000, "aplicado": 2_188_000, "pct_exec": 108.5 },
        { "bloco": "Média e Alta Complexidade",             "transferido": 5_681_000, "aplicado": 5_244_000, "pct_exec": 92.3 },
        { "bloco": "Vigilância em Saúde",                  "transferido": 892_000,   "aplicado": 871_000,   "pct_exec": 97.6 },
        { "bloco": "Assistência Farmacêutica",              "transferido": 614_000,   "aplicado": 598_000,   "pct_exec": 97.4 },
        { "bloco": "Gestão do SUS",                        "transferido": 281_000,   "aplicado": 264_000,   "pct_exec": 93.9 },
        { "bloco": "Investimentos em Saúde",               "transferido": 1_957_000, "aplicado": 1_876_000, "pct_exec": 95.9 },
    ]



# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/apuracao")
async def apuracao_minimo(
    ano: int = Query(2026),
    _: UserOut = Depends(get_current_user),
):
    """Apuração do mínimo constitucional em saúde (EC 29 / LC 141)."""
    return await siops_service.buscar_apuracao(ano)


@router.get("/trimestral")
async def execucao_trimestral(_: UserOut = Depends(get_current_user)):
    """Execução trimestral do mínimo constitucional."""
    return {
        "municipio": "Apuí/AM",
        "trimestres": _SIOPS_TRIMESTRAL(),
        "alerta_1t": "1T abaixo do mínimo — compensado nos trimestres seguintes.",
        "fonte": "referencia",
    }


@router.get("/blocos")
async def execucao_blocos(_: UserOut = Depends(get_current_user)):
    """Execução financeira por bloco de financiamento FNS."""
    total_transf = sum(b["transferido"] for b in _BLOCOS())
    total_aplic  = sum(b["aplicado"]    for b in _BLOCOS())
    return {
        "municipio": "Apuí/AM",
        "total_transferido": total_transf,
        "total_aplicado": total_aplic,
        "pct_exec_total": round(total_aplic / total_transf * 100, 1),
        "blocos": _BLOCOS(),
        "fonte": "referencia",
    }


@router.get("/historico")
async def historico_minimo(_: UserOut = Depends(get_current_user)):
    """Histórico do mínimo constitucional — últimos 5 anos."""
    historico = await siops_service.buscar_historico()
    return {"municipio": "Apuí/AM", "historico": historico}
