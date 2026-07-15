"""
Router: /api/auth — Autenticação JWT
"""
from __future__ import annotations
from datetime import datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

import os
from config import settings

router = APIRouter(prefix="/api/auth", tags=["Auth"])

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2 = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ── Usuários hardcoded para demo ─────────────────────────────────────────────
USERS_DB = {
    "euler": {
        "username": "euler",
        "nome": "Euler Ramos",
        "cargo": "Administrador Geral ERSUS 360",
        "municipio": "Apuí/AM",
        "hashed_password": pwd_ctx.hash(os.getenv("EULER_SENHA", "ersus@local")),
        "role": "superadmin",
        "email": "eulerenzoramos@gmail.com",
    },
    "gestor": {
        "username": "gestor",
        "nome": "Gestor Municipal de Saúde",
        "cargo": "Secretário Municipal de Saúde",
        "municipio": "Apuí/AM",
        "hashed_password": pwd_ctx.hash("ersus2026"),
        "role": "gestor",
    },
    "coordenador": {
        "username": "coordenador",
        "nome": "Coordenador APS",
        "cargo": "Coordenador de Atenção Primária",
        "municipio": "Apuí/AM",
        "hashed_password": pwd_ctx.hash("coord2026"),
        "role": "coordenador",
    },
    "admin": {
        "username": "admin",
        "nome": "Administrador ERSUS 360",
        "cargo": "Administrador do Sistema",
        "municipio": "Apuí/AM",
        "hashed_password": pwd_ctx.hash("admin2026"),
        "role": "admin",
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
    role: str


def _verify(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)


def _create_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def get_current_user(token: Annotated[str, Depends(oauth2)]) -> UserOut:
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

    user = USERS_DB.get(username)
    if not user:
        raise cred_exc

    return UserOut(
        username=user["username"],
        nome=user["nome"],
        cargo=user["cargo"],
        municipio=user["municipio"],
        role=user["role"],
    )


CurrentUser = Annotated[UserOut, Depends(get_current_user)]


@router.post("/login", response_model=Token)
async def login(form: Annotated[OAuth2PasswordRequestForm, Depends()]):
    user = USERS_DB.get(form.username)
    if not user or not _verify(form.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = _create_token(
        {"sub": user["username"], "role": user["role"]},
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return Token(
        access_token=token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user={
            "username": user["username"],
            "nome": user["nome"],
            "cargo": user["cargo"],
            "municipio": user["municipio"],
            "role": user["role"],
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
async def registrar_usuario(body: dict, current_user: CurrentUser):
    """Cria usuário no USERS_DB em memória (só superadmin/admin)."""
    if current_user.role not in ("superadmin", "admin"):
        raise HTTPException(status_code=403, detail="Acesso negado — somente administradores")
    username = body.get("username", "").strip().lower()
    if not username:
        raise HTTPException(status_code=422, detail="username obrigatório")
    if username in USERS_DB:
        raise HTTPException(status_code=409, detail="Usuário já existe")
    USERS_DB[username] = {
        "username": username,
        "nome": body.get("nome", username),
        "cargo": body.get("cargo", ""),
        "municipio": body.get("municipio", "Apuí/AM"),
        "hashed_password": pwd_ctx.hash(body.get("senha", "ersus2026")),
        "role": body.get("perfil", "consulta"),
        "email": body.get("email", ""),
    }
    return {"message": "Usuário criado com sucesso", "username": username}
