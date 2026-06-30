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
    return JSONResponse({"status": "ok"})


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
