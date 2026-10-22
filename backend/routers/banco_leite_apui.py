"""Router: /api/banco-leite-apui — Banco de Leite Humano — ERSUS 360

Sem fonte específica integrada: responde nao_disponivel com a explicação. Até 21/10/2026 devolvia dados de
outro assunto (proxy) que a tela poderia exibir com este rótulo — ver nota.
"""
from __future__ import annotations

from datetime import date, datetime

from fastapi import APIRouter, Query

router = APIRouter(prefix="/api/banco-leite-apui", tags=["banco_leite_apui"])
NOTA = ("Coleta, doadoras e distribuição de leite humano vêm da rede rBLH (REDEBLH), ainda não integrada. O total de estabelecimentos do CNES e os nascidos vivos do SINASC não medem a operação do banco de leite e não são mais exibidos.")


def _ts() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    return {"situacao_dado": "nao_disponivel", "dados": None, "ano": ano or date.today().year - 1, "nota": NOTA,
            "verificado_em": _ts()}


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
