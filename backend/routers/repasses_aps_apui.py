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
from services.egestor_fns_conferencia import conferir, creditos_fns_mes, meses_de_busca

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


async def _creditos_fns(nu_parcela: str) -> dict | None:
    """Créditos do FNS (consultafns, público) nos meses em que a parcela é paga.
    None quando o consultafns não responde — a tela mostra "FNS indisponível"."""
    from services.fns_parcelas import _buscar

    cnpj = "".join(ch for ch in CNPJ_FMS if ch.isdigit())
    meses = meses_de_busca(nu_parcela)
    if not meses:
        return {}
    try:
        res = await asyncio.wait_for(asyncio.gather(*[
            creditos_fns_mes(lambda a, m: _buscar(a, m, cnpj, UF, IBGE), IBGE, a, m)
            for a, m in meses
        ]), timeout=40)
    except Exception:  # noqa: BLE001 — fonte externa fora do ar não derruba a tela
        return None
    return dict(zip(meses, res))


def _resumo_pagamento(conf: dict) -> dict:
    return {k: conf.get(k) for k in (
        "situacao", "total_pago_fns", "diferenca", "datas_pagamento", "mes_pagamento_previsto")}


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/competencias")
async def listar_competencias(
    ano: int = Query(2026, ge=2020, le=2030, description="Ano do ciclo financeiro"),
):
    """
    Lista todas as competências (parcelas) do ciclo que a API de pagamento do e-Gestor
    APS já publica. A lista do portal (/data/parcelas) atrasa em relação à API de
    pagamento, por isso o ciclo inteiro (AAAA01–AAAA12) é consultado e cada parcela
    indica se já aparece no portal. As parcelas mais recentes são conferidas com o
    crédito do FNS da mesma parcela (pago / aguardando pagamento).
    """
    try:
        listadas = set(await listar_parcelas(ano=ano, co_uf=CO_UF))
    except Exception:  # noqa: BLE001
        listadas = set()

    try:
        resultado = await buscar_pagamentos(
            co_municipio=IBGE,
            co_uf=CO_UF,
            parcela_inicio=f"{ano}01",
            parcela_fim=f"{ano}12",
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

    comps = sorted(resultado["competencias"], key=lambda c: c["nu_parcela"])
    if not comps:
        raise HTTPException(
            status_code=404,
            detail={"erro": "Nenhuma parcela disponível para este ano."},
        )

    # Confere com o FNS as parcelas fora da lista do portal e a última listada
    ultima_listada = max(listadas) if listadas else None
    a_conferir = [c for c in comps
                  if c["nu_parcela"] not in listadas or c["nu_parcela"] == ultima_listada][-3:]
    creditos = await asyncio.gather(*[_creditos_fns(c["nu_parcela"]) for c in a_conferir])
    pagamento = {
        c["nu_parcela"]: _resumo_pagamento(conferir(c, cr))
        for c, cr in zip(a_conferir, creditos)
    }

    # Resumo por competência (sem detalhar componentes na listagem)
    resumo = []
    for c in comps:
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
                "listada_portal": (c["nu_parcela"] in listadas) if listadas else None,
                "pagamento_fns": pagamento.get(c["nu_parcela"]),
            }
        )

    aguardando = [r for r in resumo
                  if (r["pagamento_fns"] or {}).get("situacao") == "aguardando_pagamento_fns"]
    total_periodo = sum(c["total_oficial"] for c in comps)

    return {
        "meta": _meta(),
        "ano_ciclo": ano,
        "data_consulta_egestor": resultado["data_consulta"],
        "coletado_em": resultado["coletado_em"],
        "total_periodo": round(total_periodo, 2),
        # Total das parcelas já creditadas (exclui as que o FNS ainda não pagou)
        "total_pago": round(total_periodo - sum(r["total_oficial"] for r in aguardando), 2),
        "parcelas_aguardando_fns": [r["nu_parcela"] for r in aguardando],
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
    # Ciclo inteiro: a API de pagamento devolve só as parcelas já processadas
    # (a lista do portal /data/parcelas atrasa e escondia as parcelas recentes).
    try:
        resultado = await buscar_pagamentos(
            co_municipio=IBGE,
            co_uf=CO_UF,
            parcela_inicio=PARCELA_INICIO_2026,
            parcela_fim=PARCELA_FIM_2026,
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


@router.get("/conferencia-fns/{nu_parcela}")
async def conferencia_fns(nu_parcela: str):
    """
    Confere uma parcela do e-Gestor APS com o crédito do FNS da mesma parcela
    (campo "Comp./Parcela" do consultafns), componente a componente. Lista também
    créditos de APS do mês que pertencem a outra parcela/portaria, para fechar com
    o "Recebido FNS no período".
    """
    if len(nu_parcela) != 6 or not nu_parcela.isdigit():
        raise HTTPException(
            status_code=400,
            detail={"erro": "Formato inválido. Use YYYYPP (ex: 202611)."},
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
    if not resultado["competencias"]:
        raise HTTPException(
            status_code=404,
            detail={"erro": "Parcela ainda não publicada pelo e-Gestor APS.", "nu_parcela": nu_parcela},
        )
    return {
        "meta": _meta(),
        "coletado_em": _now_iso(),
        **conferir(resultado["competencias"][0], await _creditos_fns(nu_parcela)),
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
