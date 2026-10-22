"""Router: /api/violencia-acidentes-apui — ERSUS 360

Sem fonte específica integrada: responde nao_disponivel com a explicação. Até 21/10/2026 devolvia dados de
outro assunto (proxy) que a tela poderia exibir com este rótulo — ver NOTA.
"""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter

router = APIRouter(prefix="/api/violencia-acidentes-apui", tags=["violencia_acidentes_apui"])
NOTA = ('Notificações individuais de violência requerem SINAN Web (pendente). Internações por causas externas via SIH disponíveis. Antes esta tela recebia o total de internações do SIH e os agravos do SINAN (malária, dengue, TB, hanseníase), que não medem este assunto; não são mais exibidos.')


def _nao_disponivel() -> dict:
    return {"situacao_dado": "nao_disponivel", "dados": None, "nota": NOTA,
            "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")}


@router.get("/dashboard")
async def dashboard():
    return _nao_disponivel()


@router.get("/notificacoes")
async def notificacoes():
    return _nao_disponivel()


@router.get("/indicadores")
async def indicadores():
    return _nao_disponivel()
