"""Router: /api/judicializacao — ERSUS 360 — SIH+SIOPS dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sih_service import buscar_internacoes
from services.siops_service import buscar_apuracao
router = APIRouter(prefix="/api/judicializacao", tags=["judicializacao"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
_NOTA = "Processos judiciais individuais requerem CNJ/SENAD (pendente). SIH/SIOPS como proxy de impacto."
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    sih = await buscar_internacoes(ano); siops = await buscar_apuracao(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [sih, siops])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "internacoes": sih.get("total_internacoes"), "valor_internacoes": sih.get("valor_total_reais"), "despesa_total_saude": siops.get("despesa_total_saude"), "nota": _NOTA, "fonte": "SIH + SIOPS — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
