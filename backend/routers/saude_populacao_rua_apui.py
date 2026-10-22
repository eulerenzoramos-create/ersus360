"""Router: /api/saude-populacao-rua-apui — Saúde da População em Situação de Rua — ERSUS 360

Sem fonte específica integrada: responde nao_disponivel com a explicação. Até 21/10/2026 devolvia dados de
outro assunto (proxy) que a tela poderia exibir com este rótulo — ver nota.
"""
from __future__ import annotations

from datetime import date, datetime

from fastapi import APIRouter, Query

router = APIRouter(prefix="/api/saude-populacao-rua-apui", tags=["saude_populacao_rua_apui"])
NOTA = ("Atendimentos à população em situação de rua vêm do e-SUS APS (campo situação de rua / eCR), ainda não integrado. O total do SIA e o total de estabelecimentos do CNES não medem essa população e não são mais exibidos.")


def _ts() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    return {"situacao_dado": "nao_disponivel", "dados": None, "ano": ano or date.today().year - 1, "nota": NOTA,
            "verificado_em": _ts()}


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
