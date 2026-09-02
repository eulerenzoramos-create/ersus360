"""
Router: /api/saude-idoso-apui — ERSUS 360
Saúde do idoso via SIH/SIM — DATASUS dados abertos.
Caderneta do idoso requer e-SUS PEC (pendente). Sem dados fictícios.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sih_service import buscar_internacoes, buscar_historico
from services.sim_sinasc_service import buscar_obitos
from services.cache_service import cache_get

router = APIRouter(prefix="/api/saude-idoso-apui", tags=["saude_idoso_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_PEC = "Caderneta do idoso, avaliação funcional e polifarmácia requerem e-SUS PEC (pendente)."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    sih    = await buscar_internacoes(ano)
    obitos = await buscar_obitos(ano)
    return {
        "situacao_dado": sih.get("situacao_dado"),
        "ano": ano,
        "internacoes_total": sih.get("total_internacoes"),
        "taxa_internacao_100k": sih.get("taxa_internacao_100k"),
        "obitos_totais": obitos.get("total_obitos"),
        "nota_pec": _PEC,
        "fonte": "SIH + SIM — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/internacoes")
async def internacoes(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    result = await buscar_internacoes(ano)
    result["verificado_em"] = _TS()
    return result


@router.get("/historico")
async def historico():
    items = await buscar_historico(5)
    any_real = any(i.get("situacao_dado") == "oficial_validado" for i in items)
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "fonte": "SIH — DATASUS dados abertos", "verificado_em": _TS(), "anos": items}


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)


@router.get("/caderneta")
async def caderneta():
    return {"situacao_dado": "nao_disponivel", "nota": _PEC, "verificado_em": _TS()}


@router.get("/acoes")
async def acoes():
    return {"situacao_dado": "nao_disponivel", "nota": _PEC, "verificado_em": _TS()}
