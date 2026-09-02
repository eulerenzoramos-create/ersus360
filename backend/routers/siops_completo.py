"""
Router: /api/siops-completo — ERSUS 360
Indicadores SIOPS via API pública DATASUS dados abertos.
Sem dados ficticios — nao_disponivel quando API nao responder.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query

from services.siops_service import buscar_apuracao, buscar_historico
from services.cache_service import cache_get, cache_set

router = APIRouter(prefix="/api/siops-completo", tags=["SIOPS Completo"])

_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1


@router.get("/painel-geral")
async def painel_geral(ano: int = Query(0)):
    """Painel financeiro SIOPS — mínimo constitucional e gastos."""
    if not ano:
        ano = _ANO()
    ck = f"siops_apuracao_{ano}"
    cached = cache_get(ck)
    if cached:
        return cached
    result = await buscar_apuracao(ano)
    result["verificado_em"] = _TS()
    cache_set(ck, result, ttl=3600)
    return result


@router.get("/historico")
async def historico():
    """Histórico SIOPS — mínimo constitucional dos últimos 5 anos."""
    ck = "siops_historico"
    cached = cache_get(ck)
    if cached:
        return cached
    items = await buscar_historico()
    any_real = any(i.get("situacao_dado") == "oficial_validado" for i in items)
    result = {
        "situacao_dado": "oficial_validado" if any_real else "nao_disponivel",
        "fonte": "SIOPS — API pública DATASUS dados abertos",
        "verificado_em": _TS(),
        "anos": items,
    }
    cache_set(ck, result, ttl=3600)
    return result


@router.get("/alertas")
async def alertas_gerenciais():
    """Alertas SIOPS — mínimo constitucional não atingido."""
    ano = _ANO()
    result = await buscar_apuracao(ano)
    alertas = []
    if result.get("status_minimo") == "nao_atingido":
        pct = result.get("minimo_constitucional_pct_aplicado", 0)
        alertas.append({
            "tipo": "minimo_constitucional",
            "gravidade": "critico",
            "mensagem": f"Mínimo constitucional não atingido: {pct:.1f}% aplicado (obrigatório ≥15%).",
        })
    return {
        "situacao_dado": result.get("situacao_dado"),
        "ano": ano,
        "alertas": alertas,
        "fonte": result.get("fonte"),
        "verificado_em": _TS(),
    }


@router.get("/comparativos")
async def comparativos():
    """Comparativo histórico dos últimos anos."""
    return await historico()


# Endpoints de exportação requerem implementação futura
@router.get("/programas")
async def listar_programas():
    return {"situacao_dado": "nao_disponivel", "nota": "Exportação por programa requer integração SIOPS XML (pendente).", "verificado_em": _TS()}


@router.get("/exportar-excel")
async def exportar_excel():
    return {"situacao_dado": "nao_disponivel", "nota": "Exportação pendente.", "verificado_em": _TS()}


@router.get("/exportar-pdf")
async def exportar_pdf():
    return {"situacao_dado": "nao_disponivel", "nota": "Exportação pendente.", "verificado_em": _TS()}


@router.get("/exportar-csv")
async def exportar_csv():
    return {"situacao_dado": "nao_disponivel", "nota": "Exportação pendente.", "verificado_em": _TS()}
