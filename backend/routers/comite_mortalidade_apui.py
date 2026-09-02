"""
Router: /api/comite-mortalidade-apui — ERSUS 360
Comitê de mortalidade via SIM + SINASC — DATASUS dados abertos.
Investigação de óbitos evitáveis requer sistema local (pendente).
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sim_sinasc_service import buscar_obitos, buscar_nascidos_vivos, buscar_historico_mortalidade

router = APIRouter(prefix="/api/comite-mortalidade-apui", tags=["comite_mortalidade_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "Fichas de investigação de óbito evitável requerem sistema de comitê local (pendente)."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    obitos = await buscar_obitos(ano)
    nasc   = await buscar_nascidos_vivos(ano)
    total_nv = nasc.get("total_nascidos") or 0
    total_ob = obitos.get("total_obitos") or 0
    tmi = round(total_ob / total_nv * 1000, 1) if total_nv else None
    return {
        "situacao_dado": obitos.get("situacao_dado"),
        "ano": ano,
        "obitos": total_ob,
        "nascidos_vivos": total_nv,
        "taxa_mortalidade_infantil_estimada": tmi,
        "nota": _NOTA,
        "fonte": "SIM + SINASC — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/historico")
async def historico():
    items = await buscar_historico_mortalidade()
    any_real = any(i.get("situacao_dado") == "oficial_validado" for i in items)
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "fonte": "SIM — DATASUS dados abertos", "verificado_em": _TS(), "anos": items}


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
