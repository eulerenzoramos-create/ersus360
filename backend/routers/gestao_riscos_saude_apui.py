"""Router: /api/gestao-riscos-saude-apui — ERSUS 360 — SINAN+SIH dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sinan_service import buscar_agravos_resumo, buscar_malaria
from services.sih_service import buscar_internacoes
router = APIRouter(prefix="/api/gestao-riscos-saude-apui", tags=["Gestão de Riscos Apuí"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    sinan = await buscar_agravos_resumo(ano); mal = await buscar_malaria(ano); sih = await buscar_internacoes(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [*sinan, mal, sih])
    alertas = []
    if mal.get("situacao_dado") == "oficial_validado" and (mal.get("total_casos") or 0) > 200:
        alertas.append({"nivel": "critico", "mensagem": f"Risco malária: {mal.get('total_casos')} casos"})
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "agravos": sinan, "malaria": mal, "internacoes": sih.get("total_internacoes"), "alertas": alertas, "nota": "Matriz de riscos detalhada requer módulo local (pendente).", "fonte": "SINAN + SIH — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
@router.get("/matriz")
async def matriz(ano: int = Query(0)): return await dashboard(ano=ano)
