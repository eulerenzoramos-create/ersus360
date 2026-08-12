"""Gestão de Riscos em Saúde — Matriz de Riscos SMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/gestao-riscos-saude-apui", tags=["Gestão de Riscos Apuí"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }
