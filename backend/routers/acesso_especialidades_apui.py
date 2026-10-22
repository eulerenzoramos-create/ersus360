"""Router: /api/acesso-especialidades-apui — Acesso a Especialidades — ERSUS 360

Sem fonte específica integrada: responde nao_disponivel com a explicação. Até 21/10/2026 devolvia dados de
outro assunto (proxy) que a tela poderia exibir com este rótulo — ver nota.
"""
from __future__ import annotations

from datetime import date, datetime

from fastapi import APIRouter, Query

router = APIRouter(prefix="/api/acesso-especialidades-apui", tags=["acesso_especialidades_apui"])
NOTA = ("Fila e oferta por especialidade vêm do SISREG/regulação, ainda não integrado. O total geral de procedimentos do SIA e o total de estabelecimentos do CNES não medem acesso a especialidades e não são mais exibidos.")


def _ts() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    return {"situacao_dado": "nao_disponivel", "dados": None, "ano": ano or date.today().year - 1, "nota": NOTA,
            "verificado_em": _ts()}


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)


@router.get("/lista-espera")
async def lista_espera():
    return {"situacao_dado": "nao_disponivel", "nota": NOTA, "verificado_em": _ts()}
