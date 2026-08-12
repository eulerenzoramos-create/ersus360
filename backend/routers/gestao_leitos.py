"""Gestão de Leitos — Ocupação · Espera · Causas · SISREG · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/gestao-leitos", tags=["gestao_leitos"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }
