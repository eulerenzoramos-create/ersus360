"""
Router: /api/saude-mulher-apui — ERSUS 360
Saúde da mulher via SIM/SINASC/SIH — DATASUS dados abertos.
Rastreamento oncológico e pré-natal requerem e-SUS PEC (pendente). Sem dados fictícios.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sim_sinasc_service import buscar_obitos, buscar_nascidos_vivos
from services.sih_service import buscar_internacoes
from services.cache_service import cache_get

router = APIRouter(prefix="/api/saude-mulher-apui", tags=["saude_mulher_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_PEC = "Rastreamento (SISCAN, pré-natal, puerpério) requer integração e-SUS PEC (pendente)."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    nasc = await buscar_nascidos_vivos(ano)
    sih  = await buscar_internacoes(ano)
    return {
        "situacao_dado": nasc.get("situacao_dado"),
        "ano": ano,
        "nascidos_vivos": nasc.get("total_nascidos"),
        "internacoes": sih.get("total_internacoes"),
        "nota_pec": _PEC,
        "fonte": "SINASC + SIH — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/nascimentos")
async def nascimentos(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    result = await buscar_nascidos_vivos(ano)
    result["verificado_em"] = _TS()
    return result


@router.get("/obitos-maternos")
async def obitos_maternos(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    result = await buscar_obitos(ano)
    maternos = [o for o in result.get("obitos", []) if str(o.get("cid", "")).startswith("O")]
    return {
        "situacao_dado": result.get("situacao_dado"),
        "ano": ano,
        "total_obitos_maternos": len(maternos),
        "fonte": result.get("fonte"),
        "verificado_em": _TS(),
    }


@router.get("/historico")
async def historico():
    anos = []
    for a in range(_ANO() - 4, _ANO() + 1):
        r = await buscar_nascidos_vivos(a)
        anos.append({"ano": a, "nascidos_vivos": r.get("total_nascidos"), "situacao_dado": r.get("situacao_dado")})
    any_real = any(a["situacao_dado"] == "oficial_validado" for a in anos)
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "fonte": "SINASC — DATASUS dados abertos", "verificado_em": _TS(), "anos": anos}


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)


@router.get("/rastreamento")
async def rastreamento():
    return {"situacao_dado": "nao_disponivel", "nota": _PEC, "verificado_em": _TS()}
