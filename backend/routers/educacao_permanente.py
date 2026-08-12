"""Educação Permanente em Saúde — EPS · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/educacao-permanente", tags=["educacao_permanente"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }
