"""
Router: /api/relatorios — Módulo 10: Prestação de Contas e Relatórios
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/relatorios", tags=["Relatórios"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }
