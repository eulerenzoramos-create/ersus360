"""Router: /api/saude-escolar-pse-apui — ERSUS 360 — SIA + e-Gestor APS dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sia_service import buscar_producao
from services.fns_api_service import buscar_indicadores_previne
router = APIRouter(prefix="/api/saude-escolar-pse-apui", tags=["saude_escolar_pse_apui"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
_NOTA = "Dados PSE individuais requerem e-SUS PEC (pendente). SIA/e-Gestor como proxy de ações."
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    sia = await buscar_producao(ano); previne = await buscar_indicadores_previne(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [sia, previne])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "producao": sia.get("total_procedimentos"), "previne": previne, "nota": _NOTA, "fonte": "SIA + e-Gestor APS — dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
@router.get("/acoes")
async def acoes(ano: int = Query(0)): return await dashboard(ano=ano)
