"""Router: /api/transparencia — ERSUS 360 — SIOPS dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.siops_service import buscar_apuracao, buscar_historico
router = APIRouter(prefix="/api/transparencia", tags=["transparencia"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
_NOTA = "Portal da transparência municipal requer integração com CGM/TCE (pendente). SIOPS como proxy EC-29."
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    siops = await buscar_apuracao(ano)
    alertas = []
    pct = siops.get("percentual_saude_receita")
    if pct is not None and pct < 15:
        alertas.append({"nivel": "critico", "mensagem": f"Saúde: {pct:.1f}% — abaixo do mínimo EC-29"})
    return {"situacao_dado": siops.get("situacao_dado"), "ano": ano, "financeiro": siops, "alertas": alertas, "nota": _NOTA, "fonte": "SIOPS — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
@router.get("/historico")
async def historico():
    hist = await buscar_historico()
    return {"situacao_dado": hist.get("situacao_dado"), "historico": hist, "nota": _NOTA, "verificado_em": _TS()}
