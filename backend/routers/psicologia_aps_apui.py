from fastapi import APIRouter

router = APIRouter(prefix="/api/psicologia-aps-apui", tags=["Psicologia APS Apuí"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }
