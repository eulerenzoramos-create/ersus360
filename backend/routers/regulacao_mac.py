"""Router: /api/regulacao-mac — ERSUS 360 — SIH dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sih_service import buscar_internacoes
from services.siops_service import buscar_apuracao
router = APIRouter(prefix="/api/regulacao-mac", tags=["regulacao_mac"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    sih = await buscar_internacoes(ano); siops = await buscar_apuracao(ano)
    return {"situacao_dado": sih.get("situacao_dado"), "ano": ano, "internacoes": sih.get("total_internacoes"), "valor_mac": sih.get("valor_total_reais"), "despesa_mac_siops": siops.get("despesa_total_saude"), "fonte": "SIH + SIOPS — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
