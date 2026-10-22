"""Router: /api/monitoramento-rt — Monitoramento da produção em tempo real (ESF/ESB/eMulti) — ERSUS 360

Sem fonte integrada: responde nao_disponivel com a explicação. Até 21/10/2026 o painel devolvia agravos do SINAN
(malária/dengue), que não são produção das equipes — a tela os exibiria sob "Atendimentos".
"""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter

router = APIRouter(prefix="/api/monitoramento-rt", tags=["monitoramento_rt"])
NOTA = ("Atendimentos do dia, por equipe e por profissional vêm do e-SUS APS (PEC) do município, via agente local "
        "ainda não autorizado/instalado. Agravos do SINAN não são produção das equipes e não são mais exibidos aqui.")


def _nao_disponivel() -> dict:
    return {"situacao_dado": "nao_disponivel", "dados": None, "nota": NOTA,
            "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")}


@router.get("/dashboard")
async def dashboard():
    return _nao_disponivel()


@router.get("/indicadores")
async def indicadores():
    return _nao_disponivel()


@router.get("/rt-estimativa")
async def rt_estimativa():
    return _nao_disponivel()
