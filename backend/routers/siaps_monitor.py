"""
Router: /api/siaps-monitor
Monitor de Status SIAPS por Competência — ERSUS 360

Fontes de dados REAIS:
  - siaps_service: busca dados do Componente Vínculo via API SIAPS gov.br
  - tabela extracoes: histórico de extrações já realizadas
  - tabela inconsistencias: inconsistências relacionadas ao SIAPS

REGRA: nenhum valor é inventado. Campos sem dado real recebem situacao_dado
adequada (nao_disponivel, dado_nao_validado). random() é PROIBIDO.
"""
from __future__ import annotations
import asyncio
import logging
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from routers.auth import get_current_user, UserOut
from services import siaps_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/siaps-monitor", tags=["Monitor SIAPS"])

# Competências monitoradas (mais recentes primeiro)
COMPETENCIAS = ["202605", "202604", "202603", "202602", "202601",
                "202512", "202511", "202510"]

_IBGE = "1300144"


def _ts() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


def _fmt_comp(c: str) -> str:
    """'202605' → '05/2026'"""
    return f"{c[4:]}/{c[:4]}"


# ── Busca dados de uma competência no SIAPS ───────────────────────────────────

async def _dados_competencia(competencia: str) -> dict:
    """
    Busca dados reais do SIAPS para uma competência.
    Retorna dict com metricas e situacao_dado.
    """
    try:
        dados = await siaps_service.buscar_vinculo(competencia)
        if dados is None:
            return {
                "competencia": competencia,
                "situacao_dado": "nao_disponivel",
                "fonte": "siaps_api",
                "total_vinculadas": None,
                "total_acompanhadas": None,
                "total_equipes": None,
                "nota": "API SIAPS não retornou dados para esta competência.",
            }

        # Extrai métricas do payload real
        metricas = dados.get("metricas") or dados
        return {
            "competencia": competencia,
            "situacao_dado": dados.get("situacao_dado", "dado_nao_validado"),
            "fonte": dados.get("fonte", "siaps_api"),
            "total_vinculadas":   metricas.get("total_vinculadas"),
            "total_acompanhadas": metricas.get("total_acompanhadas"),
            "total_equipes":      metricas.get("total_equipes"),
            "situacao_k":         metricas.get("situacao_k", "dado_nao_validado"),
            "situacao_h":         metricas.get("situacao_h", "dado_nao_validado"),
            "nota":               dados.get("nota_metodologica") or dados.get("nota") or "",
            "proveniencia":       dados.get("proveniencia"),
        }
    except Exception as exc:
        logger.warning("Erro ao buscar SIAPS competencia %s: %s", competencia, exc)
        return {
            "competencia": competencia,
            "situacao_dado": "nao_disponivel",
            "fonte": "siaps_api",
            "total_vinculadas": None,
            "total_acompanhadas": None,
            "total_equipes": None,
            "nota": f"Erro ao consultar API: {exc}",
        }


# ── Extracoes da tabela de histórico ─────────────────────────────────────────

async def _historico_extracoes(ibge: str, db: AsyncSession) -> list[dict]:
    try:
        from models.extracao import ExtracaoRegistro
        stmt = (
            select(ExtracaoRegistro)
            .where(ExtracaoRegistro.municipio_ibge == ibge)
            .where(ExtracaoRegistro.fonte_sistema.in_(["SIAPS", "SIAPS_VINCULO"]))
            .order_by(desc(ExtracaoRegistro.realizada_em))
            .limit(30)
        )
        rows = (await db.execute(stmt)).scalars().all()
        return [
            {
                "id": r.id,
                "competencia": r.competencia,
                "realizada_em": r.realizada_em.isoformat(),
                "sucesso": r.sucesso,
                "metodo": r.metodo,
                "registros": r.registros_obtidos,
                "observacao": r.observacao,
            }
            for r in rows
        ]
    except Exception as exc:
        logger.debug("Sem tabela extracoes ou erro: %s", exc)
        return []


# ── Inconsistências SIAPS ─────────────────────────────────────────────────────

async def _incons_siaps(ibge: str, db: AsyncSession) -> int:
    try:
        from models.inconsistencia import Inconsistencia
        n = (await db.execute(
            select(func.count())
            .where(Inconsistencia.municipio_ibge == ibge)
            .where(Inconsistencia.programa == "SIAPS")
            .where(Inconsistencia.situacao.in_(["identificada", "em_correcao"]))
        )).scalar_one()
        return n
    except Exception:
        return 0


# ── Status da conexão SIAPS ───────────────────────────────────────────────────

async def _status_conexao() -> str:
    from config import settings
    tem_creds = bool(
        (getattr(settings, "SIAPS_CPF", None) or "").strip() and
        (getattr(settings, "SIAPS_SENHA", None) or "").strip()
    ) or bool((getattr(settings, "SIAPS_TOKEN", None) or "").strip())

    if not tem_creds:
        return "sem_credenciais"

    autenticado = await siaps_service._autenticar()
    return "online" if autenticado else "degradado"


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/resumo")
async def resumo_siaps(
    ibge: str = Query(_IBGE, regex=r"^\d{7}$"),
    _: UserOut = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Resumo do status SIAPS: conexão, competência mais recente com dados,
    inconsistências abertas e histórico de extrações.
    """
    # Busca competência mais recente em paralelo com status da conexão
    comp_atual_task = _dados_competencia(COMPETENCIAS[0])
    status_task = _status_conexao()
    incons_task = _incons_siaps(ibge, db)
    hist_task   = _historico_extracoes(ibge, db)

    comp_atual, status_conn, n_incons, historico = await asyncio.gather(
        comp_atual_task, status_task, incons_task, hist_task
    )

    # Calcula quantas competências têm dados reais
    comp_com_dados = 1 if comp_atual.get("situacao_dado") not in (
        "nao_disponivel", "dado_nao_validado", None
    ) else 0

    return {
        "ibge": ibge,
        "competencia_atual": _fmt_comp(COMPETENCIAS[0]),
        "competencia_codigo": COMPETENCIAS[0],
        "status_conexao": status_conn,
        "competencias_monitoradas": len(COMPETENCIAS),
        "competencias_com_dados": comp_com_dados,
        "inconsistencias_abertas": n_incons,
        "ultima_extracao": historico[0] if historico else None,
        "total_extracoes_historico": len(historico),
        "situacao_dado_atual": comp_atual.get("situacao_dado", "nao_disponivel"),
        "vinculadas_atual": comp_atual.get("total_vinculadas"),
        "acompanhadas_atual": comp_atual.get("total_acompanhadas"),
        "verificado_em": _ts(),
    }


@router.get("/competencias")
async def competencias_siaps(
    ibge: str = Query(_IBGE, regex=r"^\d{7}$"),
    _: UserOut = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Lista todas as competências monitoradas com seus dados reais do SIAPS.
    Busca em paralelo para minimizar latência.
    """
    historico = await _historico_extracoes(ibge, db)
    hist_por_comp = {h["competencia"]: h for h in historico}

    # Busca até 4 competências em paralelo (mais recentes)
    recentes = COMPETENCIAS[:4]
    antigas   = COMPETENCIAS[4:]

    resultados_recentes = await asyncio.gather(*[_dados_competencia(c) for c in recentes])

    # Antigas: tenta buscar mas não espera muito
    resultados_antigas = []
    for c in antigas:
        # Verifica se já temos no histórico
        if c in hist_por_comp:
            h = hist_por_comp[c]
            resultados_antigas.append({
                "competencia": c,
                "situacao_dado": "oficial_validado" if h.get("sucesso") else "dado_nao_validado",
                "fonte": "historico_extracao",
                "total_vinculadas": h.get("registros"),
                "total_acompanhadas": None,
                "total_equipes": None,
                "nota": f"Dado do histórico de extrações — {h.get('realizada_em', '')[:10]}",
            })
        else:
            resultados_antigas.append({
                "competencia": c,
                "situacao_dado": "nao_disponivel",
                "fonte": "sem_dado",
                "total_vinculadas": None,
                "total_acompanhadas": None,
                "total_equipes": None,
                "nota": "Competência sem dado disponível no histórico.",
            })

    todos = list(resultados_recentes) + resultados_antigas

    return [
        {
            **r,
            "competencia_fmt": _fmt_comp(r["competencia"]),
            "tem_dado_real": r.get("situacao_dado") not in (
                "nao_disponivel", "dado_nao_validado", "sem_dado", None
            ),
            "extracao_historico": hist_por_comp.get(r["competencia"]),
        }
        for r in todos
    ]


@router.get("/historico-extracoes")
async def historico_extracoes_siaps(
    ibge: str = Query(_IBGE, regex=r"^\d{7}$"),
    _: UserOut = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lista o histórico de extrações SIAPS registradas no banco."""
    return await _historico_extracoes(ibge, db)
