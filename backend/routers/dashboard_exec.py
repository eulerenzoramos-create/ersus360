"""Router: /api/dashboard-exec — ERSUS 360 — SIOPS+SIH+SINAN+e-Gestor dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.siops_service import buscar_apuracao
from services.sih_service import buscar_internacoes
from services.sinan_service import buscar_malaria, buscar_dengue, buscar_agravos_resumo
from services.fns_api_service import buscar_indicadores_previne
from services.cnes_service import buscar_equipes_saude, buscar_estabelecimentos, IBGE

router = APIRouter(prefix="/api/dashboard-exec", tags=["Dashboard Executivo"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1


def _sit(val) -> str:
    if val is None:
        return "nao_disponivel"
    return "oficial_validado"


def _tend(atual, anterior) -> str | None:
    if atual is None or anterior is None or anterior == 0:
        return None
    return "alta" if atual > anterior else "queda" if atual < anterior else "estavel"


# ── Endpoints legados ──────────────────────────────────────────────────────────

@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    siops = await buscar_apuracao(ano)
    sih = await buscar_internacoes(ano)
    mal = await buscar_malaria(ano)
    previne = await buscar_indicadores_previne()
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [siops, sih, mal])
    return {
        "situacao_dado": "oficial_validado" if any_real else "nao_disponivel",
        "ano": ano,
        "financeiro": siops,
        "internacoes": sih.get("total_internacoes"),
        "malaria_casos": mal.get("total_casos"),
        "previne": previne,
        "fonte": "SIOPS + SIH + SINAN + e-Gestor APS — dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)


@router.get("/resumo")
async def resumo(ano: int = Query(0)):
    return await dashboard(ano=ano)


# ── Novos endpoints ────────────────────────────────────────────────────────────

@router.get("/blocos")
async def blocos(ibge: str = IBGE, ano: int = Query(0)):
    if not ano:
        ano = _ANO()

    siops, sih, mal, dengue, equipes, estabs = await _gather_all(ano)

    esf = [e for e in equipes if e.get("tp_equipe") == "70" and e.get("ativo")]
    emulti = [e for e in equipes if e.get("tp_equipe") == "72" and e.get("ativo")]

    # Bloco Financeiro
    bloco_fin = {
        "modulo": "Financeiro",
        "icone": "💰",
        "situacao_dado": siops.get("situacao_dado", "nao_disponivel"),
        "indicadores": [
            {
                "nome": "Despesa total em saúde",
                "valor": _brl(siops.get("vl_despesa_total")) if siops.get("vl_despesa_total") else "—",
                "status": "ok" if siops.get("pct_aplicado_saude", 0) >= 15 else "alerta",
                "situacao_dado": siops.get("situacao_dado", "nao_disponivel"),
                "tendencia": None,
                "rota": "/repasses-aps",
            },
            {
                "nome": "% aplicado em saúde (Lei 141/2012)",
                "valor": f"{siops.get('pct_aplicado_saude', 0):.1f}%" if siops.get("pct_aplicado_saude") else "—",
                "status": "ok" if siops.get("pct_aplicado_saude", 0) >= 15 else "critico",
                "situacao_dado": siops.get("situacao_dado", "nao_disponivel"),
                "tendencia": None,
                "rota": "/repasses-aps",
            },
        ],
        "nota": siops.get("fonte", "SIOPS — dados abertos"),
    }

    # Bloco APS / Equipes
    bloco_aps = {
        "modulo": "Atenção Primária",
        "icone": "🏥",
        "situacao_dado": "oficial_aguardando" if equipes else "nao_disponivel",
        "indicadores": [
            {
                "nome": "Equipes eSF ativas (CNES)",
                "valor": str(len(esf)) if equipes else "—",
                "status": "ok" if len(esf) >= 8 else "alerta",
                "situacao_dado": "oficial_aguardando" if equipes else "nao_disponivel",
                "tendencia": None,
                "rota": "/repasses-aps",
            },
            {
                "nome": "Equipes eMulti ativas",
                "valor": str(len(emulti)) if equipes else "—",
                "status": "ok" if len(emulti) >= 1 else "alerta",
                "situacao_dado": "oficial_aguardando" if equipes else "nao_disponivel",
                "tendencia": None,
                "rota": "/repasses-aps",
            },
            {
                "nome": "Estabelecimentos monitorados",
                "valor": str(len(estabs)) if estabs else "—",
                "status": "ok",
                "situacao_dado": "oficial_aguardando",
                "tendencia": None,
                "rota": "/conformidade-scnes",
            },
        ],
        "nota": "CNES/DATASUS — dados públicos (cache 6h)",
    }

    # Bloco Hospitalar
    total_intern = sih.get("total_internacoes")
    bloco_hosp = {
        "modulo": "Hospitalar",
        "icone": "🏨",
        "situacao_dado": sih.get("situacao_dado", "nao_disponivel"),
        "indicadores": [
            {
                "nome": f"Internações SUS ({ano})",
                "valor": str(total_intern) if total_intern is not None else "—",
                "status": "ok",
                "situacao_dado": sih.get("situacao_dado", "nao_disponivel"),
                "tendencia": None,
                "rota": "/",
            },
            {
                "nome": "ICSAP (cond. sensíveis APS)",
                "valor": str(sih.get("total_icsap", "—")) if sih.get("total_icsap") is not None else "—",
                "status": "alerta" if sih.get("pct_icsap", 0) > 20 else "ok",
                "situacao_dado": sih.get("situacao_dado", "nao_disponivel"),
                "tendencia": None,
                "rota": "/",
            },
        ],
        "nota": sih.get("fonte", "SIH/DATASUS — dados abertos"),
    }

    # Bloco Vigilância
    total_mal = mal.get("total_casos")
    total_den = dengue.get("total_casos")
    bloco_vig = {
        "modulo": "Vigilância Epidemiológica",
        "icone": "🦟",
        "situacao_dado": mal.get("situacao_dado", "nao_disponivel"),
        "indicadores": [
            {
                "nome": f"Casos malária ({ano})",
                "valor": str(total_mal) if total_mal is not None else "—",
                "status": "critico" if (total_mal or 0) > 500 else "alerta" if (total_mal or 0) > 100 else "ok",
                "situacao_dado": mal.get("situacao_dado", "nao_disponivel"),
                "tendencia": None,
                "rota": "/",
            },
            {
                "nome": f"Casos dengue ({ano})",
                "valor": str(total_den) if total_den is not None else "—",
                "status": "alerta" if (total_den or 0) > 50 else "ok",
                "situacao_dado": dengue.get("situacao_dado", "nao_disponivel"),
                "tendencia": None,
                "rota": "/",
            },
        ],
        "nota": "SINAN/DATASUS — dados abertos",
    }

    return {
        "ibge": ibge,
        "verificado_em": _TS(),
        "nota": "Dados reais via APIs públicas do Ministério da Saúde. Indicadores com situacao_dado='nao_disponivel' não têm API pública acessível.",
        "blocos": [bloco_fin, bloco_aps, bloco_hosp, bloco_vig],
    }


@router.get("/alertas")
async def alertas(ibge: str = IBGE, ano: int = Query(0)):
    if not ano:
        ano = _ANO()

    siops, sih, mal, dengue, equipes, estabs = await _gather_all(ano)

    criticos = 0
    total = 0

    # SIOPS: % saúde abaixo de 15%
    pct = siops.get("pct_aplicado_saude")
    if pct is not None:
        total += 1
        if pct < 15:
            criticos += 1

    # Malária: alto número de casos
    casos_mal = mal.get("total_casos")
    if casos_mal is not None:
        total += 1
        if casos_mal > 500:
            criticos += 1

    # eMulti sem equipe ativa
    emulti_ativas = [e for e in equipes if e.get("tp_equipe") == "72" and e.get("ativo")]
    if equipes:
        total += 1
        if len(emulti_ativas) == 0:
            criticos += 1

    return {
        "total_alertas": total if total > 0 else None,
        "criticos": criticos if total > 0 else None,
        "situacao_dado": "oficial_aguardando" if total > 0 else "nao_disponivel",
    }


async def _gather_all(ano: int):
    """Busca todas as fontes em paralelo."""
    import asyncio
    siops, sih, mal, dengue, equipes, estabs = await asyncio.gather(
        buscar_apuracao(ano),
        buscar_internacoes(ano),
        buscar_malaria(ano),
        buscar_dengue(ano),
        buscar_equipes_saude(),
        buscar_estabelecimentos(),
        return_exceptions=True,
    )
    if isinstance(siops, Exception):  siops  = {"situacao_dado": "nao_disponivel"}
    if isinstance(sih, Exception):    sih    = {"situacao_dado": "nao_disponivel"}
    if isinstance(mal, Exception):    mal    = {"situacao_dado": "nao_disponivel"}
    if isinstance(dengue, Exception): dengue = {"situacao_dado": "nao_disponivel"}
    if isinstance(equipes, Exception): equipes = []
    if isinstance(estabs, Exception):  estabs  = []
    return siops, sih, mal, dengue, equipes, estabs


def _brl(v) -> str:
    if v is None:
        return "—"
    try:
        return f"R$ {float(v):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    except Exception:
        return str(v)
