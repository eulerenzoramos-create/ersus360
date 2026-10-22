"""Router: /api/saude-ribeirinha-apui — ERSUS 360

Sem fonte específica integrada: responde nao_disponivel com a explicação. Até 21/10/2026 devolvia dados de
outro assunto (proxy) que a tela poderia exibir com este rótulo — ver NOTA.
"""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-ribeirinha-apui", tags=["saude_ribeirinha_apui"])
NOTA = ('Dados específicos de populações ribeirinhas (SESAI/FUNAI sem incidência no município) requerem registro municipal (pendente). Antes esta tela recebia o total de procedimentos do SIA e o total de estabelecimentos do CNES, que não medem este assunto; não são mais exibidos.')


def _nao_disponivel() -> dict:
    return {"situacao_dado": "nao_disponivel", "dados": None, "nota": NOTA,
            "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")}


@router.get("/dashboard")
async def dashboard():
    return _nao_disponivel()


@router.get("/indicadores")
async def indicadores():
    return _nao_disponivel()
