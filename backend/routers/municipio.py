"""Router: /api/municipio — ERSUS 360 — CNES+SIA dados abertos (município da sessão)"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.cnes_service import resumo_estabelecimentos
from services.sia_service import buscar_producao
from tenancy.contexto import municipio_atual
router = APIRouter(prefix="/api/municipio", tags=["Município"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    cnes = await resumo_estabelecimentos(); sia = await buscar_producao(ano)
    cnes = cnes if isinstance(cnes, dict) else {"total": len(cnes), "situacao_dado": "oficial_validado" if cnes else "nao_disponivel"}
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [cnes, sia])
    mun = municipio_atual()
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "municipio": mun.nome, "ibge": mun.ibge, "ano": ano, "estabelecimentos": cnes.get("total"), "producao": sia.get("total_procedimentos"), "fonte": "CNES + SIA — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
