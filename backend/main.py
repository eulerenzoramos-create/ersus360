"""
ERSUS 360 — FastAPI Main
FMS Apuí / AM · Gestão Inteligente do SUS
"""
from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from database import init_db

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────────
    logger.info("🚀 ERSUS 360 iniciando — %s/%s", settings.MUNICIPIO_NOME, settings.MUNICIPIO_UF)
    try:
        await init_db()
        await _seed_dados_iniciais()
    except Exception as exc:
        logger.error("Erro na inicialização do banco: %s", exc, exc_info=True)

    try:
        from scheduler import start_scheduler
        start_scheduler()
    except Exception as exc:
        logger.error("Erro ao iniciar scheduler: %s", exc, exc_info=True)

    yield

    # ── Shutdown ─────────────────────────────────────────────────
    from scheduler import stop_scheduler
    stop_scheduler()
    logger.info("ERSUS 360 encerrado.")


app = FastAPI(
    title="ERSUS 360 API",
    description="Gestão Inteligente do SUS — FMS Apuí/AM",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
from routers.auth import router as auth_router
from routers.fns import router as fns_router
from routers.convenios import router as convenios_router
from routers.repasses import router as repasses_router
from routers.aps import router as aps_router
from routers.farmacia import router as farmacia_router
from routers.planejamento import router as planejamento_router
from routers.ia import router as ia_router
from routers.municipio import router as municipio_router
from routers.portarias import router as portarias_router
from routers.execucao import router as execucao_router
from routers.obras import router as obras_router
from routers.usuarios import router as usuarios_router
from routers.documentos import router as documentos_router
from routers.relatorios import router as relatorios_router
from routers.emendas import router as emendas_router
from routers.outros import (
    cronogramas_router,
    indicadores_router,
    alertas_router,
    dashboard_router,
)
from routers.modulos import (
    vigilancia_router,
    transporte_router,
    regulacao_router,
)
from routers.integracao import router as integracao_router
from routers.auditoria import router as auditoria_router
from routers.cadastros import router as cadastros_router
from routers.rh import router as rh_router
from routers.bi import router as bi_router
from routers.ocis import router as ocis_router
from routers.patrimonio import router as patrimonio_router
from routers.portais import router as portais_router
from routers.ws_alertas import router as ws_router
from routers.previne import router as previne_router
from routers.epidemiologia import router as epidemiologia_router
from routers.siops import router as siops_router
from routers.agenda import router as agenda_router
from routers.rdqa import router as rdqa_router
from routers.score import router as score_router
from routers.conformidade import router as conformidade_router
from routers.acs import router as acs_router
from routers.ws_acs import router as ws_acs_router
from routers.financeiro import router as financeiro_router

app.include_router(auth_router)
app.include_router(municipio_router)
app.include_router(fns_router)
app.include_router(convenios_router)
app.include_router(repasses_router)
app.include_router(execucao_router)
app.include_router(portarias_router)
app.include_router(obras_router)
app.include_router(usuarios_router)
app.include_router(documentos_router)
app.include_router(relatorios_router)
app.include_router(aps_router)
app.include_router(farmacia_router)
app.include_router(planejamento_router)
app.include_router(ia_router)
app.include_router(cronogramas_router)
app.include_router(indicadores_router)
app.include_router(alertas_router)
app.include_router(dashboard_router)
app.include_router(vigilancia_router)
app.include_router(transporte_router)
app.include_router(regulacao_router)
app.include_router(emendas_router)
app.include_router(integracao_router)
app.include_router(auditoria_router)
app.include_router(cadastros_router)
app.include_router(rh_router)
app.include_router(bi_router)
app.include_router(ocis_router)
app.include_router(patrimonio_router)
app.include_router(portais_router)
app.include_router(ws_router)
app.include_router(previne_router)
app.include_router(epidemiologia_router)
app.include_router(siops_router)
app.include_router(agenda_router)
app.include_router(rdqa_router)
app.include_router(score_router)
app.include_router(conformidade_router)
app.include_router(acs_router)
app.include_router(ws_acs_router)
app.include_router(financeiro_router)


@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "municipio": f"{settings.MUNICIPIO_NOME}/{settings.MUNICIPIO_UF}",
        "status": "online",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    from datetime import datetime
    from database import AsyncSessionLocal
    from sqlalchemy import text
    db_ok = False
    try:
        async with AsyncSessionLocal() as db:
            await db.execute(text("SELECT 1"))
            db_ok = True
    except Exception:
        pass
    return JSONResponse({
        "status": "ok" if db_ok else "degraded",
        "version": "1.0.0",
        "municipio": f"{settings.MUNICIPIO_NOME}/{settings.MUNICIPIO_UF}",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "services": {
            "database": "ok" if db_ok else "error",
            "scheduler": "ok",
            "ws": "ok",
        },
    })


@app.get("/api/sistema/info")
async def sistema_info():
    """Informações públicas do sistema para o frontend."""
    return {
        "app": "ERSUS 360",
        "versao": "1.0.0",
        "municipio": settings.MUNICIPIO_NOME,
        "uf": settings.MUNICIPIO_UF,
        "ibge": settings.FNS_MUNICIPIO_IBGE,
        "modulos": [
            "FNS/Convênios", "Previne Brasil", "APS", "Farmácia",
            "Vigilância", "RH", "Obras", "Patrimônio",
            "BI", "OCIS", "Portais", "Marketplace",
        ],
        "fns_sync_hora": settings.FNS_SYNC_HORA,
    }


# ── Seed de dados iniciais ───────────────────────────────────────────────────

async def _seed_dados_iniciais():
    """Insere município e dados de exemplo se o banco estiver vazio."""
    from database import AsyncSessionLocal
    from sqlalchemy import select
    from models import Municipio, BlocoPacto, Indicador, Convenio
    from models.convenio import SituacaoConvenio
    from models.indicador import SituacaoIndicador

    async with AsyncSessionLocal() as db:
        # Município
        res = await db.execute(select(Municipio).where(Municipio.codigo_ibge == "1300144"))
        mun = res.scalar_one_or_none()
        if not mun:
            mun = Municipio(nome="Apuí", uf="AM", codigo_ibge="1300144")
            db.add(mun)
            await db.flush()
            logger.info("Município Apuí/AM criado (id=%s)", mun.id)

        # Blocos de pacto
        blocos_nomes = [
            "Atenção Básica", "MAC", "Vigilância em Saúde",
            "Farmácia", "Custeio e investimento",
        ]
        for nome in blocos_nomes:
            res = await db.execute(select(BlocoPacto).where(BlocoPacto.nome == nome))
            if not res.scalar_one_or_none():
                db.add(BlocoPacto(nome=nome))

        await db.flush()

        # Indicadores PAS de exemplo (se não houver)
        res = await db.execute(select(Indicador).where(Indicador.municipio_id == mun.id))
        if not res.scalars().first():
            indicadores_seed = [
                ("Proporção de parto normal", "Saúde da Mulher", 95.0, SituacaoIndicador.ATINGIDO),
                ("Cobertura vacinal BCG", "Imunização", 92.0, SituacaoIndicador.ATINGIDO),
                ("Pré-natal 7+ consultas", "Saúde da Mulher", 85.0, SituacaoIndicador.ATINGIDO),
                ("Razão de exames citopatológicos", "Saúde da Mulher", 80.0, SituacaoIndicador.ATINGIDO),
                ("Cobertura da Estratégia de Saúde da Família", "APS", 68.0, SituacaoIndicador.EM_ANDAMENTO),
                ("Acompanhamento ICSAP", "APS", 63.0, SituacaoIndicador.EM_ANDAMENTO),
                ("Execução financeira MAC", "Financeiro", 41.0, SituacaoIndicador.NAO_ATINGIDO),
                ("Dispensação Farmácia Popular", "Farmácia", 28.0, SituacaoIndicador.NAO_ATINGIDO),
            ]
            for nome, eixo, valor, sit in indicadores_seed:
                db.add(Indicador(
                    municipio_id=mun.id,
                    indicador=nome,
                    eixo=eixo,
                    meta_prevista=100.0,
                    valor_alcancado=valor,
                    situacao=sit,
                    competencia="2026-06",
                ))

        # Convênios de exemplo
        res = await db.execute(select(Convenio).where(Convenio.municipio_id == mun.id))
        if not res.scalars().first():
            convs_seed = [
                ("793456/2024", "Atenção Básica — PAB Variável", SituacaoConvenio.VIGENTE, 890_000),
                ("793457/2024", "Média e Alta Complexidade — MAC", SituacaoConvenio.VIGENTE, 480_000),
                ("793458/2024", "Vigilância em Saúde", SituacaoConvenio.VIGENTE, 320_000),
                ("793459/2024", "Assistência Farmacêutica Básica", SituacaoConvenio.EM_EXECUCAO, 610_000),
            ]
            for num, obj, sit, valor in convs_seed:
                db.add(Convenio(
                    municipio_id=mun.id,
                    numero=num,
                    objeto=obj,
                    situacao=sit,
                    valor_contrato=float(valor),
                ))

        await db.commit()
        logger.info("Seed de dados concluído.")
