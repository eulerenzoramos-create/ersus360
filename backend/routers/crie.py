"""CRIE — Centro de Referência para Imunobiológicos Especiais · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/crie", tags=["crie"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }
