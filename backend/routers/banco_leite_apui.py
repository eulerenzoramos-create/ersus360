"""
Router: /api/banco-leite-apui — ERSUS 360
Banco de Leite Humano via CNES + SINASC — DATASUS dados abertos.
Dados operacionais BLH requerem sistema REDEBLH (pendente).
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.cnes_service import buscar_estabelecimentos
from services.sim_sinasc_service import buscar_nascidos_vivos

router = APIRouter(prefix="/api/banco-leite-apui", tags=["banco_leite_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "Volume coletado e distribuído requerem REDEBLH (pendente integração)."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    cnes = await buscar_estabelecimentos()
    nasc = await buscar_nascidos_vivos(ano)
    return {
        "situacao_dado": cnes.get("situacao_dado"),
        "ano": ano,
        "estabelecimentos": cnes.get("total"),
        "nascidos_vivos": nasc.get("total_nascidos"),
        "nota": _NOTA,
        "fonte": "CNES + SINASC — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
