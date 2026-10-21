"""Router: /api/emendas — ERSUS 360 — SIOPS dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.siops_service import buscar_apuracao, buscar_historico
router = APIRouter(prefix="/api/emendas", tags=["Emendas"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
_NOTA = "Detalhamento por emenda requer InvestSUS/DigiSUS (pendente). SIOPS como proxy de execução financeira."
_NOTA_EMENDAS = ("As emendas parlamentares do município estão no módulo InvestSUS (Propostas/Execução), com os dados "
                 "importados do InvestSUS. Esta tela não usa mais a despesa total do SIOPS como substituto.")


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    """Sem fonte própria: devolve nao_disponivel (dados=None) e aponta para o InvestSUS. Antes devolvia a despesa total
    do SIOPS, que a tela poderia exibir como se fosse valor de emendas."""
    return {"situacao_dado": "nao_disponivel", "dados": None, "nota": _NOTA_EMENDAS, "redirecionar_para": "/investsus",
            "verificado_em": _TS()}


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
