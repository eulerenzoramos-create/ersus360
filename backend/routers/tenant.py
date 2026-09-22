"""
Router: /api/tenant — contexto da sessão e troca auditada de município.

A troca emite um NOVO token com o município escolhido; o anterior continua
válido só até expirar, mas o município nunca vem de parâmetro do cliente
nas demais rotas.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_db
from models.municipio import Municipio
from routers.auth import (
    AcessoNegado, CurrentUser, _carregar_usuario, emitir_token, ip_de,
    municipios_autorizados, resolver_sessao,
)
from tenancy.auditoria import registrar_auditoria

router = APIRouter(prefix="/api/tenant", tags=["Multi-tenant"])


class SelecionarIn(BaseModel):
    municipio_uuid: str


def _municipio_publico(m: Municipio) -> dict:
    return {
        "uuid": m.uuid,
        "nome": m.nome,
        "uf": m.uf,
        "codigo_ibge": m.codigo_ibge,
        "situacao": m.situacao,
        "brasao_url": m.brasao_url,
    }


def _resposta_sessao(usuario) -> dict:
    return {
        "access_token": emitir_token(usuario),
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": usuario.model_dump(),
    }


@router.get("/contexto")
async def contexto(current_user: CurrentUser):
    """Município, perfil e módulos em uso — base do cabeçalho do frontend."""
    return {
        **current_user.model_dump(),
        "ambiente": (
            "suporte" if current_user.administrador_geral and current_user.municipio_id
            else "administracao_geral" if current_user.administrador_geral
            else "municipal"
        ),
    }


@router.get("/municipios")
async def listar_autorizados(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    """Somente os municípios que este usuário pode acessar."""
    user = await _carregar_usuario(current_user.username, db)
    return [_municipio_publico(m) for m in await municipios_autorizados(user, db)]


@router.post("/selecionar")
async def selecionar(
    body: SelecionarIn, request: Request, current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    alvo = (await db.execute(
        select(Municipio).where(Municipio.uuid == body.municipio_uuid)
    )).scalar_one_or_none()
    ip = ip_de(request)
    try:
        if not alvo:
            raise AcessoNegado("Acesso negado a este município", "MUNICIPIO_INEXISTENTE")
        nova = await resolver_sessao(current_user.username, alvo.id, db)
    except AcessoNegado as exc:
        await registrar_auditoria(db, "ACESSO_NEGADO", usuario=current_user, ip=ip,
                                  detalhe=f"{exc.motivo} troca para {body.municipio_uuid}")
        raise

    if current_user.municipio_id and current_user.municipio_id != nova.municipio_id:
        acao_saida = "SUPORTE_FIM" if current_user.administrador_geral else "SAIDA_MUNICIPIO"
        await registrar_auditoria(db, acao_saida, usuario=current_user, ip=ip,
                                  detalhe=f"saída de {current_user.municipio}")
    acao = "SUPORTE_INICIO" if nova.administrador_geral else "TROCA_MUNICIPIO"
    await registrar_auditoria(db, acao, usuario=nova, ip=ip,
                              detalhe=f"de {current_user.municipio or '—'} para {nova.municipio}/{nova.municipio_uf}")
    return _resposta_sessao(nova)


@router.post("/sair-suporte")
async def sair_suporte(request: Request, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    """Administrador-geral encerra o acesso de suporte e volta à administração geral."""
    if not current_user.administrador_geral:
        raise HTTPException(403, "Somente o administrador-geral usa o modo suporte")
    if current_user.municipio_id:
        await registrar_auditoria(db, "SUPORTE_FIM", usuario=current_user, ip=ip_de(request),
                                  detalhe=f"saída de {current_user.municipio}")
    nova = await resolver_sessao(current_user.username, None, db)
    return _resposta_sessao(nova)
