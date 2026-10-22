"""Router: /api/frota — Frota de Saúde — ERSUS 360

Sem fonte oficial integrada: todas as rotas respondem nao_disponivel com a explicação. Até 21/10/2026
devolviam dados escritos no código rotulados "referencia_municipal" — removidos (ver NOTA).
"""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter

router = APIRouter(prefix="/api/frota", tags=["frota"])
NOTA = ('Veículos, viagens, pacientes transportados e combustível vêm do controle de frota/TFD da Secretaria, ainda não integrado. Os números que existiam aqui (12 veículos, 184 viagens/mês etc.) não tinham fonte e foram removidos.')


def _nao_disponivel() -> dict:
    return {"situacao_dado": "nao_disponivel", "dados": None, "nota": NOTA,
            "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")}


@router.get("/dashboard")
async def dashboard():
    return _nao_disponivel()


@router.get("/historico")
async def historico():
    return _nao_disponivel()


@router.get("/veiculos")
async def veiculos():
    return _nao_disponivel()


@router.get("/manutencoes")
async def manutencoes():
    return _nao_disponivel()


@router.get("/indicadores")
async def indicadores():
    return _nao_disponivel()
