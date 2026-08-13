"""
Router: /api/patrimonio — ERSUS 360
Dados de referência municipal — Apuí/AM. situacao_dado = referencia_municipal.
"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from typing import Optional
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/patrimonio", tags=["Patrimônio e Frota"])

_TS = "2026-08-13T00:00:00Z"

_BENS = [
    {"tombamento": "PAT-001", "descricao": "Ambulância Toyota Hilux SW4 — Branca",         "placa": "QRM-1A23", "ano": 2021, "estado": "bom",        "unidade": "Frota SMS",       "valor_atual": 195000.00},
    {"tombamento": "PAT-002", "descricao": "Ambulância Fiat Ducato — Unidade Móvel",        "placa": "QRL-9B12", "ano": 2019, "estado": "regular",    "unidade": "Frota SMS",       "valor_atual": 120000.00},
    {"tombamento": "PAT-003", "descricao": "Pickup F-250 — Transporte de Insumos",          "placa": "QRN-4C56", "ano": 2020, "estado": "bom",        "unidade": "Frota SMS",       "valor_atual": 145000.00},
    {"tombamento": "PAT-004", "descricao": "Microscópio binocular Olympus CX23",            "placa": None,       "ano": 2020, "estado": "bom",        "unidade": "Laboratório UBS", "valor_atual": 8500.00},
    {"tombamento": "PAT-005", "descricao": "Autoclave vertical 21L",                        "placa": None,       "ano": 2019, "estado": "bom",        "unidade": "UBS Central",     "valor_atual": 6200.00},
    {"tombamento": "PAT-006", "descricao": "Cadeira odontológica Dabi Atlante",              "placa": None,       "ano": 2018, "estado": "regular",    "unidade": "ESF Centro",      "valor_atual": 12000.00},
    {"tombamento": "PAT-007", "descricao": "Equipamento de raio-X portátil",                "placa": None,       "ano": 2022, "estado": "bom",        "unidade": "UBS Central",     "valor_atual": 42000.00},
    {"tombamento": "PAT-008", "descricao": "Gerador elétrico 15 kVA",                       "placa": None,       "ano": 2021, "estado": "bom",        "unidade": "UBS Central",     "valor_atual": 18500.00},
    {"tombamento": "PAT-009", "descricao": "Ultrassonografia portátil",                     "placa": None,       "ano": 2023, "estado": "bom",        "unidade": "UBS Central",     "valor_atual": 68000.00},
    {"tombamento": "PAT-010", "descricao": "Ar condicionado split 18.000 BTUs (5 unid.)",   "placa": None,       "ano": 2022, "estado": "bom",        "unidade": "Diversas UBS",    "valor_atual": 15000.00},
    {"tombamento": "PAT-011", "descricao": "Freezer para vacinas (-20°C) Consul",           "placa": None,       "ano": 2021, "estado": "bom",        "unidade": "Sala de Vacinas", "valor_atual": 4800.00},
    {"tombamento": "PAT-012", "descricao": "Refrigerador para vacinas (2-8°C) Haier",       "placa": None,       "ano": 2023, "estado": "bom",        "unidade": "Sala de Vacinas", "valor_atual": 5200.00},
    {"tombamento": "PAT-013", "descricao": "Computador Desktop i5 (12 unid.)",              "placa": None,       "ano": 2023, "estado": "bom",        "unidade": "Sede SMS",        "valor_atual": 36000.00},
    {"tombamento": "PAT-014", "descricao": "Moto Honda CG 160 — ACS",                      "placa": "QRP-7D89", "ano": 2022, "estado": "bom",        "unidade": "Frota SMS",       "valor_atual": 14000.00},
    {"tombamento": "PAT-015", "descricao": "Lancha alumínio 6m — Saúde Ribeirinha",         "placa": "AM-123456","ano": 2020, "estado": "regular",    "unidade": "Frota SMS",       "valor_atual": 32000.00},
]


@router.get("/bens")
async def listar_bens(_: UserOut = Depends(get_current_user)):
    valor_total = sum(b["valor_atual"] for b in _BENS)
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "total_bens": len(_BENS),
        "valor_total_patrimonio": valor_total,
        "bens_em_bom_estado": sum(1 for b in _BENS if b["estado"] == "bom"),
        "bens_em_estado_regular": sum(1 for b in _BENS if b["estado"] == "regular"),
        "bens": _BENS,
        "verificado_em": _TS,
    }


@router.get("/frota")
async def listar_frota(_: UserOut = Depends(get_current_user)):
    frota = [b for b in _BENS if b["placa"] is not None]
    return {
        "situacao_dado": "referencia_municipal",
        "total_veiculos": len(frota),
        "veiculos": [
            {**v, "km_atual": {"PAT-001": 82340, "PAT-002": 134500, "PAT-003": 67200, "PAT-014": 18900, "PAT-015": None}.get(v["tombamento"], None)}
            for v in frota
        ],
        "verificado_em": _TS,
    }


@router.get("/manutencao")
async def listar_manutencao(_: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado": "referencia_municipal",
        "manutencoes": [
            {"tombamento": "PAT-002", "descricao": "Ambulância Ducato",      "tipo": "corretiva",  "problema": "Troca de embreagem",          "data_entrada": "2025-07-10", "data_saida": "2025-07-22", "custo": 3200.00,  "status": "concluida"},
            {"tombamento": "PAT-001", "descricao": "Ambulância Hilux SW4",   "tipo": "preventiva", "problema": "Revisão 80.000 km",           "data_entrada": "2025-08-05", "data_saida": "2025-08-08", "custo": 1850.00,  "status": "concluida"},
            {"tombamento": "PAT-006", "descricao": "Cadeira odontológica",   "tipo": "corretiva",  "problema": "Regulagem do compressor",     "data_entrada": "2025-08-01", "data_saida": None,          "custo": None,     "status": "em_andamento"},
            {"tombamento": "PAT-015", "descricao": "Lancha ribeirinha",      "tipo": "preventiva", "problema": "Revisão motor Yamaha 40HP",   "data_entrada": "2025-06-20", "data_saida": "2025-06-24", "custo": 980.00,   "status": "concluida"},
        ],
        "custo_total_manutencao_2025": 6030.00,
        "verificado_em": _TS,
    }


@router.get("/abastecimento")
async def listar_abastecimento(_: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado": "referencia_municipal",
        "abastecimentos_2025": [
            {"mes": "jan/2025", "veiculo": "PAT-001", "litros": 320, "valor_total": 2240.00},
            {"mes": "jan/2025", "veiculo": "PAT-002", "litros": 280, "valor_total": 1960.00},
            {"mes": "jan/2025", "veiculo": "PAT-003", "litros": 190, "valor_total": 1330.00},
            {"mes": "fev/2025", "veiculo": "PAT-001", "litros": 295, "valor_total": 2065.00},
            {"mes": "fev/2025", "veiculo": "PAT-002", "litros": 260, "valor_total": 1820.00},
            {"mes": "mar/2025", "veiculo": "PAT-001", "litros": 340, "valor_total": 2380.00},
            {"mes": "mar/2025", "veiculo": "PAT-003", "litros": 175, "valor_total": 1225.00},
        ],
        "custo_combustivel_jan_mar_2025": 13020.00,
        "media_mensal": 4340.00,
        "verificado_em": _TS,
    }


@router.get("/painel")
async def painel_patrimonio(_: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "total_bens_tombados": len(_BENS),
        "valor_total_patrimonio": sum(b["valor_atual"] for b in _BENS),
        "total_veiculos": 5,
        "veiculos_operacionais": 4,
        "veiculos_em_manutencao": 1,
        "bens_em_bom_estado_pct": round(100 * sum(1 for b in _BENS if b["estado"] == "bom") / len(_BENS), 1),
        "custo_manutencao_ano": 6030.00,
        "custo_combustivel_ano_parcial": 13020.00,
        "ultima_inventario": "2024-12-15",
        "verificado_em": _TS,
    }
