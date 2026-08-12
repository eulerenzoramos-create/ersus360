"""Router: /api/emendas — Emendas Parlamentares (InvestSUS / DigiSUS Gestor)"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/emendas", tags=["Emendas"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }
