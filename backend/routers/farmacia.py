"""
Router: /api/farmacia — Gestão da Assistência Farmacêutica
Hórus · BNAFAR · Estoque · Dispensação · Farmácia Popular
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/farmacia", tags=["Farmácia"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }
