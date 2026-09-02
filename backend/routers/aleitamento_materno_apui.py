"""
Router: /api/aleitamento-materno-apui — ERSUS 360
Aleitamento materno via SINASC (proxy) — DATASUS dados abertos.
Taxa de aleitamento individual requer e-SUS PEC (pendente).
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sim_sinasc_service import buscar_nascidos_vivos

router = APIRouter(prefix="/api/aleitamento-materno-apui", tags=["aleitamento_materno_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "Taxa de aleitamento materno exclusivo requer e-SUS PEC (pendente). SINASC fornece nascimentos como denominador."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    nasc = await buscar_nascidos_vivos(ano)
    return {
        "situacao_dado": nasc.get("situacao_dado"),
        "ano": ano,
        "nascidos_vivos": nasc.get("total_nascidos"),
        "nota": _NOTA,
        "fonte": "SINASC — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/cobertura-ame")
async def cobertura_ame():
    return {"situacao_dado": "nao_disponivel", "nota": _NOTA, "verificado_em": _TS()}


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
