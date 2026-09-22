"""
Router: /api/auth — Autenticação JWT com isolamento por município (multi-tenant).

Estratégia de lookup:
  1. USERS_BOOTSTRAP — contas de sistema do ADMINISTRADOR_GERAL (senha só via env var)
  2. Banco de dados (tabela usuarios) — login pelo e-mail exato

Isolamento:
  - O município da sessão (claim "mid" do token) é definido no login e só muda
    pela troca auditada em /api/tenant/selecionar.
  - A cada requisição o usuário, o município e a autorização são revalidados no
    banco: usuário desativado, município suspenso ou autorização revogada
    bloqueiam o acesso imediatamente, mesmo com token ainda válido.
  - Somente o ADMINISTRADOR_GERAL acessa qualquer município. Os demais acessam
    o município de origem e os autorizados expressamente (usuario_municipios).
"""
from __future__ import annotations
import json
import logging
import os
from datetime import datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.requests import HTTPConnection

from config import settings
from database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Auth"])

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2  = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

# Perfis com acesso a todos os municípios. "superadmin" é o nome legado.
PERFIS_GLOBAIS = {"administrador_geral", "superadmin"}
# Perfis que administram usuários dentro do próprio município
PERFIS_ADMIN_MUNICIPAL = {"admin"}


def eh_admin_geral(role: str | None) -> bool:
    return role in PERFIS_GLOBAIS


def _modo_desenvolvimento() -> bool:
    return settings.DEBUG or settings.DATABASE_URL.startswith("sqlite")


def _hash_bootstrap(env_var: str, senha_dev: str) -> str | None:
    """Senha das contas de sistema vem SOMENTE de env var em produção.
    Sem a variável, a conta fica desabilitada (exceto em desenvolvimento local)."""
    senha = os.getenv(env_var)
    if senha:
        return pwd_ctx.hash(senha)
    if _modo_desenvolvimento():
        return pwd_ctx.hash(senha_dev)
    logger.warning("Conta bootstrap desabilitada: %s não definida", env_var)
    return None


# ── Bootstrap — contas do administrador-geral ─────────────────────────────────
USERS_BOOTSTRAP: dict[str, dict] = {
    "euler": {
        "username": "euler",
        "nome": "Euler Ramos",
        "cargo": "Administrador Geral ERSUS 360",
        "hashed_password": _hash_bootstrap("EULER_SENHA", "ersus@local"),
        "role": "administrador_geral",
        "email": "eulerenzoramos@gmail.com",
        "ativo": True,
    },
}
if os.getenv("ADMIN_SENHA"):
    # Conta de sistema opcional; só existe se ADMIN_SENHA estiver definida.
    USERS_BOOTSTRAP["admin"] = {
        "username": "admin",
        "nome": "Administrador ERSUS 360",
        "cargo": "Administrador do Sistema",
        "hashed_password": pwd_ctx.hash(os.environ["ADMIN_SENHA"]),
        "role": "administrador_geral",
        "email": "",
        "ativo": True,
    }


class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: dict


class UserOut(BaseModel):
    username: str
    nome: str
    cargo: str = ""
    role: str
    # Município (tenant) ativo na sessão — None só para o administrador-geral
    # antes de selecionar um município.
    municipio_id: int | None = None
    municipio_uuid: str | None = None
    municipio: str = ""
    municipio_ibge: str | None = None
    municipio_uf: str | None = None
    municipio_brasao: str | None = None
    municipio_populacao: int | None = None
    usuario_id: int | None = None
    administrador_geral: bool = False
    # True quando o usuário pode trocar de município (admin-geral ou >1 autorizado)
    perfis_assessoria: bool = False
    municipios_autorizados: list[int] = []
    modulos: list[str] = []


def _verify(plain: str, hashed: str | None) -> bool:
    return bool(hashed) and pwd_ctx.verify(plain, hashed)


def _create_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def emitir_token(usuario: UserOut) -> str:
    return _create_token({"sub": usuario.username, "role": usuario.role, "mid": usuario.municipio_id})


def ip_de(conn: HTTPConnection | None) -> str | None:
    if conn is None:
        return None
    fwd = conn.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return conn.client.host if conn.client else None


async def _carregar_usuario(username: str, db: AsyncSession) -> dict | None:
    """Carrega o usuário (bootstrap ou banco, pelo e-mail exato). Inclui inativos
    — quem chama decide a mensagem. Nunca busca por nome ou por trecho de texto."""
    boot = USERS_BOOTSTRAP.get(username)
    if boot:
        return {**boot, "usuario_id": None, "municipio_id": None}
    from models.usuario import Usuario
    login = (username or "").strip().lower()
    if not login:
        return None
    usuario = (await db.execute(select(Usuario).where(Usuario.email == login))).scalar_one_or_none()
    if not usuario:
        return None
    return {
        "username": usuario.email,
        "nome": usuario.nome,
        "cargo": str(usuario.perfil.value),
        "hashed_password": usuario.senha_hash,
        "role": usuario.perfil.value,
        "email": usuario.email,
        "ativo": usuario.ativo,
        "usuario_id": usuario.id,
        "municipio_id": usuario.municipio_id,
    }


async def municipios_autorizados(user: dict, db: AsyncSession) -> list:
    """Municípios que o usuário pode acessar, já filtrados pela situação."""
    from models.municipio import Municipio, SITUACOES_COM_ACESSO
    from models.usuario import UsuarioMunicipio

    base = select(Municipio).where(Municipio.excluido_em.is_(None))
    if eh_admin_geral(user["role"]):
        return list((await db.execute(base.order_by(Municipio.nome))).scalars().all())

    ids = set()
    if user.get("municipio_id"):
        ids.add(user["municipio_id"])
    if user.get("usuario_id"):
        extras = await db.execute(
            select(UsuarioMunicipio.municipio_id)
            .where(UsuarioMunicipio.usuario_id == user["usuario_id"])
            .where(UsuarioMunicipio.ativo.is_(True))
        )
        ids.update(extras.scalars().all())
    if not ids:
        return []
    stmt = (
        base.where(Municipio.id.in_(ids))
        .where(Municipio.situacao.in_(SITUACOES_COM_ACESSO))
        .order_by(Municipio.nome)
    )
    return list((await db.execute(stmt)).scalars().all())


def _modulos(role: str, municipio) -> list[str]:
    from models.usuario import PERMISSOES
    perm = PERMISSOES.get(role, set())
    modulos = ["*"] if perm == {"*"} else sorted(perm)
    contratados = None
    if municipio is not None and municipio.modulos_contratados:
        try:
            contratados = set(json.loads(municipio.modulos_contratados))
        except ValueError:
            contratados = None
    if contratados and not eh_admin_geral(role):
        modulos = sorted(contratados) if modulos == ["*"] else [m for m in modulos if m in contratados]
    return modulos


class AcessoNegado(HTTPException):
    """403 de isolamento — sempre auditado por quem captura."""
    def __init__(self, detail: str, motivo: str):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)
        self.motivo = motivo


async def resolver_sessao(username: str, mid: int | None, db: AsyncSession) -> UserOut:
    """Monta o contexto da sessão revalidando tudo no banco.
    Lança 401 (credencial) ou AcessoNegado (isolamento)."""
    user = await _carregar_usuario(username, db)
    if not user or not user.get("hashed_password"):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido ou expirado",
                            headers={"WWW-Authenticate": "Bearer"})
    if not user.get("ativo", True):
        raise AcessoNegado("Usuário suspenso ou desativado", "USUARIO_SUSPENSO")

    global_ = eh_admin_geral(user["role"])
    autorizados = await municipios_autorizados(user, db)
    por_id = {m.id: m for m in autorizados}

    if not global_ and not autorizados:
        raise AcessoNegado(
            "Município sem acesso ao ERSUS360 (suspenso, encerrado ou em implantação)",
            "MUNICIPIO_SEM_ACESSO",
        )

    if mid is None and not global_:
        mid = user["municipio_id"] if user["municipio_id"] in por_id else autorizados[0].id

    if mid is not None and mid not in por_id:
        raise AcessoNegado("Acesso negado a este município", "MUNICIPIO_NAO_AUTORIZADO")

    mun = por_id.get(mid) if mid is not None else None
    return UserOut(
        username=user["username"],
        nome=user["nome"],
        cargo=user.get("cargo", user["role"]),
        role=user["role"],
        municipio_id=mun.id if mun else None,
        municipio_uuid=mun.uuid if mun else None,
        municipio=mun.nome if mun else "Administração Geral",
        municipio_ibge=mun.codigo_ibge if mun else None,
        municipio_uf=mun.uf if mun else None,
        municipio_brasao=mun.brasao_url if mun else None,
        municipio_populacao=mun.populacao if mun else None,
        usuario_id=user.get("usuario_id"),
        administrador_geral=global_,
        perfis_assessoria=global_ or len(autorizados) > 1,
        municipios_autorizados=[m.id for m in autorizados] if not global_ else [],
        modulos=_modulos(user["role"], mun),
    )


def decodificar_token(token: str | None) -> dict:
    cred_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido ou expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise cred_exc
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise cred_exc
    if not payload.get("sub"):
        raise cred_exc
    return payload


async def get_current_user(
    conn: HTTPConnection,
    token: Annotated[str | None, Depends(oauth2)],
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    # O guard global (tenancy.guard) já resolveu e validou a sessão.
    ja = getattr(conn.state, "usuario", None)
    if ja is not None:
        return ja
    payload = decodificar_token(token)
    return await resolver_sessao(payload["sub"], payload.get("mid"), db)


CurrentUser = Annotated[UserOut, Depends(get_current_user)]


def require_municipio_access(ibge: str, current_user: UserOut) -> None:
    """Garante que o IBGE solicitado é o do município da sessão."""
    if current_user.municipio_ibge != ibge:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Acesso negado: sessão ativa no município {current_user.municipio}.",
        )


def exigir_admin_geral(current_user: UserOut) -> None:
    if not current_user.administrador_geral:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Acesso restrito ao administrador-geral")


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/login", response_model=Token)
async def login(
    request: Request,
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: AsyncSession = Depends(get_db),
):
    from tenancy.auditoria import registrar_auditoria

    ip = ip_de(request)
    user = await _carregar_usuario(form.username, db)
    if not user or not _verify(form.password, user.get("hashed_password")):
        await registrar_auditoria(db, "LOGIN_FALHA", login=form.username[:200], ip=ip,
                                  municipio_id=user.get("municipio_id") if user else None)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        sessao = await resolver_sessao(user["username"], None, db)
    except AcessoNegado as exc:
        await registrar_auditoria(db, "LOGIN_NEGADO", login=user["username"], ip=ip,
                                  municipio_id=user.get("municipio_id"), detalhe=exc.motivo)
        raise

    if user.get("usuario_id"):
        from models.usuario import Usuario
        db_user = await db.get(Usuario, user["usuario_id"])
        if db_user:
            db_user.ultimo_acesso = datetime.utcnow()
            await db.commit()

    await registrar_auditoria(db, "LOGIN", usuario=sessao, ip=ip)
    return Token(
        access_token=emitir_token(sessao),
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=sessao.model_dump(),
    )


@router.get("/me", response_model=UserOut)
async def me(current_user: CurrentUser):
    return current_user


@router.post("/logout")
async def logout():
    return {"message": "Logout realizado com sucesso"}


@router.get("/permissoes/{perfil}")
async def permissoes_perfil(perfil: str, current_user: CurrentUser):
    from models.usuario import PERMISSOES
    p = PERMISSOES.get(perfil, set())
    return {"perfil": perfil, "modulos": list(p) if p != {"*"} else ["*"]}


@router.post("/registrar")
async def registrar_usuario(
    current_user: CurrentUser,
    body: dict,
    db: AsyncSession = Depends(get_db),
):
    """Cria usuário no banco vinculado a um município. Somente administrador-geral."""
    exigir_admin_geral(current_user)
    from models.usuario import Usuario, Perfil
    from models.municipio import Municipio
    from tenancy.auditoria import registrar_auditoria

    email = (body.get("email") or body.get("username") or "").strip().lower()
    senha = body.get("senha") or ""
    municipio_ibge = body.get("municipio_ibge")
    if not email or not senha or not municipio_ibge:
        raise HTTPException(status_code=422, detail="email, senha e municipio_ibge são obrigatórios")

    if (await db.execute(select(Usuario).where(Usuario.email == email))).scalar_one_or_none():
        raise HTTPException(status_code=409, detail="E-mail já cadastrado")

    mun = (await db.execute(select(Municipio).where(Municipio.codigo_ibge == municipio_ibge))).scalar_one_or_none()
    if not mun:
        raise HTTPException(status_code=404, detail=f"Município IBGE {municipio_ibge} não cadastrado")

    perfil_str = body.get("perfil", "consulta")
    try:
        perfil = Perfil(perfil_str)
    except ValueError:
        raise HTTPException(status_code=422, detail=f"Perfil inválido: {perfil_str}")
    if perfil in (Perfil.ADMINISTRADOR_GERAL, Perfil.SUPERADMIN):
        raise HTTPException(status_code=422, detail="Perfil global não pode ser atribuído por cadastro")

    novo = Usuario(
        municipio_id=mun.id,
        nome=body.get("nome", email),
        email=email,
        senha_hash=pwd_ctx.hash(senha),
        perfil=perfil,
        ativo=True,
    )
    db.add(novo)
    await db.commit()
    await db.refresh(novo)
    await registrar_auditoria(db, "USUARIO_CRIADO", usuario=current_user, municipio_id=mun.id,
                              tabela="usuarios", registro_id=novo.id, detalhe=f"{email} perfil={perfil.value}")

    return {
        "message": "Usuário criado com sucesso",
        "id": novo.id,
        "email": novo.email,
        "perfil": novo.perfil.value,
        "municipio_ibge": municipio_ibge,
    }


@router.get("/usuarios")
async def listar_usuarios(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    municipio_ibge: str | None = Query(None),
):
    """Lista usuários de todos os municípios. Somente administrador-geral."""
    exigir_admin_geral(current_user)

    from models.usuario import Usuario
    from models.municipio import Municipio

    stmt = (
        select(Usuario, Municipio)
        .join(Municipio, Usuario.municipio_id == Municipio.id, isouter=True)
    )
    if municipio_ibge:
        stmt = stmt.where(Municipio.codigo_ibge == municipio_ibge)

    rows = (await db.execute(stmt)).all()
    return [
        {
            "id": u.id,
            "nome": u.nome,
            "email": u.email,
            "perfil": u.perfil.value,
            "municipio": m.nome if m else None,
            "municipio_ibge": m.codigo_ibge if m else None,
            "ativo": u.ativo,
            "ultimo_acesso": u.ultimo_acesso.isoformat() if u.ultimo_acesso else None,
        }
        for u, m in rows
    ]
