"""
Router: /api/ia — IA Gestora (Claude API)
Chat contextualizado com dados reais do banco de dados.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/ia", tags=["IA Gestora"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }
