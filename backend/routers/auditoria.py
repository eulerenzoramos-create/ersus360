"""Router: /api/auditoria — ERSUS 360

Sem fonte específica integrada: responde nao_disponivel com a explicação. Até 21/10/2026 devolvia dados de
outro assunto (proxy) que a tela poderia exibir com este rótulo — ver NOTA.
"""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter

router = APIRouter(prefix="/api/auditoria", tags=["Auditoria"])
NOTA = ('Logs de auditoria internos requerem sistema local. Antes esta tela recebia o total de internações do SIH e a despesa do SIOPS, que não medem este assunto; não são mais exibidos.')


def _nao_disponivel() -> dict:
    return {"situacao_dado": "nao_disponivel", "dados": None, "nota": NOTA,
            "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")}


# /dashboard ficava aqui e encobria o de auditoria_aps.py (registrado depois em main.py), que é o painel
# lido pela Central de Auditoria. Removido em 21/10/2026.


@router.get("/indicadores")
async def indicadores():
    return _nao_disponivel()


@router.get("/logs")
async def logs():
    return _nao_disponivel()
