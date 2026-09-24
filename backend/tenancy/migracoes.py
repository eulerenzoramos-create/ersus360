"""
Migração incremental e idempotente para o modelo multi-tenant.

Somente ADICIONA colunas/valores — nunca remove nem sobrescreve dados existentes.
Os dados de Apuí/AM permanecem intactos; o município recebe situação "ativo".
"""
from __future__ import annotations

import logging
import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

logger = logging.getLogger(__name__)

_COLUNAS_MUNICIPIOS = [
    ("uuid", "VARCHAR(36)"),
    ("situacao", "VARCHAR(20)"),
    ("cnpj_prefeitura", "VARCHAR(18)"),
    ("cnpj_secretaria", "VARCHAR(18)"),
    ("cnes_secretaria", "VARCHAR(7)"),
    ("endereco", "VARCHAR(255)"),
    ("responsavel_tecnico", "VARCHAR(150)"),
    ("responsavel_administrativo", "VARCHAR(150)"),
    ("brasao_url", "VARCHAR(500)"),
    ("data_implantacao", "DATE"),
    ("contrato_inicio", "DATE"),
    ("contrato_fim", "DATE"),
    ("plano", "VARCHAR(50)"),
    ("modulos_contratados", "TEXT"),
    ("limite_usuarios", "INTEGER"),
    ("configuracoes", "TEXT"),
    ("atualizado_em", "TIMESTAMP"),
    ("excluido_em", "TIMESTAMP"),
]

_COLUNAS_AUDIT = [
    ("usuario_login", "VARCHAR(200)"),
    ("municipio_id", "INTEGER"),
]


# Tabelas municipais que não tinham identificador do município. Todo o conteúdo
# anterior ao multi-tenant pertence a Apuí/AM (único município em uso).
TABELAS_COM_NOVO_MUNICIPIO_ID = [
    "execucao_fns", "documentos_execucao", "conta_bancaria_fms", "repasses_fns", "email_diario_log",
]


async def _tabelas_existentes(conn) -> list[str]:
    if conn.dialect.name == "sqlite":
        rows = (await conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))).all()
    else:
        rows = (await conn.execute(text(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema()"))).all()
    return [r[0] for r in rows]


async def _colunas_existentes(conn, tabela: str) -> set[str]:
    if conn.dialect.name == "sqlite":
        rows = (await conn.execute(text(f"PRAGMA table_info({tabela})"))).all()
        return {r[1] for r in rows}
    rows = (await conn.execute(
        text("SELECT column_name FROM information_schema.columns WHERE table_name = :t"),
        {"t": tabela},
    )).all()
    return {r[0] for r in rows}


async def _adicionar_colunas(conn, tabela: str, colunas: list[tuple[str, str]]) -> None:
    existentes = await _colunas_existentes(conn, tabela)
    for nome, tipo in colunas:
        if nome not in existentes:
            await conn.execute(text(f"ALTER TABLE {tabela} ADD COLUMN {nome} {tipo}"))
            logger.info("[multitenant] coluna adicionada: %s.%s", tabela, nome)


async def migrar_multitenant(engine: AsyncEngine) -> None:
    # 1. Novo valor do enum de perfil (PostgreSQL guarda o NOME do membro do Enum).
    if engine.dialect.name == "postgresql":
        try:
            async with engine.connect() as conn:
                conn = await conn.execution_options(isolation_level="AUTOCOMMIT")
                await conn.execute(text("ALTER TYPE perfil ADD VALUE IF NOT EXISTS 'ADMINISTRADOR_GERAL'"))
        except Exception as exc:  # tipo pode não existir em bancos criados sem constraint
            logger.warning("[multitenant] ALTER TYPE perfil ignorado: %s", exc)

    async with engine.begin() as conn:
        # 2. Colunas novas
        await _adicionar_colunas(conn, "municipios", _COLUNAS_MUNICIPIOS)
        await _adicionar_colunas(conn, "audit_log", _COLUNAS_AUDIT)
        await _adicionar_colunas(conn, "documentos", [("excluido_em", "TIMESTAMP")])
        # Previsão Portaria × Recebimento FNS (colunas novas, nada é removido)
        tabelas_existentes = set(await _tabelas_existentes(conn))
        if "portarias_municipio" in tabelas_existentes:
            await _adicionar_colunas(conn, "portarias_municipio", [
                ("exercicio", "INTEGER"), ("grupo", "VARCHAR(200)"), ("acao", "VARCHAR(400)"),
                ("componente", "VARCHAR(500)"), ("periodicidade", "VARCHAR(20)"),
                ("qtd_parcelas", "INTEGER"), ("valor_parcela", "FLOAT"), ("fundamento", "TEXT"),
                ("criado_por", "VARCHAR(200)"), ("atualizado_em", "TIMESTAMP"), ("excluido_em", "TIMESTAMP"),
            ])
        if "transferencias_fns" in tabelas_existentes:
            await _adicionar_colunas(conn, "transferencias_fns", [
                ("previsao_id", "INTEGER"), ("competencia_referencia", "VARCHAR(7)"),
                ("vinculo_tipo", "VARCHAR(12)"), ("vinculo_por", "VARCHAR(200)"), ("vinculo_em", "TIMESTAMP"),
                ("parcela_fns", "VARCHAR(40)"), ("parcela_numero", "INTEGER"),
                ("parcela_total", "INTEGER"), ("parcela_ano", "INTEGER"),
            ])
            await conn.execute(text(
                "CREATE INDEX IF NOT EXISTS ix_transferencias_fns_previsao_id ON transferencias_fns (previsao_id)"))
        existentes = set(await _tabelas_existentes(conn))
        for tabela in TABELAS_COM_NOVO_MUNICIPIO_ID:
            if tabela in existentes:
                await _adicionar_colunas(conn, tabela, [("municipio_id", "INTEGER")])
                await conn.execute(text(
                    f"CREATE INDEX IF NOT EXISTS ix_{tabela}_municipio_id ON {tabela} (municipio_id)"))
                await conn.execute(text(
                    f"UPDATE {tabela} SET municipio_id = (SELECT id FROM municipios WHERE codigo_ibge = '1300144') "
                    f"WHERE municipio_id IS NULL"))
                if conn.dialect.name == "postgresql":
                    fk = f"fk_{tabela}_municipio"
                    await conn.execute(text(f"""
                        DO $$ BEGIN
                          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '{fk}') THEN
                            ALTER TABLE {tabela} ADD CONSTRAINT {fk}
                              FOREIGN KEY (municipio_id) REFERENCES municipios(id);
                          END IF;
                        END $$;"""))

        # 3. Situação dos municípios pré-existentes:
        #    com usuários cadastrados → ativo (preserva o acesso atual de Apuí);
        #    sem usuários → disponível.
        await conn.execute(text("""
            UPDATE municipios SET situacao = 'ativo'
             WHERE situacao IS NULL
               AND (codigo_ibge = '1300144'
                    OR id IN (SELECT DISTINCT municipio_id FROM usuarios WHERE municipio_id IS NOT NULL))
        """))
        await conn.execute(text("UPDATE municipios SET situacao = 'disponivel' WHERE situacao IS NULL"))

        # 4. Identificador público não sequencial
        sem_uuid = (await conn.execute(text("SELECT id FROM municipios WHERE uuid IS NULL"))).all()
        for (mid,) in sem_uuid:
            await conn.execute(
                text("UPDATE municipios SET uuid = :u WHERE id = :i"),
                {"u": str(uuid.uuid4()), "i": mid},
            )

        # 5. Índices de apoio ao isolamento
        await conn.execute(text(
            "CREATE UNIQUE INDEX IF NOT EXISTS ix_municipios_uuid ON municipios (uuid)"
        ))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_audit_log_municipio_criado ON audit_log (municipio_id, criado_em)"
        ))
