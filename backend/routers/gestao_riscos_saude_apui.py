"""Router: /api/gestao-riscos-saude-apui — ERSUS 360 — SINAN+SIH dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sinan_service import buscar_agravos_resumo, buscar_malaria
router = APIRouter(prefix="/api/gestao-riscos-saude-apui", tags=["Gestão de Riscos Apuí"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    # Total de internações do SIH e alerta por limiar fixo (>200 casos de malária) removidos em 21/10/2026:
    # não medem risco e o limiar não tem norma de origem.
    sinan = await buscar_agravos_resumo(ano); mal = await buscar_malaria(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [*sinan, mal])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "agravos": sinan, "malaria": mal, "casos_malaria": mal.get("total_casos"), "nota": "Matriz de riscos (probabilidade × impacto) requer módulo local (pendente). Aqui só aparecem casos notificados no SINAN.", "fonte": "SINAN — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
@router.get("/matriz")
async def matriz(ano: int = Query(0)): return await dashboard(ano=ano)
