"""PAT Saúde — Patrimônio de Saúde · Inventário · Depreciação · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/pat-saude", tags=["pat_saude"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }
