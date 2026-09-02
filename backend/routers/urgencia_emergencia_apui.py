"""
Router: /api/urgencia-emergencia-apui — ERSUS 360
Urgência e emergência via SIH — DATASUS dados abertos.
Dados em tempo real do SAMU/UPA requerem integração RNE (pendente).
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sih_service import buscar_internacoes, buscar_historico

router = APIRouter(prefix="/api/urgencia-emergencia-apui", tags=["urgencia_emergencia_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "Atendimentos SAMU/UPA em tempo real requerem integração Rede Nacional de Emergências (pendente)."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    sih = await buscar_internacoes(ano)
    alertas = []
    taxa = sih.get("taxa_internacao_100k")
    if taxa and taxa > 600:
        alertas.append({"nivel": "atencao", "mensagem": f"Taxa de internação {taxa:.1f}/100 mil — monitorar demanda hospitalar"})
    return {
        "situacao_dado": sih.get("situacao_dado"),
        "ano": ano,
        "internacoes_totais": sih.get("total_internacoes"),
        "taxa_internacao_100k": taxa,
        "valor_total_reais": sih.get("valor_total_reais"),
        "nota": _NOTA,
        "alertas": alertas,
        "fonte": "SIH — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/historico")
async def historico():
    items = await buscar_historico(5)
    any_real = any(i.get("situacao_dado") == "oficial_validado" for i in items)
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "fonte": "SIH — DATASUS dados abertos", "verificado_em": _TS(), "anos": items}


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)


@router.get("/atendimentos-tempo-real")
async def atendimentos_tempo_real():
    return {"situacao_dado": "nao_disponivel", "nota": _NOTA, "verificado_em": _TS()}
