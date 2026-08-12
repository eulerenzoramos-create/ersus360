"""
Router: /api/siops — SIOPS / Minimo Constitucional em Saude
Apuracao do gasto em saude conforme EC 29/2000 e LC 141/2012
API publica: https://apidadosabertos.saude.gov.br/siops/
Dados reais somente. Sem API disponivel → nao_disponivel.
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut
from services import siops_service

router = APIRouter(prefix="/api/siops", tags=["SIOPS"])


@router.get("/apuracao")
async def apuracao_minimo(
    ano: int = Query(2026),
    _: UserOut = Depends(get_current_user),
):
    """Apuracao do minimo constitucional em saude (EC 29 / LC 141) via API SIOPS."""
    return await siops_service.buscar_apuracao(ano)


@router.get("/trimestral")
async def execucao_trimestral(_: UserOut = Depends(get_current_user)):
    """Execucao trimestral do minimo constitucional — requer SIOPS com dados parciais anuais."""
    return {
        "situacao_dado": "nao_disponivel",
        "trimestres":    [],
        "nota": (
            "Dados trimestrais SIOPS nao possuem API publica automatica por municipio. "
            "Dados anuais disponiveis via /apuracao."
        ),
    }


@router.get("/blocos")
async def execucao_blocos(_: UserOut = Depends(get_current_user)):
    """Execucao por bloco de financiamento FNS — requer SIOPS detalhado."""
    return {
        "situacao_dado": "nao_disponivel",
        "blocos":        [],
        "nota": (
            "Execucao por bloco nao disponivel via API publica automatica. "
            "Insira os dados manualmente ou via importacao SIOPS."
        ),
    }


@router.get("/historico")
async def historico_minimo(_: UserOut = Depends(get_current_user)):
    """Historico do minimo constitucional — ultimos anos via API SIOPS."""
    historico = await siops_service.buscar_historico()
    return {"municipio": "Apui/AM", "historico": historico}
