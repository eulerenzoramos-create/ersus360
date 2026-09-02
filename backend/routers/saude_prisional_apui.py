"""Router: /api/saude-prisional-apui — ERSUS 360 — SIA+SIH dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sia_service import buscar_producao
from services.sih_service import buscar_internacoes, buscar_historico
router = APIRouter(prefix="/api/saude-prisional-apui", tags=["saude_prisional_apui"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
_NOTA = "PNAISP/SISDEPEN requerem integração (pendente). SIA/SIH como proxy."
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    sia = await buscar_producao(ano); sih = await buscar_internacoes(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [sia, sih])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "producao": sia.get("total_procedimentos"), "internacoes": sih.get("total_internacoes"), "nota": _NOTA, "fonte": "SIA + SIH — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/agravos")
async def agravos(ano: int = Query(0)): return await dashboard(ano=ano)
@router.get("/servicos")
async def servicos(ano: int = Query(0)):
    if not ano: ano = _ANO()
    cnes_proxy = await buscar_producao(ano)
    return {"situacao_dado": cnes_proxy.get("situacao_dado"), "ano": ano, "producao": cnes_proxy.get("total_procedimentos"), "nota": _NOTA, "verificado_em": _TS()}
@router.get("/historico")
async def historico(ano: int = Query(0)):
    if not ano: ano = _ANO()
    hist = await buscar_historico(5)
    return {"situacao_dado": hist.get("situacao_dado"), "historico": hist.get("historico"), "nota": _NOTA, "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
