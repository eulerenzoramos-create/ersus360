"""Router: /api/cadeia-frio-apui — Cadeia de Frio — ERSUS 360

Sem fonte específica integrada: responde nao_disponivel com a explicação. Até 21/10/2026 devolvia dados de
outro assunto (proxy) que a tela poderia exibir com este rótulo — ver nota.
"""
from __future__ import annotations

from datetime import date, datetime

from fastapi import APIRouter, Query

router = APIRouter(prefix="/api/cadeia-frio-apui", tags=["Cadeia de Frio Apuí"])
NOTA = ("Temperatura, câmaras e perdas de vacinas vêm do sistema da rede de frio (SIES/registro local), ainda não integrado. O total de estabelecimentos e a cobertura vacinal não medem a cadeia de frio e não são mais exibidos.")


def _ts() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    return {"situacao_dado": "nao_disponivel", "dados": None, "ano": ano or date.today().year - 1, "nota": NOTA,
            "verificado_em": _ts()}


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
