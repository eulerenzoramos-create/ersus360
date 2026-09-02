"""
Router: /api/doencas-raras-apui — ERSUS 360
Doenças raras via SIH — DATASUS dados abertos.
Medicamentos de alto custo via CEAF/farmácia especializada.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sih_service import buscar_internacoes

router = APIRouter(prefix="/api/doencas-raras-apui", tags=["doencas_raras_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "Registro de pacientes com doenças raras requer integração RARAS/RENAME (pendente)."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    sih = await buscar_internacoes(ano)
    return {
        "situacao_dado": sih.get("situacao_dado"),
        "ano": ano,
        "internacoes": sih.get("total_internacoes"),
        "nota": _NOTA,
        "fonte": "SIH — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
