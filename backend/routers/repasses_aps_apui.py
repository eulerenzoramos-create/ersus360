"""
Router: /api/repasses-aps — ERSUS 360
Módulo de Repasses Financeiros da APS — Apuí/AM (IBGE 130014)

REGRA ABSOLUTA: Nenhum valor fictício ou estimado é apresentado como oficial.
Cada registro indica sua fonte, data de coleta e nível de confiança.

Fonte primária: API e-Gestor APS (relatorioaps-prd.saude.gov.br)
  endpoint: /financiamento/pagamento (acesso HTTP público, sem autenticação)
  endpoint descoberto via Playwright/Chromium em 2026-08-18

Fontes complementares:
  - Portaria GM/MS nº 3.493/2024 (estrutura de financiamento)
  - Portaria GM/MS nº 635/2023 (eMulti)
"""
from __future__ import annotations
import asyncio
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from typing import Any

from services.egestor_aps import buscar_pagamentos, buscar_completo, listar_parcelas, EGestorAPIError

router = APIRouter(prefix="/api/repasses-aps", tags=["repasses_aps"])

IBGE = "130014"
CO_UF = "13"
MUNICIPIO = "Apuí"
UF = "AM"
CNPJ_FMS = "12.834.320/0001-26"

# Ciclo 2026 completo: 202601 = NOV/2025, ..., 202612 = OUT/2026
PARCELA_INICIO_2026 = "202601"
PARCELA_FIM_2026 = "202612"

# Mapeamento nu_parcela → label de competência (para o ciclo 2026)
_COMP_MAP = {
    "202601": "NOV/2025",
    "202602": "DEZ/2025",
    "202603": "JAN/2026",
    "202604": "FEV/2026",
    "202605": "MAR/2026",
    "202606": "ABR/2026",
    "202607": "MAI/2026",
    "202608": "JUN/2026",
    "202609": "JUL/2026",
    "202610": "AGO/2026",
    "202611": "SET/2026",
    "202612": "OUT/2026",
}


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _meta() -> dict[str, Any]:
    return {
        "municipio": MUNICIPIO,
        "uf": UF,
        "ibge": IBGE,
        "cnpj_fms": CNPJ_FMS,
        "fonte_primaria": "e-Gestor APS (relatorioaps-prd.saude.gov.br)",
        "nota_integridade": (
            "Todos os valores provêm da API oficial do e-Gestor APS. "
            "Nenhum valor é simulado ou estimado. "
            "Dados ausentes são sinalizados como 'nao_disponivel'."
        ),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/competencias")
async def listar_competencias(
    ano: int = Query(2026, ge=2020, le=2030, description="Ano do ciclo financeiro"),
):
    """
    Lista todas as competências (parcelas) disponíveis para o município.
    Consulta ao vivo a API do e-Gestor APS.
    """
    try:
        parcelas_raw = await listar_parcelas(ano=ano, co_uf=CO_UF)
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail={
                "erro": "Integração pendente",
                "descricao": f"Não foi possível consultar a API do e-Gestor APS: {exc}",
                "acao_sugerida": "Tente novamente em instantes ou consulte relatorioaps.saude.gov.br",
            },
        )

    # Determina parcela início e fim com base nas disponíveis
    if not parcelas_raw:
        raise HTTPException(
            status_code=404,
            detail={"erro": "Nenhuma parcela disponível para este ano."},
        )

    inicio = min(parcelas_raw)
    fim = max(parcelas_raw)

    try:
        resultado = await buscar_pagamentos(
            co_municipio=IBGE,
            co_uf=CO_UF,
            parcela_inicio=inicio,
            parcela_fim=fim,
        )
    except EGestorAPIError as exc:
        raise HTTPException(
            status_code=503,
            detail={
                "erro": "Integração pendente",
                "descricao": str(exc),
                "acao_sugerida": "Consulte relatorioaps.saude.gov.br diretamente.",
            },
        )

    # Resumo por competência (sem detalhar componentes na listagem)
    resumo = []
    for c in resultado["competencias"]:
        resumo.append(
            {
                "competencia": c["competencia"],
                "mes": c["mes"],
                "parcela": c["parcela"],
                "nu_parcela": c["nu_parcela"],
                "total_oficial": c["total_oficial"],
                "conciliado": c["conciliado"],
                "fonte_situacao": c["fonte_situacao"],
                "coletado_em": c["coletado_em"],
            }
        )

    total_periodo = sum(c["total_oficial"] for c in resultado["competencias"])

    return {
        "meta": _meta(),
        "ano_ciclo": ano,
        "data_consulta_egestor": resultado["data_consulta"],
        "coletado_em": resultado["coletado_em"],
        "total_periodo": round(total_periodo, 2),
        "competencias": resumo,
    }


@router.get("/competencias/{nu_parcela}")
async def detalhar_competencia(nu_parcela: str):
    """
    Retorna o detalhamento completo de uma parcela específica.
    nu_parcela: código no formato YYYYPP (ex: 202608 = JUN/2026 = 8ª parcela do ciclo 2026).
    """
    if len(nu_parcela) != 6 or not nu_parcela.isdigit():
        raise HTTPException(
            status_code=400,
            detail={"erro": "Formato inválido. Use YYYYPP (ex: 202608)."},
        )

    try:
        resultado = await buscar_pagamentos(
            co_municipio=IBGE,
            co_uf=CO_UF,
            parcela_inicio=nu_parcela,
            parcela_fim=nu_parcela,
        )
    except EGestorAPIError as exc:
        raise HTTPException(
            status_code=503,
            detail={
                "erro": "Integração pendente",
                "descricao": str(exc),
                "acao_sugerida": "Consulte relatorioaps.saude.gov.br diretamente.",
            },
        )

    competencias = resultado["competencias"]
    if not competencias:
        raise HTTPException(
            status_code=404,
            detail={
                "erro": "Competência não encontrada",
                "descricao": (
                    f"A parcela {nu_parcela} não foi localizada na API do e-Gestor APS. "
                    "Pode não estar disponibilizada ainda ou o código está incorreto."
                ),
                "nu_parcela": nu_parcela,
                "fonte": "e-Gestor APS",
            },
        )

    return {
        "meta": _meta(),
        "data_consulta_egestor": resultado["data_consulta"],
        "coletado_em": resultado["coletado_em"],
        **competencias[0],
    }


@router.get("/resumo-executivo")
async def resumo_executivo():
    """
    Resumo executivo do ciclo 2026 completo (NOV/2025 – OUT/2026).
    Consulta ao vivo o e-Gestor APS para todas as parcelas disponíveis.
    """
    try:
        parcelas_raw = await listar_parcelas(ano=2026, co_uf=CO_UF)
    except Exception:
        parcelas_raw = []

    if not parcelas_raw:
        # Tenta com parcelas conhecidas como fallback
        parcelas_raw = [
            "202601", "202602", "202603", "202604",
            "202605", "202606", "202607", "202608",
        ]

    inicio = min(parcelas_raw)
    fim = max(parcelas_raw)

    try:
        resultado = await buscar_pagamentos(
            co_municipio=IBGE,
            co_uf=CO_UF,
            parcela_inicio=inicio,
            parcela_fim=fim,
        )
    except EGestorAPIError as exc:
        raise HTTPException(
            status_code=503,
            detail={
                "erro": "Integração pendente com e-Gestor APS",
                "descricao": str(exc),
                "acao_sugerida": "Tente novamente ou consulte relatorioaps.saude.gov.br",
            },
        )

    comps = resultado["competencias"]
    total_disponivel = sum(c["total_oficial"] for c in comps)

    # Totais por componente (soma do ciclo)
    totais_componentes: dict[str, float] = {}
    for c in comps:
        for comp in c.get("componentes", []):
            desc = comp["descricao"]
            totais_componentes[desc] = totais_componentes.get(desc, 0.0) + comp["vl_total"]

    # Parcelas pendentes de publicação (que existem no ciclo mas não foram liberadas)
    parcelas_disponiveis = {c["nu_parcela"] for c in comps}
    todas_parcelas_ciclo = [f"2026{str(i).zfill(2)}" for i in range(1, 13)]
    parcelas_pendentes = [
        {
            "nu_parcela": p,
            "competencia": _COMP_MAP.get(p, p),
            "situacao": "Competência ainda não processada pela fonte oficial",
        }
        for p in todas_parcelas_ciclo
        if p not in parcelas_disponiveis
    ]

    return {
        "meta": _meta(),
        "data_consulta_egestor": resultado["data_consulta"],
        "coletado_em": resultado["coletado_em"],
        "ano_ciclo": 2026,
        "parcelas_disponiveis": len(comps),
        "parcelas_pendentes": len(parcelas_pendentes),
        "total_disponivel": round(total_disponivel, 2),
        "total_ciclo_completo_estimado": None,
        "nota_total_estimado": "Não disponível — usar apenas valores confirmados pela fonte oficial",
        "totais_por_componente": {
            k: round(v, 2) for k, v in sorted(totais_componentes.items(), key=lambda x: -x[1])
        },
        "competencias_disponiveis": [
            {
                "competencia": c["competencia"],
                "parcela": c["parcela"],
                "total_oficial": c["total_oficial"],
                "conciliado": c["conciliado"],
                "nu_componentes": len(c.get("componentes", [])),
            }
            for c in comps
        ],
        "competencias_pendentes": parcelas_pendentes,
    }


@router.get("/conciliacao/{nu_parcela}")
async def validar_conciliacao(nu_parcela: str):
    """
    Valida a conciliação de uma parcela: soma dos componentes = total oficial.
    Retorna status APROVADO ou DIVERGENTE com detalhes.
    """
    try:
        resultado = await buscar_pagamentos(
            co_municipio=IBGE,
            co_uf=CO_UF,
            parcela_inicio=nu_parcela,
            parcela_fim=nu_parcela,
        )
    except EGestorAPIError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    if not resultado["competencias"]:
        raise HTTPException(status_code=404, detail="Parcela não encontrada.")

    comp = resultado["competencias"][0]
    divergencia = comp["total_oficial"] - comp["soma_componentes"]

    return {
        "nu_parcela": nu_parcela,
        "competencia": comp["competencia"],
        "total_oficial": comp["total_oficial"],
        "soma_componentes": comp["soma_componentes"],
        "divergencia": round(divergencia, 2),
        "status": "APROVADO" if comp["conciliado"] else "DIVERGENTE",
        "coletado_em": comp["coletado_em"],
    }


@router.get("/detalhado/{nu_parcela}")
async def detalhar_completo(nu_parcela: str):
    """
    Retorna o detalhamento completo de uma parcela: equipes, quantidades,
    vínculo, qualidade, indicadores de classificação.
    Usa tipoRelatorio=COMPLETO da API do e-Gestor APS.
    """
    if len(nu_parcela) != 6 or not nu_parcela.isdigit():
        raise HTTPException(
            status_code=400,
            detail={"erro": "Formato inválido. Use YYYYPP (ex: 202608)."},
        )
    try:
        resultado = await buscar_completo(
            co_municipio=IBGE,
            co_uf=CO_UF,
            parcela_inicio=nu_parcela,
            parcela_fim=nu_parcela,
        )
    except EGestorAPIError as exc:
        raise HTTPException(
            status_code=503,
            detail={
                "erro": "Integração pendente",
                "descricao": str(exc),
                "acao_sugerida": "Consulte relatorioaps.saude.gov.br diretamente.",
            },
        )
    return {
        "meta": _meta(),
        "data_consulta_egestor": resultado["data_consulta"],
        "coletado_em": resultado["coletado_em"],
        **resultado["detalhado"],
    }


@router.get("/inconsistencias")
async def listar_inconsistencias():
    """
    Verifica inconsistências nas parcelas disponíveis do ciclo 2026.
    Uma inconsistência é qualquer divergência entre total oficial e soma de componentes.
    """
    try:
        resultado = await buscar_pagamentos(
            co_municipio=IBGE,
            co_uf=CO_UF,
            parcela_inicio=PARCELA_INICIO_2026,
            parcela_fim=PARCELA_FIM_2026,
        )
    except EGestorAPIError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    inconsistencias = []
    for c in resultado["competencias"]:
        if not c["conciliado"]:
            inconsistencias.append(
                {
                    "nu_parcela": c["nu_parcela"],
                    "competencia": c["competencia"],
                    "total_oficial": c["total_oficial"],
                    "soma_componentes": c["soma_componentes"],
                    "divergencia": round(c["total_oficial"] - c["soma_componentes"], 2),
                }
            )

    return {
        "meta": _meta(),
        "coletado_em": resultado["coletado_em"],
        "total_competencias_verificadas": len(resultado["competencias"]),
        "total_inconsistencias": len(inconsistencias),
        "inconsistencias": inconsistencias,
    }
