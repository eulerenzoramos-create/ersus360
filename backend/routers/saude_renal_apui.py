"""
Router: /api/saude-renal-apui — ERSUS 360
Internações renais via SIH/DATASUS. TRS/diálise requer SIGTAP/SIA específico (pendente).
Sem dados fictícios.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sih_service import buscar_internacoes, buscar_historico
from services.cache_service import cache_get

router = APIRouter(prefix="/api/saude-renal-apui", tags=["saude_renal_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_TRS_NOTA = "Dados de TRS/diálise requerem filtro por procedimento SIGTAP (pendente)."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    sih = await buscar_internacoes(ano)
    return {**sih, "nota_trs": _TRS_NOTA, "verificado_em": _TS()}


@router.get("/historico")
async def historico():
    items = await buscar_historico(5)
    any_real = any(i.get("situacao_dado") == "oficial_validado" for i in items)
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "fonte": "SIH — DATASUS dados abertos", "verificado_em": _TS(), "anos": items}


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    sih = await buscar_internacoes(ano)
    return {**sih, "nota_trs": _TRS_NOTA, "verificado_em": _TS()}


@router.get("/dialise")
async def dialise():
    return {"situacao_dado": "nao_disponivel", "nota": _TRS_NOTA, "verificado_em": _TS()}


@router.get("/acoes")
async def acoes():
    return {"situacao_dado": "nao_disponivel", "nota": "Ações de nefroproteção requerem integração e-SUS PEC (pendente).", "verificado_em": _TS()}
