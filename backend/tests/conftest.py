import os
import secrets

# Ambiente de teste próprio, antes de qualquer import do app. Antes os testes dependiam do backend/.env
# versionado (repositório público) — removido em 21/10/2026. Valores já definidos no ambiente prevalecem.
os.environ.setdefault("DATABASE_URL", "sqlite:///./ersus360_teste.db")
os.environ.setdefault("DEBUG", "true")
os.environ.setdefault("SECRET_KEY", "teste-" + secrets.token_hex(16))

import pytest_asyncio  # noqa: E402
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker  # noqa: E402

import models  # noqa: F401 — garante que todas as tabelas sejam registradas em Base.metadata
from database import Base
from models.municipio import Municipio


@pytest_asyncio.fixture
async def db_session():
    engine = create_async_engine("sqlite+aiosqlite://", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    Session = async_sessionmaker(engine, expire_on_commit=False)
    async with Session() as session:
        yield session

    await engine.dispose()


@pytest_asyncio.fixture
async def municipio(db_session):
    mun = Municipio(nome="Apuí", uf="AM", codigo_ibge="1300144")
    db_session.add(mun)
    await db_session.flush()
    return mun
