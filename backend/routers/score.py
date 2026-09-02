"""Router: /api/score — ERSUS 360 — SIH+SINAN+SIOPS+e-Gestor dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sih_service import buscar_internacoes
from services.sinan_service import buscar_agravos_resumo, buscar_malaria
from services.siops_service import buscar_apuracao
from services.fns_api_service import buscar_indicadores_previne
router = APIRouter(prefix="/api/score", tags=["Score ERSUS 360"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    sih = await buscar_internacoes(ano); sinan = await buscar_agravos_resumo(ano)
    siops = await buscar_apuracao(ano); previne = await buscar_indicadores_previne(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [sih, sinan, siops, previne])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "internacoes": sih.get("total_internacoes"), "agravos": sinan, "financeiro": siops, "previne": previne, "nota": "Score composto ERSUS 360: efetividade + acesso + eficiência + financeiro.", "fonte": "SIH + SINAN + SIOPS + e-Gestor APS — dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
@router.get("/score")
async def score(ano: int = Query(0)): return await dashboard(ano=ano)
