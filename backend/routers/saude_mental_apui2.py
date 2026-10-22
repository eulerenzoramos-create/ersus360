"""Router: /api/saude-mental-apui — ERSUS 360

Sem fonte específica integrada: responde nao_disponivel com a explicação. Até 21/10/2026 devolvia dados de
outro assunto (proxy) que a tela poderia exibir com este rótulo — ver NOTA.
"""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-mental-apui", tags=["saude_mental_apui2"])
NOTA = ('RAAS/CAPS individuais requerem e-SUS PEC (pendente). Antes esta tela recebia o total de procedimentos do SIA e o total de internações do SIH, que não medem este assunto; não são mais exibidos.')


def _nao_disponivel() -> dict:
    return {"situacao_dado": "nao_disponivel", "dados": None, "nota": NOTA,
            "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")}


@router.get("/dashboard")
async def dashboard():
    return _nao_disponivel()


@router.get("/agravos")
async def agravos():
    return _nao_disponivel()


@router.get("/caps-producao")
async def caps_producao():
    return _nao_disponivel()


@router.get("/historico")
async def historico():
    return _nao_disponivel()


@router.get("/indicadores")
async def indicadores():
    return _nao_disponivel()
