"""Router: /api/suas-sus-apui — ERSUS 360 — SIA+CNES dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sia_service import buscar_producao
from services.cnes_service import buscar_estabelecimentos
router = APIRouter(prefix="/api/suas-sus-apui", tags=["SUAS-SUS Apuí"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
_NOTA = "Dados SUAS individuais requerem SAGI/MDS (pendente). SIA/CNES como proxy de ações socioassistenciais."
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    sia = await buscar_producao(ano); cnes = await buscar_estabelecimentos()
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [sia, cnes])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "producao_ambulatorial": sia.get("total_procedimentos"), "estabelecimentos": cnes.get("total"), "nota": _NOTA, "fonte": "SIA + CNES — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
