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
        await conn.run_sync(Base.metadata.create_all)
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
