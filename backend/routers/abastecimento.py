"""Router: /api/abastecimento — ERSUS 360 — SINAN+CNES dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sinan_service import buscar_agravos_resumo
from services.cnes_service import buscar_estabelecimentos
router = APIRouter(prefix="/api/abastecimento", tags=["abastecimento"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
_NOTA = "SISÁGUA/SNIS dados abertos pendentes. SINAN como proxy de doenças de veiculação hídrica."
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    sinan = await buscar_agravos_resumo(ano); cnes = await buscar_estabelecimentos()
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [sinan, cnes])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "agravos_hidricos": sinan, "estabelecimentos": cnes.get("total"), "nota": _NOTA, "fonte": "SINAN + CNES — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
