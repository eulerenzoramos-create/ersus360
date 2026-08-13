"""
Router: /api/exportador — Exportação de relatórios ERSUS 360
Dados de referência municipal — Apuí/AM. situacao_dado = referencia_municipal.
"""
from __future__ import annotations
import uuid
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/exportador", tags=["exportador"])

_TS = "2026-08-13T00:00:00Z"

_TIPOS_RELATORIO = [
    {"id": "REL-001", "nome": "Relatório de Gestão Quadrimestral (RDQA)",    "descricao": "Relatório de Gestão conforme RDQA — DigiSUS Gestor",                "modulo": "Gestao",       "formatos": ["pdf", "excel"], "ultima_geracao": "2025-09-15", "tempo_estimado_s": 8,  "status": "disponivel"},
    {"id": "REL-002", "nome": "Produção APS — Boletim Mensal",               "descricao": "Produção ambulatorial das equipes ESF — SISAB",                     "modulo": "APS",          "formatos": ["pdf", "excel", "csv"], "ultima_geracao": "2025-08-05", "tempo_estimado_s": 5,  "status": "disponivel"},
    {"id": "REL-003", "nome": "Mapa de Cobertura Vacinal PNI",                "descricao": "Cobertura vacinal por imunobiológico — SIPNI",                      "modulo": "Vigilância",   "formatos": ["pdf", "excel"], "ultima_geracao": "2025-07-15", "tempo_estimado_s": 6,  "status": "disponivel"},
    {"id": "REL-004", "nome": "Extrato Financeiro — Repasses FNS",            "descricao": "Repasses por bloco de financiamento — FNS",                         "modulo": "Financeiro",   "formatos": ["pdf", "excel", "csv"], "ultima_geracao": "2025-09-02", "tempo_estimado_s": 4,  "status": "disponivel"},
    {"id": "REL-005", "nome": "Inventário do Almoxarifado CAF",               "descricao": "Posição de estoque medicamentos — CAF SMS Apuí",                    "modulo": "Gestao",       "formatos": ["excel", "csv"], "ultima_geracao": "2025-07-31", "tempo_estimado_s": 3,  "status": "disponivel"},
    {"id": "REL-006", "nome": "Indicadores IDSUS Municipal",                  "descricao": "Painel IDSUS — desempenho municipal SUS",                           "modulo": "Gestao",       "formatos": ["pdf", "excel"], "ultima_geracao": "2025-06-30", "tempo_estimado_s": 7,  "status": "disponivel"},
    {"id": "REL-007", "nome": "Indicadores Saúde Bucal — SB Brasil",          "descricao": "Indicadores de saúde bucal — SISAB / SIA",                          "modulo": "Saúde Bucal",  "formatos": ["pdf", "excel"], "ultima_geracao": "2025-03-15", "tempo_estimado_s": 5,  "status": "disponivel"},
    {"id": "REL-008", "nome": "Carteira de Contratos FMS",                    "descricao": "Contratos ativos e vencendo — FMS Apuí",                            "modulo": "Gestao",       "formatos": ["pdf", "excel"], "ultima_geracao": "2025-08-01", "tempo_estimado_s": 3,  "status": "disponivel"},
    {"id": "REL-009", "nome": "Relatório de Busca Ativa — IA (ACS)",          "descricao": "Famílias priorizadas pela IA para busca ativa — ERSUS",             "modulo": "APS",          "formatos": ["pdf", "excel"], "ultima_geracao": "2025-07-28", "tempo_estimado_s": 6,  "status": "disponivel"},
    {"id": "REL-010", "nome": "Mapa Sanitário — Unidades de Saúde Apuí",      "descricao": "Georreferenciamento e perfil das unidades — SCNES",                 "modulo": "Gestao",       "formatos": ["pdf"],          "ultima_geracao": "2025-05-10", "tempo_estimado_s": 9,  "status": "disponivel"},
    {"id": "REL-011", "nome": "Relatório de Gestão Anual (RAG 2024)",          "descricao": "RAG 2024 aprovado pelo CMS — Resolução 02/2025",                   "modulo": "Gestao",       "formatos": ["pdf"],          "ultima_geracao": "2025-03-01", "tempo_estimado_s": 12, "status": "disponivel"},
    {"id": "REL-012", "nome": "OKR Municipal — Progresso Ciclo 2026",          "descricao": "Objetivos e resultados-chave — ciclo 2026 SMS Apuí",               "modulo": "Planejamento", "formatos": ["pdf", "excel"], "ultima_geracao": "2025-08-10", "tempo_estimado_s": 4,  "status": "disponivel"},
    {"id": "REL-013", "nome": "Folha de Pagamento SMS — Sintético",            "descricao": "Folha sintética servidores SMS — competência mensal",               "modulo": "RH",           "formatos": ["pdf", "excel"], "ultima_geracao": "2025-08-01", "tempo_estimado_s": 3,  "status": "disponivel"},
    {"id": "REL-014", "nome": "Inventário Patrimônio SMS",                     "descricao": "Bens tombados, depreciação e situação — FMS Apuí",                 "modulo": "Patrimônio",   "formatos": ["excel", "csv"], "ultima_geracao": "2024-12-15", "tempo_estimado_s": 5,  "status": "disponivel"},
    {"id": "REL-015", "nome": "Painel Epidemiológico Mensal",                  "descricao": "Agravos notificados SINAN + situação vacinal — mensal",             "modulo": "Vigilância",   "formatos": ["pdf", "excel"], "ultima_geracao": "2025-08-05", "tempo_estimado_s": 7,  "status": "disponivel"},
    {"id": "REL-016", "nome": "Farmácia Básica — Cobertura REMUME",            "descricao": "Disponibilidade medicamentos REMUME — CAF SMS",                    "modulo": "Farmácia",     "formatos": ["pdf", "excel"], "ultima_geracao": "2025-08-01", "tempo_estimado_s": 4,  "status": "disponivel"},
    {"id": "REL-017", "nome": "Prestação de Contas TCE-AM — FMS",              "descricao": "Relatório de prestação de contas para o TCE-AM",                   "modulo": "Financeiro",   "formatos": ["pdf"],          "ultima_geracao": "2025-03-30", "tempo_estimado_s": 10, "status": "disponivel"},
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
        "modulos": sorted(list({r["modulo"] for r in _TIPOS_RELATORIO})),
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
    return items


@router.post("/gerar")
async def gerar(body: dict, _: UserOut = Depends(get_current_user)):
    rel_id = body.get("relatorio_id", "REL-001")
    formato = body.get("formato", "pdf")
    rel = next((r for r in _TIPOS_RELATORIO if r["id"] == rel_id), _TIPOS_RELATORIO[0])
    job_id = str(uuid.uuid4())[:8].upper()
    return {
        "job_id": job_id,
        "relatorio_id": rel_id,
        "nome": rel["nome"],
        "formato": formato,
        "status": "concluido",
        "criado_em": _TS[:16].replace("T", " "),
        "url_download": f"/api/exportador/download/{job_id}?formato={formato}",
        "erro": None,
        "situacao_dado": "referencia_municipal",
        "nota": "Arquivo referência — conecte sistema de origem para exportação real.",
    }
