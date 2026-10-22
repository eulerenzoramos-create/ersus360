"""Router: /api/saude-adolescente-apui — ERSUS 360

Sem fonte específica integrada: responde nao_disponivel com a explicação. Até 21/10/2026 devolvia dados de
outro assunto (proxy) que a tela poderia exibir com este rótulo — ver NOTA.
"""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-adolescente-apui", tags=["saude_adolescente_apui"])
NOTA = ('Fonte específica ainda não integrada. Antes esta tela recebia o total de internações do SIH e óbitos/nascidos do SIM/SINASC, que não medem este assunto; não são mais exibidos.')


def _nao_disponivel() -> dict:
    return {"situacao_dado": "nao_disponivel", "dados": None, "nota": NOTA,
            "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")}


@router.get("/dashboard")
async def dashboard():
    return _nao_disponivel()


@router.get("/indicadores")
async def indicadores():
    return _nao_disponivel()


@router.get("/gravidez-adolescencia")
async def gravidez_adolescencia():
    return _nao_disponivel()


@router.get("/saude-mental")
async def saude_mental():
    return _nao_disponivel()


@router.get("/acoes")
async def acoes():
    return _nao_disponivel()
