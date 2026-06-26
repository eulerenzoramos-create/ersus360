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


def start_scheduler() -> None:
    """Registra e inicia o scheduler."""
    hora_str = settings.FNS_SYNC_HORA  # "06:00"
    try:
        hora, minuto = hora_str.split(":")
    except ValueError:
        hora, minuto = "6", "0"

    scheduler.add_job(
        _job_sync_fns,
        CronTrigger(hour=int(hora), minute=int(minuto), timezone="America/Manaus"),
        id="fns_daily_sync",
        replace_existing=True,
        misfire_grace_time=3600,  # tolera até 1h de atraso
    )
    scheduler.start()
    logger.info(
        "[Scheduler] Sync FNS agendado para %s:00 (America/Manaus) todos os dias",
        hora_str,
    )


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("[Scheduler] Scheduler encerrado.")
