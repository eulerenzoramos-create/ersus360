"""Saúde do Servidor — PCMSO · CAT · Afastamentos · Exames Periódicos · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-servidor", tags=["saude_servidor"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }
