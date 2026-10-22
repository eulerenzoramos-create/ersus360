"""Router: /api/ouvidoria — Ouvidoria — ERSUS 360

Sem fonte oficial integrada: todas as rotas respondem nao_disponivel com a explicação. Até 21/10/2026
devolviam dados escritos no código rotulados "referencia_municipal" — removidos (ver NOTA).
"""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter

router = APIRouter(prefix="/api/ouvidoria", tags=["Ouvidoria"])
NOTA = ('Manifestações vêm do OuvidorSUS / sistema da ouvidoria municipal, ainda não integrado. As manifestações que existiam aqui não eram registros reais e foram removidas.')


def _nao_disponivel() -> dict:
    return {"situacao_dado": "nao_disponivel", "dados": None, "nota": NOTA,
            "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")}


@router.get("/dashboard")
async def dashboard():
    return _nao_disponivel()


@router.get("/manifestacoes")
async def manifestacoes():
    return _nao_disponivel()


@router.get("/manifestacoes/{id}")
async def manifestacoes_detalhe(id: str):
    return _nao_disponivel()


@router.get("/alertas")
async def alertas():
    return _nao_disponivel()
