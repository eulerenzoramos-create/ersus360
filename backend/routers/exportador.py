"""
Router: /api/exportador — Exportacao de relatorios ERSUS 360
Relatorios reais gerados a partir dos dados do banco + integracoes.
Geracao de arquivo real ainda nao implementada → nao_disponivel.
"""
from __future__ import annotations
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/exportador", tags=["exportador"])

_TIPOS_RELATORIO = [
    {"id": "REL-001", "nome": "Relatorio de Gestao Quadrimestral",      "modulo": "Gestao",    "formatos": ["pdf", "excel"]},
    {"id": "REL-002", "nome": "Producao APS — Boletim Mensal",          "modulo": "APS",       "formatos": ["pdf", "excel", "csv"]},
    {"id": "REL-003", "nome": "Mapa de Cobertura Vacinal PNI",          "modulo": "Vigilancia","formatos": ["pdf", "excel"]},
    {"id": "REL-004", "nome": "Extrato Financeiro — Repasses FNS",      "modulo": "Financeiro","formatos": ["pdf", "excel", "csv"]},
    {"id": "REL-005", "nome": "Inventario do Almoxarifado",             "modulo": "Gestao",    "formatos": ["excel", "csv"]},
    {"id": "REL-006", "nome": "Indicadores IDSUS Municipal",            "modulo": "Gestao",    "formatos": ["pdf", "excel"]},
    {"id": "REL-007", "nome": "Indicadores Saude Bucal — SB Brasil",    "modulo": "SaudeBucal","formatos": ["pdf", "excel"]},
    {"id": "REL-008", "nome": "Carteira de Contratos FMS",              "modulo": "Gestao",    "formatos": ["pdf", "excel"]},
    {"id": "REL-009", "nome": "Relatorio de Busca Ativa — IA",          "modulo": "APS",       "formatos": ["pdf", "excel"]},
    {"id": "REL-010", "nome": "Mapa Sanitario — Unidades de Saude",     "modulo": "Gestao",    "formatos": ["pdf"]},
]


@router.get("/resumo")
async def resumo(_: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado":          "nao_disponivel",
        "relatorios_disponiveis": len(_TIPOS_RELATORIO),
        "geracoes_mes":           None,
        "ultima_exportacao":      None,
        "formatos_suportados":    ["pdf", "excel", "csv"],
        "nota":                   "Geracao de arquivos ainda nao implementada nesta versao.",
    }


@router.get("/lista")
async def lista(
    modulo: Optional[str] = None,
    _: UserOut = Depends(get_current_user),
):
    items = list(_TIPOS_RELATORIO)
    if modulo:
        items = [r for r in items if r["modulo"] == modulo]
    return [
        {**r, "ultima_geracao": None, "situacao_dado": "nao_disponivel"}
        for r in items
    ]


@router.post("/gerar")
async def gerar(body: dict, _: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado": "nao_disponivel",
        "ok":            False,
        "nota":          "Geracao de relatorios ainda nao implementada. Em desenvolvimento.",
        "solicitado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
