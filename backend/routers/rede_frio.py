"""Router: /api/rede-frio — ERSUS 360 — CNES + SI-PNI dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.cnes_service import buscar_estabelecimentos
from services.pni_service import buscar_cobertura
router = APIRouter(prefix="/api/rede-frio", tags=["Rede de Frio"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
_NOTA = "Temperatura/câmaras individuais requerem sistema local (pendente). CNES/PNI como proxy."
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    cnes = await buscar_estabelecimentos(); pni = await buscar_cobertura(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [cnes, pni])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "estabelecimentos": cnes.get("total"), "cobertura_vacinal": pni, "nota": _NOTA, "fonte": "CNES + SI-PNI — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
