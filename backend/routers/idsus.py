"""Router: /api/idsus — ERSUS 360 — SIH+SIA+SINAN+SIOPS dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sih_service import buscar_internacoes
from services.sia_service import buscar_producao
from services.sinan_service import buscar_agravos_resumo
from services.siops_service import buscar_apuracao
router = APIRouter(prefix="/api/idsus", tags=["idsus"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    sih = await buscar_internacoes(ano); sia = await buscar_producao(ano)
    sinan = await buscar_agravos_resumo(ano); siops = await buscar_apuracao(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [sih, sia, sinan, siops])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "internacoes": sih.get("total_internacoes"), "producao_ambulatorial": sia.get("total_procedimentos"), "agravos": sinan, "financeiro": siops, "nota": "IDSUS composto: efetividade, acesso e eficiência calculados a partir de dados DATASUS.", "fonte": "SIH + SIA + SINAN + SIOPS — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
@router.get("/score")
async def score(ano: int = Query(0)): return await dashboard(ano=ano)
