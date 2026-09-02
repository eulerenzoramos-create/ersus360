"""
Router: /api/nutricao-clinica-apui — ERSUS 360
Produção nutricional via SIA/DATASUS. Dados SISVAN requerem integração
e-Gestor/SISVAN (pendente). Sem dados fictícios.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query

from services.sia_service import buscar_producao
from services.cache_service import cache_get, cache_set

router = APIRouter(prefix="/api/nutricao-clinica-apui", tags=["Nutrição Clínica Apuí"])

_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_SISVAN_PENDENTE = "Dados do SISVAN (estado nutricional, marcadores alimentares) requerem integração e-Gestor/SISVAN (pendente)."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    """Dashboard nutricional — produção ambulatorial via SIA."""
    if not ano:
        ano = _ANO()
    ck = f"sia_producao_{ano}"
    cached = cache_get(ck)
    base = cached if cached else await buscar_producao(ano)
    return {
        **base,
        "modulo": "nutricao_clinica",
        "nota_sisvan": _SISVAN_PENDENTE,
        "verificado_em": _TS(),
    }


@router.get("/sisvan")
async def sisvan():
    return {"situacao_dado": "nao_disponivel", "nota": _SISVAN_PENDENTE, "verificado_em": _TS()}


@router.get("/indicadores")
async def indicadores():
    return {"situacao_dado": "nao_disponivel", "nota": _SISVAN_PENDENTE, "verificado_em": _TS()}
