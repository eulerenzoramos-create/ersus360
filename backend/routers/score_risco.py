"""Router: /api/score-risco — ERSUS 360 — SIH+SINAN dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sih_service import buscar_internacoes
from services.sinan_service import buscar_agravos_resumo, buscar_malaria
router = APIRouter(prefix="/api/score-risco", tags=["score-risco"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    sih = await buscar_internacoes(ano); sinan = await buscar_agravos_resumo(ano); mal = await buscar_malaria(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [sih, sinan, mal])
    alertas = []
    if mal.get("situacao_dado") == "oficial_validado" and (mal.get("total_casos") or 0) > 100:
        alertas.append({"nivel": "atencao", "mensagem": f"Malária: {mal.get('total_casos')} casos"})
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "internacoes": sih.get("total_internacoes"), "agravos": sinan, "malaria": mal, "alertas": alertas, "fonte": "SIH + SINAN — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
