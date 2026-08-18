"""
Serviço de integração com a API do e-Gestor APS.
URL base: https://relatorioaps-prd.saude.gov.br

Endpoint principal:
  GET /financiamento/pagamento
    ?unidadeGeografica=MUNICIPIO
    &coUf=13
    &coMunicipio=130014
    &nuParcelaInicio=202601
    &nuParcelaFim=202608
    &tipoRelatorio=AGRUPADO

Retorna: { "data": "DD/MM/YYYY", "agrupamentos": [ { ...componentes... } ] }

Nenhum valor é fabricado. Se a API retornar erro ou timeout, a função
levanta EGestorAPIError para que o router possa sinalizar "integração pendente".
"""
from __future__ import annotations
import httpx
from datetime import datetime, timezone
from typing import Any

API_BASE = "https://relatorioaps-prd.saude.gov.br"

_HEADERS = {
    "Accept": "application/json, */*",
    "Accept-Language": "pt-BR,pt;q=0.9",
    "Origin": "https://relatorioaps.saude.gov.br",
    "Referer": "https://relatorioaps.saude.gov.br/gerenciaaps/pagamento",
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
}

# Mapeamento: código parcela (YYYYPP) → descrição humana
# Ciclo 2026: parcela 01 = NOV/2025, 02 = DEZ/2025, 03 = JAN/2026 ...
_PARCELA_LABELS = {
    "202601": ("NOV/2025", "2025-11", "1/12"),
    "202602": ("DEZ/2025", "2025-12", "2/12"),
    "202603": ("JAN/2026", "2026-01", "3/12"),
    "202604": ("FEV/2026", "2026-02", "4/12"),
    "202605": ("MAR/2026", "2026-03", "5/12"),
    "202606": ("ABR/2026", "2026-04", "6/12"),
    "202607": ("MAI/2026", "2026-05", "7/12"),
    "202608": ("JUN/2026", "2026-06", "8/12"),
    "202609": ("JUL/2026", "2026-07", "9/12"),
    "202610": ("AGO/2026", "2026-08", "10/12"),
    "202611": ("SET/2026", "2026-09", "11/12"),
    "202612": ("OUT/2026", "2026-10", "12/12"),
    # Ciclo 2025
    "202501": ("NOV/2024", "2024-11", "1/12"),
    "202502": ("DEZ/2024", "2024-12", "2/12"),
    "202503": ("JAN/2025", "2025-01", "3/12"),
    "202504": ("FEV/2025", "2025-02", "4/12"),
    "202505": ("MAR/2025", "2025-03", "5/12"),
    "202506": ("ABR/2025", "2025-04", "6/12"),
    "202507": ("MAI/2025", "2025-05", "7/12"),
    "202508": ("JUN/2025", "2025-06", "8/12"),
    "202509": ("JUL/2025", "2025-07", "9/12"),
    "202510": ("AGO/2025", "2025-08", "10/12"),
    "202511": ("SET/2025", "2025-09", "11/12"),
    "202512": ("OUT/2025", "2025-10", "12/12"),
}

# Nomes dos planos orçamentários (coSeqPlanoOrcamentario)
_PLANO_NOMES = {
    2:  "Agentes Comunitários de Saúde — ACS",
    7:  "Academia da Saúde",
    8:  "Equipes de Saúde da Família — eSF e eAP",
    9:  "Equipes Multiprofissionais — eMulti",
    10: "Atenção à Saúde Bucal — eSB",
    11: "Demais programas, serviços e equipes da APS",
    12: "Componente per capita de base populacional",
    16: "Incentivo financeiro da APS — Promoção à saúde",
}


class EGestorAPIError(Exception):
    pass


async def buscar_pagamentos(
    co_municipio: str = "130014",
    co_uf: str = "13",
    parcela_inicio: str = "202601",
    parcela_fim: str = "202608",
) -> dict[str, Any]:
    """
    Consulta o endpoint /financiamento/pagamento da API do e-Gestor APS.
    Retorna os dados normalizados com metadados de fonte.
    Levanta EGestorAPIError em caso de falha.
    """
    params = {
        "unidadeGeografica": "MUNICIPIO",
        "coUf": co_uf,
        "coMunicipio": co_municipio,
        "nuParcelaInicio": parcela_inicio,
        "nuParcelaFim": parcela_fim,
        "tipoRelatorio": "AGRUPADO",
    }
    url = f"{API_BASE}/financiamento/pagamento"
    coletado_em = datetime.now(timezone.utc).isoformat()

    try:
        async with httpx.AsyncClient(headers=_HEADERS, timeout=20, follow_redirects=True) as client:
            resp = await client.get(url, params=params)
    except httpx.RequestError as exc:
        raise EGestorAPIError(f"Erro de conexão com e-Gestor APS: {exc}") from exc

    if resp.status_code != 200:
        raise EGestorAPIError(
            f"e-Gestor APS retornou HTTP {resp.status_code} para {url}"
        )

    try:
        raw = resp.json()
    except Exception as exc:
        raise EGestorAPIError(f"Resposta inválida da API e-Gestor: {exc}") from exc

    competencias = []
    for ag in raw.get("agrupamentos", []):
        cod_parcela = ag.get("nuParcela", "")
        label_info = _PARCELA_LABELS.get(cod_parcela, (cod_parcela, "", ""))
        competencia_label, mes_iso, parcela_label = label_info

        componentes = []
        for po in ag.get("listaPagamentoPlanoOrcamentario", []):
            co_seq = po.get("coSeqPlanoOrcamentario", 0)
            vl_custeio = po.get("vlTotalCusteio", 0.0) or 0.0
            vl_implantacao = po.get("vlTotalImplantacao", 0.0) or 0.0
            componentes.append({
                "co_seq": co_seq,
                "descricao": _PLANO_NOMES.get(co_seq, po.get("dsPlanoOrcamentario", "")),
                "descricao_original": po.get("dsPlanoOrcamentario", ""),
                "gestao": po.get("dsGestao", "MUNICIPAL"),
                "vl_custeio": vl_custeio,
                "vl_implantacao": vl_implantacao,
                "vl_total": vl_custeio + vl_implantacao,
            })

        total_api = ag.get("total", 0.0)
        soma_comp = sum(c["vl_total"] for c in componentes)
        conciliado = abs(total_api - soma_comp) < 0.02

        competencias.append({
            "competencia": competencia_label,
            "mes": mes_iso,
            "parcela": parcela_label,
            "nu_parcela": cod_parcela,
            "nu_comp_cnes": ag.get("nuCompCnes", ""),
            "co_processo": ag.get("coProcesso"),
            "co_municipio_ibge": ag.get("coMunicipioIbge", ""),
            "no_municipio": ag.get("noMunicipio", ""),
            "sg_uf": ag.get("sgUf", ""),
            "total_oficial": total_api,
            "soma_componentes": round(soma_comp, 2),
            "conciliado": conciliado,
            "componentes": componentes,
            "fonte": "e-Gestor APS — API /financiamento/pagamento",
            "fonte_url": f"{url}?{resp.request.url.query}",
            "fonte_situacao": "oficial_confirmado",
            "coletado_em": coletado_em,
        })

    return {
        "data_consulta": raw.get("data", ""),
        "coletado_em": coletado_em,
        "fonte_api": url,
        "municipio": co_municipio,
        "uf": co_uf,
        "competencias": competencias,
    }


async def buscar_completo(
    co_municipio: str = "130014",
    co_uf: str = "13",
    parcela_inicio: str = "202608",
    parcela_fim: str = "202608",
) -> dict[str, Any]:
    """
    Consulta o endpoint /financiamento/pagamento com tipoRelatorio=COMPLETO.
    Retorna detalhamento de equipes, quantidades, vínculo/qualidade, indicadores.
    """
    params = {
        "unidadeGeografica": "MUNICIPIO",
        "coUf": co_uf,
        "coMunicipio": co_municipio,
        "nuParcelaInicio": parcela_inicio,
        "nuParcelaFim": parcela_fim,
        "tipoRelatorio": "COMPLETO",
    }
    url = f"{API_BASE}/financiamento/pagamento"
    coletado_em = datetime.now(timezone.utc).isoformat()

    try:
        async with httpx.AsyncClient(headers=_HEADERS, timeout=20) as client:
            resp = await client.get(url, params=params)
    except httpx.RequestError as exc:
        raise EGestorAPIError(f"Erro de conexão com e-Gestor APS: {exc}") from exc

    if resp.status_code != 200:
        raise EGestorAPIError(f"e-Gestor APS (COMPLETO) retornou HTTP {resp.status_code}")

    raw = resp.json()
    pagamentos = raw.get("pagamentos", [])
    if not pagamentos:
        raise EGestorAPIError("Nenhum dado 'pagamentos' na resposta COMPLETO.")

    pg = pagamentos[0]  # Para um único município, há apenas 1 entrada

    def _v(key: str) -> float:
        return float(pg.get(key) or 0)

    def _i(key: str) -> int:
        return int(pg.get(key) or 0)

    cod_parcela = pg.get("nuParcela", parcela_inicio)
    label_info = _PARCELA_LABELS.get(cod_parcela, (cod_parcela, "", ""))
    competencia_label, mes_iso, parcela_label = label_info

    resultado = {
        "competencia": competencia_label,
        "mes": mes_iso,
        "parcela": parcela_label,
        "nu_parcela": cod_parcela,
        "nu_comp_cnes": pg.get("nuCompCnes", ""),
        "municipio": pg.get("noMunicipio", ""),
        "uf": pg.get("sgUf", ""),
        "ibge": pg.get("coMunicipioIbge", ""),
        "fonte": "e-Gestor APS — API /financiamento/pagamento?tipoRelatorio=COMPLETO",
        "fonte_situacao": "oficial_confirmado",
        "coletado_em": coletado_em,

        # Indicadores gerais
        "populacao": _i("qtPopulacao"),
        "ano_ref_populacao": pg.get("nuAnoRefPopulacaoIbge"),
        "faixa_equidade_esf": pg.get("dsFaixaIndiceEquidadeEsfEap"),
        "classificacao_vinculo_esf": pg.get("dsClassificacaoVinculoEsfEap"),
        "classificacao_qualidade_esf": pg.get("dsClassificacaoQualidadeEsfEap"),
        "classificacao_qualidade_emulti": pg.get("dsClassificacaoQualidadeEmulti"),

        # eSF
        "esf": {
            "qt_credenciadas": _i("qtEsfCredenciado"),
            "qt_homologadas": _i("qtEsfHomologado"),
            "qt_pagas": _i("qtEsfTotalPgto"),
            "qt_100pct": _i("qtEsf100pcPgto"),
            "qt_75pct": _i("qtEsf75pcPgto"),
            "qt_50pct": _i("qtEsf50pcPgto"),
            "qt_25pct": _i("qtEsf25pcPgto"),
            "vl_fixo": _v("vlFixoEsf"),
            "vl_vinculo": _v("vlVinculoEsf"),
            "vl_qualidade": _v("vlQualidadeEsf"),
            "vl_total_bruto": _v("vlTotalEsf"),
            "vl_implantacao": _v("vlPagamentoImplantacaoEsf"),
        },
        # eAP
        "eap": {
            "qt_credenciadas": _i("qtEapCredenciadas"),
            "qt_homologadas": _i("qtEapHomologado"),
            "qt_pagas": _i("qtEapTotalPgto"),
            "vl_fixo": _v("vlFixoEap"),
            "vl_vinculo": _v("vlVinculoEap"),
            "vl_qualidade": _v("vlQualidadeEap"),
            "vl_total_bruto": _v("vlTotalEap"),
            "vl_implantacao": _v("vlPagamentoImplantacaoEap"),
        },
        # eMulti
        "emulti": {
            "qt_credenciadas": _i("qtEmultiCredenciadas"),
            "qt_homologadas": _i("qtEmultiHomologado"),
            "qt_pagas": _i("qtEmultiPagas"),
            "qt_ampliada": _i("qtEmultiPagamentoAmpliada"),
            "qt_estrategica": _i("qtEmultiPagamentoEstrategica"),
            "qt_complementar": _i("qtEmultiPagamentoComplementar"),
            "qt_intermunicipal": _i("qtEmultiPagamentoIntermunicipal"),
            "qt_atend_remoto": _i("qtEmultiPagasAtendRemoto"),
            "vl_custeio": _v("vlPagamentoEmultiCusteio"),
            "vl_qualidade": _v("vlPagamentoEmultiQualidade"),
            "vl_atend_remoto": _v("vlPagamentoEmultiAtendimentoRemoto"),
            "vl_total": _v("vlTotalEmulti"),
            "vl_implantacao": _v("vlPagamentoEmultiImplantacao"),
        },
        # eSB (Saúde Bucal)
        "esb": {
            "qt_40h_credenciadas": _i("qtSb40hCredenciada"),
            "qt_40h_homologadas": _i("qtSb40hHomologado"),
            "qt_40h_pagas_modal_i": _i("qtSbPagamentoModalidadeI"),
            "qt_40h_pagas_modal_ii": _i("qtSbPagamentoModalidadeII"),
            "qt_quilombola_modal_i": _i("qtSbEqpQuilombAssentModalI"),
            "qt_implantacao": _i("qtSbEquipeImplantacao"),
            "vl_esb_40h": _v("vlPagamentoEsb40h"),
            "vl_qualidade_40h": _v("vlPagamentoEsb40hQualidade"),
            "vl_ch_diferenciada": _v("vlPagamentoEsbChDiferenciada"),
            "vl_implantacao": _v("vlPagamentoImplantacaoEsb40h"),
            # UOM e LRPD (dentro de eSB)
            "qt_uom": _i("qtUomPgto"),
            "vl_uom": _v("vlPagamentoUom"),
            "vl_lrpd_municipal": _v("vlPagamentoLrpdMunicipal"),
            "vl_ceo_municipal": _v("vlPagamentoCeoMunicipal"),
            "vl_total_sb_calculado": (
                _v("vlPagamentoEsb40h") + _v("vlPagamentoEsb40hQualidade") +
                _v("vlPagamentoEsbChDiferenciada") + _v("vlPagamentoUom") +
                _v("vlPagamentoLrpdMunicipal") + _v("vlPagamentoCeoMunicipal")
            ),
        },
        # ACS
        "acs": {
            "qt_teto": _i("qtTetoAcs"),
            "qt_direto_credenciado": _i("qtAcsDiretoCredenciado"),
            "qt_direto_pago": _i("qtAcsDiretoPgto"),
            "vl_direto": _v("vlPagamentoAcsDireto"),
            "vl_parcela_extra_direto": _v("vlPagamentoParcelaExtraAcsDireto"),
            "qt_indireto_pago": _i("qtAcsIndiretoPgto"),
            "vl_indireto": _v("vlPagamentoAcsIndireto"),
            "vl_total": _v("vlTotalAcsDireto") + _v("vlTotalAcsIndireto"),
        },
        # eSFRB (Ribeirinha)
        "esfrb": {
            "qt_credenciadas": _i("qtRibeirinhaCredenciado"),
            "qt_homologadas": _i("qtRibeirinhaHomologado"),
            "qt_pagas": _i("qtRibeirinhaPagas"),
            "qt_embarcacoes": _i("qtEmbarcacaoRibeirinha"),
            "vl_custeio": _v("vlPagamentoEsfrb"),
            "vl_qualidade": _v("vlPagamentoEsfrbQualidade"),
            "vl_vinculo": _v("vlPagamentoEsfrbVinculoAcomp"),
            "vl_extra": _v("vlPagamentoEsfrbExtra"),
            "vl_implantacao": _v("vlPagamentoEsfrbImplantacao"),
            "vl_total": (
                _v("vlPagamentoEsfrb") + _v("vlPagamentoEsfrbQualidade") +
                _v("vlPagamentoEsfrbVinculoAcomp") + _v("vlPagamentoEsfrbExtra")
            ),
        },
        # Microscopistas
        "microscopistas": {
            "qt_credenciados": _i("qtMicroscopistaCredenciado"),
            "qt_pagos": _i("qtMicroscopistaPgto"),
            "vl_pagamento": _v("vlPagamentoMicroscopista"),
            "vl_extra": _v("vlPagamentoParcelaExtraMicroscopista"),
            "vl_total": _v("vlTotalMicroscopista"),
        },
        # Per capita
        "per_capita": {
            "populacao": _i("qtPopulacao"),
            "vl_pagamento": _v("vlPagamentoIncentivoPopulacional"),
        },
        # PSE
        "pse": {
            "vl_monitoramento": _v("vlMonitoramentoPse"),
            "vl_adicional": _v("vlAdicionalPse"),
            "vl_total": _v("vlTotalPse"),
        },
        # Tetos credenciamento
        "tetos": {
            "esf": _i("qtTetoEsf"),
            "eap": _i("qtTetoEap"),
            "emulti_estrategica": _i("qtTetoEmultiEstrategica"),
            "emulti_complementar": _i("qtTetoEmultiComplementar"),
            "emulti_ampliada": _i("qtTetoEmultiAmpliada"),
            "sb_40h": _i("qtTetoSb40h"),
        },
    }

    return {
        "data_consulta": raw.get("data", ""),
        "coletado_em": coletado_em,
        "detalhado": resultado,
    }


async def listar_parcelas(ano: int = 2026, co_uf: str = "13") -> list[str]:
    """Retorna lista de códigos de parcelas disponíveis para o ano."""
    url = f"{API_BASE}/data/parcelas"
    params = {"ano": ano}
    try:
        async with httpx.AsyncClient(headers=_HEADERS, timeout=10) as client:
            resp = await client.get(url, params=params)
        if resp.status_code == 200:
            return resp.json()
    except Exception:
        pass
    return []
