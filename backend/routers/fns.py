"""
Router: /api/fns — Integração FNS / Ministério da Saúde

Endpoints:
  GET  /api/fns/status          → status do último sync
  GET  /api/fns/historico       → histórico de syncs
  POST /api/fns/sync            → sincroniza uma competência (preview ou gravar)
  POST /api/fns/sync-todos      → sincroniza últimas N competências
"""
from __future__ import annotations
from datetime import datetime, date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.fns import FnsSyncRequest, FnsSyncResult, FnsStatusOut
from services.fns_service import fns_preview, fns_sync
from models import Repasse, Alerta

router = APIRouter(prefix="/api/fns", tags=["FNS"])

DbDep = Annotated[AsyncSession, Depends(get_db)]


@router.get("/status", response_model=FnsStatusOut)
async def get_fns_status(db: DbDep, municipio_id: int = Query(1)):
    """Retorna status da última sincronização FNS."""
    # Último repasse de origem fns_sync
    stmt = (
        select(Repasse)
        .where(Repasse.origem == "fns_sync")
        .order_by(desc(Repasse.criado_em))
        .limit(1)
    )
    result = await db.execute(stmt)
    ultimo: Repasse | None = result.scalar_one_or_none()

    # Total de alertas FNS não resolvidos
    stmt_a = select(Alerta).where(
        Alerta.modulo == "FNS",
        Alerta.resolvido == False,  # noqa: E712
        Alerta.municipio_id == municipio_id,
    )
    res_a = await db.execute(stmt_a)
    alertas = res_a.scalars().all()

    return FnsStatusOut(
        ultimo_sync=ultimo.criado_em if ultimo else None,
        competencia=ultimo.competencia if ultimo else None,
        status="ok" if ultimo else "nunca_sincronizado",
        novos_repasses=sum(r.novos_repasses for r in [ultimo] if r) if ultimo else 0,
        erros=0,
    )


@router.get("/historico")
async def get_fns_historico(
    db: DbDep,
    municipio_id: int = Query(1),
    limit: int = Query(12, ge=1, le=60),
):
    """Retorna histórico de repasses importados via sync FNS."""
    stmt = (
        select(Repasse)
        .where(Repasse.origem == "fns_sync")
        .order_by(desc(Repasse.criado_em))
        .limit(limit)
    )
    result = await db.execute(stmt)
    repasses = result.scalars().all()
    return [
        {
            "id": r.id,
            "competencia": r.competencia,
            "mes": r.mes,
            "ano": r.ano,
            "valor_previsto": r.valor_previsto,
            "valor_realizado": r.valor_realizado,
            "novos_repasses": r.novos_repasses,
            "criado_em": r.criado_em,
        }
        for r in repasses
    ]


@router.post("/sync", response_model=FnsSyncResult)
async def sync_competencia(body: FnsSyncRequest, db: DbDep):
    """
    Sincroniza ou faz preview de uma competência FNS.

    - `modo="preview"` → busca dados sem gravar no banco
    - `modo="sync"`    → importa repasses e gera alertas
    """
    if body.mes < 1 or body.mes > 12:
        raise HTTPException(400, "Mês inválido (1–12)")
    if body.ano < 2020 or body.ano > date.today().year + 1:
        raise HTTPException(400, "Ano fora do intervalo permitido")

    if body.modo == "preview":
        itens = await fns_preview(body.mes, body.ano)
        return FnsSyncResult(
            status="preview",
            municipio_ibge="",
            competencia=f"{body.ano}-{body.mes:02d}",
            total_encontrados=len(itens),
            novos_inseridos=0,
            atualizados=0,
            alertas_gerados=0,
            itens=itens,
            mensagem="Preview gerado — nenhum dado foi gravado.",
            executado_em=datetime.utcnow(),
        )

    return await fns_sync(body.mes, body.ano, body.municipio_id, db)


@router.post("/sync-todos", response_model=list[FnsSyncResult])
async def sync_todos(
    db: DbDep,
    municipio_id: int = Query(1),
    ultimos_meses: int = Query(3, ge=1, le=12),
):
    """
    Sincroniza as últimas N competências de uma vez.
    Útil para inicialização ou recuperação após período offline.
    """
    hoje = date.today()
    resultados: list[FnsSyncResult] = []

    for i in range(ultimos_meses):
        mes = hoje.month - i
        ano = hoje.year
        if mes <= 0:
            mes += 12
            ano -= 1
        resultado = await fns_sync(mes, ano, municipio_id, db)
        resultados.append(resultado)

    return resultados
