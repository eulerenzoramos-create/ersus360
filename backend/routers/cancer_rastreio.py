"""Router: /api/cancer-rastreio — Rastreio de Câncer — ERSUS 360

Sem fonte específica integrada: responde nao_disponivel com a explicação. Até 21/10/2026 devolvia dados de
outro assunto (proxy) que a tela poderia exibir com este rótulo — ver nota.
"""
from __future__ import annotations

from datetime import date, datetime

from fastapi import APIRouter, Query

router = APIRouter(prefix="/api/cancer-rastreio", tags=["cancer_rastreio"])
NOTA = ("Exames de rastreio (citopatológico, mamografia) vêm do SISCAN/SIA por procedimento, ainda não integrados. O total geral de procedimentos do SIA não é produção oncológica e não é mais exibido.")


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    return {"situacao_dado": "nao_disponivel", "dados": None, "ano": ano or date.today().year - 1, "nota": NOTA,
            "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")}


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
