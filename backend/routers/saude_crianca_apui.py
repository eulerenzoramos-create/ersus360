"""
Router: /api/saude-crianca-apui — ERSUS 360
Saúde da criança via SIM/SINASC/SIH — DATASUS dados abertos.
Monitoramento individual requer e-SUS PEC (pendente). Sem dados fictícios.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sim_sinasc_service import buscar_obitos, buscar_nascidos_vivos, buscar_historico_mortalidade
from services.sih_service import buscar_internacoes
from services.cache_service import cache_get, cache_set

router = APIRouter(prefix="/api/saude-crianca-apui", tags=["saude_crianca_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_PEC = "Monitoramento individual de crianças requer integração e-SUS PEC (pendente)."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    obitos = await buscar_obitos(ano)
    nasc   = await buscar_nascidos_vivos(ano)
    sih    = await buscar_internacoes(ano)
    total_ob = obitos.get("total_obitos") or 0
    total_nv = nasc.get("total_nascidos") or 0
    tmi = round(total_ob / total_nv * 1000, 1) if total_nv else None
    return {
        "situacao_dado": obitos.get("situacao_dado"),
        "ano": ano,
        "nascidos_vivos": total_nv,
        "obitos_totais": total_ob,
        "taxa_mortalidade_infantil_estimada": tmi,
        "internacoes_total": sih.get("total_internacoes"),
        "nota_pec": _PEC,
        "fonte": "SIM + SINASC + SIH — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/mortalidade-infantil")
async def mortalidade_infantil(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    obitos = await buscar_obitos(ano)
    nasc   = await buscar_nascidos_vivos(ano)
    total_ob = obitos.get("total_obitos") or 0
    total_nv = nasc.get("total_nascidos") or 0
    tmi = round(total_ob / total_nv * 1000, 1) if total_nv else None
    alertas = []
    if tmi is not None and tmi > 15:
        alertas.append({"gravidade": "critico", "mensagem": f"TMI ({tmi}/1000 NV) acima da meta nacional (≤15/1000 NV)."})
    return {"situacao_dado": obitos.get("situacao_dado"), "ano": ano, "tmi": tmi, "nascidos_vivos": total_nv, "alertas": alertas, "verificado_em": _TS()}


@router.get("/nascidos-vivos")
async def nascidos_vivos(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    result = await buscar_nascidos_vivos(ano)
    result["verificado_em"] = _TS()
    return result


@router.get("/historico")
async def historico():
    items = await buscar_historico_mortalidade()
    any_real = any(i.get("situacao_dado") == "oficial_validado" for i in items)
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "fonte": "SIM — DATASUS dados abertos", "verificado_em": _TS(), "anos": items}


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)


@router.get("/monitoramento")
async def monitoramento():
    return {"situacao_dado": "nao_disponivel", "nota": _PEC, "verificado_em": _TS()}
