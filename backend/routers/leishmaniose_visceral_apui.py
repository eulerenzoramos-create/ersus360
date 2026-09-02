"""
Router: /api/leishmaniose-visceral-apui — ERSUS 360
Leishmaniose via SINAN — DATASUS dados abertos.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sinan_service import buscar_agravos_resumo

router = APIRouter(prefix="/api/leishmaniose-visceral-apui", tags=["leishmaniose_visceral_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "Dados específicos de leishmaniose visceral/tegumentar requerem endpoint SINAN /leishmaniose (pendente disponibilização na API pública)."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    agravos = await buscar_agravos_resumo(ano)
    return {
        "situacao_dado": agravos.get("situacao_dado"),
        "ano": ano,
        "agravos_sinan": agravos,
        "nota": _NOTA,
        "fonte": "SINAN — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/casos")
async def casos():
    return {"situacao_dado": "nao_disponivel", "nota": _NOTA, "verificado_em": _TS()}


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
