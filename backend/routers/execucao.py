"""
Router: /api/execucao — Módulo 3: Execução Financeira
Empenho → Liquidação → Pagamento · Restos a Pagar · Aplicações
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/execucao", tags=["Execução Financeira"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }
