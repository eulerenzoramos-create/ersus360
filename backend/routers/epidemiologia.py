"""
Router: /api/epidemiologia — Vigilância Epidemiológica / SINAN
APIs: apidadosabertos.saude.gov.br/sinan/ — dados reais somente.
Sem fallback com valores inventados. Sem API → nao_disponivel.
"""
from __future__ import annotations
from datetime import date as _date

from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut
from services import sinan_service

router = APIRouter(prefix="/api/epidemiologia", tags=["Epidemiologia"])

_IBGE = "1300144"


def _ano_sinan() -> int:
    return _date.today().year - 1


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def dashboard(_: UserOut = Depends(get_current_user)):
    """Dashboard epidemiológico consolidado — malária e dengue via SINAN."""
    ano = _ano_sinan()
    malaria_data = await sinan_service.buscar_malaria(ano)
    dengue_data  = await sinan_service.buscar_dengue(ano)

    return {
        "municipio":         "Apuí/AM",
        "ibge":              _IBGE,
        "periodo":           f"Ano {ano}",
        "malaria_ipa_atual": malaria_data.get("ipa"),
        "malaria_ipa_meta":  10.0,
        "malaria_ipa_status": malaria_data.get("classificacao_ipa"),
        "dengue_casos_acum": dengue_data.get("total_casos"),
        "dengue_incidencia": dengue_data.get("incidencia_100k"),
        # Sem API pública
        "mortalidade_infantil":       None,
        "cobertura_vacinal_media_pct": None,
        "total_notificacoes_ano":     None,
        "situacao_dado_malaria":      malaria_data.get("situacao_dado", "nao_disponivel"),
        "situacao_dado_dengue":       dengue_data.get("situacao_dado",  "nao_disponivel"),
        "situacao_dado_outros":       "nao_disponivel",
        "fonte_malaria":              malaria_data.get("fonte"),
        "fonte_dengue":               dengue_data.get("fonte"),
        "nota": (
            "Malária e dengue via SINAN/TabNet (API pública). "
            "Mortalidade, vacinação e notificações SINAN gerais requerem acesso "
            "ao TabNet municipal ou e-SUS PEC local."
        ),
    }


@router.get("/notificacoes")
async def notificacoes(
    agravo: str = Query(None),
    mes: int = Query(None, ge=1, le=12),
    _: UserOut = Depends(get_current_user),
):
    """Notificações SINAN — requer TabNet municipal ou e-SUS PEC."""
    return {
        "situacao_dado": "nao_disponivel",
        "total":         None,
        "notificacoes":  [],
        "nota": (
            "Notificações individuais SINAN não disponíveis via API pública por município. "
            "Configure acesso ao TabNet municipal ou e-SUS PEC local."
        ),
    }


@router.get("/agravos")
async def agravos_prioritarios(_: UserOut = Depends(get_current_user)):
    """Lista de agravos — dados por doença via SINAN onde disponível."""
    ano = _ano_sinan()
    malaria = await sinan_service.buscar_malaria(ano)
    dengue  = await sinan_service.buscar_dengue(ano)

    agravos = []
    if malaria.get("situacao_dado") != "nao_disponivel":
        agravos.append({
            "agravo":       "Malária",
            "cid":          "B50-B54",
            "casos_ano":    malaria.get("total_casos"),
            "ipa":          malaria.get("ipa"),
            "meta_ipa":     10.0,
            "status":       malaria.get("classificacao_ipa", "nao_disponivel"),
            "situacao_dado": malaria.get("situacao_dado", "nao_disponivel"),
            "fonte":        malaria.get("fonte"),
        })
    if dengue.get("situacao_dado") != "nao_disponivel":
        agravos.append({
            "agravo":       "Dengue",
            "cid":          "A90",
            "casos_ano":    dengue.get("total_casos"),
            "incidencia":   dengue.get("incidencia_100k"),
            "situacao_dado": dengue.get("situacao_dado", "nao_disponivel"),
            "fonte":        dengue.get("fonte"),
        })

    return {
        "situacao_dado": "nao_disponivel" if not agravos else "dado_nao_validado",
        "total_agravos_monitorados": len(agravos),
        "agravos_com_dado":         len(agravos),
        "agravos":                  agravos,
        "nota": (
            "Dados reais disponíveis apenas para malária e dengue via SINAN/TabNet. "
            "Tuberculose, hanseníase e outros requerem acesso ao TabNet municipal."
        ),
    }


@router.get("/malaria")
async def malaria(
    ano: int = Query(0),
    _: UserOut = Depends(get_current_user),
):
    """Dados malária — IPA, distribuição Pf/Pv via SINAN."""
    if not ano:
        ano = _ano_sinan()
    data = await sinan_service.buscar_malaria(ano)
    return {
        "municipio":      "Apuí/AM",
        "ibge":           _IBGE,
        "ano":            ano,
        "total_casos_ano": data.get("total_casos"),
        "total_pf":       data.get("falciparum"),
        "total_pv":       data.get("vivax"),
        "ipa_acumulado":  data.get("ipa"),
        "ipa_meta":       10.0,
        "ipa_status":     data.get("classificacao_ipa"),
        "serie_mensal":   [],
        "situacao_dado":  data.get("situacao_dado", "nao_disponivel"),
        "fonte":          data.get("fonte"),
        "nota": (
            "Série mensal requer TabNet municipal. "
            "Totais anuais via SINAN/TabNet nacional."
        ),
    }


@router.get("/dengue")
async def dengue(
    ano: int = Query(0),
    _: UserOut = Depends(get_current_user),
):
    """Dados dengue — incidência, casos graves via SINAN."""
    if not ano:
        ano = _ano_sinan()
    data = await sinan_service.buscar_dengue(ano)
    return {
        "municipio":          "Apuí/AM",
        "ibge":               _IBGE,
        "ano":                ano,
        "total_casos_ano":    data.get("total_casos"),
        "casos_graves":       data.get("casos_graves"),
        "obitos":             data.get("obitos"),
        "incidencia_por_100k": data.get("incidencia_100k"),
        "nivel_alerta":       None,
        "serie_mensal":       [],
        "situacao_dado":      data.get("situacao_dado", "nao_disponivel"),
        "fonte":              data.get("fonte"),
        "nota":               "Série mensal requer TabNet municipal.",
    }


@router.get("/mortalidade")
async def mortalidade(_: UserOut = Depends(get_current_user)):
    """Indicadores de mortalidade — requerem SIM/DATASUS (sem API pública por município)."""
    return {
        "municipio":      "Apuí/AM",
        "ibge":           _IBGE,
        "situacao_dado":  "nao_disponivel",
        "indicadores":    {},
        "nota": (
            "Dados de mortalidade requerem acesso ao SIM/DATASUS. "
            "Não há API pública automática por município disponível."
        ),
    }
