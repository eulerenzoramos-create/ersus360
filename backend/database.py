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
        from models import conta_bancaria_fms  # noqa — contas bancárias FMS
        from models import backup  # noqa — registro de backups
        from models import fns_origem  # noqa — origem dos recursos FNS (Ministério × emendas)
        from models import cnes_xml  # noqa — importações do XML-CNES do SISAB
        from models import siaps_relatorio  # noqa — relatórios exportados do SIAPS
        from models import equipe_siaps  # noqa — equipes pela API pública do SIAPS
        from models import egestor_pagamento  # noqa — pagamento e validação por equipe (e-Gestor)
        from models import siaps_publico  # noqa — resultados públicos oficiais do SIAPS (quadrimestre, IED)
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

        # Enums do InvestSUS: o tipo já existe no Postgres com os valores de quando
        # a tabela foi criada pela primeira vez — create_all() não adiciona valores
        # novos a um ENUM já existente. Sincroniza aqui, derivando do Enum Python
        # (fonte única da verdade) para não duplicar a lista manualmente.
        if not _raw_url.startswith("sqlite"):
            from models.investsus import (
                TipoEmenda, SituacaoNormalizada, NivelAlertaInvest,
                TipoParecer, ResultadoParecer, OrigemAtualizacao,
            )
            _enums_investsus = [
                ("tipoemenda", TipoEmenda),
                ("situacaonormalizada", SituacaoNormalizada),
                ("nivelalertainvest", NivelAlertaInvest),
                ("tipoparecer", TipoParecer),
                ("resultadoparecer", ResultadoParecer),
                ("origematualizacao", OrigemAtualizacao),
            ]
            for nome_tipo, enum_cls in _enums_investsus:
                for membro in enum_cls:
                    try:
                        await conn.execute(
                            text(f"ALTER TYPE {nome_tipo} ADD VALUE IF NOT EXISTS '{membro.value}'")
                        )
                    except Exception:
                        pass  # tipo ainda não existe (primeira execução) — create_all já cria com todos os valores

    await _migrar_investsus_federal()

    # Multi-tenant: colunas de credenciamento, auditoria por município, perfil ADMINISTRADOR_GERAL
    from tenancy.migracoes import migrar_multitenant
    await migrar_multitenant(engine)


async def _migrar_investsus_federal() -> None:
    """INVESTSUS 360 — escopo federal: colunas novas em is_propostas / is_pareceres e
    preenchimento inicial de esfera e modalidade. Idempotente; transação própria para
    que uma falha aqui não aborte as demais migrações."""
    colunas = {
        "is_propostas": [
            ("esfera", "VARCHAR(20) DEFAULT 'federal'"),
            ("modalidade", "VARCHAR(20)"),
            ("observacoes_internas", "TEXT"),
            ("prioridade", "VARCHAR(20)"),
        ],
        "is_pareceres": [
            ("resposta_texto", "TEXT"),
            ("respondido_por", "VARCHAR(100)"),
        ],
        # detalhe da proposta importado do InvestSUS (chave para não duplicar)
        "is_planos_trabalho": [("id_externo", "VARCHAR(50)")],
        "is_acoes_servicos": [("id_externo", "VARCHAR(50)")],
        "is_documentos": [("id_externo", "VARCHAR(50)")],
    }
    sqlite = _raw_url.startswith("sqlite")
    async with engine.begin() as conn:
        for tabela, cols in colunas.items():
            existentes: set[str] = set()
            if sqlite:
                existentes = {r[1] for r in (await conn.execute(text(f"PRAGMA table_info({tabela})"))).all()}
            for col, typ in cols:
                if sqlite:
                    if col not in existentes:
                        await conn.execute(text(f"ALTER TABLE {tabela} ADD COLUMN {col} {typ}"))
                else:
                    await conn.execute(text(f"ALTER TABLE {tabela} ADD COLUMN IF NOT EXISTS {col} {typ}"))

        await conn.execute(text("UPDATE is_propostas SET esfera = 'federal' WHERE esfera IS NULL"))
        # Modalidade a partir do tipo legado. "individual" só é confiável em cadastro manual:
        # a sincronização antiga gravava TODA emenda como individual — esses registros ficam
        # "a_classificar" até a próxima sincronização reclassificá-los pelo dado oficial.
        await conn.execute(text("""
            UPDATE is_propostas SET modalidade = CASE CAST(tipo_emenda AS TEXT)
                WHEN 'bancada' THEN 'rp7'
                WHEN 'coletiva' THEN 'rp7'
                WHEN 'comissao' THEN 'rp8'
                WHEN 'programa' THEN 'programa'
                WHEN 'individual' THEN CASE
                    WHEN fonte_dado IN ('investsus', 'portal_transparencia', 'sincronizacao_browser')
                    THEN 'a_classificar' ELSE 'rp6' END
                ELSE 'a_classificar' END
            WHERE modalidade IS NULL
        """))
