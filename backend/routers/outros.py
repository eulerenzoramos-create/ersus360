"""Routers: Cronogramas · Indicadores · Alertas · Dashboard"""
from __future__ import annotations
from datetime import datetime
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Cronograma, Indicador, Alerta, Convenio, Repasse
from schemas.convenio import CronogramaCreate, CronogramaUpdate, CronogramaOut
from schemas.fns import IndicadorCreate, IndicadorUpdate, IndicadorOut, AlertaOut, DashboardStats

DbDep = Annotated[AsyncSession, Depends(get_db)]

# ─── Cronogramas ─────────────────────────────────────────────────────────────

cronogramas_router = APIRouter(prefix="/api/cronogramas", tags=["Cronogramas"])


@cronogramas_router.get("", response_model=list[CronogramaOut])
async def listar_cronogramas(
    db: DbDep,
    convenio_id: int | None = Query(None),
):
    stmt = select(Cronograma).order_by(Cronograma.id)
    if convenio_id:
        stmt = stmt.where(Cronograma.convenio_id == convenio_id)
    result = await db.execute(stmt)
    return result.scalars().all()


@cronogramas_router.post("", response_model=CronogramaOut, status_code=201)
async def criar_cronograma(body: CronogramaCreate, db: DbDep):
    cron = Cronograma(**body.model_dump())
    db.add(cron)
    await db.commit()
    await db.refresh(cron)
    return cron


@cronogramas_router.put("/{id}", response_model=CronogramaOut)
async def atualizar_cronograma(id: int, body: CronogramaUpdate, db: DbDep):
    result = await db.execute(select(Cronograma).where(Cronograma.id == id))
    cron = result.scalar_one_or_none()
    if not cron:
        raise HTTPException(404, "Cronograma não encontrado")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(cron, k, v)
    await db.commit()
    await db.refresh(cron)
    return cron


@cronogramas_router.delete("/{id}", status_code=204)
async def deletar_cronograma(id: int, db: DbDep):
    result = await db.execute(select(Cronograma).where(Cronograma.id == id))
    cron = result.scalar_one_or_none()
    if not cron:
        raise HTTPException(404)
    await db.delete(cron)
    await db.commit()


# ─── Indicadores ─────────────────────────────────────────────────────────────

indicadores_router = APIRouter(prefix="/api/indicadores", tags=["Indicadores"])


@indicadores_router.get("", response_model=list[IndicadorOut])
async def listar_indicadores(
    db: DbDep,
    municipio_id: int = Query(1),
    competencia: str | None = Query(None),
):
    stmt = (
        select(Indicador)
        .where(Indicador.municipio_id == municipio_id)
        .order_by(Indicador.id)
    )
    if competencia:
        stmt = stmt.where(Indicador.competencia == competencia)
    result = await db.execute(stmt)
    return result.scalars().all()


@indicadores_router.post("", response_model=IndicadorOut, status_code=201)
async def criar_indicador(body: IndicadorCreate, db: DbDep):
    ind = Indicador(**body.model_dump())
    db.add(ind)
    await db.commit()
    await db.refresh(ind)
    return ind


@indicadores_router.put("/{id}", response_model=IndicadorOut)
async def atualizar_indicador(id: int, body: IndicadorUpdate, db: DbDep):
    result = await db.execute(select(Indicador).where(Indicador.id == id))
    ind = result.scalar_one_or_none()
    if not ind:
        raise HTTPException(404, "Indicador não encontrado")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(ind, k, v)
    await db.commit()
    await db.refresh(ind)
    return ind


@indicadores_router.delete("/{id}", status_code=204)
async def deletar_indicador(id: int, db: DbDep):
    result = await db.execute(select(Indicador).where(Indicador.id == id))
    ind = result.scalar_one_or_none()
    if not ind:
        raise HTTPException(404)
    await db.delete(ind)
    await db.commit()


# ─── Alertas ─────────────────────────────────────────────────────────────────

alertas_router = APIRouter(prefix="/api/alertas", tags=["Alertas"])


@alertas_router.get("", response_model=list[AlertaOut])
async def listar_alertas(
    db: DbDep,
    municipio_id: int = Query(1),
    resolvido: bool = Query(False),
):
    stmt = (
        select(Alerta)
        .where(
            Alerta.municipio_id == municipio_id,
            Alerta.resolvido == resolvido,
        )
        .order_by(Alerta.criado_em.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@alertas_router.post("/{id}/resolver", response_model=AlertaOut)
async def resolver_alerta(id: int, db: DbDep):
    result = await db.execute(select(Alerta).where(Alerta.id == id))
    alerta = result.scalar_one_or_none()
    if not alerta:
        raise HTTPException(404, "Alerta não encontrado")
    alerta.resolvido = True
    alerta.resolvido_em = datetime.utcnow()
    await db.commit()
    await db.refresh(alerta)
    return alerta


@alertas_router.delete("/{id}", status_code=204)
async def deletar_alerta(id: int, db: DbDep):
    result = await db.execute(select(Alerta).where(Alerta.id == id))
    alerta = result.scalar_one_or_none()
    if not alerta:
        raise HTTPException(404)
    await db.delete(alerta)
    await db.commit()


# ─── Dashboard ───────────────────────────────────────────────────────────────

dashboard_router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@dashboard_router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: DbDep,
    municipio_id: int = Query(1),
):
    from models import Municipio
    mun_res = await db.execute(select(Municipio).where(Municipio.id == municipio_id))
    mun = mun_res.scalar_one_or_none()
    nome = mun.nome if mun else "Apuí"

    # Indicadores
    ind_res = await db.execute(
        select(Indicador).where(Indicador.municipio_id == municipio_id)
    )
    inds = ind_res.scalars().all()
    total_ind = len(inds)
    atingidos = sum(1 for i in inds if i.situacao == "Atingido")
    exec_media = (
        sum(i.valor_alcancado for i in inds) / total_ind if total_ind else 0
    )

    # Convênios
    conv_res = await db.execute(
        select(Convenio).where(Convenio.municipio_id == municipio_id)
    )
    convs = conv_res.scalars().all()
    total_conv = len(convs)
    vigentes = sum(1 for c in convs if c.situacao in ("Vigente", "Em Execução"))

    # Repasses
    rep_res = await db.execute(
        select(func.sum(Repasse.valor_realizado))
        .join(Convenio, Repasse.convenio_id == Convenio.id)
        .where(Convenio.municipio_id == municipio_id)
    )
    total_rep = rep_res.scalar() or 0.0

    # Alertas
    al_res = await db.execute(
        select(Alerta).where(
            Alerta.municipio_id == municipio_id,
            Alerta.resolvido == False,  # noqa: E712
        )
    )
    alertas = al_res.scalars().all()
    criticos = sum(1 for a in alertas if a.severidade == "critico")

    return DashboardStats(
        municipio_id=municipio_id,
        municipio_nome=nome,
        total_indicadores=total_ind,
        indicadores_atingidos=atingidos,
        execucao_media=round(exec_media, 1),
        total_repasses=round(total_rep, 2),
        convenios_vigentes=vigentes,
        total_convenios=total_conv,
        execucao_pas=round(exec_media, 1),
        alertas_ativos=len(alertas),
        alertas_criticos=criticos,
        atualizado_em=datetime.utcnow(),
    )
