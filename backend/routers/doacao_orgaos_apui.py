"""
Router: /api/doacao-orgaos-apui — ERSUS 360
Doação de órgãos via SIH + CNES — DATASUS dados abertos.
SNT/ABTO requerem integração específica (pendente).
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sih_service import buscar_internacoes
from services.cnes_service import buscar_estabelecimentos

router = APIRouter(prefix="/api/doacao-orgaos-apui", tags=["doacao_orgaos_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "Registro de doadores/receptores requer SNT/RNT (pendente integração)."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    sih  = await buscar_internacoes(ano)
    cnes = await buscar_estabelecimentos()
    return {
        "situacao_dado": sih.get("situacao_dado"),
        "ano": ano,
        "internacoes": sih.get("total_internacoes"),
        "estabelecimentos": cnes.get("total"),
        "nota": _NOTA,
        "fonte": "SIH + CNES — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
