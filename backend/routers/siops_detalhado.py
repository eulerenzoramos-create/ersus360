"""SIOPS Detalhado — EC29 · Vinculação · Teto MAC · Execução por Bloco · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/siops-detalhado", tags=["siops_detalhado"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }
