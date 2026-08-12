"""PNAE — Programa Nacional de Alimentação Escolar · FNDE · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/pnae", tags=["pnae"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }
