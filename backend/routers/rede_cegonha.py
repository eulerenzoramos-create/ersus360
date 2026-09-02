"""Router: /api/rede-cegonha — ERSUS 360 — SINASC+SIH dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sim_sinasc_service import buscar_nascidos_vivos, buscar_obitos
from services.sih_service import buscar_internacoes
router = APIRouter(prefix="/api/rede-cegonha", tags=["rede_cegonha"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
_NOTA = "Adesão à Rede Cegonha requer e-SUS PEC (pendente). SINASC/SIH como proxy materno-infantil."
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    nasc = await buscar_nascidos_vivos(ano); sih = await buscar_internacoes(ano)
    return {"situacao_dado": nasc.get("situacao_dado"), "ano": ano, "nascidos_vivos": nasc.get("total_nascidos"), "internacoes": sih.get("total_internacoes"), "nota": _NOTA, "fonte": "SINASC + SIH — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
