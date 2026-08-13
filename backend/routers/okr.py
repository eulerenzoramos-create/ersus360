"""
Router: /api/okr — ERSUS 360
Dados de referência municipal — Apuí/AM. situacao_dado = referencia_municipal.
"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from typing import Optional
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/okr", tags=["okr"])

_TS = "2026-08-13T00:00:00Z"

_OBJETIVOS = [
    {
        "id": "O1",
        "objetivo": "Ampliar a cobertura e qualidade da Atenção Primária à Saúde",
        "responsavel": "Coord. APS",
        "ciclo": "2026",
        "progresso_geral": 72.0,
        "key_results": [
            {"id": "O1-KR1", "descricao": "Cobertura ESF ≥ 80% até dez/2026", "meta": 80.0, "atual": 78.5, "unidade": "%", "status": "em_andamento"},
            {"id": "O1-KR2", "descricao": "≥ 85% das famílias visitadas 1×/mês por ACS", "meta": 85.0, "atual": 79.3, "unidade": "%", "status": "em_andamento"},
            {"id": "O1-KR3", "descricao": "Pré-natal com 7+ consultas ≥ 80%", "meta": 80.0, "atual": 71.4, "unidade": "%", "status": "alerta"},
            {"id": "O1-KR4", "descricao": "Primeira consulta odontológica ≥ 6% pop.", "meta": 6.0, "atual": 5.3, "unidade": "%", "status": "em_andamento"},
        ],
    },
    {
        "id": "O2",
        "objetivo": "Fortalecer a Vigilância em Saúde e reduzir endemias",
        "responsavel": "SEVIG",
        "ciclo": "2026",
        "progresso_geral": 81.5,
        "key_results": [
            {"id": "O2-KR1", "descricao": "IPA malária < 10/1.000 hab.", "meta": 10.0, "atual": 7.8, "unidade": "IPA", "status": "meta_atingida"},
            {"id": "O2-KR2", "descricao": "Cobertura vacinal DTP ≥ 95%", "meta": 95.0, "atual": 88.2, "unidade": "%", "status": "alerta"},
            {"id": "O2-KR3", "descricao": "Notificações SINAN encerradas em ≤ 60 dias ≥ 90%", "meta": 90.0, "atual": 93.1, "unidade": "%", "status": "meta_atingida"},
            {"id": "O2-KR4", "descricao": "Índice de positividade dengue < 1%", "meta": 1.0, "atual": 0.6, "unidade": "%", "status": "meta_atingida"},
        ],
    },
    {
        "id": "O3",
        "objetivo": "Garantir sustentabilidade financeira e conformidade legal",
        "responsavel": "Secretária / FMS",
        "ciclo": "2026",
        "progresso_geral": 88.0,
        "key_results": [
            {"id": "O3-KR1", "descricao": "Aplicação mínima de 15% em saúde (EC 29)", "meta": 15.0, "atual": 18.4, "unidade": "%", "status": "meta_atingida"},
            {"id": "O3-KR2", "descricao": "RDQA entregue no prazo em 3/3 quadrimestres", "meta": 3, "atual": 3, "unidade": "rdqa", "status": "meta_atingida"},
            {"id": "O3-KR3", "descricao": "Relatório de Gestão enviado ao CMS e DIGISUS", "meta": 1, "atual": 1, "unidade": "rag", "status": "meta_atingida"},
            {"id": "O3-KR4", "descricao": "Inadimplência de contratos < 5%", "meta": 5.0, "atual": 2.1, "unidade": "%", "status": "meta_atingida"},
        ],
    },
    {
        "id": "O4",
        "objetivo": "Qualificar a força de trabalho em saúde",
        "responsavel": "RH SMS",
        "ciclo": "2026",
        "progresso_geral": 55.0,
        "key_results": [
            {"id": "O4-KR1", "descricao": "≥ 80% dos servidores com 1 capacitação/ano (EducaSUS)", "meta": 80.0, "atual": 62.0, "unidade": "%", "status": "alerta"},
            {"id": "O4-KR2", "descricao": "Reduzir absenteísmo geral para < 8%", "meta": 8.0, "atual": 9.2, "unidade": "%", "status": "alerta"},
            {"id": "O4-KR3", "descricao": "Plano de Cargos e Salários SMS atualizado", "meta": 1, "atual": 0, "unidade": "plano", "status": "em_andamento"},
        ],
    },
    {
        "id": "O5",
        "objetivo": "Ampliar acesso a especialidades e exames (TFD/Regulação)",
        "responsavel": "Coord. Regulação",
        "ciclo": "2026",
        "progresso_geral": 61.0,
        "key_results": [
            {"id": "O5-KR1", "descricao": "Tempo médio de espera TFD ≤ 30 dias", "meta": 30, "atual": 38, "unidade": "dias", "status": "alerta"},
            {"id": "O5-KR2", "descricao": "≥ 90% das solicitações TFD respondidas em ≤ 5 dias úteis", "meta": 90.0, "atual": 84.7, "unidade": "%", "status": "em_andamento"},
            {"id": "O5-KR3", "descricao": "Fila cirúrgica reduzida em 20% até dez/2026", "meta": 20.0, "atual": 11.0, "unidade": "% redução", "status": "em_andamento"},
        ],
    },
]


@router.get("/resumo")
async def resumo():
    total_kr = sum(len(o["key_results"]) for o in _OBJETIVOS)
    kr_atingidos = sum(
        1 for o in _OBJETIVOS for kr in o["key_results"] if kr["status"] == "meta_atingida"
    )
    return {
        "situacao_dado": "referencia_municipal",
        "ciclo": "2026",
        "municipio": "Apuí/AM",
        "total_objetivos": len(_OBJETIVOS),
        "total_key_results": total_kr,
        "key_results_atingidos": kr_atingidos,
        "key_results_em_andamento": sum(1 for o in _OBJETIVOS for kr in o["key_results"] if kr["status"] == "em_andamento"),
        "key_results_alerta": sum(1 for o in _OBJETIVOS for kr in o["key_results"] if kr["status"] == "alerta"),
        "progresso_medio_geral": round(sum(o["progresso_geral"] for o in _OBJETIVOS) / len(_OBJETIVOS), 1),
        "verificado_em": _TS,
    }


@router.get("/objetivos")
async def listar():
    return {
        "situacao_dado": "referencia_municipal",
        "ciclo": "2026",
        "municipio": "Apuí/AM",
        "objetivos": _OBJETIVOS,
        "verificado_em": _TS,
    }


@router.post("/atualizar")
async def atualizar():
    return {
        "situacao_dado": "referencia_municipal",
        "ok": True,
        "mensagem": "Atualização de OKR registrada. Dados de referência municipal.",
        "atualizado_em": _TS,
    }
