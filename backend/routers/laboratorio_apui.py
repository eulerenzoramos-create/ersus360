"""
Router: /api/laboratorio-apui — ERSUS 360
Laboratório via SIA (produção BPA) + CNES — DATASUS dados abertos.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sia_service import buscar_producao
from services.cnes_service import buscar_estabelecimentos

router = APIRouter(prefix="/api/laboratorio-apui", tags=["laboratorio_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "Exames individuais e resultado de laudos requerem sistema de gestão laboratorial local (pendente integração REDE)."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    sia  = await buscar_producao(ano)
    cnes = await buscar_estabelecimentos()
    return {
        "situacao_dado": sia.get("situacao_dado"),
        "ano": ano,
        "producao_ambulatorial_total": sia.get("total_procedimentos"),
        "estabelecimentos_cnes": cnes.get("total"),
        "nota": _NOTA,
        "fonte": "SIA + CNES — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/exames")
async def exames():
    return {"situacao_dado": "nao_disponivel", "nota": _NOTA, "verificado_em": _TS()}


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
