"""Router: /api/mercurio-garimpo-apui — ERSUS 360

Sem fonte específica integrada: responde nao_disponivel com a explicação. Até 21/10/2026 devolvia dados de
outro assunto (proxy) que a tela poderia exibir com este rótulo — ver NOTA.
"""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter

router = APIRouter(prefix="/api/mercurio-garimpo-apui", tags=["mercurio_garimpo_apui"])
NOTA = ('Intoxicação por mercúrio CID T56.1 requer SINAN SINITOX (pendente). Dados IBAMA/monitoramento ambiental pendentes. Antes esta tela recebia o total de internações do SIH e os agravos do SINAN (malária, dengue, TB, hanseníase), que não medem este assunto; não são mais exibidos.')


def _nao_disponivel() -> dict:
    return {"situacao_dado": "nao_disponivel", "dados": None, "nota": NOTA,
            "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")}


@router.get("/dashboard")
async def dashboard():
    return _nao_disponivel()


@router.get("/indicadores")
async def indicadores():
    return _nao_disponivel()
