"""
Router: /api/mortalidade-prematura-apui — ERSUS 360
Mortalidade prematura (30-69 anos) via SIM — DATASUS dados abertos.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sim_sinasc_service import buscar_obitos, buscar_historico_mortalidade

router = APIRouter(prefix="/api/mortalidade-prematura-apui", tags=["mortalidade_prematura_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    result = await buscar_obitos(ano)
    alertas = []
    taxa = result.get("taxa_mortalidade_100k")
    if taxa and taxa > 400:
        alertas.append({"nivel": "critico", "mensagem": f"Taxa de mortalidade {taxa:.1f}/100 mil — acima de 400"})
    elif taxa and taxa > 300:
        alertas.append({"nivel": "atencao", "mensagem": f"Taxa de mortalidade {taxa:.1f}/100 mil — acima de 300"})
    return {
        "situacao_dado": result.get("situacao_dado"),
        "ano": ano,
        "obitos_totais": result.get("total_obitos"),
        "taxa_mortalidade_100k": taxa,
        "nota": "Estratificação por faixa etária 30-69 anos requer filtro adicional no SIM (pendente).",
        "alertas": alertas,
        "fonte": "SIM — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/historico")
async def historico():
    items = await buscar_historico_mortalidade()
    any_real = any(i.get("situacao_dado") == "oficial_validado" for i in items)
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "fonte": "SIM — DATASUS dados abertos", "verificado_em": _TS(), "anos": items}


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)


@router.get("/por-causa")
async def por_causa():
    return {"situacao_dado": "nao_disponivel", "nota": "Detalhamento por causa CID requer filtro avançado SIM (pendente).", "verificado_em": _TS()}
