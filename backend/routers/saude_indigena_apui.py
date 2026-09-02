"""
Router: /api/saude-indigena-apui — ERSUS 360
Saúde indígena via CNES + SIA — DATASUS dados abertos.
SIASI (SESAI) requer acesso específico (pendente).
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.cnes_service import buscar_estabelecimentos
from services.sia_service import buscar_producao

router = APIRouter(prefix="/api/saude-indigena-apui", tags=["saude_indigena_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "Dados SIASI (SESAI) requerem convênio municipal com DSEI Manaus (pendente). CNES/SIA como proxy de oferta assistencial."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    cnes = await buscar_estabelecimentos()
    sia  = await buscar_producao(ano)
    return {
        "situacao_dado": cnes.get("situacao_dado"),
        "ano": ano,
        "estabelecimentos": cnes.get("total"),
        "producao_ambulatorial": sia.get("total_procedimentos"),
        "nota": _NOTA,
        "fonte": "CNES + SIA — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/siasi")
async def siasi():
    return {"situacao_dado": "nao_disponivel", "nota": _NOTA, "verificado_em": _TS()}


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
