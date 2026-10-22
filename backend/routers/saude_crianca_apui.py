"""
Router: /api/saude-crianca-apui — ERSUS 360
Saúde da criança via SIM/SINASC/SIH — DATASUS dados abertos.
Monitoramento individual requer e-SUS PEC (pendente). Sem dados fictícios.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sim_sinasc_service import buscar_obitos, buscar_nascidos_vivos, buscar_historico_mortalidade
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
    total_nv = nasc.get("total_nascidos")
    total_ob = obitos.get("total_obitos")
    # "TMI estimada" (óbitos de todas as idades ÷ NV) e total de internações do SIH removidos em 21/10/2026.
    return {
        "situacao_dado": obitos.get("situacao_dado"),
        "ano": ano,
        "nascidos_vivos": total_nv,
        "obitos_totais": total_ob,
        "nota_tmi": 'Taxa de mortalidade infantil exige óbitos de menores de 1 ano (SIM por idade), ainda não integrados. A conta anterior dividia óbitos de todas as idades pelos nascidos vivos e foi removida em 21/10/2026.',
        "nota_pec": _PEC,
        "fonte": "SIM + SINASC — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/mortalidade-infantil")
async def mortalidade_infantil(ano: int = Query(0)):
    # Antes: TMI = óbitos de TODAS as idades ÷ NV, com alerta "crítico" acima de 15/1000 — falso alarme.
    return {"situacao_dado": "nao_disponivel", "dados": None, "ano": ano or _ANO(), "nota": 'Taxa de mortalidade infantil exige óbitos de menores de 1 ano (SIM por idade), ainda não integrados. A conta anterior dividia óbitos de todas as idades pelos nascidos vivos e foi removida em 21/10/2026.',
            "verificado_em": _TS()}


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
