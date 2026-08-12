"""Planejamento Familiar — Métodos · DIU · Laqueadura · Vasectomia · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/planejamento-familiar", tags=["planejamento_familiar"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }
