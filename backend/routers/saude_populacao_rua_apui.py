"""Saúde da População em Situação de Rua — Consultório na Rua / CnaR · Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-populacao-rua-apui", tags=["Saúde Pop. Rua Apuí"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }
