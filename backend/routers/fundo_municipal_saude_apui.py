"""Router: /api/fundo-municipal-saude-apui — ERSUS 360 — SIOPS dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.siops_service import buscar_apuracao, buscar_historico
router = APIRouter(prefix="/api/fundo-municipal-saude-apui", tags=["fundo_municipal_saude_apui"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
_NOTA = "FMS Apuí detalhado requer SICONFI (pendente). SIOPS como proxy EC-29."
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    siops = await buscar_apuracao(ano)
    alertas = []
    pct = siops.get("percentual_saude_receita")
    if pct is not None and pct < 15:
        alertas.append({"nivel": "critico", "mensagem": f"EC-29: {pct:.1f}% — abaixo de 15%"})
    return {"situacao_dado": siops.get("situacao_dado"), "ano": ano, "financeiro": siops, "alertas": alertas, "nota": _NOTA, "fonte": "SIOPS — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
@router.get("/historico")
async def historico():
    hist = await buscar_historico(5)
    return {"situacao_dado": hist.get("situacao_dado"), "historico": hist.get("historico"), "nota": _NOTA, "verificado_em": _TS()}
