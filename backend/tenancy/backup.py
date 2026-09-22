"""
Backup, verificação (teste de restauração) e restauração por município.

Formato: arquivo .ersusbkp = ZIP criptografado (Fernet/AES-128-CBC + HMAC).
  manifest.json          versão, tipo, município, contagens e sha256 de cada parte
  dados/<tabela>.json    linhas da tabela
  arquivos/<caminho>     arquivos do município (documentos, relatórios, cache...)

Escopo de um backup de município — calculado a partir do modelo de dados:
  - tabelas com `municipio_id`      → linhas daquele município
  - tabelas com `municipio_ibge`    → linhas daquele IBGE (7 ou 6 dígitos)
  - tabelas filhas (FK) das acima   → linhas cujo pai pertence ao município
  - tabelas nacionais/globais        → fora do backup municipal (estão no geral)

Restaurar um município apaga e regrava SOMENTE as linhas do escopo dele, numa
única transação; linhas de outros municípios nunca entram no filtro.
O registro do município (tabela municipios), a trilha de auditoria, os usuários
e as autorizações não são sobrescritos na restauração.
"""
from __future__ import annotations

import base64
import enum
import hashlib
import io
import json
import logging
import os
import shutil
import tempfile
import uuid as _uuid
import zipfile
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from pathlib import Path
from typing import Callable

from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy import Enum as SAEnum, MetaData, Table, delete, insert, inspect, select, text
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy.pool import StaticPool

from config import settings
from tenancy.arquivos import pasta_backups, pasta_raiz_municipio, raiz

logger = logging.getLogger("ersus.backup")

FORMATO = 1
# Nunca entram no escopo de um município (cadastro-mestre e registros de backup)
FORA_DO_ESCOPO_MUNICIPAL = {"municipios", "backup_execucoes"}
# Entram no backup, mas não são sobrescritas na restauração: a trilha de
# auditoria é imutável, e contas/autorizações ficam sempre no estado atual
# (restaurar poderia reativar usuário revogado ou senha antiga).
NAO_RESTAURAR = {"audit_log", "usuarios", "usuario_municipios"}


class ErroBackup(Exception):
    pass


# ── Modelo de dados ──────────────────────────────────────────────────────────

def metadata_completo() -> MetaData:
    """Registra todos os modelos (inclusive os fora de models/__init__)."""
    import models  # noqa: F401
    from models import (  # noqa: F401
        backup, conta_bancaria_fms, credencial_municipio, email_diario, execucao_fns,
        extracao, inconsistencia, indicadores_aps, integracao_gateway, investsus,
        portaria_dou, repasse_fns, transferencia_fns,
    )
    from database import Base
    return Base.metadata


Filtro = Callable[[int, str], object]


def escopo_municipal(md: MetaData) -> dict[str, Filtro]:
    """tabela → função(municipio_id, ibge) que gera o WHERE das linhas do município."""
    filtros: dict[str, Filtro] = {}
    for t in md.sorted_tables:  # pais antes dos filhos
        if t.name in FORA_DO_ESCOPO_MUNICIPAL:
            continue
        if "municipio_id" in t.c:
            filtros[t.name] = lambda mid, ibge, t=t: t.c.municipio_id == mid
        elif "municipio_ibge" in t.c:
            filtros[t.name] = lambda mid, ibge, t=t: t.c.municipio_ibge.in_([ibge, ibge[:6]])
        else:
            for fk in sorted(t.foreign_keys, key=lambda f: f.parent.name):
                pai = fk.column.table
                if pai.name in filtros:
                    f_pai = filtros[pai.name]
                    filtros[t.name] = (lambda mid, ibge, fk=fk, f_pai=f_pai:
                                       fk.parent.in_(select(fk.column).where(f_pai(mid, ibge))))
                    break
    return filtros


# ── Serialização ─────────────────────────────────────────────────────────────

def _ser(v):
    if v is None or isinstance(v, (bool, int, float, str)):
        return v
    if isinstance(v, datetime):
        return {"__t": "dt", "v": v.isoformat()}
    if isinstance(v, date):
        return {"__t": "d", "v": v.isoformat()}
    if isinstance(v, time):
        return {"__t": "tm", "v": v.isoformat()}
    if isinstance(v, Decimal):
        return {"__t": "dec", "v": str(v)}
    if isinstance(v, enum.Enum):
        return {"__t": "enum", "v": v.name}
    if isinstance(v, (bytes, bytearray, memoryview)):
        return {"__t": "b64", "v": base64.b64encode(bytes(v)).decode()}
    if isinstance(v, _uuid.UUID):
        return str(v)
    if isinstance(v, (dict, list)):
        return {"__t": "json", "v": v}
    return str(v)


def _des(v, coluna):
    if not isinstance(v, dict) or "__t" not in v:
        return v
    t, x = v["__t"], v["v"]
    if t == "dt":
        return datetime.fromisoformat(x)
    if t == "d":
        return date.fromisoformat(x)
    if t == "tm":
        return time.fromisoformat(x)
    if t == "dec":
        return Decimal(x)
    if t == "b64":
        return base64.b64decode(x)
    if t == "enum":
        classe = getattr(coluna.type, "enum_class", None) if isinstance(coluna.type, SAEnum) else None
        return classe[x] if classe else x
    return x  # json


def _sha(dados: bytes) -> str:
    return hashlib.sha256(dados).hexdigest()


# ── Criptografia ─────────────────────────────────────────────────────────────

def _fernet() -> Fernet:
    chave = os.getenv("BACKUP_CHAVE", "").strip()
    if chave:
        return Fernet(chave.encode())
    # Sem chave dedicada: deriva do SECRET_KEY (separação de domínio). Trocar o
    # SECRET_KEY torna ilegíveis os backups antigos — defina BACKUP_CHAVE.
    logger.warning("BACKUP_CHAVE não definida: chave derivada do SECRET_KEY")
    derivada = hashlib.sha256(b"ersus360-backup-v1|" + settings.SECRET_KEY.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(derivada))


def _abrir(caminho: Path) -> zipfile.ZipFile:
    try:
        bruto = _fernet().decrypt(caminho.read_bytes())
    except InvalidToken:
        raise ErroBackup("Não foi possível descriptografar o backup (chave diferente ou arquivo alterado)")
    return zipfile.ZipFile(io.BytesIO(bruto))


# ── Geração ──────────────────────────────────────────────────────────────────

@dataclass
class MunicipioAlvo:
    id: int
    uuid: str
    ibge: str
    nome: str
    uf: str


async def _exportar_tabelas(engine: AsyncEngine, md: MetaData, alvo: MunicipioAlvo | None) -> dict[str, list]:
    filtros = escopo_municipal(md) if alvo else None
    saida: dict[str, list] = {}
    async with engine.connect() as conn:
        existentes = set(await conn.run_sync(lambda c: inspect(c).get_table_names()))
        for t in md.sorted_tables:
            if t.name not in existentes:
                continue
            if alvo:
                if t.name not in filtros:
                    continue
                stmt = select(t).where(filtros[t.name](alvo.id, alvo.ibge))
            else:
                stmt = select(t)
            linhas = (await conn.execute(stmt)).mappings().all()
            saida[t.name] = [{k: _ser(v) for k, v in dict(r).items()} for r in linhas]
    return saida


def _arquivos(alvo: MunicipioAlvo | None) -> list[tuple[Path, str]]:
    if alvo:
        base = pasta_raiz_municipio(alvo.uuid)
        bases = [(base, "")]
    else:
        bases = [(raiz() / "municipios", "municipios/"), (raiz() / "global", "global/")]
    itens = []
    for pasta, prefixo in bases:
        if pasta.exists():
            for f in sorted(pasta.rglob("*")):
                if f.is_file():
                    itens.append((f, prefixo + f.relative_to(pasta).as_posix()))
    return itens


async def gerar_backup(engine: AsyncEngine, alvo: MunicipioAlvo | None) -> dict:
    """Gera o arquivo criptografado. Retorna metadados para o registro."""
    md = metadata_completo()
    tabelas = await _exportar_tabelas(engine, md, alvo)
    manifesto = {
        "formato": FORMATO,
        "tipo": "municipio" if alvo else "geral",
        "gerado_em": datetime.utcnow().isoformat(),
        "municipio": alvo.__dict__ if alvo else None,
        "tabelas": {},
        "arquivos": {},
    }
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        for nome, linhas in tabelas.items():
            dados = json.dumps(linhas, ensure_ascii=False).encode()
            z.writestr(f"dados/{nome}.json", dados)
            manifesto["tabelas"][nome] = {"registros": len(linhas), "sha256": _sha(dados)}
        for caminho, rel in _arquivos(alvo):
            conteudo = caminho.read_bytes()
            z.writestr(f"arquivos/{rel}", conteudo)
            manifesto["arquivos"][rel] = _sha(conteudo)
        z.writestr("manifest.json", json.dumps(manifesto, ensure_ascii=False, indent=1))

    cifrado = _fernet().encrypt(buf.getvalue())
    pasta = pasta_backups() / ("municipios/" + alvo.uuid if alvo else "geral")
    pasta.mkdir(parents=True, exist_ok=True)
    destino = pasta / f"{datetime.utcnow():%Y%m%dT%H%M%S}_{_uuid.uuid4().hex[:8]}.ersusbkp"
    destino.write_bytes(cifrado)
    return {
        "arquivo": str(destino),
        "tamanho_bytes": len(cifrado),
        "sha256": _sha(cifrado),
        "total_registros": sum(len(v) for v in tabelas.values()),
        "total_arquivos": len(manifesto["arquivos"]),
    }


# ── Verificação (teste de restauração) ───────────────────────────────────────

def _ler_conteudo(caminho: Path, sha_esperado: str | None) -> tuple[dict, zipfile.ZipFile]:
    if not caminho.exists():
        raise ErroBackup("Arquivo de backup não encontrado")
    if sha_esperado and _sha(caminho.read_bytes()) != sha_esperado:
        raise ErroBackup("Arquivo de backup alterado (sha256 diferente do registrado)")
    z = _abrir(caminho)
    manifesto = json.loads(z.read("manifest.json"))
    for nome, info in manifesto["tabelas"].items():
        if _sha(z.read(f"dados/{nome}.json")) != info["sha256"]:
            raise ErroBackup(f"Tabela {nome} corrompida no backup")
    for rel, sha in manifesto["arquivos"].items():
        if _sha(z.read(f"arquivos/{rel}")) != sha:
            raise ErroBackup(f"Arquivo {rel} corrompido no backup")
    return manifesto, z


async def verificar_backup(caminho: Path, sha_esperado: str | None) -> str:
    """Restaura o backup inteiro num banco temporário e confere as contagens.
    Lança ErroBackup se algo não bater; devolve um resumo se estiver íntegro."""
    manifesto, z = _ler_conteudo(caminho, sha_esperado)
    md = metadata_completo()
    temp = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)
    try:
        async with temp.begin() as conn:
            await conn.run_sync(md.create_all)
            for t in md.sorted_tables:
                if t.name not in manifesto["tabelas"]:
                    continue
                linhas = json.loads(z.read(f"dados/{t.name}.json"))
                if linhas:
                    await conn.execute(insert(t), [_linha(t, l) for l in linhas])
        async with temp.connect() as conn:
            for nome, info in manifesto["tabelas"].items():
                n = (await conn.execute(text(f'SELECT COUNT(*) FROM "{nome}"'))).scalar_one()
                if n != info["registros"]:
                    raise ErroBackup(f"{nome}: {n} registros restaurados, esperado {info['registros']}")
    finally:
        await temp.dispose()
    total = sum(i["registros"] for i in manifesto["tabelas"].values())
    return (f"Restauração de teste OK: {len(manifesto['tabelas'])} tabelas, {total} registros, "
            f"{len(manifesto['arquivos'])} arquivos conferidos")


def _linha(t: Table, linha: dict) -> dict:
    return {k: _des(v, t.c[k]) for k, v in linha.items() if k in t.c}


# ── Restauração de um município ──────────────────────────────────────────────

async def restaurar_municipio(engine: AsyncEngine, caminho: Path, sha_esperado: str | None,
                              alvo: MunicipioAlvo) -> dict:
    manifesto, z = _ler_conteudo(caminho, sha_esperado)
    if manifesto["tipo"] != "municipio" or (manifesto["municipio"] or {}).get("uuid") != alvo.uuid:
        raise ErroBackup("Este backup não pertence a este município — restauração recusada")

    md = metadata_completo()
    filtros = escopo_municipal(md)
    tabelas = [t for t in md.sorted_tables
               if t.name in manifesto["tabelas"] and t.name in filtros and t.name not in NAO_RESTAURAR]
    resumo: dict[str, dict] = {}
    async with engine.begin() as conn:  # tudo ou nada
        for t in reversed(tabelas):  # filhos antes dos pais
            r = await conn.execute(delete(t).where(filtros[t.name](alvo.id, alvo.ibge)))
            resumo[t.name] = {"removidos": r.rowcount or 0}
        for t in tabelas:
            linhas = [_linha(t, l) for l in json.loads(z.read(f"dados/{t.name}.json"))]
            for l in linhas:  # defesa extra: só entram linhas do próprio município
                if "municipio_id" in l and l["municipio_id"] not in (None, alvo.id):
                    raise ErroBackup(f"{t.name}: linha de outro município no backup — restauração abortada")
            if linhas:
                await conn.execute(insert(t), linhas)
            resumo[t.name]["restaurados"] = len(linhas)
        if conn.dialect.name == "postgresql":
            for t in tabelas:
                if "id" in t.c and t.c.id.autoincrement and str(t.c.id.type).upper().startswith(("INTEGER", "BIGINT")):
                    await conn.execute(text(
                        f"SELECT setval(pg_get_serial_sequence('{t.name}', 'id'), "
                        f"GREATEST((SELECT COALESCE(MAX(id), 1) FROM {t.name}), 1))"))

    # Arquivos: a versão atual é preservada ao lado, nunca apagada
    pasta = pasta_raiz_municipio(alvo.uuid)
    with tempfile.TemporaryDirectory() as tmp:
        for rel in manifesto["arquivos"]:
            destino = Path(tmp) / rel
            destino.parent.mkdir(parents=True, exist_ok=True)
            destino.write_bytes(z.read(f"arquivos/{rel}"))
        if pasta.exists():
            pasta.rename(pasta.with_name(f"{pasta.name}.antes-restauracao-{datetime.utcnow():%Y%m%dT%H%M%S}"))
        shutil.copytree(tmp, pasta)
    return {"tabelas": resumo, "arquivos": len(manifesto["arquivos"])}


# ── Retenção ─────────────────────────────────────────────────────────────────

def dias_retencao() -> int:
    try:
        return max(1, int(os.getenv("BACKUP_RETENCAO_DIAS", "30")))
    except ValueError:
        return 30


def limite_retencao() -> datetime:
    return datetime.utcnow() - timedelta(days=dias_retencao())


# ── Orquestração: registro, verificação automática, rotina diária ────────────

def alvo_de(m) -> MunicipioAlvo:
    return MunicipioAlvo(id=m.id, uuid=m.uuid, ibge=m.codigo_ibge, nome=m.nome, uf=m.uf)


async def executar_backup(db, engine: AsyncEngine, municipio=None, origem: str = "agendado",
                          solicitado_por: str | None = None):
    """Gera o backup, faz o teste de restauração e grava o registro da execução."""
    from models.backup import BackupExecucao

    reg = BackupExecucao(tipo="municipio" if municipio else "geral",
                         municipio_id=municipio.id if municipio else None,
                         origem=origem, status="executando", solicitado_por=solicitado_por)
    db.add(reg)
    await db.commit()
    try:
        info = await gerar_backup(engine, alvo_de(municipio) if municipio else None)
        for k, v in info.items():
            setattr(reg, k, v)
        reg.status, reg.concluido_em = "ok", datetime.utcnow()
        await db.commit()
    except Exception as exc:
        logger.error("Backup %s falhou: %s", reg.id, exc, exc_info=True)
        reg.status, reg.erro, reg.concluido_em = "erro", str(exc)[:4000], datetime.utcnow()
        await db.commit()
        return reg
    await verificar_registro(db, reg)
    return reg


async def verificar_registro(db, reg) -> None:
    try:
        reg.verificacao_detalhe = await verificar_backup(Path(reg.arquivo), reg.sha256)
        reg.verificacao_ok = True
    except Exception as exc:
        reg.verificacao_ok, reg.verificacao_detalhe = False, str(exc)[:4000]
        logger.error("Verificação do backup %s falhou: %s", reg.id, exc)
    reg.verificado_em = datetime.utcnow()
    await db.commit()


async def aplicar_retencao(db, minimo_por_escopo: int = 3) -> int:
    """Remove arquivos mais antigos que BACKUP_RETENCAO_DIAS, preservando sempre
    os `minimo_por_escopo` backups íntegros mais recentes de cada escopo."""
    from models.backup import BackupExecucao

    regs = (await db.execute(
        select(BackupExecucao).where(BackupExecucao.status == "ok")
        .order_by(BackupExecucao.iniciado_em.desc())
    )).scalars().all()
    vistos: dict[tuple, int] = {}
    limite, expirados = limite_retencao(), 0
    for r in regs:
        chave = (r.tipo, r.municipio_id)
        vistos[chave] = vistos.get(chave, 0) + 1
        if vistos[chave] > minimo_por_escopo and r.iniciado_em < limite:
            try:
                Path(r.arquivo).unlink(missing_ok=True)
            except OSError as exc:
                logger.warning("Não removeu %s: %s", r.arquivo, exc)
                continue
            r.status = "expirado"
            expirados += 1
    await db.commit()
    return expirados


async def rotina_diaria(session_factory, engine: AsyncEngine) -> dict:
    """Backup geral + um por município contratado, cada um verificado; depois retenção."""
    from models.municipio import Municipio

    resultado = {"geral": None, "municipios": {}, "expirados": 0}
    async with session_factory() as db:
        reg = await executar_backup(db, engine, None)
        resultado["geral"] = reg.status
        muns = (await db.execute(
            select(Municipio).where(Municipio.excluido_em.is_(None))
            .where(Municipio.situacao != "disponivel")
        )).scalars().all()
        for m in muns:
            reg = await executar_backup(db, engine, m)
            resultado["municipios"][m.nome] = reg.status
        resultado["expirados"] = await aplicar_retencao(db)
    logger.info("Rotina de backup: %s", resultado)
    return resultado
