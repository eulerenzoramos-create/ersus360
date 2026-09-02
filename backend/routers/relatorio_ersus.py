"""Router: /api/relatorio-ersus — ERSUS 360 — SIH+SIA+SIOPS+SINAN dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sih_service import buscar_internacoes
from services.sia_service import buscar_producao
from services.siops_service import buscar_apuracao
from services.sinan_service import buscar_agravos_resumo
router = APIRouter(prefix="/api/relatorio-ersus", tags=["Relatório ERSUS 360"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    sih = await buscar_internacoes(ano); sia = await buscar_producao(ano)
    siops = await buscar_apuracao(ano); sinan = await buscar_agravos_resumo(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [sih, sia, siops, sinan])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "internacoes": sih.get("total_internacoes"), "producao_ambulatorial": sia.get("total_procedimentos"), "financeiro": siops, "agravos": sinan, "fonte": "SIH + SIA + SIOPS + SINAN — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
@router.get("/gerar")
async def gerar(ano: int = Query(0)): return await dashboard(ano=ano)
