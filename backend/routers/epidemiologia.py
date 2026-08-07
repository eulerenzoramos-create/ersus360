"""
Router: /api/epidemiologia — Vigilância Epidemiológica / SINAN
Notificações compulsórias, malária, dengue, mortalidade — Apuí/AM
APIs: apidadosabertos.saude.gov.br/sinan/
"""
from __future__ import annotations
from datetime import date as _date
from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut
from services import sinan_service
from functools import lru_cache

router = APIRouter(prefix="/api/epidemiologia", tags=["Epidemiologia"])

# ── Dados de referência Apuí/AM ───────────────────────────────────────────────

@lru_cache(maxsize=1)
def _AGRAVOS():
    return [
        { "agravo": "Malária",            "cid": "B50-B54", "casos_mes": 12, "casos_ano": 87,  "ipa": 3.47,  "meta_ipa": 10.0, "status": "verde",    "tendencia": "queda" },
        { "agravo": "Dengue",             "cid": "A90",     "casos_mes": 4,  "casos_ano": 28,  "incidencia": 111.8, "status": "verde",    "tendencia": "estavel" },
        { "agravo": "Tuberculose",        "cid": "A15-A19", "casos_mes": 1,  "casos_ano": 5,   "incidencia": 20.0,  "status": "amarelo",  "tendencia": "estavel" },
        { "agravo": "Hanseníase",         "cid": "A30",     "casos_mes": 0,  "casos_ano": 2,   "incidencia": 8.0,   "status": "verde",    "tendencia": "queda" },
        { "agravo": "Leptospirose",       "cid": "A27",     "casos_mes": 2,  "casos_ano": 11,  "incidencia": 43.9,  "status": "amarelo",  "tendencia": "subida" },
        { "agravo": "Leishmaniose Visc.", "cid": "B55.0",   "casos_mes": 0,  "casos_ano": 3,   "incidencia": 12.0,  "status": "verde",    "tendencia": "estavel" },
        { "agravo": "Hepatite B",         "cid": "B16",     "casos_mes": 1,  "casos_ano": 7,   "incidencia": 27.9,  "status": "amarelo",  "tendencia": "estavel" },
        { "agravo": "HIV/AIDS",           "cid": "B20-B24", "casos_mes": 0,  "casos_ano": 4,   "incidencia": 16.0,  "status": "verde",    "tendencia": "estavel" },
    ]


@lru_cache(maxsize=1)
def _MALARIA_MENSAL():
    return [
        { "mes": "Jan/26", "vf": 18, "vv": 31, "total": 49, "ipa": 1.96 },
        { "mes": "Fev/26", "vf": 15, "vv": 28, "total": 43, "ipa": 1.72 },
        { "mes": "Mar/26", "vf": 22, "vv": 35, "total": 57, "ipa": 2.28 },
        { "mes": "Abr/26", "vf": 19, "vv": 29, "total": 48, "ipa": 1.92 },
        { "mes": "Mai/26", "vf": 16, "vv": 25, "total": 41, "ipa": 1.64 },
        { "mes": "Jun/26", "vf": 14, "vv": 22, "total": 36, "ipa": 1.44 },
        { "mes": "Jul/26", "vf": 8,  "vv": 4,  "total": 12, "ipa": 0.48 },
    ]


@lru_cache(maxsize=1)
def _DENGUE_MENSAL():
    return [
        { "mes": "Jan/26", "casos": 8,  "graves": 0, "obitos": 0 },
        { "mes": "Fev/26", "casos": 12, "graves": 0, "obitos": 0 },
        { "mes": "Mar/26", "casos": 6,  "graves": 1, "obitos": 0 },
        { "mes": "Abr/26", "casos": 3,  "graves": 0, "obitos": 0 },
        { "mes": "Mai/26", "casos": 2,  "graves": 0, "obitos": 0 },
        { "mes": "Jun/26", "casos": 1,  "graves": 0, "obitos": 0 },
        { "mes": "Jul/26", "casos": 4,  "graves": 0, "obitos": 0 },
    ]


@lru_cache(maxsize=1)
def _MORTALIDADE():
    return {
        "mortalidade_geral": 4.2,
        "mortalidade_infantil": 8.1,
        "mortalidade_materna": 0,
        "mortalidade_prop_doencas_infecciosas_pct": 23.4,
        "mortalidade_prop_circulatorio_pct": 31.2,
        "mortalidade_prop_neoplasias_pct": 14.8,
        "mortalidade_prop_causas_externas_pct": 18.9,
        "expectativa_vida": 71.3,
        "meta_mort_infantil": 10.0,
        "status_mort_infantil": "verde",
    }



# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def dashboard(_: UserOut = Depends(get_current_user)):
    """Dashboard epidemiológico consolidado Apuí/AM."""
    ano = _date.today().year - 1  # SINAN tem defasagem de ~1 ano
    malaria_data = await sinan_service.buscar_malaria(ano)
    dengue_data  = await sinan_service.buscar_dengue(ano)
    return {
        "municipio": "Apuí/AM",
        "ibge": "1300144",
        "periodo": f"Ano {ano}",
        "alertas_ativos": 2,
        "agravo_prioritario": "Malária",
        "malaria_ipa_atual":  malaria_data["ipa"],
        "malaria_ipa_meta":   10.0,
        "malaria_ipa_status": malaria_data["classificacao_ipa"],
        "dengue_casos_acum":  dengue_data["total_casos"],
        "dengue_incidencia":  dengue_data.get("incidencia_100k", 0),
        "mortalidade_infantil": 8.1,
        "mortalidade_infantil_meta": 10.0,
        "cobertura_vacinal_media_pct": 84.2,
        "total_notificacoes_ano": malaria_data["total_casos"] + dengue_data["total_casos"],
        "total_investigadas_pct": 91.7,
        "fonte_malaria": malaria_data["fonte"],
        "fonte_dengue":  dengue_data["fonte"],
    }


@router.get("/notificacoes")
async def notificacoes(
    agravo: str = Query(None),
    mes: int = Query(None, ge=1, le=12),
    _: UserOut = Depends(get_current_user),
):
    """Notificações SINAN — lista com filtros."""
    notificacoes = [
        { "id": 1001, "agravo": "Malária", "cid": "B52", "notificante": "UBS Central", "data": "2026-07-02", "municipio_residencia": "Apuí", "status": "investigada", "encerrada": True },
        { "id": 1002, "agravo": "Dengue",  "cid": "A90", "notificante": "UBS Central", "data": "2026-07-10", "municipio_residencia": "Apuí", "status": "investigada", "encerrada": True },
        { "id": 1003, "agravo": "Malária", "cid": "B50", "notificante": "UBS Castanho","data": "2026-07-12", "municipio_residencia": "Apuí", "status": "em investigacao", "encerrada": False },
        { "id": 1004, "agravo": "Leptospirose","cid": "A27","notificante": "UBS Central","data": "2026-07-14","municipio_residencia": "Apuí", "status": "em investigacao", "encerrada": False },
        { "id": 1005, "agravo": "Malária", "cid": "B54", "notificante": "UBS II",       "data": "2026-07-18", "municipio_residencia": "Apuí", "status": "investigada", "encerrada": True },
        { "id": 1006, "agravo": "Tuberculose","cid": "A15","notificante": "UBS Central","data": "2026-07-20","municipio_residencia": "Apuí", "status": "em investigacao", "encerrada": False },
    ]
    if agravo:
        notificacoes = [n for n in notificacoes if n["agravo"].lower() == agravo.lower()]
    return {
        "total": len(notificacoes),
        "investigadas": sum(1 for n in notificacoes if n["encerrada"]),
        "pendentes": sum(1 for n in notificacoes if not n["encerrada"]),
        "notificacoes": notificacoes,
        "fonte": "referencia",
    }


@router.get("/agravos")
async def agravos_prioritarios(_: UserOut = Depends(get_current_user)):
    """Lista de agravos de notificação compulsória com situação atual."""
    return {
        "total_agravos_monitorados": len(_AGRAVOS()),
        "alertas_ativos": sum(1 for a in _AGRAVOS() if a["status"] in ("amarelo", "vermelho")),
        "agravos": _AGRAVOS(),
        "fonte": "referencia",
    }


@router.get("/malaria")
async def malaria(
    ano: int = Query(0),
    _: UserOut = Depends(get_current_user),
):
    """Dados malária — IPA, distribuição Pf/Pv."""
    if not ano:
        ano = _date.today().year - 1
    data = await sinan_service.buscar_malaria(ano)
    # Mantém série mensal de referência para o gráfico
    mensal = _MALARIA_MENSAL()
    return {
        "municipio": "Apuí/AM",
        "total_casos_ano": data["total_casos"],
        "total_pf": data["falciparum"],
        "total_pv": data["vivax"],
        "ipa_acumulado": data["ipa"],
        "ipa_meta": 10.0,
        "ipa_status": data["classificacao_ipa"],
        "serie_mensal": mensal,
        "observacao": "Apuí é município de alto risco histórico para malária (IPA > 10 até 2022). Tendência de queda.",
        "fonte": data["fonte"],
    }


@router.get("/dengue")
async def dengue(
    ano: int = Query(0),
    _: UserOut = Depends(get_current_user),
):
    """Dados dengue — incidência, casos graves."""
    if not ano:
        ano = _date.today().year - 1
    data = await sinan_service.buscar_dengue(ano)
    return {
        "municipio": "Apuí/AM",
        "total_casos_ano": data["total_casos"],
        "casos_graves": data.get("casos_graves", 0),
        "obitos": data.get("obitos", 0),
        "incidencia_por_100k": data.get("incidencia_100k", 0),
        "nivel_alerta": "verde" if data["total_casos"] < 50 else "amarelo",
        "serie_mensal": _DENGUE_MENSAL(),
        "fonte": data["fonte"],
    }


@router.get("/mortalidade")
async def mortalidade(_: UserOut = Depends(get_current_user)):
    """Indicadores de mortalidade — Apuí/AM."""
    return { **_MORTALIDADE(), "municipio": "Apuí/AM", "ano_referencia": 2025, "fonte": "referencia" }