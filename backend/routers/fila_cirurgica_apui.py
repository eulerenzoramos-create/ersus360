"""
Router: /api/fila-cirurgica-apui — ERSUS 360
Fila cirúrgica via SIH (internações cirúrgicas) + regulação — DATASUS dados abertos.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sih_service import buscar_internacoes

router = APIRouter(prefix="/api/fila-cirurgica-apui", tags=["fila_cirurgica_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "Lista de espera cirúrgica em tempo real requer SISREG/regulação local (pendente integração)."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    sih = await buscar_internacoes(ano)
    return {
        "situacao_dado": sih.get("situacao_dado"),
        "ano": ano,
        "internacoes_realizadas": sih.get("total_internacoes"),
        "nota": _NOTA,
        "fonte": "SIH — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/lista-espera")
async def lista_espera():
    return {"situacao_dado": "nao_disponivel", "nota": _NOTA, "verificado_em": _TS()}


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
