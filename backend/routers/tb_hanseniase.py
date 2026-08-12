"""TB e Hanseníase — SINAN · DOTS · PQT · Vigilância Epidemiológica · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/tb-hanseniase", tags=["tb_hanseniase"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }
