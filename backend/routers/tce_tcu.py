"""Router: /api/tce-tcu — ERSUS 360 — SIOPS dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.siops_service import buscar_apuracao, buscar_historico
router = APIRouter(prefix="/api/tce-tcu", tags=["TCE-TCU"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
_NOTA = "Dados TCE/TCU requerem acesso direto ao tribunal (pendente). SIOPS como proxy de conformidade financeira."
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    siops = await buscar_apuracao(ano); hist = await buscar_historico()
    pct = siops.get("percentual_saude_receita")
    alertas = []
    if pct is not None and pct < 15:
        alertas.append({"nivel": "critico", "mensagem": f"EC-29: {pct:.1f}% — abaixo de 15%"})
    return {"situacao_dado": siops.get("situacao_dado"), "ano": ano, "despesa_total_saude": siops.get("despesa_total_saude"), "percentual_saude_receita": pct, "historico": hist, "alertas": alertas, "nota": _NOTA, "fonte": "SIOPS — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
