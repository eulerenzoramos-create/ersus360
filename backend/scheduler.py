"""
Scheduler ERSUS 360 — Sync FNS automático diário
Usa APScheduler com AsyncIOScheduler.
Dispara todo dia às FNS_SYNC_HORA (default 06:00).
"""
from __future__ import annotations
import logging
from datetime import date

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from config import settings

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler(timezone="America/Manaus")


async def _job_sync_fns() -> None:
    """Job: sincroniza o mês atual com o FNS."""
    from database import AsyncSessionLocal
    from services.fns_service import fns_sync

    hoje = date.today()
    logger.info("[Scheduler] Iniciando sync FNS — %s/%s", hoje.month, hoje.year)

    async with AsyncSessionLocal() as db:
        try:
            result = await fns_sync(hoje.month, hoje.year, municipio_id=1, db=db)
            logger.info(
                "[Scheduler] Sync FNS concluído: %s novos, %s atualizados, %s alertas",
                result.novos_inseridos,
                result.atualizados,
                result.alertas_gerados,
            )
        except Exception as exc:
            logger.error("[Scheduler] Erro no sync FNS: %s", exc, exc_info=True)


async def _job_score_ersus() -> None:
    """Job: recalcula Score ERSUS 360 e envia alerta WebSocket se score crítico."""
    logger.info("[Scheduler] Recalculando Score ERSUS 360...")
    try:
        from routers.score import calcular_score_completo
        from routers.ws_alertas import manager

        data = calcular_score_completo()
        score = data["score_total"]
        nivel = data["nivel"]
        logger.info("[Scheduler] Score ERSUS 360 = %.1f (%s)", score, nivel)

        # Broadcast WebSocket se score crítico ou baixo
        if score < 50:
            await manager.broadcast({
                "nivel": "CRITICO",
                "titulo": f"Score ERSUS 360 crítico: {score:.1f}/100",
                "mensagem": f"Situação {nivel}. Verifique os eixos APS, Financeiro e Epidemiologia.",
                "modulo": "Score ERSUS",
            })
        elif score < 65:
            await manager.broadcast({
                "nivel": "AVISO",
                "titulo": f"Score ERSUS 360: {score:.1f}/100 ({nivel})",
                "mensagem": "Melhore a execução financeira e cobertura do Novo Financiamento APS.",
                "modulo": "Score ERSUS",
            })
    except Exception as exc:
        logger.error("[Scheduler] Erro ao recalcular Score ERSUS: %s", exc, exc_info=True)


async def _job_sync_consultafns() -> None:
    """Job: sincroniza repasses FNS Fundo a Fundo via consultafns.saude.gov.br — 3x ao dia."""
    from database import AsyncSessionLocal
    from services.consultafns_service import buscar_repasses_fns
    from models.repasse_fns import RepasseFNS
    from sqlalchemy import select
    from datetime import datetime as dt

    logger.info("[Scheduler] Iniciando sync consultafns.saude.gov.br...")
    async with AsyncSessionLocal() as db:
        try:
            resultado = await buscar_repasses_fns(ano=2026)
            if not resultado["ok"]:
                logger.warning("[Scheduler] consultafns sem dados: %s", resultado.get("erros"))
                return
            agora = dt.utcnow()
            inseridos = atualizados = 0
            for item in resultado["repasses"]:
                res = await db.execute(select(RepasseFNS).where(RepasseFNS.id == item["id"]))
                ex  = res.scalar_one_or_none()
                if ex:
                    if ex.fonte != "manual":
                        for k, v in item.items():
                            if k != "id": setattr(ex, k, v)
                        ex.sincronizado_em = agora
                        atualizados += 1
                else:
                    db.add(RepasseFNS(sincronizado_em=agora, **item))
                    inseridos += 1
            await db.commit()
            logger.info("[Scheduler] consultafns sync: %d novos, %d atualizados", inseridos, atualizados)
        except Exception as exc:
            logger.error("[Scheduler] Erro sync consultafns: %s", exc, exc_info=True)


async def _job_alertas_automaticos() -> None:
    """Job: gera alertas WebSocket a partir de prazos urgentes da Agenda e outras fontes."""
    logger.info("[Scheduler] Verificando alertas automáticos...")
    try:
        from datetime import timedelta
        from routers.agenda import _OBRIGACOES
        from routers.ws_alertas import manager

        hoje = date.today()
        alertas: list[dict] = []

        for ev in _OBRIGACOES:
            if ev["status"] == "concluido":
                continue
            d = date.fromisoformat(ev["data"])
            delta = (d - hoje).days
            if delta < 0:
                alertas.append({
                    "nivel": "CRITICO",
                    "titulo": f"Prazo VENCIDO: {ev['titulo']}",
                    "mensagem": f"Venceu há {abs(delta)} dia(s). Responsável: {ev['responsavel']}.",
                    "modulo": "Agenda",
                })
            elif delta <= 7 and ev["prioridade"] == "alta":
                alertas.append({
                    "nivel": "AVISO",
                    "titulo": f"Prazo urgente: {ev['titulo']}",
                    "mensagem": f"Vence em {delta} dia(s). Responsável: {ev['responsavel']}.",
                    "modulo": "Agenda",
                })

        for alerta in alertas:
            await manager.broadcast(alerta)
            logger.info("[Scheduler] Alerta agenda enviado: %s", alerta["titulo"])

        logger.info("[Scheduler] %s alertas de agenda gerados.", len(alertas))
    except Exception as exc:
        logger.error("[Scheduler] Erro nos alertas automáticos: %s", exc, exc_info=True)


def start_scheduler() -> None:
    """Registra e inicia o scheduler."""
    hora_str = settings.FNS_SYNC_HORA  # "06:00"
    try:
        hora, minuto = hora_str.split(":")
    except ValueError:
        hora, minuto = "6", "0"

    # Job 1: Sync FNS diário (06:00)
    scheduler.add_job(
        _job_sync_fns,
        CronTrigger(hour=int(hora), minute=int(minuto), timezone="America/Manaus"),
        id="fns_daily_sync",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    # Job 2: Recálculo Score ERSUS 360 (01:00)
    scheduler.add_job(
        _job_score_ersus,
        CronTrigger(hour=1, minute=0, timezone="America/Manaus"),
        id="score_ersus_daily",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    # Job 3: Alertas automáticos (07:00 — antes do expediente)
    scheduler.add_job(
        _job_alertas_automaticos,
        CronTrigger(hour=7, minute=0, timezone="America/Manaus"),
        id="alertas_automaticos",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    # Job 4: Sync consultafns.saude.gov.br — 3x ao dia (08:00, 13:00, 18:00)
    for h in [8, 13, 18]:
        scheduler.add_job(
            _job_sync_consultafns,
            CronTrigger(hour=h, minute=0, timezone="America/Manaus"),
            id=f"consultafns_sync_{h}h",
            replace_existing=True,
            misfire_grace_time=3600,
        )

    scheduler.start()
    logger.info(
        "[Scheduler] 3 jobs agendados — FNS %s, Score 01:00, Alertas 07:00 (America/Manaus)",
        hora_str,
    )


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("[Scheduler] Scheduler encerrado.")
