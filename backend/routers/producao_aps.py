"""
Router: /api/producao-aps — Producao APS (e-SUS PEC / SISAB)
Dados reais somente. Sem API local configurada → nao_disponivel.
"""
from __future__ import annotations
from fastapi import APIRouter, Depends
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/producao-aps", tags=["producao-aps"])

_NOTA = (
    "Producao APS requer acesso ao e-SUS PEC local (ESUS_URL, ESUS_USUARIO, ESUS_SENHA) "
    "ou exportacao do SISAB. Configure as variaveis no Railway para habilitar este modulo."
)


@router.get("/resumo")
async def resumo(_: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado":    "nao_disponivel",
        "atendimentos_mes": None,
        "nota":             _NOTA,
    }


@router.get("/atendimentos")
async def atendimentos(_: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado": "nao_disponivel",
        "dados":         [],
        "nota":          _NOTA,
    }


@router.get("/cids")
async def cids(_: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado": "nao_disponivel",
        "dados":         [],
        "nota":          _NOTA,
    }


@router.get("/fichas")
async def fichas(_: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado": "nao_disponivel",
        "dados":         [],
        "nota":          _NOTA,
    }
