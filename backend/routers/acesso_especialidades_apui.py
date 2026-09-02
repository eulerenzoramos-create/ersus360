"""
Router: /api/acesso-especialidades-apui — ERSUS 360
Acesso a especialidades via SIA (produção ambulatorial) + CNES — DATASUS dados abertos.
SISREG/regulação requerem integração específica (pendente).
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sia_service import buscar_producao
from services.cnes_service import buscar_estabelecimentos

router = APIRouter(prefix="/api/acesso-especialidades-apui", tags=["acesso_especialidades_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "Lista de espera por especialidade requer SISREG (pendente). SIA/CNES como proxy de oferta."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    sia  = await buscar_producao(ano)
    cnes = await buscar_estabelecimentos()
    return {
        "situacao_dado": sia.get("situacao_dado"),
        "ano": ano,
        "producao_ambulatorial": sia.get("total_procedimentos"),
        "estabelecimentos": cnes.get("total"),
        "nota": _NOTA,
        "fonte": "SIA + CNES — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/lista-espera")
async def lista_espera():
    return {"situacao_dado": "nao_disponivel", "nota": _NOTA, "verificado_em": _TS()}


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
