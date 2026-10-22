"""Router: /api/ceac-ambulatorial-apui — Ambulatório de Especialidades — ERSUS 360

Sem fonte específica integrada: responde nao_disponivel com a explicação. Até 21/10/2026 devolvia dados de
outro assunto (proxy) que a tela poderia exibir com este rótulo — ver nota.
"""
from __future__ import annotations

from datetime import date, datetime

from fastapi import APIRouter, Query

router = APIRouter(prefix="/api/ceac-ambulatorial-apui", tags=["ceac_ambulatorial_apui"])
NOTA = ("Agendamentos e produção do ambulatório de especialidades dependem do SISREG e do SIA filtrado pelo estabelecimento, ainda não integrados. O total geral do SIA do município não é produção do ambulatório e não é mais exibido.")


def _ts() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    return {"situacao_dado": "nao_disponivel", "dados": None, "ano": ano or date.today().year - 1, "nota": NOTA,
            "verificado_em": _ts()}


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
