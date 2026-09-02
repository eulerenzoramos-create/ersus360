"""Router: /api/seguranca-paciente — ERSUS 360 — SIH dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sih_service import buscar_internacoes, buscar_historico
router = APIRouter(prefix="/api/seguranca-paciente", tags=["seguranca_paciente"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    sih = await buscar_internacoes(ano); hist = await buscar_historico(5)
    return {"situacao_dado": sih.get("situacao_dado"), "ano": ano, "total_internacoes": sih.get("total_internacoes"), "valor_total": sih.get("valor_total_reais"), "historico": hist.get("historico"), "fonte": "SIH — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
