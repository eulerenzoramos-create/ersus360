from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
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
        pool_size=10,
        max_overflow=20,
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
        )
        await conn.run_sync(Base.metadata.create_all)
