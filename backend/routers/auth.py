"""
Router: /api/auth — Autenticação JWT com isolamento por município.

Estratégia de lookup:
  1. Banco de dados (tabela usuarios) — fonte primária
  2. USERS_BOOTSTRAP — apenas para contas de sistema (superadmin/admin da assessoria)
     que existem antes de qualquer município ser cadastrado.

Isolamento:
  - Perfis municipais (gestor, coordenador, operador) só enxergam seu município.
  - Perfis da assessoria (superadmin, admin, assessor_tecnico) enxergam municípios autorizados.
  - Nunca misturar dados de municípios diferentes.
"""
from __future__ import annotations
import logging
import os
from datetime import datetime, timedelta
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Auth"])

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2  = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ── Perfis que pertencem à assessoria (acesso multi-município) ────────────────
_PERFIS_ASSESSORIA = {"superadmin", "admin", "assessor_tecnico", "auditoria"}
# Perfis municipais só enxergam o próprio município
_PERFIS_MUNICIPAIS = {"gestor", "coordenador", "enfermeiro", "medico",
                      "tecnico_aps", "acs", "odontologia", "farmaceutico",
                      "vigilancia", "financeiro", "contabilidade", "planejamento",
                      "prefeito", "conselho", "operador_municipal", "visualizador", "consulta"}

# ── Bootstrap — contas de sistema (assessoria) ────────────────────────────────
# Estas contas existem antes de qualquer BD ser populado.
# Senhas protegidas via env vars no Railway — nunca em texto claro em produção.
USERS_BOOTSTRAP: dict[str, dict] = {
    "euler": {
        "username": "euler",
        "nome": "Euler Ramos",
        "cargo": "Administrador Geral ERSUS 360",
        "municipio": "Assessoria",
        "municipio_ibge": None,        # acesso a todos os municípios
        "hashed_password": pwd_ctx.hash(os.getenv("EULER_SENHA", "ersus@local")),
        "role": "superadmin",
        "email": "eulerenzoramos@gmail.com",
        "ativo": True,
    },
    "admin": {
        "username": "admin",
        "nome": "Administrador ERSUS 360",
        "cargo": "Administrador do Sistema",
        "municipio": "Assessoria",
        "municipio_ibge": None,
        "hashed_password": pwd_ctx.hash(os.getenv("ADMIN_SENHA", "admin2026")),
        "role": "admin",
        "email": "",
        "ativo": True,
    },
}


class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: dict


class UserOut(BaseModel):
    username: str
    nome: str
    cargo: str
    municipio: str
    municipio_ibge: str | None   # None = assessoria (acesso a todos)
    role: str
    perfis_assessoria: bool      # True = pode acessar múltiplos municípios


def _verify(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)


def _create_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


async def _lookup_usuario_db(username: str, db: AsyncSession) -> dict | None:
    """Busca usuário no banco. Retorna None se não encontrado."""
    try:
        from models.usuario import Usuario
        from models.municipio import Municipio

        stmt = (
            select(Usuario, Municipio)
            .join(Municipio, Usuario.municipio_id == Municipio.id, isouter=True)
            .where(Usuario.email == username)
            .where(Usuario.ativo == True)
        )
        result = await db.execute(stmt)
        row = result.first()
        if not row:
            # Tenta pelo username se email não encontrar
            stmt2 = (
                select(Usuario, Municipio)
                .join(Municipio, Usuario.municipio_id == Municipio.id, isouter=True)
                .where(Usuario.nome.ilike(f"%{username}%"))
                .where(Usuario.ativo == True)
                .limit(1)
            )
            result2 = await db.execute(stmt2)
            row = result2.first()
            if not row:
                return None

        usuario, municipio = row
        return {
            "username": usuario.email,
            "nome": usuario.nome,
            "cargo": str(usuario.perfil.value),
            "municipio": municipio.nome if municipio else "Assessoria",
            "municipio_ibge": municipio.codigo_ibge if municipio else None,
            "hashed_password": usuario.senha_hash,
            "role": usuario.perfil.value,
            "email": usuario.email,
            "ativo": usuario.ativo,
        }
    except Exception as exc:
        logger.debug("auth DB lookup falhou: %s", exc)
        return None


async def get_current_user(
    token: Annotated[str, Depends(oauth2)],
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    cred_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido ou expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str | None = payload.get("sub")
        if not username:
            raise cred_exc
    except JWTError:
        raise cred_exc

    # 1. Bootstrap (contas de sistema)
    user = USERS_BOOTSTRAP.get(username)

    # 2. Banco de dados
    if not user:
        user = await _lookup_usuario_db(username, db)

    if not user or not user.get("ativo", True):
        raise cred_exc

    role = user["role"]
    return UserOut(
        username=user["username"],
        nome=user["nome"],
        cargo=user.get("cargo", role),
        municipio=user.get("municipio", ""),
        municipio_ibge=user.get("municipio_ibge"),
        role=role,
        perfis_assessoria=role in _PERFIS_ASSESSORIA,
    )


CurrentUser = Annotated[UserOut, Depends(get_current_user)]


def require_municipio_access(ibge: str, current_user: UserOut) -> None:
    """
    Garante que o usuário tem acesso ao município solicitado.
    Lança HTTP 403 se o usuário municipal tentar acessar outro município.
    """
    if current_user.perfis_assessoria:
        return  # assessoria acessa tudo
    if current_user.municipio_ibge and current_user.municipio_ibge != ibge:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"Acesso negado: você só pode acessar dados do município {current_user.municipio} "
                f"(IBGE {current_user.municipio_ibge})."
            ),
        )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/login", response_model=Token)
async def login(
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: AsyncSession = Depends(get_db),
):
    # Bootstrap
    user: dict | None = USERS_BOOTSTRAP.get(form.username)

    # Banco de dados (email como login)
    if not user:
        user = await _lookup_usuario_db(form.username, db)

    if not user or not _verify(form.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.get("ativo", True):
        raise HTTPException(status_code=403, detail="Usuário desativado")

    # Registra último acesso no BD (se for usuário BD)
    try:
        from models.usuario import Usuario
        stmt = select(Usuario).where(Usuario.email == user["username"])
        result = await db.execute(stmt)
        db_user = result.scalar_one_or_none()
        if db_user:
            db_user.ultimo_acesso = datetime.utcnow()
            await db.commit()
    except Exception:
        pass

    token = _create_token(
        {"sub": user["username"], "role": user["role"],
         "ibge": user.get("municipio_ibge")},
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return Token(
        access_token=token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user={
            "username": user["username"],
            "nome": user["nome"],
            "cargo": user.get("cargo", user["role"]),
            "municipio": user.get("municipio", ""),
            "municipio_ibge": user.get("municipio_ibge"),
            "role": user["role"],
            "perfis_assessoria": user["role"] in _PERFIS_ASSESSORIA,
        },
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
    """Cria usuário no banco. Somente superadmin/admin da assessoria."""
    if current_user.role not in ("superadmin", "admin"):
        raise HTTPException(status_code=403, detail="Acesso negado — somente administradores")

    email = (body.get("email") or body.get("username") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=422, detail="email obrigatório")

    from models.usuario import Usuario, Perfil
    from models.municipio import Municipio

    # Verifica duplicidade
    stmt = select(Usuario).where(Usuario.email == email)
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="E-mail já cadastrado")

    # Resolve município
    municipio_ibge = body.get("municipio_ibge")
    municipio_id: int | None = None
    if municipio_ibge:
        stmt_m = select(Municipio).where(Municipio.codigo_ibge == municipio_ibge)
        mun = (await db.execute(stmt_m)).scalar_one_or_none()
        if not mun:
            raise HTTPException(status_code=404, detail=f"Município IBGE {municipio_ibge} não cadastrado")
        municipio_id = mun.id

    perfil_str = body.get("perfil", "consulta")
    try:
        perfil = Perfil(perfil_str)
    except ValueError:
        raise HTTPException(status_code=422, detail=f"Perfil inválido: {perfil_str}")

    novo = Usuario(
        municipio_id=municipio_id or 1,   # fallback para id=1 (assessoria) se sem município
        nome=body.get("nome", email),
        email=email,
        senha_hash=pwd_ctx.hash(body.get("senha", "ersus2026")),
        perfil=perfil,
        ativo=True,
    )
    db.add(novo)
    await db.commit()
    await db.refresh(novo)

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
    """Lista usuários. Admin/superadmin veem todos; gestor vê só seu município."""
    if current_user.role not in ("superadmin", "admin"):
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")

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
