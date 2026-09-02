"""
Router: /api/saude-mental-caps-apui — ERSUS 360
Produção de saúde mental via SIA/DATASUS (grupo 03 SIGTAP).
Dados CAPS/RAAS requerem integração e-SUS PEC (pendente). Sem dados fictícios.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query

from services.sia_service import buscar_producao
from services.cnes_service import buscar_estabelecimentos
from services.cache_service import cache_get, cache_set

router = APIRouter(prefix="/api/saude-mental-caps-apui", tags=["saude_mental_caps_apui"])

_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_RAAS_PENDENTE = "Dados CAPS/RAAS (procedimentos, perfil diagnóstico) requerem integração e-SUS PEC (pendente)."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    """Dashboard saúde mental — produção ambulatorial SIA + CAPS via CNES."""
    if not ano:
        ano = _ANO()
    ck_sia = f"sia_producao_{ano}"
    base = cache_get(ck_sia) or await buscar_producao(ano)

    # CAPS identificados via CNES
    ck_cnes = "cnes_estabelecimentos"
    estabs = cache_get(ck_cnes)
    if not estabs:
        estabs = await buscar_estabelecimentos()
    caps = [e for e in estabs if "caps" in (e.get("tipo") or "").lower() or "caps" in (e.get("nome") or "").lower()]

    return {
        **base,
        "modulo": "saude_mental",
        "caps_cadastrados": len(caps),
        "caps": caps,
        "nota_raas": _RAAS_PENDENTE,
        "verificado_em": _TS(),
    }


@router.get("/servicos")
async def servicos():
    """CAPS e serviços de saúde mental cadastrados no CNES."""
    ck = "cnes_estabelecimentos"
    estabs = cache_get(ck) or await buscar_estabelecimentos()
    caps = [e for e in estabs if "caps" in (e.get("tipo") or "").lower() or "caps" in (e.get("nome") or "").lower()]
    return {
        "situacao_dado": "oficial_confirmado" if estabs else "nao_disponivel",
        "fonte": "CNES — DATASUS",
        "total_caps": len(caps),
        "caps": caps,
        "verificado_em": _TS(),
    }


@router.get("/historico")
async def historico():
    anos = []
    for a in range(_ANO() - 2, _ANO() + 1):
        r = await buscar_producao(a)
        anos.append({"ano": a, "total_procedimentos": r.get("total_procedimentos"), "situacao_dado": r.get("situacao_dado")})
    any_real = any(a["situacao_dado"] == "oficial_validado" for a in anos)
    return {
        "situacao_dado": "oficial_validado" if any_real else "nao_disponivel",
        "fonte": "SIA — DATASUS dados abertos",
        "verificado_em": _TS(),
        "anos": anos,
    }


@router.get("/diagnosticos")
async def diagnosticos():
    return {"situacao_dado": "nao_disponivel", "nota": _RAAS_PENDENTE, "verificado_em": _TS()}


@router.get("/indicadores")
async def indicadores():
    return {"situacao_dado": "nao_disponivel", "nota": _RAAS_PENDENTE, "verificado_em": _TS()}

