"""Router: /api/financeiro — ERSUS 360 — SIOPS dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.siops_service import buscar_apuracao, buscar_historico
router = APIRouter(prefix="/api/financeiro", tags=["Financeiro"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
_NOTA = "Dados financeiros municipais detalhados requerem SICONFI/SIGFIS (pendente). SIOPS como proxy saúde."
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    siops = await buscar_apuracao(ano)
    alertas = []
    pct = siops.get("percentual_saude_receita")
    if pct is not None and pct < 15:
        alertas.append({"nivel": "critico", "mensagem": f"Saúde: {pct:.1f}% da receita — abaixo de 15% (EC-29)"})
    return {"situacao_dado": siops.get("situacao_dado"), "ano": ano, "financeiro": siops, "alertas": alertas, "nota": _NOTA, "fonte": "SIOPS — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
@router.get("/resumo")
async def resumo(ano: int = Query(0)): return await dashboard(ano=ano)
@router.get("/historico")
async def historico():
    hist = await buscar_historico()
    return {"situacao_dado": hist.get("situacao_dado"), "historico": hist, "nota": _NOTA, "verificado_em": _TS()}
