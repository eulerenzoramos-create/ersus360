"""Router: /api/aps — Atenção Primária (visão geral) — ERSUS 360

Sem fonte própria: responde nao_disponivel e aponta o Monitoramento SIAPS, onde está o resultado oficial.
Até 21/10/2026 devolvia indicadores de um endpoint do FNS que não existe (/api/previne/indicadores) e o total
de procedimentos do SIA — que não é produção da APS (essa vem do SISAB).
"""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Query

router = APIRouter(prefix="/api/aps", tags=["APS"])
NOTA = ("Cobertura, equipes e indicadores oficiais da APS estão no Monitoramento SIAPS (e-Gestor), por equipe e "
        "competência. Esta visão geral ainda não tem fonte própria; o total do SIA não é produção da APS.")


def _nao_disponivel(ano: int = 0) -> dict:
    return {"situacao_dado": "nao_disponivel", "dados": None, "ano": ano or None, "nota": NOTA,
            "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")}


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    return _nao_disponivel(ano)


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return _nao_disponivel(ano)


@router.get("/cobertura")
async def cobertura(ano: int = Query(0)):
    return _nao_disponivel(ano)
