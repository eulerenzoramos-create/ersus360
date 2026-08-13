"""
Router: /api/pnae — Programa Nacional de Alimentação Escolar · FNDE — FMS Apuí/AM
Dados de referência municipal. situacao_dado = referencia_municipal.
"""
from __future__ import annotations
from fastapi import APIRouter, Depends
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/pnae", tags=["pnae"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "2026",
        "alunos_beneficiados": 3840,
        "escolas_atendidas": 18,
        "repasse_fnde_mensal": 61000.00,
        "agricultores_da_local_pct": 34,
        "meta_da_local_pct": 30,
        "amostras_laboratorio_ok_pct": 96,
        "escolas_sem_nutri_visita_mes": 4,
        "fonte": "Referência municipal FMS Apuí/AM (FNDE 2026)",
    }


@router.get("/historico")
async def historico():
    return [
        {"mes": "Jan", "alunos": 3820, "da_local_pct": 32, "amostras_ok_pct": 94, "cardapios_ok_pct": 89},
        {"mes": "Fev", "alunos": 3835, "da_local_pct": 33, "amostras_ok_pct": 95, "cardapios_ok_pct": 91},
        {"mes": "Mar", "alunos": 3840, "da_local_pct": 34, "amostras_ok_pct": 96, "cardapios_ok_pct": 93},
        {"mes": "Abr", "alunos": 3840, "da_local_pct": 34, "amostras_ok_pct": 96, "cardapios_ok_pct": 93},
        {"mes": "Mai", "alunos": 3838, "da_local_pct": 35, "amostras_ok_pct": 97, "cardapios_ok_pct": 94},
        {"mes": "Jun", "alunos": 3840, "da_local_pct": 34, "amostras_ok_pct": 96, "cardapios_ok_pct": 93},
    ]


@router.get("/escolas")
async def escolas():
    return [
        {
            "escola": "EMEF Castelo Branco",
            "tipo": "Municipal urbana",
            "alunos": 620,
            "refeicoes_dia": 2,
            "nutricionista_visita_mes": True,
            "cardapio_aprovado": True,
            "agricultora_local_pct": 38,
            "status": "ok",
        },
        {
            "escola": "EMEF Nossa Senhora do Carmo",
            "tipo": "Municipal urbana",
            "alunos": 480,
            "refeicoes_dia": 2,
            "nutricionista_visita_mes": True,
            "cardapio_aprovado": True,
            "agricultora_local_pct": 32,
            "status": "ok",
        },
        {
            "escola": "EMEF Floresta Amazônica",
            "tipo": "Municipal rural",
            "alunos": 180,
            "refeicoes_dia": 3,
            "nutricionista_visita_mes": False,
            "cardapio_aprovado": True,
            "agricultora_local_pct": 45,
            "status": "atencao",
        },
        {
            "escola": "EMEF Rio Apuí",
            "tipo": "Ribeirinha",
            "alunos": 72,
            "refeicoes_dia": 3,
            "nutricionista_visita_mes": False,
            "cardapio_aprovado": False,
            "agricultora_local_pct": 52,
            "status": "critico",
        },
        {
            "escola": "EMEF São Francisco",
            "tipo": "Municipal urbana",
            "alunos": 310,
            "refeicoes_dia": 2,
            "nutricionista_visita_mes": True,
            "cardapio_aprovado": True,
            "agricultora_local_pct": 30,
            "status": "ok",
        },
        {
            "escola": "EMEF Km 180",
            "tipo": "Assentamento rural",
            "alunos": 130,
            "refeicoes_dia": 3,
            "nutricionista_visita_mes": False,
            "cardapio_aprovado": True,
            "agricultora_local_pct": 48,
            "status": "atencao",
        },
        {
            "escola": "EMEF Indígena Paranawaite",
            "tipo": "Indígena",
            "alunos": 88,
            "refeicoes_dia": 3,
            "nutricionista_visita_mes": False,
            "cardapio_aprovado": False,
            "agricultora_local_pct": 61,
            "status": "critico",
        },
        {
            "escola": "EMEF Centro",
            "tipo": "Municipal urbana",
            "alunos": 540,
            "refeicoes_dia": 2,
            "nutricionista_visita_mes": True,
            "cardapio_aprovado": True,
            "agricultora_local_pct": 31,
            "status": "ok",
        },
    ]


@router.get("/fornecedores")
async def fornecedores():
    return [
        {
            "fornecedor": "Associação de Agricultores Familiares de Apuí (AAFA)",
            "tipo": "Agricultura familiar local",
            "dap_valida": True,
            "itens_fornecidos": ["Mandioca", "Açaí", "Banana", "Peixe fresco", "Feijão"],
            "valor_contrato_mensal": 18400.00,
            "percentual_total": 30.2,
        },
        {
            "fornecedor": "Cooperativa Ribeirinha Apuí (CORA)",
            "tipo": "Agricultura familiar local",
            "dap_valida": True,
            "itens_fornecidos": ["Macaxeira", "Pupunha", "Laranja", "Ovos caipira"],
            "valor_contrato_mensal": 4860.00,
            "percentual_total": 7.9,
        },
        {
            "fornecedor": "Distribuidora Nutri Norte",
            "tipo": "Fornecedor convencional",
            "dap_valida": False,
            "itens_fornecidos": ["Arroz", "Feijão embalado", "Óleo", "Macarrão", "Leite em pó"],
            "valor_contrato_mensal": 27800.00,
            "percentual_total": 45.6,
        },
        {
            "fornecedor": "Padaria e Confeitaria São João",
            "tipo": "Fornecedor local (não DAP)",
            "dap_valida": False,
            "itens_fornecidos": ["Pão francês", "Biscoito"],
            "valor_contrato_mensal": 9940.00,
            "percentual_total": 16.3,
        },
    ]
