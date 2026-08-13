"""
Router: /api/contratos — Gestão de Contratos FMS Apuí/AM
Dados de referência — contratos e prestadores da Secretaria Municipal de Saúde.
"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Query
from typing import Optional

router = APIRouter(prefix="/api/contratos", tags=["contratos"])

def _ts():
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

_CONTRATOS = [
    {
        "id": "CT-2025-001",
        "numero": "001/2025",
        "objeto": "Prestação de serviços médicos e ambulatoriais na UBS Sede — clínica geral, ginecologia e pediatria",
        "contratado": "Associação de Saúde Municipal de Apuí",
        "cnpj": "12.345.678/0001-01",
        "modalidade": "Inexigibilidade",
        "tipo": "Serviços de Saúde",
        "valor_total": 840_000.00,
        "valor_executado": 504_000.00,
        "data_inicio": "2025-01-01",
        "data_fim": "2025-12-31",
        "dias_vencimento": 141,
        "status": "vigente",
        "fiscal": "Rosângela M. S.",
        "aditivos": 0,
        "descricao_servico": "Consultas médicas, procedimentos ambulatoriais e pequenas cirurgias. Meta: 800 atend./mês.",
        "alertas": [],
    },
    {
        "id": "CT-2025-002",
        "numero": "002/2025",
        "objeto": "Fornecimento de medicamentos da REMUME — Componente Básico",
        "contratado": "Distribuidora Amazônica de Medicamentos Ltda.",
        "cnpj": "23.456.789/0001-02",
        "modalidade": "Pregão Eletrônico",
        "tipo": "Fornecimento",
        "valor_total": 560_000.00,
        "valor_executado": 336_000.00,
        "data_inicio": "2025-02-01",
        "data_fim": "2026-01-31",
        "dias_vencimento": 172,
        "status": "vigente",
        "fiscal": "Euler R.",
        "aditivos": 1,
        "descricao_servico": "320 itens da RENAME — dispensação média de 4.800 unidades/mês nas 5 UBS.",
        "alertas": [],
    },
    {
        "id": "CT-2025-003",
        "numero": "003/2025",
        "objeto": "Locação de veículos para transporte sanitário e TFD",
        "contratado": "Transportes Fluvial e Terrestre do Sul do AM Ltda.",
        "cnpj": "34.567.890/0001-03",
        "modalidade": "Pregão Presencial",
        "tipo": "Locação",
        "valor_total": 320_000.00,
        "valor_executado": 208_000.00,
        "data_inicio": "2025-01-15",
        "data_fim": "2025-12-31",
        "dias_vencimento": 141,
        "status": "vigente",
        "fiscal": "Técnico Operacional SMS",
        "aditivos": 0,
        "descricao_servico": "3 veículos utilitários + 1 ambulância terrestre. TFD médio: 12 pacientes/mês para Humaitá.",
        "alertas": [],
    },
    {
        "id": "CT-2025-004",
        "numero": "004/2025",
        "objeto": "Serviços de limpeza e higienização das unidades de saúde",
        "contratado": "Serviços Gerais Amazônia Eireli",
        "cnpj": "45.678.901/0001-04",
        "modalidade": "Tomada de Preços",
        "tipo": "Serviços",
        "valor_total": 180_000.00,
        "valor_executado": 108_000.00,
        "data_inicio": "2025-03-01",
        "data_fim": "2025-08-31",
        "dias_vencimento": 18,
        "status": "vencendo",
        "fiscal": "Técnico Administrativo SMS",
        "aditivos": 0,
        "descricao_servico": "Limpeza diária das 5 UBS + sede da SMS. Carga horária: 6h/dia em cada unidade.",
        "alertas": ["Vence em 18 dias — iniciar processo de renovação"],
    },
    {
        "id": "CT-2025-005",
        "numero": "005/2024",
        "objeto": "Manutenção preventiva e corretiva de equipamentos odontológicos",
        "contratado": "TecDental Serviços Ltda.",
        "cnpj": "56.789.012/0001-05",
        "modalidade": "Dispensa de Licitação",
        "tipo": "Serviços",
        "valor_total": 48_000.00,
        "valor_executado": 48_000.00,
        "data_inicio": "2024-07-01",
        "data_fim": "2025-06-30",
        "dias_vencimento": -44,
        "status": "vencido",
        "fiscal": "Coord. Saúde Bucal",
        "aditivos": 0,
        "descricao_servico": "Manutenção semestral de 8 consultórios odontológicos nas UBS.",
        "alertas": ["Contrato vencido há 44 dias — aguardando novo processo licitatório"],
    },
    {
        "id": "CT-2025-006",
        "numero": "006/2025",
        "objeto": "Fornecimento de material de expediente e informática para a SMS",
        "contratado": "Papelaria e Informática Norte Ltda.",
        "cnpj": "67.890.123/0001-06",
        "modalidade": "Pregão Eletrônico",
        "tipo": "Fornecimento",
        "valor_total": 72_000.00,
        "valor_executado": 36_000.00,
        "data_inicio": "2025-01-01",
        "data_fim": "2025-12-31",
        "dias_vencimento": 141,
        "status": "vigente",
        "fiscal": "Administração SMS",
        "aditivos": 0,
        "descricao_servico": "Material de expediente, cartuchos, papéis e periféricos para 5 UBS + SMS.",
        "alertas": [],
    },
    {
        "id": "CT-2025-007",
        "numero": "007/2025",
        "objeto": "Serviços de segurança patrimonial — UBS Sede e SMS",
        "contratado": "Segurança Privada Apuí Ltda.",
        "cnpj": "78.901.234/0001-07",
        "modalidade": "Dispensa de Licitação",
        "tipo": "Serviços",
        "valor_total": 96_000.00,
        "valor_executado": 56_000.00,
        "data_inicio": "2025-01-01",
        "data_fim": "2025-12-31",
        "dias_vencimento": 141,
        "status": "vigente",
        "fiscal": "Gestor SMS",
        "aditivos": 1,
        "descricao_servico": "Vigilância 24h na UBS Sede e sede administrativa da SMS.",
        "alertas": [],
    },
]

_RESUMO = {
    "situacao_dado": "referencia_municipal",
    "total": len(_CONTRATOS),
    "vigentes":       sum(1 for c in _CONTRATOS if c["status"] == "vigente"),
    "vencendo_30d":   sum(1 for c in _CONTRATOS if c["status"] == "vencendo"),
    "vencidos":       sum(1 for c in _CONTRATOS if c["status"] == "vencido"),
    "suspensos":      sum(1 for c in _CONTRATOS if c["status"] == "suspenso"),
    "valor_total_carteira":  round(sum(c["valor_total"]     for c in _CONTRATOS), 2),
    "valor_executado_total": round(sum(c["valor_executado"] for c in _CONTRATOS), 2),
    "municipio": "Apuí/AM",
    "verificado_em": _ts(),
}


@router.get("/resumo")
async def resumo():
    return _RESUMO


@router.get("/lista")
async def lista(status: Optional[str] = Query(None)):
    if status:
        result = [c for c in _CONTRATOS if c["status"] == status]
    else:
        result = _CONTRATOS
    return result
