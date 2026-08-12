"""Consultório na Rua — Pop. em Situação de Rua · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/consultorio-rua", tags=["consultorio_rua"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }
