"""Saúde Sexual e Reprodutiva — Planejamento Familiar / IST / Pré-Natal · Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-sexual-reprodutiva-apui", tags=["Saúde Sexual Reprodutiva Apuí"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }
