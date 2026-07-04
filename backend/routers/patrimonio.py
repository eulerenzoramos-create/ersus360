"""
ERSUS 360 — Patrimônio e Frota
Bens patrimoniais, veículos, manutenção, abastecimento
"""
from fastapi import APIRouter, Depends
from routers.auth import get_current_user

router = APIRouter(prefix="/api/patrimonio", tags=["Patrimônio e Frota"])


@router.get("/bens")
async def listar_bens(_=Depends(get_current_user)):
    return {
        "bens": [
            {"tombamento": "SMS-001", "descricao": "Ambulância UTI Móvel", "tipo": "veiculo", "estado": "bom", "valor_aquisicao": 280000, "ano": 2022},
            {"tombamento": "SMS-002", "descricao": "Ultrassom portátil", "tipo": "equipamento_medico", "estado": "bom", "valor_aquisicao": 85000, "ano": 2023},
            {"tombamento": "SMS-003", "descricao": "Microscópio Laboratorial", "tipo": "equipamento_medico", "estado": "regular", "valor_aquisicao": 32000, "ano": 2020},
            {"tombamento": "SMS-004", "descricao": "Gerador 40kVA UBS Central", "tipo": "equipamento", "estado": "regular", "valor_aquisicao": 48000, "ano": 2021},
            {"tombamento": "SMS-005", "descricao": "Ar Condicionado Split 24k", "tipo": "equipamento", "estado": "bom", "valor_aquisicao": 3800, "ano": 2024},
        ],
        "resumo": {
            "total_bens": 5,
            "por_estado": {"otimo": 0, "bom": 3, "regular": 2, "ruim": 0, "inservivel": 0},
            "valor_total": 448800,
        },
        "fonte": "referencia",
    }


@router.get("/frota")
async def listar_frota(_=Depends(get_current_user)):
    return {
        "veiculos": [
            {
                "placa": "QRZ-8821", "descricao": "Ambulância UTI — Renault Master",
                "tipo": "ambulancia_uti", "ano": 2022, "km_atual": 48200,
                "ultima_manutencao": "2026-05-15", "status": "ativo",
                "responsavel": "Hospital Municipal",
            },
            {
                "placa": "QSA-4412", "descricao": "Ambulância Simples — Sprinter",
                "tipo": "ambulancia_simples", "ano": 2021, "km_atual": 72400,
                "ultima_manutencao": "2026-04-10", "status": "ativo",
                "responsavel": "UBS Central",
            },
            {
                "placa": "NRX-2290", "descricao": "Pickup Leve — Hilux",
                "tipo": "veiculo_leve", "ano": 2023, "km_atual": 31000,
                "ultima_manutencao": "2026-06-01", "status": "ativo",
                "responsavel": "Secretaria de Saúde",
            },
            {
                "placa": "PVZ-7741", "descricao": "Motocicleta — Honda CG 160",
                "tipo": "moto", "ano": 2022, "km_atual": 24800,
                "ultima_manutencao": "2026-05-20", "status": "ativo",
                "responsavel": "Vigilância em Saúde",
            },
            {
                "placa": "FMS-BARCO1", "descricao": "Lancha de Alumínio — 40HP",
                "tipo": "barco", "ano": 2020, "km_atual": 0,
                "ultima_manutencao": "2026-03-10", "status": "manutencao",
                "responsavel": "ACS Zonas Ribeirinhas",
            },
        ],
        "resumo": {
            "total": 5, "ativos": 4, "em_manutencao": 1, "inservivel": 0,
        },
        "fonte": "referencia",
    }


@router.get("/manutencao")
async def listar_manutencao(_=Depends(get_current_user)):
    return {
        "manutencoes": [
            {
                "id": 1, "veiculo": "QSA-4412 — Sprinter",
                "tipo": "preventiva", "km_entrada": 72400,
                "descricao": "Troca de óleo + filtros + revisão geral",
                "data": "2026-04-10", "custo": 1850.0, "oficina": "Auto Peças Apuí",
                "status": "concluida",
            },
            {
                "id": 2, "veiculo": "FMS-BARCO1 — Lancha",
                "tipo": "corretiva", "km_entrada": 0,
                "descricao": "Reparo no motor 40HP — bomba de combustível",
                "data": "2026-06-15", "custo": 3200.0, "oficina": "Náutica Amazonas",
                "status": "em_andamento",
            },
            {
                "id": 3, "veiculo": "NRX-2290 — Hilux",
                "tipo": "preventiva", "km_entrada": 31000,
                "descricao": "Revisão 30.000 km — troca óleo, correia",
                "data": "2026-06-01", "custo": 2400.0, "oficina": "Toyota Manaus",
                "status": "concluida",
            },
        ],
        "total_custo_ano": 7450.0,
        "fonte": "referencia",
    }


@router.get("/abastecimento")
async def listar_abastecimento(_=Depends(get_current_user)):
    return {
        "abastecimentos": [
            {"data": "2026-07-01", "veiculo": "QRZ-8821", "km": 48200, "litros": 60.0, "valor_total": 348.0, "consumo_km_l": 8.2},
            {"data": "2026-07-01", "veiculo": "QSA-4412", "km": 72400, "litros": 55.0, "valor_total": 319.0, "consumo_km_l": 7.8},
            {"data": "2026-06-30", "veiculo": "NRX-2290", "km": 31000, "litros": 40.0, "valor_total": 232.0, "consumo_km_l": 12.4},
            {"data": "2026-06-29", "veiculo": "PVZ-7741", "km": 24800, "litros": 8.0, "valor_total": 46.4, "consumo_km_l": 30.0},
        ],
        "custo_mes": 945.4,
        "fonte": "referencia",
    }


@router.get("/painel")
async def painel_patrimonio(_=Depends(get_current_user)):
    return {
        "total_bens": 5,
        "valor_patrimonio": 448800,
        "frota_total": 5,
        "frota_ativa": 4,
        "frota_manutencao": 1,
        "custo_manutencao_mes": 3200.0,
        "custo_combustivel_mes": 945.4,
        "alertas": [
            {"tipo": "manutencao", "descricao": "Lancha FMS-BARCO1 em manutenção há 22 dias"},
            {"tipo": "km", "descricao": "QSA-4412 — 72.400 km — próxima revisão em 2.600 km"},
        ],
        "fonte": "referencia",
    }
