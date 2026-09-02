"""Router: /api/saude-trabalhador-apui-sst — ERSUS 360 — SINAN+SIH dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sinan_service import buscar_agravos_resumo
from services.sih_service import buscar_internacoes
router = APIRouter(prefix="/api/saude-trabalhador-apui-sst", tags=["saude_trabalhador_apui_sst"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
_NOTA = "SINAN-NET acidente trabalho + internações SIH como proxy SST. SISCAT/RINA pendentes."
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    sinan = await buscar_agravos_resumo(ano); sih = await buscar_internacoes(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [*sinan, sih])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "agravos_trabalho": sinan, "internacoes": sih.get("total_internacoes"), "nota": _NOTA, "fonte": "SINAN + SIH — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
@router.get("/agravos")
async def agravos(ano: int = Query(0)):
    if not ano: ano = _ANO()
    sinan = await buscar_agravos_resumo(ano)
    return {"situacao_dado": ("oficial_validado" if any(d.get("situacao_dado") == "oficial_validado" for d in sinan) else "nao_disponivel"), "ano": ano, "agravos": sinan, "nota": _NOTA, "verificado_em": _TS()}
