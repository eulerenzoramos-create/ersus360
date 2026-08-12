"""
Router: /api/inconsistencias
Módulo central de rastreamento de inconsistências — ERSUS 360.

Regras de acesso (isolamento por município):
  - Assessoria: vê todas as inconsistências (pode filtrar por município)
  - Perfil municipal: vê apenas o próprio município
  - Qualquer autenticado pode criar inconsistência no próprio município
  - Atualização de situação: gestor do município ou assessoria
"""
from __future__ import annotations
import json
import logging
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from pydantic import BaseModel
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from routers.auth import CurrentUser, require_municipio_access

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/inconsistencias", tags=["Inconsistências"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class InconsistenciaIn(BaseModel):
    municipio_ibge: str
    competencia: str
    programa: str
    componente: str
    descricao: str
    cnes: str | None = None
    ine: str | None = None
    equipe_nome: str | None = None
    quantidade_afetada: int | None = None
    evidencia: str
    fontes_comparadas: list[str] | None = None
    link_evidencia: str | None = None
    causa_confirmada: str | None = None
    risco_assistencial: str | None = None
    risco_financeiro: float | None = None
    gravidade: str = "media"
    sistema_correcao: str | None = None
    procedimento: str | None = None
    responsavel: str | None = None
    prazo: str | None = None                     # ISO date string
    competencia_regularizacao: str | None = None


class SituacaoUpdate(BaseModel):
    situacao: str
    evidencia_resolucao: str | None = None
    link_resolucao: str | None = None


def _row_to_dict(inc) -> dict:
    return {
        "id": inc.id,
        "municipio_ibge": inc.municipio_ibge,
        "municipio_nome": inc.municipio_nome,
        "municipio_uf": inc.municipio_uf,
        "competencia": inc.competencia,
        "programa": inc.programa,
        "componente": inc.componente,
        "descricao": inc.descricao,
        "cnes": inc.cnes,
        "ine": inc.ine,
        "equipe_nome": inc.equipe_nome,
        "quantidade_afetada": inc.quantidade_afetada,
        "evidencia": inc.evidencia,
        "fontes_comparadas": json.loads(inc.fontes_comparadas) if inc.fontes_comparadas else [],
        "link_evidencia": inc.link_evidencia,
        "causa_confirmada": inc.causa_confirmada,
        "risco_assistencial": inc.risco_assistencial,
        "risco_financeiro": inc.risco_financeiro,
        "gravidade": inc.gravidade,
        "sistema_correcao": inc.sistema_correcao,
        "procedimento": inc.procedimento,
        "responsavel": inc.responsavel,
        "prazo": inc.prazo.date().isoformat() if inc.prazo else None,
        "competencia_regularizacao": inc.competencia_regularizacao,
        "evidencia_resolucao": inc.evidencia_resolucao,
        "link_resolucao": inc.link_resolucao,
        "resolvida_em": inc.resolvida_em.isoformat() if inc.resolvida_em else None,
        "situacao": inc.situacao,
        "criado_em": inc.criado_em.isoformat(),
        "atualizado_em": inc.atualizado_em.isoformat(),
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("")
async def listar_inconsistencias(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    municipio_ibge: str | None = Query(None, description="Filtrar por IBGE"),
    competencia: str | None = Query(None),
    situacao: str | None = Query(None),
    gravidade: str | None = Query(None),
    programa: str | None = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0),
):
    """Lista inconsistências. Municipal: só o próprio município."""
    from models.inconsistencia import Inconsistencia

    stmt = select(Inconsistencia).order_by(
        desc(Inconsistencia.gravidade),
        desc(Inconsistencia.criado_em),
    )

    # Isolamento municipal
    if not current_user.perfis_assessoria:
        if not current_user.municipio_ibge:
            raise HTTPException(403, "Sem município configurado")
        stmt = stmt.where(Inconsistencia.municipio_ibge == current_user.municipio_ibge)
    elif municipio_ibge:
        stmt = stmt.where(Inconsistencia.municipio_ibge == municipio_ibge)

    # Filtros opcionais
    if competencia:
        stmt = stmt.where(Inconsistencia.competencia == competencia)
    if situacao:
        stmt = stmt.where(Inconsistencia.situacao == situacao)
    if gravidade:
        stmt = stmt.where(Inconsistencia.gravidade == gravidade)
    if programa:
        stmt = stmt.where(Inconsistencia.programa.ilike(f"%{programa}%"))

    total_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(total_stmt)).scalar_one()

    stmt = stmt.limit(limit).offset(offset)
    rows = (await db.execute(stmt)).scalars().all()

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "inconsistencias": [_row_to_dict(r) for r in rows],
    }


@router.get("/resumo")
async def resumo_inconsistencias(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    municipio_ibge: str | None = Query(None),
):
    """Resumo por situação e gravidade para o painel."""
    from models.inconsistencia import Inconsistencia

    ibge = (
        municipio_ibge
        if current_user.perfis_assessoria
        else current_user.municipio_ibge
    )

    base = select(Inconsistencia)
    if ibge:
        base = base.where(Inconsistencia.municipio_ibge == ibge)

    # Por situação
    por_situacao_stmt = (
        select(Inconsistencia.situacao, func.count().label("n"))
        .select_from(base.subquery())
        .group_by(Inconsistencia.situacao)
    )
    por_situacao = {
        r.situacao: r.n
        for r in (await db.execute(por_situacao_stmt)).all()
    }

    # Por gravidade
    por_gravidade_stmt = (
        select(Inconsistencia.gravidade, func.count().label("n"))
        .select_from(base.subquery())
        .group_by(Inconsistencia.gravidade)
    )
    por_gravidade = {
        r.gravidade: r.n
        for r in (await db.execute(por_gravidade_stmt)).all()
    }

    total = sum(por_situacao.values())
    abertas = (
        por_situacao.get("identificada", 0)
        + por_situacao.get("em_correcao", 0)
    )
    criticas = por_gravidade.get("critica", 0)
    risco_financeiro_stmt = (
        select(func.sum(Inconsistencia.risco_financeiro))
        .select_from(base.subquery())
    )
    risco_total = (await db.execute(risco_financeiro_stmt)).scalar_one() or 0.0

    return {
        "municipio_ibge": ibge,
        "total": total,
        "abertas": abertas,
        "criticas": criticas,
        "risco_financeiro_total": risco_total,
        "por_situacao": por_situacao,
        "por_gravidade": por_gravidade,
    }


@router.get("/{inc_id}")
async def detalhe_inconsistencia(
    current_user: CurrentUser,
    inc_id: int = Path(...),
    db: AsyncSession = Depends(get_db),
):
    from models.inconsistencia import Inconsistencia

    inc = (await db.execute(
        select(Inconsistencia).where(Inconsistencia.id == inc_id)
    )).scalar_one_or_none()

    if not inc:
        raise HTTPException(404, "Inconsistência não encontrada")

    require_municipio_access(inc.municipio_ibge, current_user)
    return _row_to_dict(inc)


@router.post("", status_code=201)
async def criar_inconsistencia(
    current_user: CurrentUser,
    body: InconsistenciaIn,
    db: AsyncSession = Depends(get_db),
):
    """Registra nova inconsistência. Isolamento: município do corpo deve ser acessível."""
    require_municipio_access(body.municipio_ibge, current_user)

    from models.inconsistencia import Inconsistencia, GravidadeInconsistencia, SituacaoInconsistencia
    from models.municipio import Municipio

    # Busca nome/UF do município
    mun = (await db.execute(
        select(Municipio).where(Municipio.codigo_ibge == body.municipio_ibge)
    )).scalar_one_or_none()
    if not mun:
        raise HTTPException(404, f"Município IBGE {body.municipio_ibge} não cadastrado")

    prazo_dt = None
    if body.prazo:
        try:
            prazo_dt = datetime.fromisoformat(body.prazo)
        except ValueError:
            raise HTTPException(422, "prazo deve ser ISO date (YYYY-MM-DD)")

    try:
        grav = GravidadeInconsistencia(body.gravidade)
    except ValueError:
        raise HTTPException(422, f"gravidade inválida: {body.gravidade}")

    nova = Inconsistencia(
        municipio_ibge=body.municipio_ibge,
        municipio_nome=mun.nome,
        municipio_uf=mun.uf,
        competencia=body.competencia,
        programa=body.programa,
        componente=body.componente,
        descricao=body.descricao,
        cnes=body.cnes,
        ine=body.ine,
        equipe_nome=body.equipe_nome,
        quantidade_afetada=body.quantidade_afetada,
        evidencia=body.evidencia,
        fontes_comparadas=json.dumps(body.fontes_comparadas or []),
        link_evidencia=body.link_evidencia,
        causa_confirmada=body.causa_confirmada,
        risco_assistencial=body.risco_assistencial,
        risco_financeiro=body.risco_financeiro,
        gravidade=grav,
        sistema_correcao=body.sistema_correcao,
        procedimento=body.procedimento,
        responsavel=body.responsavel,
        prazo=prazo_dt,
        competencia_regularizacao=body.competencia_regularizacao,
        situacao=SituacaoInconsistencia.IDENTIFICADA,
        criado_por_id=None,
    )
    db.add(nova)
    await db.commit()
    await db.refresh(nova)
    return {"id": nova.id, "mensagem": "Inconsistência registrada", **_row_to_dict(nova)}


@router.patch("/{inc_id}/situacao")
async def atualizar_situacao(
    current_user: CurrentUser,
    inc_id: int = Path(...),
    body: SituacaoUpdate = ...,
    db: AsyncSession = Depends(get_db),
):
    """Atualiza situação da inconsistência."""
    from models.inconsistencia import Inconsistencia, SituacaoInconsistencia

    inc = (await db.execute(
        select(Inconsistencia).where(Inconsistencia.id == inc_id)
    )).scalar_one_or_none()
    if not inc:
        raise HTTPException(404, "Inconsistência não encontrada")

    require_municipio_access(inc.municipio_ibge, current_user)

    try:
        nova_situacao = SituacaoInconsistencia(body.situacao)
    except ValueError:
        raise HTTPException(422, f"situacao inválida: {body.situacao}")

    inc.situacao = nova_situacao
    inc.atualizado_em = datetime.utcnow()

    if body.evidencia_resolucao:
        inc.evidencia_resolucao = body.evidencia_resolucao
    if body.link_resolucao:
        inc.link_resolucao = body.link_resolucao
    if nova_situacao in (SituacaoInconsistencia.CORRIGIDA, SituacaoInconsistencia.ENCERRADA):
        inc.resolvida_em = datetime.utcnow()

    await db.commit()
    return {"id": inc_id, "situacao": nova_situacao, "mensagem": "Situação atualizada"}


@router.delete("/{inc_id}")
async def descartar_inconsistencia(
    current_user: CurrentUser,
    inc_id: int = Path(...),
    justificativa: str = Query(..., min_length=10),
    db: AsyncSession = Depends(get_db),
):
    """Marca como descartada com justificativa (não exclui fisicamente)."""
    from models.inconsistencia import Inconsistencia, SituacaoInconsistencia

    if current_user.role not in ("superadmin", "admin", "gestor", "assessor_tecnico"):
        raise HTTPException(403, "Sem permissão para descartar")

    inc = (await db.execute(
        select(Inconsistencia).where(Inconsistencia.id == inc_id)
    )).scalar_one_or_none()
    if not inc:
        raise HTTPException(404, "Inconsistência não encontrada")

    require_municipio_access(inc.municipio_ibge, current_user)

    inc.situacao = SituacaoInconsistencia.DESCARTADA
    inc.evidencia_resolucao = f"[DESCARTADA] {justificativa}"
    inc.atualizado_em = datetime.utcnow()
    await db.commit()
    return {"id": inc_id, "situacao": "descartada", "mensagem": "Inconsistência descartada"}
