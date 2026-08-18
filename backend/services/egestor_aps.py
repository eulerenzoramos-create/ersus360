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
