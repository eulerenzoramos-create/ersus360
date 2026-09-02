"""
Router: /api/tuberculose-apui — ERSUS 360
Casos de tuberculose via SINAN/DATASUS dados abertos.
Sem dados fictícios — nao_disponivel quando API não responder.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query

from services.sinan_service import buscar_tuberculose
from services.cache_service import cache_get, cache_set

router = APIRouter(prefix="/api/tuberculose-apui", tags=["tuberculose_apui"])

_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    """Dashboard TB — casos, cura, incidência."""
    if not ano:
        ano = _ANO()
    ck = f"sinan_tb_{ano}"
    cached = cache_get(ck)
    if cached:
        return cached
    result = await buscar_tuberculose(ano)
    result["verificado_em"] = _TS()
    if result.get("situacao_dado") == "oficial_validado":
        cache_set(ck, result, ttl=3600)
    return result


@router.get("/casos")
async def casos(ano: int = Query(0)):
    """Casos de tuberculose notificados."""
    if not ano:
        ano = _ANO()
    return await dashboard(ano=ano)


@router.get("/historico")
async def historico():
    """Histórico TB — últimos 4 anos."""
    anos = []
    for a in range(_ANO() - 3, _ANO() + 1):
        r = await buscar_tuberculose(a)
        anos.append({
            "ano": a,
            "total_casos": r.get("total_casos"),
            "taxa_cura_pct": r.get("taxa_cura_pct"),
            "incidencia_100k": r.get("incidencia_100k"),
            "situacao_dado": r.get("situacao_dado"),
        })
    any_real = any(a["situacao_dado"] == "oficial_validado" for a in anos)
    return {
        "situacao_dado": "oficial_validado" if any_real else "nao_disponivel",
        "fonte": "SINAN — DATASUS dados abertos",
        "verificado_em": _TS(),
        "anos": anos,
    }


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    """Indicadores TB — taxa de cura vs meta 85%."""
    if not ano:
        ano = _ANO()
    result = await buscar_tuberculose(ano)
    alertas = []
    cura = result.get("taxa_cura_pct")
    if cura is not None and cura < 70:
        alertas.append({"gravidade": "critico", "mensagem": f"Taxa de cura TB ({cura}%) muito abaixo da meta de 85%."})
    elif cura is not None and cura < 85:
        alertas.append({"gravidade": "atencao", "mensagem": f"Taxa de cura TB ({cura}%) abaixo da meta de 85%."})
    return {**result, "alertas": alertas, "verificado_em": _TS()}


@router.get("/acoes")
async def acoes():
    """Ações prioritárias TB — requer análise cruzada PEC (pendente)."""
    return {
        "situacao_dado": "nao_disponivel",
        "nota": "Ações estratégicas requerem integração e-SUS PEC (pendente).",
        "verificado_em": _TS(),
    }

