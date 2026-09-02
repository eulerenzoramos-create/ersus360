"""Router: /api/gestao-leitos — ERSUS 360 — SIH+CNES dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sih_service import buscar_internacoes
from services.cnes_service import buscar_estabelecimentos
router = APIRouter(prefix="/api/gestao-leitos", tags=["gestao_leitos"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    sih = await buscar_internacoes(ano); cnes = await buscar_estabelecimentos()
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [sih, cnes])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "total_internacoes": sih.get("total_internacoes"), "estabelecimentos": cnes.get("total"), "fonte": "SIH + CNES — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
