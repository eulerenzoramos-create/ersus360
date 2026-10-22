"""Router: /api/patrimonio — Patrimônio e Frota — ERSUS 360

Sem fonte oficial integrada: todas as rotas respondem nao_disponivel com a explicação. Até 21/10/2026
devolviam dados escritos no código rotulados "referencia_municipal" — removidos (ver NOTA).
"""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter

router = APIRouter(prefix="/api/patrimonio", tags=["Patrimônio e Frota"])
NOTA = ('Bens tombados, frota, manutenções e abastecimento vêm do sistema de patrimônio/almoxarifado da Prefeitura, ainda não integrado. A lista que existia aqui (15 bens com placas como "AM-123456") não veio de inventário oficial e foi removida.')


def _nao_disponivel() -> dict:
    return {"situacao_dado": "nao_disponivel", "dados": None, "nota": NOTA,
            "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")}


@router.get("/bens")
async def bens():
    return _nao_disponivel()


@router.get("/frota")
async def frota():
    return _nao_disponivel()


@router.get("/manutencao")
async def manutencao():
    return _nao_disponivel()


@router.get("/abastecimento")
async def abastecimento():
    return _nao_disponivel()


@router.get("/painel")
async def painel():
    return _nao_disponivel()
