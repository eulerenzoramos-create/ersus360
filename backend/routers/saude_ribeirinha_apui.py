"""
Router: /api/saude-ribeirinha-apui — ERSUS 360
Saúde ribeirinha via CNES (estabelecimentos) + SIA — DATASUS dados abertos.
Populações ribeirinhas do Amazonas — contexto específico.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.cnes_service import buscar_estabelecimentos
from services.sia_service import buscar_producao

router = APIRouter(prefix="/api/saude-ribeirinha-apui", tags=["saude_ribeirinha_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "Dados específicos de populações ribeirinhas (SESAI/FUNAI não incidência em Apuí) requerem registro municipal (pendente)."


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


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
