"""
Router: /api/saude-diabetes-apui — ERSUS 360
Internações por diabetes via SIH/DATASUS + produção ambulatorial SIA.
Monitoramento DM por paciente requer e-SUS PEC (pendente). Sem dados fictícios.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sih_service import buscar_internacoes, buscar_historico
from services.sia_service import buscar_producao
from services.cache_service import cache_get, cache_set

router = APIRouter(prefix="/api/saude-diabetes-apui", tags=["saude_diabetes_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_PEC_NOTA = "Monitoramento de DM por paciente (HbA1c, pé diabético) requer integração e-SUS PEC (pendente)."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    sih = await buscar_internacoes(ano)
    sia = await buscar_producao(ano)
    return {
        "situacao_dado": sih.get("situacao_dado"),
        "ano": ano,
        "internacoes_total": sih.get("total_internacoes"),
        "icsap_pct": sih.get("icsap_pct"),
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
