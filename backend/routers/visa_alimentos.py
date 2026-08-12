"""VISA Alimentos — Vigilância Sanitária de Alimentos · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/visa-alimentos", tags=["visa_alimentos"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }
