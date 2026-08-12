"""
Router: /api/aps — Atenção Primária à Saúde
Integração SISAB · e-SUS APS · Indicadores de cobertura · ICSAP
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/aps", tags=["APS"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }
