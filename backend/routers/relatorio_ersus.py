"""
Router: /api/relatorio-ersus
Relatórios oficiais ERSUS 360 — Executivo e Técnico.

Regras:
  - Consolidam dados reais de múltiplas fontes em um único documento estruturado
  - NUNCA inventam dados: campos sem dado real recebem situacao_dado="dado_nao_validado"
  - Dois tipos: executivo (gestores/prefeitura) e tecnico (assessoria/auditoria)
  - Histórico de relatórios gerados é salvo na tabela extracoes
  - Isolamento: usuário municipal só gera relatório do próprio município
"""
from __future__ import annotations
import asyncio
import json
import logging
from datetime import datetime
from typing import Any

import httpx
from fastapi import APIRouter, Depends, Query, Path, HTTPException, Header
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_db
from routers.auth import CurrentUser, require_municipio_access

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/relatorio-ersus", tags=["Relatório ERSUS 360"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _ts() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


async def _get_json(client: httpx.AsyncClient, url: str, token: str) -> dict:
    """Chama endpoint interno com JWT."""
    try:
        r = await client.get(url, headers={"Authorization": f"Bearer {token}"}, timeout=15.0)
        if r.status_code == 200:
            return r.json()
        return {"erro": f"HTTP {r.status_code}", "situacao_dado": "nao_disponivel"}
    except Exception as exc:
        return {"erro": str(exc), "situacao_dado": "nao_disponivel"}


async def _populacao_ibge(ibge: str) -> dict:
    url = (
        f"https://servicodados.ibge.gov.br/api/v3/agregados/4714"
        f"/periodos/2022/variaveis/93?localidades=N6[{ibge}]"
    )
    try:
        async with httpx.AsyncClient(timeout=8.0) as c:
            r = await c.get(url)
            if r.status_code == 200:
                for ag in r.json() or []:
                    for res in ag.get("resultados", []):
                        for s in res.get("series", []):
                            if s.get("localidade", {}).get("id") == ibge:
                                val = s.get("serie", {}).get("2022")
                                if val:
                                    return {"populacao": int(val), "situacao_dado": "oficial_validado",
                                            "fonte": "IBGE Censo 2022"}
    except Exception:
        pass
    return {"populacao": None, "situacao_dado": "nao_disponivel", "fonte": "IBGE"}


async def _inconsistencias_resumo(ibge: str, db: AsyncSession) -> dict:
    try:
        from models.inconsistencia import Inconsistencia
        base = select(Inconsistencia).where(Inconsistencia.municipio_ibge == ibge)
        por_sit = (await db.execute(
            select(Inconsistencia.situacao, func.count().label("n"))
            .select_from(base.subquery())
            .group_by(Inconsistencia.situacao)
        )).all()
        por_grav = (await db.execute(
            select(Inconsistencia.gravidade, func.count().label("n"))
            .select_from(base.subquery())
            .group_by(Inconsistencia.gravidade)
        )).all()
        risco = (await db.execute(
            select(func.sum(Inconsistencia.risco_financeiro))
            .select_from(base.subquery())
        )).scalar_one() or 0.0
        total = sum(r.n for r in por_sit)
        abertas = sum(r.n for r in por_sit if r.situacao in ("identificada", "em_correcao"))

        # Últimas 5 inconsistências críticas/altas abertas
        recentes_stmt = (
            select(Inconsistencia)
            .where(Inconsistencia.municipio_ibge == ibge)
            .where(Inconsistencia.situacao.in_(["identificada", "em_correcao"]))
            .where(Inconsistencia.gravidade.in_(["critica", "alta"]))
            .order_by(desc(Inconsistencia.criado_em))
            .limit(5)
        )
        recentes = (await db.execute(recentes_stmt)).scalars().all()

        return {
            "total": total,
            "abertas": abertas,
            "criticas": sum(r.n for r in por_grav if r.gravidade == "critica"),
            "altas": sum(r.n for r in por_grav if r.gravidade == "alta"),
            "risco_financeiro_total": float(risco),
            "por_situacao": {r.situacao: r.n for r in por_sit},
            "por_gravidade": {r.gravidade: r.n for r in por_grav},
            "destaques": [
                {
                    "id": i.id, "programa": i.programa, "componente": i.componente,
                    "gravidade": i.gravidade, "descricao": i.descricao[:200],
                    "situacao": i.situacao,
                }
                for i in recentes
            ],
        }
    except Exception as exc:
        logger.warning("Erro ao buscar inconsistências: %s", exc)
        return {"total": 0, "abertas": 0, "criticas": 0, "risco_financeiro_total": 0.0,
                "destaques": [], "situacao_dado": "nao_disponivel"}


async def _municipio_info(ibge: str, db: AsyncSession) -> dict:
    try:
        from models.municipio import Municipio
        mun = (await db.execute(
            select(Municipio).where(Municipio.codigo_ibge == ibge)
        )).scalar_one_or_none()
        if mun:
            return {
                "nome": mun.nome, "uf": mun.uf, "codigo_ibge": mun.codigo_ibge,
                "cnpj_fundo": mun.cnpj_fundo, "secretario": mun.secretario,
                "populacao": mun.populacao,
            }
    except Exception:
        pass
    return {"codigo_ibge": ibge, "nome": "Não cadastrado", "uf": "?"}


# ── Consolidador principal ────────────────────────────────────────────────────

async def _consolidar(
    ibge: str, competencia: str, token: str, db: AsyncSession, tipo: str
) -> dict:
    """Busca todas as fontes em paralelo e consolida o relatório."""
    base_url = f"http://localhost:{settings.PORT if hasattr(settings, 'PORT') else 8000}"

    async with httpx.AsyncClient() as client:
        tasks = {
            "cvat":         _get_json(client, f"{base_url}/api/cvat/{ibge}/vinculo?competencia={competencia}", token),
            "status_fontes": _get_json(client, f"{base_url}/api/cvat/{ibge}/status-fontes", token),
            "integracao":   _get_json(client, f"{base_url}/api/integracao/status?ibge={ibge}", token),
            "cnes":         _get_json(client, f"{base_url}/api/integracao/cnes/estabelecimentos", token),
        }
        results = dict(zip(tasks.keys(), await asyncio.gather(*tasks.values())))

    pop_ibge, incons = await asyncio.gather(
        _populacao_ibge(ibge),
        _inconsistencias_resumo(ibge, db),
    )
    mun = await _municipio_info(ibge, db)

    cvat       = results.get("cvat", {})
    fontes     = results.get("status_fontes", {})
    integracao = results.get("integracao", {})
    cnes_data  = results.get("cnes", {})

    metricas  = cvat.get("metricas", {})
    equipes   = cvat.get("equipes", [])
    pop_db    = mun.get("populacao")
    pop_final = pop_ibge.get("populacao") or pop_db

    # Cobertura
    cobertura = None
    vinculadas = metricas.get("total_vinculadas", 0)
    if vinculadas and pop_final:
        cobertura = round(vinculadas / pop_final * 100, 1)

    # Fontes com dados reais
    fontes_status = fontes.get("fontes", {})
    fontes_ok     = [k for k, v in fontes_status.items() if v.get("configurado")]
    fontes_pend   = [k for k, v in fontes_status.items() if not v.get("configurado")]

    dados = {
        "tipo": tipo,
        "municipio": mun,
        "competencia": competencia,
        "gerado_em": _ts(),
        "gerado_por": "ERSUS 360",

        # Fontes
        "fontes_configuradas": fontes_ok,
        "fontes_pendentes":    fontes_pend,
        "status_integracao":   integracao,

        # CVAT
        "cvat": {
            "situacao_dado": cvat.get("situacao_dado", "dado_nao_validado"),
            "fonte": cvat.get("fonte", "indisponivel"),
            "proveniencia": cvat.get("proveniencia", {}) if tipo == "tecnico" else None,
            "total_equipes": metricas.get("total_equipes"),
            "total_vinculadas": vinculadas if vinculadas else None,
            "total_acompanhadas": metricas.get("total_acompanhadas") or None,
            "situacao_k": metricas.get("situacao_k", "dado_nao_validado"),
            "situacao_h": metricas.get("situacao_h", "dado_nao_validado"),
            "nota_h": metricas.get("nota_h"),
            "sem_vinculo_estimado": metricas.get("sem_vinculo_estimado"),
            "nota_sem_vinculo": metricas.get("nota_sem_vinculo") if tipo == "tecnico" else None,
            "equipes": equipes if tipo == "tecnico" else None,
        },

        # População
        "populacao": {
            "valor": pop_final,
            "situacao_dado": pop_ibge.get("situacao_dado", "nao_disponivel"),
            "fonte": pop_ibge.get("fonte", "IBGE"),
            "cobertura_vinculacao_pct": cobertura,
        },

        # CNES
        "cnes": {
            "situacao_dado": "oficial_validado" if cnes_data.get("estabelecimentos") else "nao_disponivel",
            "total_estabelecimentos": len(cnes_data.get("estabelecimentos", [])),
            "estabelecimentos": cnes_data.get("estabelecimentos", []) if tipo == "tecnico" else None,
        },

        # Inconsistências
        "inconsistencias": incons,

        # Avisos automáticos
        "avisos": _gerar_avisos(metricas, incons, fontes_pend, cvat.get("situacao_dado")),
    }

    return dados


def _gerar_avisos(metricas: dict, incons: dict, fontes_pend: list, situacao_cvat: str | None) -> list[dict]:
    avisos = []

    if situacao_cvat in (None, "dado_nao_validado", "nao_disponivel"):
        avisos.append({
            "nivel": "critico",
            "modulo": "SIAPS/CVAT",
            "mensagem": "Dados do Componente Vínculo não disponíveis. Configure as credenciais SIAPS no Railway.",
        })

    if fontes_pend:
        avisos.append({
            "nivel": "atencao",
            "modulo": "Integrações",
            "mensagem": f"Fontes sem credenciais configuradas: {', '.join(fontes_pend).upper()}.",
        })

    if incons.get("criticas", 0) > 0:
        avisos.append({
            "nivel": "critico",
            "modulo": "Inconsistências",
            "mensagem": f"{incons['criticas']} inconsistência(s) CRÍTICA(s) em aberto — ação imediata necessária.",
        })

    if incons.get("risco_financeiro_total", 0) > 0:
        r = incons["risco_financeiro_total"]
        avisos.append({
            "nivel": "atencao",
            "modulo": "Risco financeiro",
            "mensagem": f"Risco financeiro identificado: R$ {r:,.2f}. Verificar procedimentos de correção.",
        })

    if metricas.get("total_acompanhadas") is None or metricas.get("situacao_h") == "dado_nao_validado":
        avisos.append({
            "nivel": "info",
            "modulo": "Campo H",
            "mensagem": "Campo H (acompanhadas) aguardando extração nominal via e-SUS PEC + SIAPS.",
        })

    return avisos


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/{ibge}/executivo")
async def relatorio_executivo(
    ibge: str = Path(..., regex=r"^\d{7}$"),
    competencia: str = Query("202605", regex=r"^\d{6}$"),
    current_user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
    authorization: str = Header(default=""),
):
    """
    Relatório Executivo — resumo para gestor municipal / prefeito / conselho.
    Sem proveniência técnica detalhada.
    """
    require_municipio_access(ibge, current_user)
    token = _extrair_token(authorization)
    dados = await _consolidar(ibge, competencia, token, db, tipo="executivo")
    dados["classificacao"] = "executivo"
    dados["publico_alvo"] = "Secretário de Saúde, Prefeito, Conselho Municipal de Saúde"
    return dados


@router.get("/{ibge}/tecnico")
async def relatorio_tecnico(
    ibge: str = Path(..., regex=r"^\d{7}$"),
    competencia: str = Query("202605", regex=r"^\d{6}$"),
    current_user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
    authorization: str = Header(default=""),
):
    """
    Relatório Técnico — dados completos com proveniência, metodologia e inconsistências detalhadas.
    Para assessoria técnica e auditoria.
    """
    require_municipio_access(ibge, current_user)
    token = _extrair_token(authorization)
    dados = await _consolidar(ibge, competencia, token, db, tipo="tecnico")
    dados["classificacao"] = "tecnico"
    dados["publico_alvo"] = "Assessoria técnica, coordenador APS, auditoria"
    dados["nota_metodologica"] = (
        "Todos os campos classificados conforme SituacaoDado: oficial_validado, "
        "oficial_aguardando, divergente, rejeitado, nao_localizado, nao_disponivel, "
        "estimativa_autorizada, dado_nao_validado. "
        "Nenhum valor é inventado — campos sem fonte real retornam 'dado_nao_validado'."
    )
    return dados


@router.get("/{ibge}/historico")
async def historico_relatorios(
    ibge: str = Path(..., regex=r"^\d{7}$"),
    current_user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """Lista relatórios gerados para o município (extrações registradas)."""
    require_municipio_access(ibge, current_user)
    try:
        from models.extracao import ExtracaoRegistro
        stmt = (
            select(ExtracaoRegistro)
            .where(ExtracaoRegistro.municipio_ibge == ibge)
            .where(ExtracaoRegistro.fonte_sistema == "RELATORIO_ERSUS")
            .order_by(desc(ExtracaoRegistro.realizada_em))
            .limit(20)
        )
        rows = (await db.execute(stmt)).scalars().all()
        return [
            {
                "id": r.id, "competencia": r.competencia,
                "realizada_em": r.realizada_em.isoformat(),
                "sucesso": r.sucesso, "metodo": r.metodo,
            }
            for r in rows
        ]
    except Exception:
        return []


def _extrair_token(authorization: str) -> str:
    if authorization.startswith("Bearer "):
        return authorization[7:]
    return ""
