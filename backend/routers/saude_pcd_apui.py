"""
Router: /api/saude-pcd-apui — ERSUS 360
Saúde da pessoa com deficiência via SIA (reabilitação) + CNES — DATASUS dados abertos.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sia_service import buscar_producao
from services.cnes_service import buscar_estabelecimentos

router = APIRouter(prefix="/api/saude-pcd-apui", tags=["saude_pcd_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "Beneficiários BPC/LOAS e CIF requerem integração MDAS/CNIS (pendente). SIA/CNES como proxy de oferta."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    sia  = await buscar_producao(ano)
    cnes = await buscar_estabelecimentos()
    return {
        "situacao_dado": sia.get("situacao_dado"),
        "ano": ano,
        "producao_reabilitacao": sia.get("total_procedimentos"),
        "estabelecimentos": cnes.get("total"),
        "nota": _NOTA,
        "fonte": "SIA + CNES — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
