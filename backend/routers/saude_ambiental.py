"""Router: /api/saude-ambiental — ERSUS 360 (genérico) — SINAN+SIH dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sinan_service import buscar_agravos_resumo
from services.sih_service import buscar_internacoes
router = APIRouter(prefix="/api/saude-ambiental", tags=["saude_ambiental"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    ag = await buscar_agravos_resumo(ano); sih = await buscar_internacoes(ano)
    return {"situacao_dado": ag.get("situacao_dado"), "ano": ano, "agravos": ag, "internacoes": sih.get("total_internacoes"), "nota": "Dados ambientais SISÁGUA/IBAMA requerem integração (pendente).", "fonte": "SINAN + SIH — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
