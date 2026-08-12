"""SAMU — Serviço de Atendimento Móvel de Urgência · RUTE · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/samu", tags=["samu"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }
