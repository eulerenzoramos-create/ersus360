"""
Router: /api/saude-cardiovascular-apui — ERSUS 360
Internações cardiovasculares via SIH/DATASUS + produção ambulatorial SIA.
Monitoramento DCV via e-SUS PEC requer integração (pendente). Sem dados fictícios.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sih_service import buscar_internacoes, buscar_historico
from services.sia_service import buscar_producao
from services.cache_service import cache_get, cache_set

router = APIRouter(prefix="/api/saude-cardiovascular-apui", tags=["saude_cardiovascular_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_PEC_NOTA = "Monitoramento de HAS/DCV por paciente requer integração e-SUS PEC (pendente)."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    """Dashboard DCV — internações hospitalares + produção ambulatorial."""
    if not ano:
        ano = _ANO()
    sih = await buscar_internacoes(ano)
    sia = await buscar_producao(ano)
    return {
        "situacao_dado": sih.get("situacao_dado"),
        "ano": ano,
        "internacoes_total": sih.get("total_internacoes"),
        "taxa_internacao_100k": sih.get("taxa_internacao_100k"),
        "obitos_hospitalares": sih.get("obitos_hospitalares"),
        "producao_ambulatorial": sia.get("total_procedimentos"),
        "nota_pec": _PEC_NOTA,
        "fonte": "SIH + SIA — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


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
    return {**sih, "nota_pec": _PEC_NOTA, "verificado_em": _TS()}


@router.get("/monitoramento")
async def monitoramento():
    return {"situacao_dado": "nao_disponivel", "nota": _PEC_NOTA, "verificado_em": _TS()}


@router.get("/acoes")
async def acoes():
    return {"situacao_dado": "nao_disponivel", "nota": _PEC_NOTA, "verificado_em": _TS()}
