"""
Router: /api/vigilancia-epidemiologica-apui — ERSUS 360
Vigilância epidemiológica via SINAN/DATASUS dados abertos.
Sem dados fictícios — nao_disponivel quando API não responder.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query

from services.sinan_service import buscar_malaria, buscar_dengue, buscar_agravos_resumo
from services.cache_service import cache_get, cache_set

router = APIRouter(prefix="/api/vigilancia-epidemiologica-apui", tags=["vigilancia_epidemiologica_apui"])

_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    """Dashboard de vigilância — malária e dengue."""
    if not ano:
        ano = _ANO()
    ck = f"vigepid_dashboard_{ano}"
    cached = cache_get(ck)
    if cached:
        return cached
    agravos = await buscar_agravos_resumo(ano)
    any_real = any(a.get("situacao_dado") == "oficial_validado" for a in agravos)
    result = {
        "situacao_dado": "oficial_validado" if any_real else "nao_disponivel",
        "fonte": "SINAN / SIVEP-Malária — DATASUS dados abertos",
        "ano": ano,
        "verificado_em": _TS(),
        "agravos": agravos,
    }
    if any_real:
        cache_set(ck, result, ttl=3600)
    return result


@router.get("/agravos")
async def agravos(ano: int = Query(0)):
    """Lista de agravos notificáveis — malária e dengue."""
    if not ano:
        ano = _ANO()
    return await dashboard(ano=ano)


@router.get("/historico")
async def historico():
    """Série histórica — últimos 4 anos de malária e dengue."""
    anos_resultado = []
    for a in range(_ANO() - 3, _ANO() + 1):
        mal = await buscar_malaria(a)
        den = await buscar_dengue(a)
        anos_resultado.append({
            "ano": a,
            "malaria": {
                "total": mal.get("total_casos"),
                "ipa": mal.get("ipa"),
                "situacao_dado": mal.get("situacao_dado"),
            },
            "dengue": {
                "total": den.get("total_casos"),
                "situacao_dado": den.get("situacao_dado"),
            },
        })
    any_real = any(
        a["malaria"]["situacao_dado"] == "oficial_validado" or
        a["dengue"]["situacao_dado"] == "oficial_validado"
        for a in anos_resultado
    )
    return {
        "situacao_dado": "oficial_validado" if any_real else "nao_disponivel",
        "fonte": "SINAN / SIVEP-Malária — DATASUS dados abertos",
        "verificado_em": _TS(),
        "serie": anos_resultado,
    }


@router.get("/surtos")
async def surtos():
    """Surtos — requer SINAN com filtro de surto (pendente)."""
    return {
        "situacao_dado": "nao_disponivel",
        "nota": "Dados de surtos requerem endpoint SINAN específico (pendente).",
        "verificado_em": _TS(),
    }


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    """Indicadores epidemiológicos consolidados."""
    if not ano:
        ano = _ANO()
    mal = await buscar_malaria(ano)
    den = await buscar_dengue(ano)
    return {
        "situacao_dado": mal.get("situacao_dado") if mal.get("total_casos") else den.get("situacao_dado"),
        "ano": ano,
        "malaria_casos": mal.get("total_casos"),
        "malaria_ipa": mal.get("ipa"),
        "malaria_classificacao_ipa": mal.get("classificacao_ipa"),
        "dengue_casos": den.get("total_casos"),
        "dengue_incidencia_100k": den.get("incidencia_100k"),
        "fonte": "SINAN / SIVEP-Malária — DATASUS dados abertos",
        "verificado_em": _TS(),
    }
