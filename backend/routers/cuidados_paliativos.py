"""Cuidados Paliativos — Equipe Multiprofissional · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/cuidados-paliativos", tags=["cuidados_paliativos"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }
