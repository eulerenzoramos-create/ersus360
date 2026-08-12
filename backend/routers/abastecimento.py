"""Abastecimento de Água e Saneamento — FMS Apuí/AM · Saúde Ambiental"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/abastecimento", tags=["abastecimento"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }
