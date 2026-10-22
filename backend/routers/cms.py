"""Router: /api/cms — Conselho Municipal de Saúde — ERSUS 360

Sem fonte oficial integrada: todas as rotas respondem nao_disponivel com a explicação. Até 21/10/2026
devolviam dados escritos no código rotulados "referencia_municipal" — removidos (ver NOTA).
"""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter

router = APIRouter(prefix="/api/cms", tags=["cms"])
NOTA = ('Composição, reuniões e resoluções do Conselho vêm das atas e resoluções publicadas pelo CMS, ainda não cadastradas no sistema. Os nomes e atas que existiam aqui não foram conferidos em documento oficial e foram removidos.')


def _nao_disponivel() -> dict:
    return {"situacao_dado": "nao_disponivel", "dados": None, "nota": NOTA,
            "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")}


@router.get("/resumo")
async def resumo():
    return _nao_disponivel()


@router.get("/dashboard")
async def dashboard():
    return _nao_disponivel()


@router.get("/reunioes")
async def reunioes():
    return _nao_disponivel()


@router.get("/conselheiros")
async def conselheiros():
    return _nao_disponivel()


@router.get("/deliberacoes")
async def deliberacoes():
    return _nao_disponivel()
