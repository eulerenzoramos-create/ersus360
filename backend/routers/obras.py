"""
Router: /api/obras — Módulo 4: Obras e SISMOB
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/obras", tags=["Obras"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }
