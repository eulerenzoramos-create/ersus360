"""Router: /api/gestao-qualidade — ERSUS 360 — SIH+SIA dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sih_service import buscar_internacoes
from services.sia_service import buscar_producao
router = APIRouter(prefix="/api/gestao-qualidade", tags=["gestao_qualidade"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
_NOTA = "Indicadores de qualidade individuais requerem ONA/PNASH (pendente). SIH/SIA como proxy de desempenho."
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    sih = await buscar_internacoes(ano); sia = await buscar_producao(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [sih, sia])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "internacoes": sih.get("total_internacoes"), "producao_ambulatorial": sia.get("total_procedimentos"), "nota": _NOTA, "fonte": "SIH + SIA — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
