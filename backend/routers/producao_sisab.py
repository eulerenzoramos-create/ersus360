"""
Router: /api/sisab — ERSUS 360

Endpoints:
  GET /api/sisab/dashboard           → nao_disponivel (requer e-SUS PEC)
  GET /api/sisab/por-equipe          → nao_disponivel (requer e-SUS PEC)
  GET /api/sisab/procedimentos       → nao_disponivel (requer e-SUS PEC)
  GET /api/sisab/ciclos              → nao_disponivel (requer e-SUS PEC)
  GET /api/sisab/qualidade-equipes   → DADOS REAIS via e-Gestor APS (API pública, sem auth)
  GET /api/sisab/resumo-financeiro   → DADOS REAIS via e-Gestor APS (API pública, sem auth)

Regra: nenhum valor simulado ou estimado. Dados PEC requerem integração e-SUS PEC.
Dados financeiros/qualidade vêm da API pública relatorioaps-prd.saude.gov.br.
"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Query
from services.egestor_aps import buscar_completo, buscar_pagamentos, EGestorAPIError
from services.cache_service import cache_get, cache_set

router = APIRouter(prefix="/api/sisab", tags=["Produção APS"])

_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_NAO_DISP = lambda nota="Integração pendente. Requer e-SUS PEC configurado.": {
    "situacao_dado": "nao_disponivel", "dados": None,
    "nota": nota, "verificado_em": _TS(),
}


@router.get("/dashboard")
async def dashboard():
    return _NAO_DISP(
        "Dados de produção (atendimentos, procedimentos) requerem integração e-SUS PEC. "
        "Use /api/sisab/qualidade-equipes para dados de qualidade disponíveis agora."
    )


@router.get("/por-equipe")
async def por_equipe():
    return _NAO_DISP()


@router.get("/procedimentos")
async def procedimentos():
    return _NAO_DISP()


@router.get("/ciclos")
async def ciclos():
    return _NAO_DISP()


# ── Qualidade de Equipes — API pública e-Gestor APS ───────────────────────────

@router.get("/qualidade-equipes")
async def qualidade_equipes(parcela: str = Query("202608", description="Código da parcela YYYYPP")):
    """
    Dados reais de qualidade e vínculo das equipes, via API pública relatorioaps-prd.saude.gov.br.
    Não requer token. Usa tipoRelatorio=COMPLETO.
    """
    cache_key = f"sisab_qualidade_{parcela}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    try:
        raw = await buscar_completo(parcela_inicio=parcela, parcela_fim=parcela)
    except EGestorAPIError as e:
        return {
            "situacao_dado": "erro_api",
            "dados": None,
            "nota": f"API e-Gestor APS indisponível: {e}",
            "verificado_em": _TS(),
        }

    det = raw.get("detalhado", {})
    esf = det.get("esf", {})
    eap = det.get("eap", {})
    emulti = det.get("emulti", {})
    esb = det.get("esb", {})
    acs = det.get("acs", {})
    esfrb = det.get("esfrb", {})
    tetos = det.get("tetos", {})

    # Distribucao de qualidade eSF por faixa de pagamento
    qt_pagas = esf.get("qt_pagas", 0)
    qt_100 = esf.get("qt_100pct", 0)
    qt_75  = esf.get("qt_75pct", 0)
    qt_50  = esf.get("qt_50pct", 0)
    qt_25  = esf.get("qt_25pct", 0)
    qt_abaixo = max(0, qt_pagas - qt_100 - qt_75 - qt_50 - qt_25)

    result = {
        "situacao_dado": "oficial_confirmado",
        "fonte": "e-Gestor APS — API /financiamento/pagamento?tipoRelatorio=COMPLETO",
        "fonte_url": "https://relatorioaps-prd.saude.gov.br/financiamento/pagamento",
        "verificado_em": raw.get("coletado_em", _TS()),
        "competencia": det.get("competencia"),
        "municipio": det.get("municipio"),
        "ibge": det.get("ibge"),
        "populacao": det.get("populacao"),
        "classificacoes": {
            "vinculo_esf":      det.get("classificacao_vinculo_esf"),
            "qualidade_esf":    det.get("classificacao_qualidade_esf"),
            "qualidade_emulti": det.get("classificacao_qualidade_emulti"),
            "equidade_esf":     det.get("faixa_equidade_esf"),
        },
        "equipes": {
            "esf": {
                "teto":       tetos.get("esf", 0),
                "credenciadas": esf.get("qt_credenciadas", 0),
                "homologadas":  esf.get("qt_homologadas", 0),
                "pagas":        qt_pagas,
                "distribuicao_qualidade": {
                    "100pct": qt_100,
                    "75pct":  qt_75,
                    "50pct":  qt_50,
                    "25pct":  qt_25,
                    "abaixo_25pct": qt_abaixo,
                },
                "vl_fixo":     esf.get("vl_fixo", 0),
                "vl_vinculo":  esf.get("vl_vinculo", 0),
                "vl_qualidade": esf.get("vl_qualidade", 0),
                "vl_total":    esf.get("vl_total_bruto", 0),
            },
            "eap": {
                "teto":         tetos.get("eap", 0),
                "credenciadas": eap.get("qt_credenciadas", 0),
                "homologadas":  eap.get("qt_homologadas", 0),
                "pagas":        eap.get("qt_pagas", 0),
                "vl_total":     eap.get("vl_total_bruto", 0),
            },
            "emulti": {
                "teto_estrategica":   tetos.get("emulti_estrategica", 0),
                "teto_complementar":  tetos.get("emulti_complementar", 0),
                "teto_ampliada":      tetos.get("emulti_ampliada", 0),
                "credenciadas":       emulti.get("qt_credenciadas", 0),
                "homologadas":        emulti.get("qt_homologadas", 0),
                "pagas":              emulti.get("qt_pagas", 0),
                "vl_total":           emulti.get("vl_total", 0),
            },
            "esb": {
                "teto":        tetos.get("sb_40h", 0),
                "credenciadas": esb.get("qt_40h_credenciadas", 0),
                "homologadas":  esb.get("qt_40h_homologadas", 0),
                "vl_total":    esb.get("vl_esb_40h", 0) + esb.get("vl_qualidade_40h", 0),
            },
            "acs": {
                "teto":         acs.get("qt_teto", 0),
                "credenciados": acs.get("qt_direto_credenciado", 0),
                "pagos":        acs.get("qt_direto_pago", 0),
                "vl_total":     acs.get("vl_total", 0),
            },
            "esfrb": {
                "credenciadas": esfrb.get("qt_credenciadas", 0),
                "pagas":        esfrb.get("qt_pagas", 0),
                "embarcacoes":  esfrb.get("qt_embarcacoes", 0),
                "vl_total":     esfrb.get("vl_total", 0),
            },
        },
    }

    cache_set(cache_key, result, ttl=1800)
    return result


# ── Resumo Financeiro — API pública e-Gestor APS ──────────────────────────────

@router.get("/resumo-financeiro")
async def resumo_financeiro(
    parcela_inicio: str = Query("202601", description="Parcela inicial YYYYPP"),
    parcela_fim:    str = Query("202608", description="Parcela final YYYYPP"),
):
    """
    Dados reais de pagamentos por componente, via API pública relatorioaps-prd.saude.gov.br.
    Não requer token.
    """
    cache_key = f"sisab_financeiro_{parcela_inicio}_{parcela_fim}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    try:
        raw = await buscar_pagamentos(parcela_inicio=parcela_inicio, parcela_fim=parcela_fim)
    except EGestorAPIError as e:
        return {
            "situacao_dado": "erro_api",
            "dados": None,
            "nota": f"API e-Gestor APS indisponível: {e}",
            "verificado_em": _TS(),
        }

    result = {
        "situacao_dado": "oficial_confirmado",
        "fonte": "e-Gestor APS — API /financiamento/pagamento",
        "verificado_em": raw.get("coletado_em", _TS()),
        **raw,
    }

    cache_set(cache_key, result, ttl=1800)
    return result
