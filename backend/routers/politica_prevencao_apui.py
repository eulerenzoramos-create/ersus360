"""Router: /api/politica-prevencao-apui — ERSUS 360 — SINAN+SIH dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sinan_service import buscar_agravos_resumo, buscar_malaria
from services.sih_service import buscar_internacoes
router = APIRouter(prefix="/api/politica-prevencao-apui", tags=["Política de Prevenção Apuí"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    ag = await buscar_agravos_resumo(ano); mal = await buscar_malaria(ano); sih = await buscar_internacoes(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [ag, mal, sih])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "agravos": ag, "malaria": mal, "internacoes": sih.get("total_internacoes"), "fonte": "SINAN + SIH — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
