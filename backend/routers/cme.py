"""CME — Central de Material e Esterilização · Ciclos · Biológicos · Rastreabilidade · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/cme", tags=["cme"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }
