from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
from config import settings

_raw_url = settings.DATABASE_URL

# Suporte a SQLite (desenvolvimento sem PostgreSQL)
if _raw_url.startswith("sqlite"):
    DATABASE_URL = _raw_url if "+aiosqlite" in _raw_url else _raw_url.replace("sqlite://", "sqlite+aiosqlite://", 1)
    engine = create_async_engine(DATABASE_URL, echo=settings.DEBUG, connect_args={"check_same_thread": False})
else:
    DATABASE_URL = _raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    engine = create_async_engine(
        DATABASE_URL,
        echo=settings.DEBUG,
        pool_pre_ping=True,
        pool_size=2,
        max_overflow=3,
    )

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Cria todas as tabelas (use em startup ou via Alembic)."""
    async with engine.begin() as conn:
        # import aqui para garantir que os modelos sejam registrados
        from models import (  # noqa
            convenio, repasse, cronograma, indicador, alerta,
            municipio, portaria, execucao, obra, usuario, documento, emenda,
            repasse_fns, pec_cadastro, visita_domiciliar,
            extracao, inconsistencia, credencial_municipio,
            investsus,
        )
        from models import indicadores_aps  # noqa — tabelas Indicadores APS (3 camadas)
        from models import integracao_gateway  # noqa — tabelas ERSUS Integration Gateway
        from models import execucao_fns  # noqa — execução financeira FNS
        from models import portaria_dou   # noqa — portarias DOU + log execução agente
        await conn.run_sync(Base.metadata.create_all)
        # Tabela de snapshot eSUS PEC (entrada manual ou bookmarklet)
        if _raw_url.startswith("sqlite"):
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS esus_snapshot (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    dados TEXT NOT NULL,
                    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
        else:
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS esus_snapshot (
                    id SERIAL PRIMARY KEY,
                    dados JSONB NOT NULL,
                    criado_em TIMESTAMP DEFAULT NOW()
                )
            """))
        # Migração incremental: adiciona colunas novas sem derrubar tabela
        _novas_colunas = [
            ("banco_ob",        "VARCHAR(10)"),
            ("agencia_ob",      "VARCHAR(20)"),
            ("numero_conta_ob", "VARCHAR(30)"),
            ("data_ob",         "DATE"),
        ]
        for col, typ in _novas_colunas:
            try:
                await conn.execute(
                    text(f"ALTER TABLE transferencias_fns ADD COLUMN IF NOT EXISTS {col} {typ}")
                )
            except Exception:
                pass  # SQLite dev local não suporta IF NOT EXISTS — ignora

        # Colunas novas em execucao_fns (adicionadas incrementalmente)
        _exec_fns_colunas = [
            ("banco_pagamento",   "VARCHAR(120)"),
            ("agencia_pagamento", "VARCHAR(30)"),
            ("numero_conta_pag",  "VARCHAR(40)"),
            ("criado_por",        "VARCHAR(100)"),
            ("editado_por",       "VARCHAR(100)"),
            ("editado_em",        "TIMESTAMP"),
            ("excluido_por",      "VARCHAR(100)"),
            ("excluido_em",       "TIMESTAMP"),
        ]
        for col, typ in _exec_fns_colunas:
            try:
                await conn.execute(
                    text(f"ALTER TABLE execucao_fns ADD COLUMN IF NOT EXISTS {col} {typ}")
                )
            except Exception:
                pass
