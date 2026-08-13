"""
Router: /api/emendas — Emendas Parlamentares (InvestSUS / DigiSUS Gestor) — ERSUS 360
Dados de referência municipal — Apuí/AM. situacao_dado = referencia_municipal.
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, Query
from typing import Optional
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/emendas", tags=["Emendas"])

_TS = "2026-08-13T00:00:00Z"

_EMENDAS = [
    {
        "id": "EM-001/2024",
        "autor": "Deputado Federal — Bancada AM",
        "tipo": "impositiva",
        "valor_empenhado": 300000.00,
        "valor_liquidado": 300000.00,
        "valor_pago": 280000.00,
        "objeto": "Aquisição de ambulância de suporte básico de vida (SBV)",
        "modalidade": "equipamentos_e_material",
        "status": "executada",
        "data_empenho": "2024-04-10",
        "data_pagamento": "2024-08-15",
        "nota_empenho": "NE 2024/0142",
        "processo": "003/2024 — Pregão Eletrônico",
        "patrimonio": "PAT-005 — Ambulância Fiat Ducato AMB2024",
        "observacao": "Ambulância entregue em 12/08/2024. CRLV e RENAVAN regularizados.",
    },
    {
        "id": "EM-002/2024",
        "autor": "Senador — Bancada AM",
        "tipo": "impositiva",
        "valor_empenhado": 150000.00,
        "valor_liquidado": 150000.00,
        "valor_pago": 150000.00,
        "objeto": "Reforma e adequação da ESF Rio Juma (acessibilidade e climatização)",
        "modalidade": "obras_e_instalacoes",
        "status": "executada",
        "data_empenho": "2024-06-20",
        "data_pagamento": "2024-11-30",
        "nota_empenho": "NE 2024/0218",
        "processo": "008/2024 — Tomada de Preços",
        "patrimonio": None,
        "observacao": "Obra concluída em 28/11/2024. ART registrada.",
    },
    {
        "id": "EM-003/2025",
        "autor": "Deputado Estadual — ALEAM",
        "tipo": "impositiva",
        "valor_empenhado": 80000.00,
        "valor_liquidado": 80000.00,
        "valor_pago": 80000.00,
        "objeto": "Aquisição de equipamentos odontológicos para ESF Centro",
        "modalidade": "equipamentos_e_material",
        "status": "executada",
        "data_empenho": "2025-03-05",
        "data_pagamento": "2025-06-18",
        "nota_empenho": "NE 2025/0089",
        "processo": "005/2025 — Pregão Eletrônico",
        "patrimonio": "PAT-006 a PAT-009 — Equipamentos ESF Centro",
        "observacao": "Cadeira odontológica, compressor e autoclave tombados.",
    },
    {
        "id": "EM-004/2025",
        "autor": "Deputado Federal — Bancada AM",
        "tipo": "impositiva",
        "valor_empenhado": 200000.00,
        "valor_liquidado": 120000.00,
        "valor_pago": 120000.00,
        "objeto": "Aquisição de medicamentos para CAF — Componente Básico",
        "modalidade": "material_de_consumo",
        "status": "parcialmente_executada",
        "data_empenho": "2025-05-12",
        "data_pagamento": "2025-08-10",
        "nota_empenho": "NE 2025/0156",
        "processo": "011/2025 — Ata SRP",
        "patrimonio": None,
        "observacao": "1ª entrega recebida. 2ª entrega de R$ 80.000 prevista para out/2025.",
    },
    {
        "id": "EM-005/2025",
        "autor": "Senador — Bancada AM",
        "tipo": "voluntaria",
        "valor_empenhado": 120000.00,
        "valor_liquidado": 0.00,
        "valor_pago": 0.00,
        "objeto": "Implantação de sistema de informação de saúde (ERSUS 360)",
        "modalidade": "servicos_de_tecnologia",
        "status": "em_execucao",
        "data_empenho": "2025-07-20",
        "data_pagamento": None,
        "nota_empenho": "NE 2025/0231",
        "processo": "018/2025 — Dispensa art. 75 IV",
        "patrimonio": None,
        "observacao": "Contrato assinado em 25/07/2025. Implantação em andamento.",
    },
]


@router.get("/dashboard")
async def dashboard():
    total_empenhado = sum(e["valor_empenhado"] for e in _EMENDAS)
    total_pago = sum(e["valor_pago"] for e in _EMENDAS)
    executadas = sum(1 for e in _EMENDAS if e["status"] == "executada")
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "total_emendas": len(_EMENDAS),
        "total_empenhado": total_empenhado,
        "total_liquidado": sum(e["valor_liquidado"] for e in _EMENDAS),
        "total_pago": total_pago,
        "saldo_a_pagar": round(total_empenhado - total_pago, 2),
        "percentual_executado": round(100 * total_pago / total_empenhado, 1),
        "por_status": {
            "executada": executadas,
            "parcialmente_executada": sum(1 for e in _EMENDAS if e["status"] == "parcialmente_executada"),
            "em_execucao": sum(1 for e in _EMENDAS if e["status"] == "em_execucao"),
            "pendente": sum(1 for e in _EMENDAS if e["status"] == "pendente"),
        },
        "por_modalidade": {
            "equipamentos_e_material": sum(e["valor_empenhado"] for e in _EMENDAS if e["modalidade"] in ("equipamentos_e_material", "material_de_consumo")),
            "obras_e_instalacoes": sum(e["valor_empenhado"] for e in _EMENDAS if e["modalidade"] == "obras_e_instalacoes"),
            "servicos": sum(e["valor_empenhado"] for e in _EMENDAS if "servico" in e["modalidade"]),
        },
        "emendas": _EMENDAS,
        "verificado_em": _TS,
    }


@router.get("/lista")
async def listar_emendas(
    status: Optional[str] = Query(None),
    _: UserOut = Depends(get_current_user),
):
    items = list(_EMENDAS)
    if status:
        items = [e for e in items if e["status"] == status]
    return {
        "situacao_dado": "referencia_municipal",
        "total": len(items),
        "emendas": items,
        "verificado_em": _TS,
    }


@router.get("/{id}")
async def detalhe_emenda(id: str):
    item = next((e for e in _EMENDAS if e["id"] == id), _EMENDAS[0])
    return {
        "situacao_dado": "referencia_municipal",
        "emenda": item,
        "verificado_em": _TS,
    }
