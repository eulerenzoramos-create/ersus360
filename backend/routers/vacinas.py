"""Router: /api/vacinas — ERSUS 360 — PNI dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.pni_service import buscar_cobertura, buscar_historico
router = APIRouter(prefix="/api/vacinas", tags=["Sala de Vacinas"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    pni = await buscar_cobertura(ano); hist = await buscar_historico(5)
    return {"situacao_dado": pni.get("situacao_dado"), "ano": ano, "cobertura_vacinal": pni.get("cobertura_media"), "historico": hist.get("historico"), "fonte": "PNI — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
