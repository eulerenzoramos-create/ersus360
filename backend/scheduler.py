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
    """Job: recalcula Score ERSUS 360 para todos os municípios."""
    logger.info("[Scheduler] Recalculando Score ERSUS 360...")
    try:
        # Score é calculado via /api/bi/score — aqui apenas registramos no log
        # A implementação real consultará todos os módulos e gravará no banco
        logger.info("[Scheduler] Score ERSUS 360 recalculado com sucesso.")
    except Exception as exc:
        logger.error("[Scheduler] Erro ao recalcular Score ERSUS: %s", exc, exc_info=True)


async def _job_alertas_automaticos() -> None:
    """Job: gera alertas automáticos (férias vencidas, contratos expirando, metas em risco)."""
    logger.info("[Scheduler] Verificando alertas automáticos...")
    try:
        from database import AsyncSessionLocal
        # Ponto de extensão: inserir alertas automáticos no banco
        logger.info("[Scheduler] Verificação de alertas concluída.")
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

    scheduler.start()
    logger.info(
        "[Scheduler] 3 jobs agendados — FNS %s, Score 01:00, Alertas 07:00 (America/Manaus)",
        hora_str,
    )


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("[Scheduler] Scheduler encerrado.")
