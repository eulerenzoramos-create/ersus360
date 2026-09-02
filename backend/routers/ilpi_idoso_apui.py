"""Router: /api/ilpi-idoso-apui — ERSUS 360 — CNES+SIH dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.cnes_service import buscar_estabelecimentos
from services.sih_service import buscar_internacoes
router = APIRouter(prefix="/api/ilpi-idoso-apui", tags=["ilpi_idoso_apui"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
_NOTA = "Registro de residentes ILPI requer sistema de vigilância ANVISA (pendente)."
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    cnes = await buscar_estabelecimentos(); sih = await buscar_internacoes(ano)
    return {"situacao_dado": cnes.get("situacao_dado"), "ano": ano, "estabelecimentos": cnes.get("total"), "internacoes": sih.get("total_internacoes"), "nota": _NOTA, "fonte": "CNES + SIH — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
