import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

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
