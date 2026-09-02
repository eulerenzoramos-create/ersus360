"""Router: /api/municipio — ERSUS 360 — CNES+SIA dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.cnes_service import buscar_estabelecimentos
from services.sia_service import buscar_producao
router = APIRouter(prefix="/api/municipio", tags=["Município"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    cnes = await buscar_estabelecimentos(); sia = await buscar_producao(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [cnes, sia])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "municipio": "Apuí", "ibge": "1300144", "ano": ano, "estabelecimentos": cnes.get("total"), "producao": sia.get("total_procedimentos"), "fonte": "CNES + SIA — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
