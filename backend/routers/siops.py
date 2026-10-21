"""Router: /api/siops — ERSUS 360 — SIOPS dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.siops_service import buscar_apuracao, buscar_historico, alerta_minimo
router = APIRouter(prefix="/api/siops", tags=["SIOPS"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    siops = await buscar_apuracao(ano); hist = await buscar_historico()
    pct = siops.get("percentual_saude_receita")
    alertas = []
    if (alerta := alerta_minimo(siops)):
        alertas.append(alerta)
    return {"situacao_dado": siops.get("situacao_dado"), "ano": ano, "despesa_total_saude": siops.get("despesa_total_saude"), "percentual_saude_receita": pct, "historico": hist, "alertas": alertas, "fonte": "SIOPS — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)


@router.get("/apuracao")
async def apuracao(ano: int = Query(0)):
    """Apuração oficial do ano (último bimestre homologado no SIOPS) com os 14 indicadores."""
    ano = ano or _ANO()
    a = await buscar_apuracao(ano)
    alerta = alerta_minimo(a)
    return {**a, "alertas": [alerta] if alerta else [], "verificado_em": _TS()}


@router.get("/historico")
async def historico():
    itens = await buscar_historico()
    return {"situacao_dado": "oficial_validado" if any(i["situacao_dado"] == "oficial_validado" for i in itens) else "nao_disponivel",
            "anos": itens, "verificado_em": _TS()}
