"""
Router: /api/urgencia-emergencia — ERSUS 360
Dados de referência municipal — Apuí/AM
UBS com pronto-atendimento 24h · SAMU 192 · Sem UPA
"""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(prefix="/api/urgencia-emergencia", tags=["Urgência e Emergência"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "competencia": "Mar/2026",
        "upa_existe": False,
        "pronto_atendimento_ubs": True,
        "atendimentos_ubs_mes": 1248,
        "atendimentos_samu_mes": 187,
        "transferencias_reguladas_mes": 22,
        "obitos_urgencia_mes": 5,
        "leitos_observacao_ubs": 8,
        "leitos_observacao_ocupados": 6,
        "nota_estrutura": "Apuí não possui UPA. A urgência é atendida na UBS Central com PA 24h e 8 leitos de observação.",
    }


@router.get("/atendimentos")
async def atendimentos():
    return [
        {"situacao_dado": "referencia_municipal", "categoria": "Clínica médica geral", "total": 388, "pct": 31.1, "internados": 22, "transferidos": 2},
        {"situacao_dado": "referencia_municipal", "categoria": "Respiratório (asma, DPOC, pneumonia)", "total": 218, "pct": 17.5, "internados": 18, "transferidos": 4},
        {"situacao_dado": "referencia_municipal", "categoria": "Trauma / Acidentes", "total": 162, "pct": 13.0, "internados": 12, "transferidos": 6},
        {"situacao_dado": "referencia_municipal", "categoria": "Cardiovascular (HAS, ICC)", "total": 148, "pct": 11.9, "internados": 14, "transferidos": 3},
        {"situacao_dado": "referencia_municipal", "categoria": "Gastrointestinal", "total": 128, "pct": 10.3, "internados": 10, "transferidos": 1},
        {"situacao_dado": "referencia_municipal", "categoria": "Saúde mental / Psiquiatria", "total": 94, "pct": 7.5, "internados": 8, "transferidos": 2},
        {"situacao_dado": "referencia_municipal", "categoria": "Obstétrica", "total": 72, "pct": 5.8, "internados": 6, "transferidos": 4},
        {"situacao_dado": "referencia_municipal", "categoria": "Outros", "total": 38, "pct": 3.0, "internados": 4, "transferidos": 0},
    ]


@router.get("/samu")
async def samu():
    return {
        "situacao_dado": "referencia_municipal",
        "competencia": "Mar/2026",
        "chamadas_mes": 187,
        "atendimentos_realizados": 164,
        "tempo_resposta_medio_min": 18.4,
        "ambulancias_disponiveis": 1,
        "ambulancias_total": 2,
        "lancha_operacional": False,
        "transferencias_uti_mes": 14,
    }


@router.get("/causas")
async def causas():
    return [
        {"situacao_dado": "referencia_municipal", "cid10": "J18", "descricao": "Pneumonia", "atendimentos": 82, "obitos": 1},
        {"situacao_dado": "referencia_municipal", "cid10": "S00-S09", "descricao": "Traumatismo crânio-encefálico", "atendimentos": 48, "obitos": 1},
        {"situacao_dado": "referencia_municipal", "cid10": "I10", "descricao": "Hipertensão essencial — urgência", "atendimentos": 76, "obitos": 0},
        {"situacao_dado": "referencia_municipal", "cid10": "E14", "descricao": "Diabetes — hipoglicemia/cetoacidose", "atendimentos": 58, "obitos": 0},
        {"situacao_dado": "referencia_municipal", "cid10": "B54", "descricao": "Malária não especificada", "atendimentos": 42, "obitos": 1},
        {"situacao_dado": "referencia_municipal", "cid10": "F20-F29", "descricao": "Transtornos psicóticos agudos", "atendimentos": 38, "obitos": 0},
        {"situacao_dado": "referencia_municipal", "cid10": "I50", "descricao": "Insuficiência cardíaca — descompensação", "atendimentos": 34, "obitos": 2},
        {"situacao_dado": "referencia_municipal", "cid10": "T36-T65", "descricao": "Intoxicações / envenenamentos", "atendimentos": 28, "obitos": 0},
    ]
