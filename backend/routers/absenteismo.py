"""Router: /api/absenteismo — Absenteísmo — ERSUS 360

Sem fonte oficial integrada: todas as rotas respondem nao_disponivel com a explicação. Até 21/10/2026
devolviam dados escritos no código rotulados "referencia_municipal" — removidos (ver NOTA).
"""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter

router = APIRouter(prefix="/api/absenteismo", tags=["Absenteísmo"])
NOTA = ('Faltas e afastamentos vêm da folha/ponto do RH da Prefeitura, ainda não integrados. Os servidores e motivos de saúde que existiam aqui não eram registros reais e foram removidos (dado pessoal sensível).')


def _nao_disponivel() -> dict:
    return {"situacao_dado": "nao_disponivel", "dados": None, "nota": NOTA,
            "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")}


@router.get("/dashboard")
async def dashboard():
    return _nao_disponivel()


@router.get("/servidores")
async def servidores():
    return _nao_disponivel()
