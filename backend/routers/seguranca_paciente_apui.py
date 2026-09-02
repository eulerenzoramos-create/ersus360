"""Router: /api/seguranca-paciente-apui — ERSUS 360 — SIH dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sih_service import buscar_internacoes, buscar_historico
router = APIRouter(prefix="/api/seguranca-paciente-apui", tags=["seguranca_paciente_apui"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
_NOTA = "Incidentes individuais requerem sistema local de notificação (NOTIVISA/ANVISA pendente). SIH como proxy hospitalar."
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    sih = await buscar_internacoes(ano)
    return {"situacao_dado": sih.get("situacao_dado"), "ano": ano, "internacoes": sih.get("total_internacoes"), "obitos_hospitalares": sih.get("obitos"), "nota": _NOTA, "fonte": "SIH — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
@router.get("/historico")
async def historico():
    hist = await buscar_historico(5)
    return {"situacao_dado": hist.get("situacao_dado"), "historico": hist.get("historico"), "nota": _NOTA, "verificado_em": _TS()}
