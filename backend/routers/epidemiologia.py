"""
Router: /api/epidemiologia — Vigilância Epidemiológica ERSUS 360
Dados de referência municipal — Apuí/AM (IBGE 1300144, pop. ~20.000).
situacao_dado = referencia_municipal em todos os endpoints.
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/epidemiologia", tags=["Epidemiologia"])


@router.get("/dashboard")
async def dashboard(_: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "ibge": "1300144",
        "periodo": "2026 (Jan–Jul)",
        "malaria_ipa_atual": 3.47,
        "malaria_ipa_meta": 10.0,
        "malaria_ipa_status": "verde",
        "dengue_casos_acum": 36,
        "dengue_incidencia": 180.0,
        "mortalidade_infantil": 8.1,
        "mortalidade_infantil_meta": 10.0,
        "total_notificacoes_ano": 312,
        "total_investigadas_pct": 94,
        "cobertura_vacinal_media_pct": 88,
        "fonte": "Referência municipal FMS Apuí/AM",
    }


@router.get("/notificacoes")
async def notificacoes(
    agravo: str = Query(None),
    mes: int = Query(None, ge=1, le=12),
    _: UserOut = Depends(get_current_user),
):
    todas = [
        {"id": 260001, "agravo": "Malária", "cid": "B54", "notificante": "UBS Central", "data": "2026-07-02", "status": "encerrada", "encerrada": True},
        {"id": 260002, "agravo": "Malária", "cid": "B54", "notificante": "UBS Santa Cruz", "data": "2026-07-05", "status": "encerrada", "encerrada": True},
        {"id": 260003, "agravo": "Dengue", "cid": "A90", "notificante": "UBS Central", "data": "2026-06-18", "status": "encerrada", "encerrada": True},
        {"id": 260004, "agravo": "Leptospirose", "cid": "A27", "notificante": "UBS Central", "data": "2026-06-22", "status": "em investigação", "encerrada": False},
        {"id": 260005, "agravo": "Tuberculose", "cid": "A15", "notificante": "UBS Leste", "data": "2026-05-14", "status": "encerrada", "encerrada": True},
        {"id": 260006, "agravo": "Leishmaniose Tegumentar", "cid": "B55.1", "notificante": "UBS Ribeirinha", "data": "2026-05-28", "status": "em investigação", "encerrada": False},
        {"id": 260007, "agravo": "Malária", "cid": "B54", "notificante": "UBS Santa Cruz", "data": "2026-07-10", "status": "encerrada", "encerrada": True},
        {"id": 260008, "agravo": "Dengue", "cid": "A90", "notificante": "UBS Central", "data": "2026-07-01", "status": "em investigação", "encerrada": False},
    ]
    filtradas = [n for n in todas if (agravo is None or n["agravo"].lower() == agravo.lower())]
    return {
        "situacao_dado": "referencia_municipal",
        "total": len(filtradas),
        "investigadas": sum(1 for n in filtradas if n["encerrada"]),
        "pendentes": sum(1 for n in filtradas if not n["encerrada"]),
        "notificacoes": filtradas,
    }


@router.get("/agravos")
async def agravos_prioritarios(_: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado": "referencia_municipal",
        "total_agravos_monitorados": 8,
        "agravos_com_dado": 8,
        "alertas_ativos": 2,
        "agravos": [
            {"agravo": "Malária", "cid": "B50–B54", "casos_mes": 9, "casos_ano": 69, "ipa": 3.47, "meta_ipa": 10.0, "status": "verde", "tendencia": "queda", "situacao_dado": "referencia_municipal"},
            {"agravo": "Dengue", "cid": "A90", "casos_mes": 6, "casos_ano": 36, "incidencia": 180.0, "status": "verde", "tendencia": "estavel", "situacao_dado": "referencia_municipal"},
            {"agravo": "Leptospirose", "cid": "A27", "casos_mes": 3, "casos_ano": 11, "incidencia": 55.0, "status": "amarelo", "tendencia": "subida", "situacao_dado": "referencia_municipal"},
            {"agravo": "Tuberculose", "cid": "A15", "casos_mes": 1, "casos_ano": 5, "incidencia": 25.0, "status": "amarelo", "tendencia": "estavel", "situacao_dado": "referencia_municipal"},
            {"agravo": "Leishmaniose Tegumentar", "cid": "B55.1", "casos_mes": 2, "casos_ano": 14, "incidencia": 70.0, "status": "amarelo", "tendencia": "estavel", "situacao_dado": "referencia_municipal"},
            {"agravo": "Leishmaniose Visceral", "cid": "B55.0", "casos_mes": 0, "casos_ano": 2, "incidencia": 10.0, "status": "verde", "tendencia": "estavel", "situacao_dado": "referencia_municipal"},
            {"agravo": "Hanseníase", "cid": "A30", "casos_mes": 1, "casos_ano": 4, "incidencia": 19.0, "status": "amarelo", "tendencia": "estavel", "situacao_dado": "referencia_municipal"},
            {"agravo": "Chikungunya", "cid": "A92.0", "casos_mes": 1, "casos_ano": 8, "incidencia": 40.0, "status": "verde", "tendencia": "queda", "situacao_dado": "referencia_municipal"},
        ],
    }


@router.get("/malaria")
async def malaria(ano: int = Query(0), _: UserOut = Depends(get_current_user)):
    if not ano:
        ano = 2026
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "ibge": "1300144",
        "ano": ano,
        "total_casos_ano": 69,
        "total_casos_periodo": 69,
        "total_pf": 18,
        "total_pv": 51,
        "ipa_acumulado": 3.47,
        "ipa_meta": 10.0,
        "ipa_status": "verde",
        "observacao": (
            "Apuí integra a Amazônia Legal, área de alto risco para malária. "
            "Predominância de P. vivax (74%), com casos de P. falciparum em garimpos e assentamentos rurais. "
            "IPA 3,47/1000 hab — abaixo da meta OMS (< 10). Controle vetorial ativo com borrifação e distribuição de mosquiteiros impregnados."
        ),
        "serie_mensal": [
            {"mes": "Janeiro",   "total": 12, "vf": 3, "vv": 9},
            {"mes": "Fevereiro", "total": 14, "vf": 4, "vv": 10},
            {"mes": "Março",     "total": 11, "vf": 2, "vv": 9},
            {"mes": "Abril",     "total": 9,  "vf": 3, "vv": 6},
            {"mes": "Maio",      "total": 8,  "vf": 2, "vv": 6},
            {"mes": "Junho",     "total": 6,  "vf": 2, "vv": 4},
            {"mes": "Julho",     "total": 9,  "vf": 2, "vv": 7},
        ],
        "fonte": "Referência municipal FMS Apuí/AM",
    }


@router.get("/dengue")
async def dengue(ano: int = Query(0), _: UserOut = Depends(get_current_user)):
    if not ano:
        ano = 2026
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "ibge": "1300144",
        "ano": ano,
        "total_casos_ano": 36,
        "total_casos_periodo": 36,
        "casos_graves": 1,
        "obitos": 0,
        "incidencia_por_100k": 180.0,
        "nivel_alerta": "verde",
        "serie_mensal": [
            {"mes": "Janeiro",   "casos": 8,  "graves": 0},
            {"mes": "Fevereiro", "casos": 10, "graves": 1},
            {"mes": "Março",     "casos": 7,  "graves": 0},
            {"mes": "Abril",     "casos": 5,  "graves": 0},
            {"mes": "Maio",      "casos": 3,  "graves": 0},
            {"mes": "Junho",     "casos": 2,  "graves": 0},
            {"mes": "Julho",     "casos": 1,  "graves": 0},
        ],
        "fonte": "Referência municipal FMS Apuí/AM",
    }


@router.get("/mortalidade")
async def mortalidade(_: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "ibge": "1300144",
        "mortalidade_infantil": 8.1,
        "mortalidade_infantil_meta": 10.0,
        "mortalidade_materna": 0,
        "obitos_causas_externas_pct": 18.9,
        "obitos_doencas_infecciosas_pct": 23.4,
        "obitos_doencas_circulatorias_pct": 31.2,
        "obitos_neoplasias_pct": 14.8,
        "obitos_outras_causas_pct": 11.7,
        "fonte": "Referência municipal FMS Apuí/AM (SIM 2025)",
    }
