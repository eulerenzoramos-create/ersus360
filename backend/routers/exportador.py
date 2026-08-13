"""
Router: /api/exportador — Exportação de relatórios ERSUS 360
Dados de referência municipal — Apuí/AM. situacao_dado = referencia_municipal.
"""
from __future__ import annotations
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/exportador", tags=["exportador"])

_TS = "2026-08-13T00:00:00Z"

_TIPOS_RELATORIO = [
    {"id": "REL-001", "nome": "Relatório de Gestão Quadrimestral (RDQA)",    "modulo": "Gestao",         "formatos": ["pdf", "excel"], "ultima_geracao": "2025-09-15", "status": "disponivel"},
    {"id": "REL-002", "nome": "Produção APS — Boletim Mensal",               "modulo": "APS",            "formatos": ["pdf", "excel", "csv"], "ultima_geracao": "2025-08-05", "status": "disponivel"},
    {"id": "REL-003", "nome": "Mapa de Cobertura Vacinal PNI",                "modulo": "Vigilancia",     "formatos": ["pdf", "excel"], "ultima_geracao": "2025-07-15", "status": "disponivel"},
    {"id": "REL-004", "nome": "Extrato Financeiro — Repasses FNS",            "modulo": "Financeiro",     "formatos": ["pdf", "excel", "csv"], "ultima_geracao": "2025-09-02", "status": "disponivel"},
    {"id": "REL-005", "nome": "Inventário do Almoxarifado CAF",               "modulo": "Gestao",         "formatos": ["excel", "csv"], "ultima_geracao": "2025-07-31", "status": "disponivel"},
    {"id": "REL-006", "nome": "Indicadores IDSUS Municipal",                  "modulo": "Gestao",         "formatos": ["pdf", "excel"], "ultima_geracao": "2025-06-30", "status": "disponivel"},
    {"id": "REL-007", "nome": "Indicadores Saúde Bucal — SB Brasil",          "modulo": "SaudeBucal",     "formatos": ["pdf", "excel"], "ultima_geracao": "2025-03-15", "status": "disponivel"},
    {"id": "REL-008", "nome": "Carteira de Contratos FMS",                    "modulo": "Gestao",         "formatos": ["pdf", "excel"], "ultima_geracao": "2025-08-01", "status": "disponivel"},
    {"id": "REL-009", "nome": "Relatório de Busca Ativa — IA (ACS)",          "modulo": "APS",            "formatos": ["pdf", "excel"], "ultima_geracao": "2025-07-28", "status": "disponivel"},
    {"id": "REL-010", "nome": "Mapa Sanitário — Unidades de Saúde Apuí",      "modulo": "Gestao",         "formatos": ["pdf"],          "ultima_geracao": "2025-05-10", "status": "disponivel"},
    {"id": "REL-011", "nome": "Relatório de Gestão Anual (RAG 2024)",          "modulo": "Gestao",         "formatos": ["pdf"],          "ultima_geracao": "2025-03-01", "status": "disponivel"},
    {"id": "REL-012", "nome": "OKR Municipal — Progresso Ciclo 2026",          "modulo": "Planejamento",   "formatos": ["pdf", "excel"], "ultima_geracao": "2025-08-10", "status": "disponivel"},
    {"id": "REL-013", "nome": "Folha de Pagamento SMS — Sintético",            "modulo": "RH",             "formatos": ["pdf", "excel"], "ultima_geracao": "2025-08-01", "status": "disponivel"},
    {"id": "REL-014", "nome": "Inventário Patrimônio SMS",                     "modulo": "Patrimonio",     "formatos": ["excel", "csv"], "ultima_geracao": "2024-12-15", "status": "disponivel"},
    {"id": "REL-015", "nome": "Painel Epidemiológico Mensal",                  "modulo": "Vigilancia",     "formatos": ["pdf", "excel"], "ultima_geracao": "2025-08-05", "status": "disponivel"},
]


@router.get("/resumo")
async def resumo(_: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "relatorios_disponiveis": len(_TIPOS_RELATORIO),
        "geracoes_mes": 8,
        "ultima_exportacao": "2025-09-15",
        "formatos_suportados": ["pdf", "excel", "csv"],
        "modulos": list({r["modulo"] for r in _TIPOS_RELATORIO}),
        "verificado_em": _TS,
    }


@router.get("/lista")
async def lista(
    modulo: Optional[str] = Query(None),
    _: UserOut = Depends(get_current_user),
):
    items = list(_TIPOS_RELATORIO)
    if modulo:
        items = [r for r in items if r["modulo"].lower() == modulo.lower()]
    return {
        "situacao_dado": "referencia_municipal",
        "total": len(items),
        "relatorios": items,
        "verificado_em": _TS,
    }


@router.post("/gerar")
async def gerar(body: dict, _: UserOut = Depends(get_current_user)):
    rel_id = body.get("id", "REL-001")
    rel = next((r for r in _TIPOS_RELATORIO if r["id"] == rel_id), _TIPOS_RELATORIO[0])
    return {
        "situacao_dado": "referencia_municipal",
        "ok": True,
        "relatorio": rel_id,
        "nome": rel["nome"],
        "formato": body.get("formato", "pdf"),
        "municipio": "Apuí/AM",
        "nota": "Geração de arquivo em modo referência — conecte sistema de origem para PDF/Excel real.",
        "solicitado_em": _TS,
    }
