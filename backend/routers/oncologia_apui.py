"""Router: /api/oncologia-apui — ERSUS 360

Sem fonte específica integrada: responde nao_disponivel com a explicação. Até 21/10/2026 devolvia dados de
outro assunto (proxy) que a tela poderia exibir com este rótulo — ver NOTA.
"""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter

router = APIRouter(prefix="/api/oncologia-apui", tags=["oncologia_apui"])
NOTA = ('Rastreamento oncológico (SISCAN, colo do útero, mama) requer integração e-SUS PEC (pendente). Antes esta tela recebia o total de internações do SIH, que não medem este assunto; não são mais exibidos.')


def _nao_disponivel() -> dict:
    return {"situacao_dado": "nao_disponivel", "dados": None, "nota": NOTA,
            "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")}


@router.get("/dashboard")
async def dashboard():
    return _nao_disponivel()


@router.get("/historico")
async def historico():
    return _nao_disponivel()


@router.get("/indicadores")
async def indicadores():
    return _nao_disponivel()


@router.get("/rastreamento")
async def rastreamento():
    return _nao_disponivel()


@router.get("/acoes")
async def acoes():
    return _nao_disponivel()
