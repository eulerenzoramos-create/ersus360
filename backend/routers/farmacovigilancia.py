"""Farmacovigilância — RAM · NOTIVISA · Queixas Técnicas · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/farmacovigilancia", tags=["farmacovigilancia"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }
