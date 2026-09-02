"""
Router: /api/doencas-negligenciadas-apui — ERSUS 360
Doenças negligenciadas via SINAN + SIH — DATASUS dados abertos.
(Leishmaniose, Chagas, Esquistossomose, Hanseníase — endêmicas na Amazônia)
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sinan_service import buscar_agravos_resumo, buscar_hanseniase
from services.sih_service import buscar_internacoes

router = APIRouter(prefix="/api/doencas-negligenciadas-apui", tags=["doencas_negligenciadas_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    agravos    = await buscar_agravos_resumo(ano)
    hanseniase = await buscar_hanseniase(ano)
    sih        = await buscar_internacoes(ano)
    return {
        "situacao_dado": agravos.get("situacao_dado"),
        "ano": ano,
        "agravos_sinan": agravos,
        "hanseniase": hanseniase,
        "internacoes": sih.get("total_internacoes"),
        "nota": "Leishmaniose, Chagas, Esquistossomose requerem endpoints SINAN específicos (pendente disponibilização API pública).",
        "fonte": "SINAN + SIH — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/hanseniase")
async def hanseniase(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    result = await buscar_hanseniase(ano)
    result["verificado_em"] = _TS()
    return result


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
