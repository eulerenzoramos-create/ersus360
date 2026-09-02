"""Router: /api/dashboard-exec — ERSUS 360 — SIOPS+SIH+SINAN+e-Gestor dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.siops_service import buscar_apuracao
from services.sih_service import buscar_internacoes
from services.sinan_service import buscar_malaria, buscar_dengue
from services.fns_api_service import buscar_indicadores_previne
router = APIRouter(prefix="/api/dashboard-exec", tags=["Dashboard Executivo"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    siops = await buscar_apuracao(ano); sih = await buscar_internacoes(ano)
    mal = await buscar_malaria(ano); previne = await buscar_indicadores_previne(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [siops, sih, mal, previne])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "financeiro": siops, "internacoes": sih.get("total_internacoes"), "malaria_casos": mal.get("total_casos"), "previne": previne, "fonte": "SIOPS + SIH + SINAN + e-Gestor APS — dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
@router.get("/resumo")
async def resumo(ano: int = Query(0)): return await dashboard(ano=ano)
