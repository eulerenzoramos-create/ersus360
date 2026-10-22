"""Router: /api/okr — OKR — ERSUS 360

Sem fonte oficial integrada: todas as rotas respondem nao_disponivel com a explicação. Até 21/10/2026
devolviam dados escritos no código rotulados "referencia_municipal" — removidos (ver NOTA).
"""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter

router = APIRouter(prefix="/api/okr", tags=["okr"])
NOTA = ('Objetivos e resultados-chave dependem do Plano Municipal de Saúde e da PAS aprovados, ainda não cadastrados no sistema. Os objetivos e percentuais que existiam aqui não tinham fonte e foram removidos.')


def _nao_disponivel() -> dict:
    return {"situacao_dado": "nao_disponivel", "dados": None, "nota": NOTA,
            "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")}


@router.get("/resumo")
async def resumo():
    return _nao_disponivel()


@router.get("/objetivos")
async def objetivos():
    return _nao_disponivel()


@router.post("/atualizar")
async def atualizar():
    return {**_nao_disponivel(), "ok": False}
