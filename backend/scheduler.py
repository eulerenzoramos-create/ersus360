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


async def _job_portarias_ms() -> None:
    """Job: busca portarias MS no DOU e envia e-mail diário."""
    logger.info("[Scheduler] Iniciando agente de portarias MS — DOU...")
    try:
        from services.portarias_dou_service import executar_envio_diario
        resultado = await executar_envio_diario()
        if resultado.get("ok"):
            logger.info("[Scheduler] Portarias MS enviadas — %d portarias", resultado.get("qtd_portarias", 0))
        else:
            logger.warning("[Scheduler] Portarias MS — falha: %s", resultado.get("erro") or resultado.get("motivo"))
    except Exception as exc:
        logger.error("[Scheduler] Erro no agente portarias MS: %s", exc, exc_info=True)


async def _job_monitor_scnes() -> None:
    """Job: envia relatório semanal SCNES/Sprint toda segunda às 07:00 (Manaus)."""
    logger.info("[Scheduler] Enviando relatório semanal SCNES/Sprint...")
    try:
        from services.monitor_scnes_service import enviar_relatorio_semanal
        resultado = await enviar_relatorio_semanal()
        if resultado.get("ok"):
            logger.info("[Scheduler] Monitor SCNES enviado para %s", resultado.get("destinatario"))
        else:
            logger.warning("[Scheduler] Monitor SCNES — falha: %s", resultado.get("erro") or resultado.get("motivo"))
    except Exception as exc:
        logger.error("[Scheduler] Erro no monitor SCNES: %s", exc, exc_info=True)


async def _job_diagnostico_cobertura() -> None:
    """Job: atualiza cache diário Diagnóstico/Cobertura eGestor às 05:00 (Manaus)."""
    logger.info("[Scheduler] Atualizando cache Diagnóstico/Cobertura eGestor...")
    try:
        from services.egestor_diagnostico_scraper import buscar_diagnostico_cobertura, _parcela_atual
        parcela = _parcela_atual()
        resultado = await buscar_diagnostico_cobertura(parcela, forcar_atualizacao=True)
        fonte = resultado.get("fonte", "?")
        logger.info("[Scheduler] Diagnóstico/Cobertura atualizado — fonte: %s", fonte)
    except Exception as exc:
        logger.error("[Scheduler] Erro no job Diagnóstico/Cobertura: %s", exc, exc_info=True)


async def _job_siaps_publico() -> None:
    """
    Job: atualiza o cache SIAPS (qualidade + vínculo) via API pública — sem credenciais.
    Roda dia 1 de cada mês às 03:00 e também sob demanda via /api/sync/extrair-historico.
    Popula /tmp/ersus_pec_cache/ com dados 2026Q1 e 2026Q2 (quando disponível).
    """
    logger.info("[Scheduler] Iniciando extração automática SIAPS público...")
    try:
        from routers.sync_historico import _job_extrator, COMPETENCIAS_2026
        await _job_extrator(COMPETENCIAS_2026, incluir_rnds=False)
        logger.info("[Scheduler] SIAPS público: extração automática concluída")
    except Exception as exc:
        logger.error("[Scheduler] Erro na extração SIAPS público: %s", exc, exc_info=True)


async def _job_egestor_incentivos() -> None:
    """
    Job: atualiza histórico de incentivos e-Gestor via API pública — toda domingo às 04:00.
    Consulta relatorioaps-prd.saude.gov.br e atualiza HISTORICO_INCENTIVOS em memória.
    """
    logger.info("[Scheduler] Atualizando histórico e-Gestor incentivos...")
    try:
        import httpx
        from services.egestor_diagnostico_scraper import HISTORICO_INCENTIVOS, IBGE_6, _MAPA_COMP

        url = "https://relatorioaps-prd.saude.gov.br/financiamento/pagamento"
        hdrs = {"Accept": "application/json", "Content-Type": "application/json",
                "User-Agent": "ERSUS360/2.0 FMS-Apui-AM"}
        async with httpx.AsyncClient(timeout=25, verify=False) as c:
            r = await c.get(url, params={"ibge": IBGE_6, "tipoRelatorio": "COMPLETO"}, headers=hdrs)
        if r.status_code != 200:
            logger.warning("[Scheduler] e-Gestor incentivos HTTP %d", r.status_code)
            return
        data = r.json()
        itens = data if isinstance(data, list) else data.get("content") or data.get("data") or []
        if not itens:
            logger.warning("[Scheduler] e-Gestor incentivos: resposta vazia")
            return

        # Mapeia parcelas recebidas → atualiza ou insere no HISTORICO_INCENTIVOS
        codigos_existentes = {h["parcela_code"] for h in HISTORICO_INCENTIVOS}
        atualizados = inseridos = 0
        for item in itens:
            # Formato API: {"nuCompetencia": "202609", "vlTotalCalculado": 641500.00, ...}
            comp = str(item.get("nuCompetencia") or item.get("competencia") or "")
            total_raw = item.get("vlTotalCalculado") or item.get("vlTotal") or item.get("total")
            if not comp or total_raw is None:
                continue
            try:
                total = float(total_raw)
            except (TypeError, ValueError):
                continue
            parcela_num = int(comp[4:]) if len(comp) >= 6 else 0
            parcela_str = f"{parcela_num}/12" if parcela_num else "?"
            competencia_label = _MAPA_COMP.get(comp, comp)
            if comp in codigos_existentes:
                for h in HISTORICO_INCENTIVOS:
                    if h["parcela_code"] == comp:
                        h["total"] = total
                        h["competencia"] = competencia_label
                        atualizados += 1
                        break
            else:
                HISTORICO_INCENTIVOS.append({
                    "parcela_code": comp,
                    "competencia": competencia_label,
                    "parcela": parcela_str,
                    "total": total,
                })
                inseridos += 1
        # Ordena por parcela_code
        HISTORICO_INCENTIVOS.sort(key=lambda h: h["parcela_code"])
        logger.info(
            "[Scheduler] e-Gestor incentivos: %d atualizados, %d inseridos — total %d parcelas",
            atualizados, inseridos, len(HISTORICO_INCENTIVOS),
        )
    except Exception as exc:
        logger.error("[Scheduler] Erro no job e-Gestor incentivos: %s", exc, exc_info=True)


async def _job_cvat_equipes() -> None:
    """
    Job: atualiza vinculadas CVAT por equipe via API pública SIAPS — toda segunda às 04:30.
    Atualiza _EQUIPES.vinculadas em monitor_scnes_service sem alterar scores (SCNES autenticado).
    """
    logger.info("[Scheduler] Atualizando vinculadas CVAT por equipe (SIAPS público)...")
    try:
        import httpx
        from services.monitor_scnes_service import _EQUIPES

        url = "https://apisiaps.saude.gov.br/api/public/componente/indicador-quadrimestre/filtro"
        hdrs = {"Accept": "application/json", "Content-Type": "application/json",
                "User-Agent": "ERSUS360/2.0"}

        # Quadrimestre atual (2026Q1=Jan-Abr, 2026Q2=Mai-Ago, 2026Q3=Set-Dez)
        from datetime import date as _d
        mes = _d.today().month
        quad = f"2026Q{(mes - 1) // 4 + 1}"

        async with httpx.AsyncClient(timeout=20, verify=False) as c:
            r = await c.post(url,
                             json={"coMunicipioIbge": ["130014"], "nuQuadrimestre": [quad]},
                             headers=hdrs)
        if r.status_code != 200:
            logger.warning("[Scheduler] CVAT SIAPS HTTP %d", r.status_code)
            return
        data = r.json()
        items = data if isinstance(data, list) else data.get("content") or []
        if not items:
            logger.info("[Scheduler] CVAT: sem dados para %s", quad)
            return

        # Tenta extrair total de vinculadas por nome de equipe
        total_novo = 0
        for item in items:
            nome_raw = (
                item.get("nomeEquipe") or item.get("nome") or
                item.get("ds_equipe") or item.get("nmEquipe") or ""
            ).upper().strip()
            vinc = item.get("qtVinculadas") or item.get("vinculadas") or item.get("qt_vinculadas")
            if nome_raw and vinc is not None:
                try:
                    v = int(vinc)
                except (TypeError, ValueError):
                    continue
                for eq in _EQUIPES:
                    if eq["nome"] in nome_raw or nome_raw in eq["nome"]:
                        eq["vinculadas"] = v
                        total_novo += v
                        break
        if total_novo:
            logger.info("[Scheduler] CVAT atualizado: total %d vinculadas (%s)", total_novo, quad)
        else:
            logger.info("[Scheduler] CVAT: estrutura de resposta sem campo vinculadas — mantidos valores anteriores")
    except Exception as exc:
        logger.error("[Scheduler] Erro no job CVAT equipes: %s", exc, exc_info=True)


async def seed_siaps_cache_se_vazio() -> None:
    """
    Chamado no startup do FastAPI: popula cache SIAPS imediatamente se estiver vazio.
    Usa a API pública SIAPS (sem credenciais). Roda uma única vez em background.
    """
    try:
        from pathlib import Path as _P
        cache_dir = _P("/tmp/ersus_pec_cache")
        arquivos = list(cache_dir.glob("indicadores_*.json")) if cache_dir.exists() else []
        if arquivos:
            logger.info("[Startup] SIAPS cache já tem %d arquivo(s) — seed ignorado", len(arquivos))
            return
        logger.info("[Startup] SIAPS cache vazio — iniciando seed automático via API pública...")
        from routers.sync_historico import _job_extrator, COMPETENCIAS_2026
        await _job_extrator(COMPETENCIAS_2026, incluir_rnds=False)
        logger.info("[Startup] SIAPS cache seed concluído")
    except Exception as exc:
        logger.error("[Startup] Erro no seed SIAPS cache: %s", exc, exc_info=True)


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

    # Job 5: Agente de Portarias MS — envio diário 06:00 (America/Manaus)
    import os as _os
    _email_hora = _os.getenv("EMAIL_SEND_HOUR", "06:00")
    try:
        _eh, _em = map(int, _email_hora.split(":"))
    except ValueError:
        _eh, _em = 6, 0
    scheduler.add_job(
        _job_portarias_ms,
        CronTrigger(hour=_eh, minute=_em, timezone="America/Manaus"),
        id="portarias_ms_email",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    # Job 6: Monitor SCNES/Sprint — toda segunda-feira às 07:00 (America/Manaus)
    scheduler.add_job(
        _job_monitor_scnes,
        CronTrigger(day_of_week="mon", hour=7, minute=0, timezone="America/Manaus"),
        id="monitor_scnes_semanal",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    # Job 7: Diagnóstico/Cobertura eGestor — atualização diária às 05:00 (America/Manaus)
    scheduler.add_job(
        _job_diagnostico_cobertura,
        CronTrigger(hour=5, minute=0, timezone="America/Manaus"),
        id="diagnostico_cobertura_daily",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    # Job 8: SIAPS público — extração mensal (dia 1 às 03:00) e também no 16 (quinzenal)
    for dia in [1, 16]:
        scheduler.add_job(
            _job_siaps_publico,
            CronTrigger(day=dia, hour=3, minute=0, timezone="America/Manaus"),
            id=f"siaps_publico_mensal_{dia}",
            replace_existing=True,
            misfire_grace_time=7200,
        )

    # Job 9: e-Gestor histórico de incentivos — toda domingo às 04:00
    scheduler.add_job(
        _job_egestor_incentivos,
        CronTrigger(day_of_week="sun", hour=4, minute=0, timezone="America/Manaus"),
        id="egestor_incentivos_semanal",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    # Job 10: CVAT vinculadas por equipe — toda segunda às 04:30 (junto com Monitor SCNES)
    scheduler.add_job(
        _job_cvat_equipes,
        CronTrigger(day_of_week="mon", hour=4, minute=30, timezone="America/Manaus"),
        id="cvat_equipes_semanal",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    scheduler.start()
    logger.info(
        "[Scheduler] 10 jobs agendados — FNS %s, Score 01:00, DiagCobertura 05:00, Alertas 07:00, "
        "Portarias MS %s, Monitor SCNES seg 07:00, SIAPS público dia 1+16 às 03:00, "
        "e-Gestor incentivos dom 04:00, CVAT equipes seg 04:30 (America/Manaus)",
        hora_str, _email_hora,
    )


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("[Scheduler] Scheduler encerrado.")
