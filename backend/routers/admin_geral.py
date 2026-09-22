"""
Router: /api/admin-geral — cadastro e credenciamento de municípios, usuários,
autorizações multi-município e auditoria. Exclusivo do ADMINISTRADOR_GERAL
(verificado no guard global e novamente aqui).
"""
from __future__ import annotations

import json
import os
from datetime import date, datetime
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from passlib.context import CryptContext
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.municipio import Municipio, SituacaoMunicipio
from models.usuario import AuditLog, Perfil, Usuario, UsuarioMunicipio
from routers.auth import CurrentUser, UserOut, exigir_admin_geral, ip_de
from tenancy.auditoria import registrar_auditoria

router = APIRouter(prefix="/api/admin-geral", tags=["Administrador-geral"])
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

IBGE_API = "https://servicodados.ibge.gov.br/api/v1/localidades/estados/{uf}/municipios"


def _admin(current_user: CurrentUser) -> UserOut:
    exigir_admin_geral(current_user)
    return current_user


AdminDep = Depends(_admin)


# ── Schemas ───────────────────────────────────────────────────────────────────

class MunicipioIn(BaseModel):
    nome: str
    uf: str = Field(min_length=2, max_length=2)
    codigo_ibge: str = Field(min_length=7, max_length=7)
    situacao: SituacaoMunicipio = SituacaoMunicipio.DISPONIVEL
    cnpj_prefeitura: Optional[str] = None
    cnpj_secretaria: Optional[str] = None
    cnpj_fundo: Optional[str] = None
    cnes_secretaria: Optional[str] = None
    endereco: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    prefeito: Optional[str] = None
    secretario: Optional[str] = None
    responsavel_tecnico: Optional[str] = None
    responsavel_administrativo: Optional[str] = None
    brasao_url: Optional[str] = None
    data_implantacao: Optional[date] = None
    contrato_inicio: Optional[date] = None
    contrato_fim: Optional[date] = None
    plano: Optional[str] = None
    modulos_contratados: Optional[list[str]] = None
    limite_usuarios: Optional[int] = None
    populacao: Optional[int] = None


class MunicipioUpdate(BaseModel):
    nome: Optional[str] = None
    cnpj_prefeitura: Optional[str] = None
    cnpj_secretaria: Optional[str] = None
    cnpj_fundo: Optional[str] = None
    cnes_secretaria: Optional[str] = None
    endereco: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    prefeito: Optional[str] = None
    secretario: Optional[str] = None
    responsavel_tecnico: Optional[str] = None
    responsavel_administrativo: Optional[str] = None
    brasao_url: Optional[str] = None
    data_implantacao: Optional[date] = None
    contrato_inicio: Optional[date] = None
    contrato_fim: Optional[date] = None
    plano: Optional[str] = None
    modulos_contratados: Optional[list[str]] = None
    limite_usuarios: Optional[int] = None
    populacao: Optional[int] = None


class SituacaoIn(BaseModel):
    situacao: SituacaoMunicipio
    motivo: Optional[str] = None


class UsuarioAdminIn(BaseModel):
    nome: str
    email: str
    senha: str = Field(min_length=8)
    perfil: Perfil = Perfil.CONSULTA
    municipio_uuid: str


class UsuarioAdminUpdate(BaseModel):
    nome: Optional[str] = None
    perfil: Optional[Perfil] = None
    ativo: Optional[bool] = None


class AutorizacoesIn(BaseModel):
    municipios_uuid: list[str]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _mun_dict(m: Municipio, total_usuarios: int | None = None) -> dict:
    return {
        "uuid": m.uuid,
        "nome": m.nome,
        "uf": m.uf,
        "codigo_ibge": m.codigo_ibge,
        "situacao": m.situacao,
        "cnpj_prefeitura": m.cnpj_prefeitura,
        "cnpj_secretaria": m.cnpj_secretaria,
        "cnpj_fundo": m.cnpj_fundo,
        "cnes_secretaria": m.cnes_secretaria,
        "endereco": m.endereco,
        "telefone": m.telefone,
        "email": m.email,
        "prefeito": m.prefeito,
        "secretario": m.secretario,
        "responsavel_tecnico": m.responsavel_tecnico,
        "responsavel_administrativo": m.responsavel_administrativo,
        "brasao_url": m.brasao_url,
        "data_implantacao": m.data_implantacao,
        "contrato_inicio": m.contrato_inicio,
        "contrato_fim": m.contrato_fim,
        "plano": m.plano,
        "modulos_contratados": json.loads(m.modulos_contratados) if m.modulos_contratados else [],
        "limite_usuarios": m.limite_usuarios,
        "populacao": m.populacao,
        "total_usuarios": total_usuarios,
    }


async def _municipio(db: AsyncSession, uuid: str) -> Municipio:
    m = (await db.execute(
        select(Municipio).where(Municipio.uuid == uuid).where(Municipio.excluido_em.is_(None))
    )).scalar_one_or_none()
    if not m:
        raise HTTPException(404, "Município não encontrado")
    return m


def _aplicar(m: Municipio, dados: dict) -> None:
    for campo, valor in dados.items():
        if campo == "modulos_contratados":
            valor = json.dumps(valor) if valor is not None else None
        setattr(m, campo, valor)


def _usuario_dict(u: Usuario, m: Municipio | None, extras: list[str] | None = None) -> dict:
    return {
        "id": u.id,
        "nome": u.nome,
        "email": u.email,
        "perfil": u.perfil.value,
        "ativo": u.ativo,
        "municipio_uuid": m.uuid if m else None,
        "municipio": m.nome if m else None,
        "municipios_extras_uuid": extras or [],
        "ultimo_acesso": u.ultimo_acesso,
    }


# ── Municípios ────────────────────────────────────────────────────────────────

@router.get("/painel")
async def painel(db: AsyncSession = Depends(get_db), _: UserOut = AdminDep):
    """Visão consolidada de TODOS os municípios (somente administrador-geral)."""
    por_situacao = dict((await db.execute(
        select(Municipio.situacao, func.count()).where(Municipio.excluido_em.is_(None))
        .group_by(Municipio.situacao)
    )).all())
    usuarios = dict((await db.execute(
        select(Usuario.municipio_id, func.count()).where(Usuario.ativo.is_(True))
        .group_by(Usuario.municipio_id)
    )).all())
    muns = (await db.execute(
        select(Municipio).where(Municipio.excluido_em.is_(None))
        .where(Municipio.situacao != SituacaoMunicipio.DISPONIVEL.value)
        .order_by(Municipio.nome)
    )).scalars().all()
    return {
        "municipios_por_situacao": por_situacao,
        "municipios_contratados": [_mun_dict(m, usuarios.get(m.id, 0)) for m in muns],
    }


@router.get("/municipios")
async def listar_municipios(
    situacao: Optional[SituacaoMunicipio] = None,
    uf: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: UserOut = AdminDep,
):
    stmt = select(Municipio).where(Municipio.excluido_em.is_(None)).order_by(Municipio.uf, Municipio.nome)
    if situacao:
        stmt = stmt.where(Municipio.situacao == situacao.value)
    if uf:
        stmt = stmt.where(Municipio.uf == uf.upper())
    return [_mun_dict(m) for m in (await db.execute(stmt)).scalars().all()]


@router.post("/municipios", status_code=201)
async def criar_municipio(
    body: MunicipioIn, request: Request,
    db: AsyncSession = Depends(get_db), admin: UserOut = AdminDep,
):
    if (await db.execute(select(Municipio).where(Municipio.codigo_ibge == body.codigo_ibge))).scalar_one_or_none():
        raise HTTPException(409, "Município já cadastrado")
    dados = body.model_dump()
    dados["situacao"] = body.situacao.value
    dados["uf"] = body.uf.upper()
    m = Municipio()
    _aplicar(m, dados)
    db.add(m)
    await db.commit()
    await db.refresh(m)
    await registrar_auditoria(db, "MUNICIPIO_CRIADO", usuario=admin, municipio_id=m.id, ip=ip_de(request),
                              tabela="municipios", registro_id=m.id, detalhe=f"{m.nome}/{m.uf} {m.situacao}")
    return _mun_dict(m)


@router.post("/municipios/importar-ibge")
async def importar_ibge(
    request: Request, uf: str = Query("AM", min_length=2, max_length=2),
    db: AsyncSession = Depends(get_db), admin: UserOut = AdminDep,
):
    """Cadastra como DISPONÍVEL os municípios da relação oficial do IBGE para a UF.
    Não altera municípios já cadastrados."""
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.get(IBGE_API.format(uf=uf.upper()))
            r.raise_for_status()
            oficiais = r.json()
    except Exception as exc:
        raise HTTPException(502, f"Não foi possível consultar a API do IBGE: {exc}")

    existentes = set((await db.execute(select(Municipio.codigo_ibge))).scalars().all())
    novos = 0
    for item in oficiais:
        cod = str(item["id"])
        if cod in existentes:
            continue
        db.add(Municipio(nome=item["nome"], uf=uf.upper(), codigo_ibge=cod,
                         situacao=SituacaoMunicipio.DISPONIVEL.value))
        novos += 1
    await db.commit()
    await registrar_auditoria(db, "MUNICIPIOS_IMPORTADOS", usuario=admin, municipio_id=None, ip=ip_de(request),
                              detalhe=f"UF={uf.upper()} oficiais={len(oficiais)} novos={novos}")
    return {"uf": uf.upper(), "total_oficial": len(oficiais), "cadastrados_agora": novos,
            "fonte": "IBGE — API de Localidades"}


@router.get("/municipios/{uuid}")
async def obter_municipio(uuid: str, db: AsyncSession = Depends(get_db), _: UserOut = AdminDep):
    return _mun_dict(await _municipio(db, uuid))


@router.patch("/municipios/{uuid}")
async def atualizar_municipio(
    uuid: str, body: MunicipioUpdate, request: Request,
    db: AsyncSession = Depends(get_db), admin: UserOut = AdminDep,
):
    m = await _municipio(db, uuid)
    dados = body.model_dump(exclude_unset=True)
    _aplicar(m, dados)
    await db.commit()
    await registrar_auditoria(db, "MUNICIPIO_ATUALIZADO", usuario=admin, municipio_id=m.id, ip=ip_de(request),
                              tabela="municipios", registro_id=m.id, detalhe=", ".join(sorted(dados)))
    return _mun_dict(m)


@router.post("/municipios/{uuid}/situacao")
async def alterar_situacao(
    uuid: str, body: SituacaoIn, request: Request,
    db: AsyncSession = Depends(get_db), admin: UserOut = AdminDep,
):
    """Ativa, suspende ou encerra o município. Os dados nunca são excluídos.
    Suspensão/encerramento bloqueia os usuários municipais na requisição seguinte."""
    m = await _municipio(db, uuid)
    anterior = m.situacao
    m.situacao = body.situacao.value
    if body.situacao == SituacaoMunicipio.ATIVO and not m.data_implantacao:
        m.data_implantacao = date.today()
    await db.commit()
    await registrar_auditoria(db, "MUNICIPIO_SITUACAO", usuario=admin, municipio_id=m.id, ip=ip_de(request),
                              tabela="municipios", registro_id=m.id,
                              detalhe=f"{anterior} -> {m.situacao}. {body.motivo or ''}".strip())
    return _mun_dict(m)


# ── Usuários e autorizações ───────────────────────────────────────────────────

@router.get("/usuarios")
async def listar_usuarios(
    municipio_uuid: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: UserOut = AdminDep,
):
    stmt = (select(Usuario, Municipio)
            .join(Municipio, Usuario.municipio_id == Municipio.id, isouter=True)
            .order_by(Municipio.nome, Usuario.nome))
    if municipio_uuid:
        stmt = stmt.where(Municipio.uuid == municipio_uuid)
    rows = (await db.execute(stmt)).all()
    extras_rows = (await db.execute(
        select(UsuarioMunicipio.usuario_id, Municipio.uuid)
        .join(Municipio, UsuarioMunicipio.municipio_id == Municipio.id)
        .where(UsuarioMunicipio.ativo.is_(True))
    )).all()
    extras: dict[int, list[str]] = {}
    for uid, muuid in extras_rows:
        extras.setdefault(uid, []).append(muuid)
    return [_usuario_dict(u, m, extras.get(u.id)) for u, m in rows]


@router.post("/usuarios", status_code=201)
async def criar_usuario(
    body: UsuarioAdminIn, request: Request,
    db: AsyncSession = Depends(get_db), admin: UserOut = AdminDep,
):
    if body.perfil in (Perfil.ADMINISTRADOR_GERAL, Perfil.SUPERADMIN):
        raise HTTPException(422, "Perfil global não pode ser atribuído por cadastro")
    m = await _municipio(db, body.municipio_uuid)
    email = body.email.strip().lower()
    if (await db.execute(select(Usuario).where(Usuario.email == email))).scalar_one_or_none():
        raise HTTPException(409, "E-mail já cadastrado")
    if m.limite_usuarios:
        ativos = (await db.execute(
            select(func.count()).select_from(Usuario)
            .where(Usuario.municipio_id == m.id).where(Usuario.ativo.is_(True))
        )).scalar_one()
        if ativos >= m.limite_usuarios:
            raise HTTPException(409, f"Limite de {m.limite_usuarios} usuários do município atingido")
    u = Usuario(municipio_id=m.id, nome=body.nome, email=email,
                senha_hash=pwd_ctx.hash(body.senha), perfil=body.perfil, ativo=True)
    db.add(u)
    await db.commit()
    await db.refresh(u)
    await registrar_auditoria(db, "USUARIO_CRIADO", usuario=admin, municipio_id=m.id, ip=ip_de(request),
                              tabela="usuarios", registro_id=u.id, detalhe=f"{email} perfil={u.perfil.value}")
    return _usuario_dict(u, m)


@router.patch("/usuarios/{usuario_id}")
async def atualizar_usuario(
    usuario_id: int, body: UsuarioAdminUpdate, request: Request,
    db: AsyncSession = Depends(get_db), admin: UserOut = AdminDep,
):
    u = await db.get(Usuario, usuario_id)
    if not u:
        raise HTTPException(404, "Usuário não encontrado")
    dados = body.model_dump(exclude_unset=True)
    if dados.get("perfil") in (Perfil.ADMINISTRADOR_GERAL, Perfil.SUPERADMIN):
        raise HTTPException(422, "Perfil global não pode ser atribuído por cadastro")
    for campo, valor in dados.items():
        setattr(u, campo, valor)
    await db.commit()
    await registrar_auditoria(db, "USUARIO_ATUALIZADO", usuario=admin, municipio_id=u.municipio_id,
                              ip=ip_de(request), tabela="usuarios", registro_id=u.id,
                              detalhe=json.dumps({k: str(v) for k, v in dados.items()}, ensure_ascii=False))
    return {"ok": True}


@router.put("/usuarios/{usuario_id}/municipios")
async def definir_autorizacoes(
    usuario_id: int, body: AutorizacoesIn, request: Request,
    db: AsyncSession = Depends(get_db), admin: UserOut = AdminDep,
):
    """Define os municípios ADICIONAIS que o usuário pode acessar (além do de origem).
    Lista vazia revoga todas as autorizações extras."""
    u = await db.get(Usuario, usuario_id)
    if not u:
        raise HTTPException(404, "Usuário não encontrado")
    alvos = {}
    for muuid in body.municipios_uuid:
        m = await _municipio(db, muuid)
        if m.id != u.municipio_id:
            alvos[m.id] = m
    atuais = {v.municipio_id: v for v in (await db.execute(
        select(UsuarioMunicipio).where(UsuarioMunicipio.usuario_id == u.id)
    )).scalars().all()}
    agora = datetime.utcnow()
    for mid, vinc in atuais.items():
        if mid not in alvos and vinc.ativo:
            vinc.ativo = False
            vinc.revogado_em = agora
    for mid in alvos:
        vinc = atuais.get(mid)
        if vinc:
            vinc.ativo, vinc.revogado_em, vinc.concedido_por = True, None, admin.username
        else:
            db.add(UsuarioMunicipio(usuario_id=u.id, municipio_id=mid, concedido_por=admin.username))
    await db.commit()
    await registrar_auditoria(db, "AUTORIZACAO_MUNICIPIOS", usuario=admin, municipio_id=u.municipio_id,
                              ip=ip_de(request), tabela="usuario_municipios", registro_id=u.id,
                              detalhe="extras=" + ",".join(f"{m.nome}/{m.uf}" for m in alvos.values()))
    return {"ok": True, "municipios_extras_uuid": [m.uuid for m in alvos.values()]}


# ── Auditoria ─────────────────────────────────────────────────────────────────

@router.get("/auditoria")
async def auditoria(
    municipio_uuid: Optional[str] = None,
    acao: Optional[str] = None,
    login: Optional[str] = None,
    limite: int = Query(200, le=2000),
    db: AsyncSession = Depends(get_db),
    _: UserOut = AdminDep,
):
    stmt = select(AuditLog).order_by(AuditLog.criado_em.desc(), AuditLog.id.desc()).limit(limite)
    if municipio_uuid:
        m = await _municipio(db, municipio_uuid)
        stmt = stmt.where(AuditLog.municipio_id == m.id)
    if acao:
        stmt = stmt.where(AuditLog.acao == acao.upper())
    if login:
        stmt = stmt.where(AuditLog.usuario_login == login)
    return [
        {"id": a.id, "criado_em": a.criado_em, "acao": a.acao, "usuario_login": a.usuario_login,
         "municipio_id": a.municipio_id, "tabela": a.tabela, "registro_id": a.registro_id,
         "detalhe": a.detalhe, "ip_origem": a.ip_origem}
        for a in (await db.execute(stmt)).scalars().all()
    ]


# ── Backups ───────────────────────────────────────────────────────────────────

class BackupIn(BaseModel):
    municipio_uuid: Optional[str] = None   # None = backup geral de todo o banco


class RestaurarIn(BaseModel):
    confirmacao: str   # nome do município, digitado para confirmar


def _backup_dict(r, municipios: dict[int, Municipio]) -> dict:
    m = municipios.get(r.municipio_id) if r.municipio_id else None
    return {
        "id": r.id, "tipo": r.tipo, "origem": r.origem, "status": r.status,
        "municipio_uuid": m.uuid if m else None, "municipio": f"{m.nome}/{m.uf}" if m else None,
        "tamanho_bytes": r.tamanho_bytes, "total_registros": r.total_registros,
        "total_arquivos": r.total_arquivos, "sha256": r.sha256, "erro": r.erro,
        "solicitado_por": r.solicitado_por, "iniciado_em": r.iniciado_em, "concluido_em": r.concluido_em,
        "verificado_em": r.verificado_em, "verificacao_ok": r.verificacao_ok,
        "verificacao_detalhe": r.verificacao_detalhe,
        "restaurado_em": r.restaurado_em, "restaurado_por": r.restaurado_por,
    }


@router.get("/backups")
async def listar_backups(
    municipio_uuid: Optional[str] = None, limite: int = Query(100, le=500),
    db: AsyncSession = Depends(get_db), _: UserOut = AdminDep,
):
    from models.backup import BackupExecucao
    from tenancy.arquivos import armazenamento_persistente
    from tenancy.backup import dias_retencao

    stmt = select(BackupExecucao).order_by(BackupExecucao.iniciado_em.desc(), BackupExecucao.id.desc()).limit(limite)
    if municipio_uuid:
        stmt = stmt.where(BackupExecucao.municipio_id == (await _municipio(db, municipio_uuid)).id)
    regs = (await db.execute(stmt)).scalars().all()
    muns = {m.id: m for m in (await db.execute(select(Municipio))).scalars().all()}
    return {
        "retencao_dias": dias_retencao(),
        "armazenamento_persistente": armazenamento_persistente(),
        "chave_dedicada": bool(os.getenv("BACKUP_CHAVE")),
        "backups": [_backup_dict(r, muns) for r in regs],
    }


@router.post("/backups", status_code=201)
async def criar_backup(
    body: BackupIn, request: Request,
    db: AsyncSession = Depends(get_db), admin: UserOut = AdminDep,
):
    from tenancy.backup import executar_backup

    mun = await _municipio(db, body.municipio_uuid) if body.municipio_uuid else None
    reg = await executar_backup(db, db.bind, mun, origem="manual", solicitado_por=admin.username)
    await registrar_auditoria(db, "BACKUP_GERADO", usuario=admin, municipio_id=mun.id if mun else None,
                              ip=ip_de(request), tabela="backup_execucoes", registro_id=reg.id,
                              detalhe=f"{reg.tipo} status={reg.status} verificado={reg.verificacao_ok}")
    return _backup_dict(reg, {mun.id: mun} if mun else {})


async def _backup(db: AsyncSession, backup_id: int):
    from models.backup import BackupExecucao
    reg = await db.get(BackupExecucao, backup_id)
    if not reg or reg.status != "ok":
        raise HTTPException(404, "Backup não encontrado ou indisponível")
    return reg


@router.post("/backups/{backup_id}/verificar")
async def verificar_backup_manual(
    backup_id: int, request: Request,
    db: AsyncSession = Depends(get_db), admin: UserOut = AdminDep,
):
    from tenancy.backup import verificar_registro

    reg = await _backup(db, backup_id)
    await verificar_registro(db, reg)
    await registrar_auditoria(db, "BACKUP_VERIFICADO", usuario=admin, municipio_id=reg.municipio_id,
                              ip=ip_de(request), tabela="backup_execucoes", registro_id=reg.id,
                              detalhe=f"ok={reg.verificacao_ok} {reg.verificacao_detalhe or ''}")
    return {"verificacao_ok": reg.verificacao_ok, "detalhe": reg.verificacao_detalhe}


@router.post("/backups/{backup_id}/restaurar")
async def restaurar_backup(
    backup_id: int, body: RestaurarIn, request: Request,
    db: AsyncSession = Depends(get_db), admin: UserOut = AdminDep,
):
    """Restaura UM município a partir de um backup dele mesmo. Antes, grava um
    backup de segurança do estado atual. Outros municípios não são tocados."""
    from pathlib import Path
    from tenancy.backup import ErroBackup, alvo_de, executar_backup, restaurar_municipio

    reg = await _backup(db, backup_id)
    if reg.tipo != "municipio" or not reg.municipio_id:
        raise HTTPException(422, "Somente backups de município podem ser restaurados pelo sistema")
    mun = await db.get(Municipio, reg.municipio_id)
    if not mun or body.confirmacao.strip().lower() != mun.nome.strip().lower():
        raise HTTPException(422, "Confirmação inválida: digite exatamente o nome do município")
    if reg.verificacao_ok is not True:
        raise HTTPException(409, "Backup sem teste de restauração aprovado — verifique antes de restaurar")

    seguranca = await executar_backup(db, db.bind, mun, origem="pre-restauracao", solicitado_por=admin.username)
    if seguranca.status != "ok":
        raise HTTPException(500, "Não foi possível gravar o backup de segurança — restauração cancelada")

    ip = ip_de(request)
    try:
        resumo = await restaurar_municipio(db.bind, Path(reg.arquivo), reg.sha256, alvo_de(mun))
    except ErroBackup as exc:
        await registrar_auditoria(db, "RESTAURACAO_FALHOU", usuario=admin, municipio_id=mun.id, ip=ip,
                                  tabela="backup_execucoes", registro_id=reg.id, detalhe=str(exc))
        raise HTTPException(422, str(exc))
    reg.restaurado_em, reg.restaurado_por = datetime.utcnow(), admin.username
    await db.commit()
    await registrar_auditoria(db, "RESTAURACAO_MUNICIPIO", usuario=admin, municipio_id=mun.id, ip=ip,
                              tabela="backup_execucoes", registro_id=reg.id,
                              detalhe=f"backup de {reg.iniciado_em:%Y-%m-%d %H:%M}; segurança id={seguranca.id}")
    return {"ok": True, "backup_seguranca_id": seguranca.id, **resumo}
