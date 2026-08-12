"""PSE — Programa Saúde na Escola · Avaliações · Ações · Cobertura · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/pse", tags=["pse"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }
