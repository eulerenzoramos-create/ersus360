from fastapi import APIRouter

router = APIRouter(prefix="/api/triagem-neonatal-apui", tags=["triagem_neonatal_apui"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }
