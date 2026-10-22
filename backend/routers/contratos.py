"""Router: /api/contratos — Contratos — ERSUS 360

Sem fonte oficial integrada: todas as rotas respondem nao_disponivel com a explicação. Até 21/10/2026
devolviam dados escritos no código rotulados "referencia_municipal" — removidos (ver NOTA).
"""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter

router = APIRouter(prefix="/api/contratos", tags=["contratos"])
NOTA = ('Contratos e vencimentos vêm do Portal da Transparência / sistema de compras da Prefeitura, ainda não integrado. A lista que existia aqui não veio de fonte oficial e foi removida.')


def _nao_disponivel() -> dict:
    return {"situacao_dado": "nao_disponivel", "dados": None, "nota": NOTA,
            "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")}


@router.get("/resumo")
async def resumo():
    return _nao_disponivel()


@router.get("/dashboard")
async def dashboard():
    return _nao_disponivel()


@router.get("/lista")
async def lista():
    return _nao_disponivel()


@router.get("/alertas")
async def alertas():
    return _nao_disponivel()
