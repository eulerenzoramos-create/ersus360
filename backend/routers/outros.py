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
from tenancy.escopo import MunicipioDaSessao, SessaoMunicipal, garantir_do_municipio

DbDep = Annotated[AsyncSession, Depends(get_db)]

# ─── Cronogramas ─────────────────────────────────────────────────────────────

cronogramas_router = APIRouter(prefix="/api/cronogramas", tags=["Cronogramas"])


async def _cronograma_da_sessao(db, current, id: int) -> Cronograma:
    result = await db.execute(
        select(Cronograma, Convenio.municipio_id)
        .join(Convenio, Cronograma.convenio_id == Convenio.id)
        .where(Cronograma.id == id)
    )
    row = result.first()
    if row is None:
        raise HTTPException(404, "Cronograma não encontrado")
    cron, dono = row
    cron.municipio_id = dono  # atributo transitório p/ checagem de propriedade
    return await garantir_do_municipio(db, current, cron, "cronogramas", id)


@cronogramas_router.get("", response_model=list[CronogramaOut])
async def listar_cronogramas(
    db: DbDep,
    municipio_id: MunicipioDaSessao,
    convenio_id: int | None = Query(None),
):
    stmt = (
        select(Cronograma)
        .join(Convenio, Cronograma.convenio_id == Convenio.id)
        .where(Convenio.municipio_id == municipio_id)
        .order_by(Cronograma.id)
    )
    if convenio_id:
        stmt = stmt.where(Cronograma.convenio_id == convenio_id)
    result = await db.execute(stmt)
    return result.scalars().all()


@cronogramas_router.post("", response_model=CronogramaOut, status_code=201)
async def criar_cronograma(body: CronogramaCreate, db: DbDep, current: SessaoMunicipal):
    conv = await db.get(Convenio, body.convenio_id)
    await garantir_do_municipio(db, current, conv, "convenios", body.convenio_id)
    cron = Cronograma(**body.model_dump())
    db.add(cron)
    await db.commit()
    await db.refresh(cron)
    return cron


@cronogramas_router.put("/{id}", response_model=CronogramaOut)
async def atualizar_cronograma(id: int, body: CronogramaUpdate, db: DbDep, current: SessaoMunicipal):
    cron = await _cronograma_da_sessao(db, current, id)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(cron, k, v)
    await db.commit()
    await db.refresh(cron)
    return cron


@cronogramas_router.delete("/{id}", status_code=204)
async def deletar_cronograma(id: int, db: DbDep, current: SessaoMunicipal):
    cron = await _cronograma_da_sessao(db, current, id)
    await db.delete(cron)
    await db.commit()


# ─── Indicadores ─────────────────────────────────────────────────────────────

indicadores_router = APIRouter(prefix="/api/indicadores", tags=["Indicadores"])


@indicadores_router.get("", response_model=list[IndicadorOut])
async def listar_indicadores(
    db: DbDep,
    municipio_id: MunicipioDaSessao,
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
async def criar_indicador(body: IndicadorCreate, db: DbDep, municipio_id: MunicipioDaSessao):
    ind = Indicador(**body.model_dump(), municipio_id=municipio_id)
    db.add(ind)
    await db.commit()
    await db.refresh(ind)
    return ind


@indicadores_router.put("/{id}", response_model=IndicadorOut)
async def atualizar_indicador(id: int, body: IndicadorUpdate, db: DbDep, current: SessaoMunicipal):
    ind = await garantir_do_municipio(db, current, await db.get(Indicador, id), "indicadores", id)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(ind, k, v)
    await db.commit()
    await db.refresh(ind)
    return ind


@indicadores_router.delete("/{id}", status_code=204)
async def deletar_indicador(id: int, db: DbDep, current: SessaoMunicipal):
    ind = await garantir_do_municipio(db, current, await db.get(Indicador, id), "indicadores", id)
    await db.delete(ind)
    await db.commit()


# ─── Alertas ─────────────────────────────────────────────────────────────────

alertas_router = APIRouter(prefix="/api/alertas", tags=["Alertas"])


@alertas_router.get("", response_model=list[AlertaOut])
async def listar_alertas(
    db: DbDep,
    municipio_id: MunicipioDaSessao,
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
async def resolver_alerta(id: int, db: DbDep, current: SessaoMunicipal):
    alerta = await garantir_do_municipio(db, current, await db.get(Alerta, id), "alertas", id)
    alerta.resolvido = True
    alerta.resolvido_em = datetime.utcnow()
    await db.commit()
    await db.refresh(alerta)
    return alerta


@alertas_router.delete("/{id}", status_code=204)
async def deletar_alerta(id: int, db: DbDep, current: SessaoMunicipal):
    alerta = await garantir_do_municipio(db, current, await db.get(Alerta, id), "alertas", id)
    await db.delete(alerta)
    await db.commit()


# ─── Dashboard ───────────────────────────────────────────────────────────────

async def _repasses_aps_ciclo() -> dict:
    """Total pago no ciclo corrente do financiamento APS ao município da sessão,
    direto da API pública do e-Gestor APS (mesma fonte do módulo Repasses APS).
    Cache de 1h por município; se a API não responder a tempo → indisponível."""
    import asyncio
    from services.cache_service import cache_get, cache_set
    from services.egestor_aps import buscar_pagamentos
    from tenancy.contexto import ibge6

    ano = datetime.utcnow().year
    chave = f"dashboard:repasses_aps:{ano}"
    em_cache = cache_get(chave)
    if em_cache is not None:
        return em_cache
    vazio = {"repasses_aps_total": None, "repasses_aps_parcelas": None,
             "repasses_aps_ciclo": ano, "repasses_aps_situacao": "nao_disponivel"}
    try:
        res = await asyncio.wait_for(
            buscar_pagamentos(co_municipio=ibge6(), co_uf=ibge6()[:2],
                              parcela_inicio=f"{ano}01", parcela_fim=f"{ano}12"),
            timeout=8,
        )
    except Exception:
        return vazio  # não guarda em cache: tenta de novo na próxima abertura
    comps = res.get("competencias") or []
    if not comps:
        cache_set(chave, vazio, ttl=3600)
        return vazio
    dados = {
        "repasses_aps_total": round(sum(c.get("total_oficial") or 0 for c in comps), 2),
        "repasses_aps_parcelas": len(comps),
        "repasses_aps_ciclo": ano,
        "repasses_aps_situacao": "oficial_validado",
    }
    cache_set(chave, dados, ttl=3600)
    return dados


dashboard_router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@dashboard_router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: DbDep,
    municipio_id: MunicipioDaSessao,
):
    from models import Municipio
    mun = await db.get(Municipio, municipio_id)
    nome = mun.nome if mun else ""

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
        **(await _repasses_aps_ciclo()),
    )
