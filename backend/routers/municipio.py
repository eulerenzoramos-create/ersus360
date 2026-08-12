"""
Router: /api/municipio — Módulo 1: Cadastro do Município
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/municipio", tags=["Município"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }
