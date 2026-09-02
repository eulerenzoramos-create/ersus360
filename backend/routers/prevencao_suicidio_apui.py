"""
Router: /api/prevencao-suicidio-apui — ERSUS 360
Prevenção ao suicídio via SIH (internações tentativa) + SIM (óbitos X60-X84) — DATASUS.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sih_service import buscar_internacoes
from services.sim_sinasc_service import buscar_obitos

router = APIRouter(prefix="/api/prevencao-suicidio-apui", tags=["prevencao_suicidio_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "Filtro por CID X60-X84 (suicídio) e Y87.0 requer query específica no SIM/SIH (pendente). Dados de CAPS/RAPS requerem e-SUS PEC."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    sih    = await buscar_internacoes(ano)
    obitos = await buscar_obitos(ano)
    return {
        "situacao_dado": sih.get("situacao_dado"),
        "ano": ano,
        "internacoes_totais": sih.get("total_internacoes"),
        "obitos_totais": obitos.get("total_obitos"),
        "nota": _NOTA,
        "fonte": "SIH + SIM — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)


@router.get("/acoes")
async def acoes():
    return {"situacao_dado": "nao_disponivel", "nota": _NOTA, "verificado_em": _TS()}
