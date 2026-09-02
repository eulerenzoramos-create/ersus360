"""Router: /api/saude-mental-apui — ERSUS 360 — SIA+SIH dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sia_service import buscar_producao
from services.sih_service import buscar_internacoes
router = APIRouter(prefix="/api/saude-mental-apui", tags=["saude_mental_apui2"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
_NOTA = "RAAS/CAPS individuais requerem e-SUS PEC (pendente). SIA/SIH como proxy de oferta e demanda."
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    sia = await buscar_producao(ano); sih = await buscar_internacoes(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [sia, sih])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "producao_ambulatorial": sia.get("total_procedimentos"), "internacoes_psiquiatricas": sih.get("total_internacoes"), "nota": _NOTA, "fonte": "SIA + SIH — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/agravos")
async def agravos(ano: int = Query(0)): return await dashboard(ano=ano)
@router.get("/caps-producao")
async def caps_producao(ano: int = Query(0)):
    if not ano: ano = _ANO()
    sia = await buscar_producao(ano)
    return {"situacao_dado": sia.get("situacao_dado"), "ano": ano, "producao": sia.get("total_procedimentos"), "nota": _NOTA, "verificado_em": _TS()}
@router.get("/historico")
async def historico(ano: int = Query(0)): return await dashboard(ano=ano)
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
