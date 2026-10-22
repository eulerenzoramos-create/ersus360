"""Router: /api/infraestrutura-ubs-apui — ERSUS 360

Painel sem fonte específica integrada: responde nao_disponivel com a explicação (/estabelecimentos = CNES, mantido). Até 21/10/2026 devolvia dados de
outro assunto (proxy) que a tela poderia exibir com este rótulo — ver NOTA.
"""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter

from services.cnes_service import resumo_estabelecimentos

router = APIRouter(prefix="/api/infraestrutura-ubs-apui", tags=["infraestrutura_ubs_apui"])
NOTA = ("Condições físicas das UBS (estrutura, energia, equipamentos) vêm de vistoria local/SCNES detalhado, ainda não "
        "integrados. O total de estabelecimentos do CNES não mede condição de infraestrutura e não é mais exibido no painel.")


def _nao_disponivel() -> dict:
    return {"situacao_dado": "nao_disponivel", "dados": None, "nota": NOTA,
            "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")}


@router.get("/dashboard")
async def dashboard():
    return _nao_disponivel()


@router.get("/indicadores")
async def indicadores():
    return _nao_disponivel()


@router.get("/estabelecimentos")
async def estabelecimentos():
    # Cadastro do CNES: é o dado deste assunto (lista de estabelecimentos), mantido.
    cnes = await resumo_estabelecimentos()
    return {"situacao_dado": cnes.get("situacao_dado"), "dados": cnes,
            "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")}
