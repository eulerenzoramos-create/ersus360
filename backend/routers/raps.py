"""Router: /api/raps — ERSUS 360 — SIA+CNES dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sia_service import buscar_producao
from services.cnes_service import buscar_estabelecimentos
router = APIRouter(prefix="/api/raps", tags=["RAPS"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
_NOTA = "RAAS individual requer e-SUS PEC (pendente). SIA/CNES como proxy de oferta RAPS."
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    sia = await buscar_producao(ano); cnes = await buscar_estabelecimentos()
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [sia, cnes])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "producao": sia.get("total_procedimentos"), "estabelecimentos": cnes.get("total"), "nota": _NOTA, "fonte": "SIA + CNES — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
