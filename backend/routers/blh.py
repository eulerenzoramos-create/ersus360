"""Router: /api/blh — ERSUS 360 — CNES+SINASC dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.cnes_service import buscar_estabelecimentos
from services.sim_sinasc_service import buscar_nascidos_vivos
router = APIRouter(prefix="/api/blh", tags=["blh"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
_NOTA = "Dados internos BLH (coleta, pasteurização) requerem sistema local (pendente). CNES/SINASC como proxy."
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    cnes = await buscar_estabelecimentos(); sinasc = await buscar_nascidos_vivos(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [cnes, sinasc])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "estabelecimentos": cnes.get("total"), "nascidos_vivos": sinasc.get("total_nascidos"), "nota": _NOTA, "fonte": "CNES + SINASC — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
