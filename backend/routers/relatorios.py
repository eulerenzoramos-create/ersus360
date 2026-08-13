"""
Router: /api/relatorios — ERSUS 360
Dados de referência municipal — Apuí/AM. situacao_dado = referencia_municipal.
"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from typing import Optional
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/relatorios", tags=["Relatórios"])

_TS = "2026-08-13T00:00:00Z"

_RELATORIOS = [
    {
        "id": "RAG-2024",
        "nome": "Relatório Anual de Gestão 2024",
        "tipo": "RAG",
        "periodo": "2024",
        "status": "enviado",
        "enviado_digisus": True,
        "aprovado_cms": True,
        "data_aprovacao": "2025-03-18",
        "resolucao_cms": "Resolução CMS nº 02/2025",
        "gerado_em": "2025-03-01",
        "formato": "pdf",
        "tamanho_kb": 2840,
    },
    {
        "id": "RDQA-2025-Q1",
        "nome": "RDQA — 1º Quadrimestre 2025",
        "tipo": "RDQA",
        "periodo": "jan–abr 2025",
        "status": "enviado",
        "enviado_digisus": True,
        "aprovado_cms": True,
        "data_aprovacao": "2025-05-12",
        "resolucao_cms": "Resolução CMS nº 03/2025",
        "gerado_em": "2025-05-10",
        "formato": "pdf",
        "tamanho_kb": 1240,
    },
    {
        "id": "RDQA-2025-Q2",
        "nome": "RDQA — 2º Quadrimestre 2025",
        "tipo": "RDQA",
        "periodo": "mai–ago 2025",
        "status": "enviado",
        "enviado_digisus": True,
        "aprovado_cms": True,
        "data_aprovacao": "2025-09-10",
        "resolucao_cms": "Resolução CMS nº 05/2025",
        "gerado_em": "2025-09-08",
        "formato": "pdf",
        "tamanho_kb": 1310,
    },
    {
        "id": "PROD-APS-2025-07",
        "nome": "Boletim de Produção APS — Julho 2025",
        "tipo": "Producao",
        "periodo": "2025-07",
        "status": "gerado",
        "enviado_digisus": False,
        "aprovado_cms": False,
        "gerado_em": "2025-08-05",
        "formato": "excel",
        "tamanho_kb": 380,
    },
    {
        "id": "COB-VACINAL-2025-S1",
        "nome": "Cobertura Vacinal — 1º Semestre 2025",
        "tipo": "Imunizacao",
        "periodo": "jan–jun 2025",
        "status": "gerado",
        "enviado_digisus": False,
        "aprovado_cms": False,
        "gerado_em": "2025-07-15",
        "formato": "pdf",
        "tamanho_kb": 560,
    },
    {
        "id": "FIN-FMS-2025-Q2",
        "nome": "Extrato Financeiro FMS — 2º Quadrimestre 2025",
        "tipo": "Financeiro",
        "periodo": "mai–ago 2025",
        "status": "gerado",
        "enviado_digisus": False,
        "aprovado_cms": False,
        "gerado_em": "2025-09-02",
        "formato": "excel",
        "tamanho_kb": 720,
    },
]


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "total_relatorios": len(_RELATORIOS),
        "relatorios_enviados_digisus": sum(1 for r in _RELATORIOS if r["enviado_digisus"]),
        "relatorios_aprovados_cms": sum(1 for r in _RELATORIOS if r["aprovado_cms"]),
        "ultimo_rag": "RAG-2024",
        "ultimo_rdqa": "RDQA-2025-Q2",
        "proximo_rdqa_prazo": "2026-01-20",
        "relatorios": _RELATORIOS,
        "verificado_em": _TS,
    }


@router.get("/lista")
async def listar_relatorios(tipo: Optional[str] = Query(None)):
    items = list(_RELATORIOS)
    if tipo:
        items = [r for r in items if r["tipo"].lower() == tipo.lower()]
    return {
        "situacao_dado": "referencia_municipal",
        "total": len(items),
        "relatorios": items,
        "verificado_em": _TS,
    }


@router.get("/downloads")
async def downloads():
    return {
        "situacao_dado": "referencia_municipal",
        "downloads_disponiveis": [r["id"] for r in _RELATORIOS if r["status"] in ("gerado", "enviado")],
        "nota": "Downloads disponíveis via sistema interno SMS Apuí.",
        "verificado_em": _TS,
    }


_CONVENIOS_2026 = [
    {"convenio": "PAB Fixo",              "bloco": "Atenção Básica",             "valor_recebido": 1486000.00, "valor_pago": 1210000.00, "saldo": 276000.00, "perc_executado": 81.4},
    {"convenio": "PMAQ/Prev. Brasil",     "bloco": "Atenção Básica",             "valor_recebido":  342000.00, "valor_pago":  286000.00, "saldo":  56000.00, "perc_executado": 83.6},
    {"convenio": "Vig. Epidemiológica",   "bloco": "Vigilância em Saúde",        "valor_recebido":  218000.00, "valor_pago":  174000.00, "saldo":  44000.00, "perc_executado": 79.8},
    {"convenio": "Vig. Sanitária",        "bloco": "Vigilância em Saúde",        "valor_recebido":   84000.00, "valor_pago":   61000.00, "saldo":  23000.00, "perc_executado": 72.6},
    {"convenio": "Assist. Farmacêutica",  "bloco": "Assistência Farmacêutica",   "valor_recebido":  312000.00, "valor_pago":  280000.00, "saldo":  32000.00, "perc_executado": 89.7},
    {"convenio": "MAC (TFD/SADT)",        "bloco": "Média e Alta Complexidade",  "valor_recebido":  680000.00, "valor_pago":  468000.00, "saldo": 212000.00, "perc_executado": 68.8},
    {"convenio": "Gestão SUS",            "bloco": "Gestão do SUS",              "valor_recebido":  128000.00, "valor_pago":   96000.00, "saldo":  32000.00, "perc_executado": 75.0},
]

_CONVENIOS_2025 = [
    {"convenio": "PAB Fixo",              "bloco": "Atenção Básica",             "valor_recebido": 1380000.00, "valor_pago": 1380000.00, "saldo":       0.00, "perc_executado": 100.0},
    {"convenio": "PMAQ/Prev. Brasil",     "bloco": "Atenção Básica",             "valor_recebido":  318000.00, "valor_pago":  318000.00, "saldo":       0.00, "perc_executado": 100.0},
    {"convenio": "Vig. Epidemiológica",   "bloco": "Vigilância em Saúde",        "valor_recebido":  204000.00, "valor_pago":  196000.00, "saldo":    8000.00, "perc_executado": 96.1},
    {"convenio": "Assist. Farmacêutica",  "bloco": "Assistência Farmacêutica",   "valor_recebido":  298000.00, "valor_pago":  294000.00, "saldo":    4000.00, "perc_executado": 98.7},
    {"convenio": "MAC (TFD/SADT)",        "bloco": "Média e Alta Complexidade",  "valor_recebido":  648000.00, "valor_pago":  624000.00, "saldo":   24000.00, "perc_executado": 96.3},
    {"convenio": "Gestão SUS",            "bloco": "Gestão do SUS",              "valor_recebido":  118000.00, "valor_pago":  115000.00, "saldo":    3000.00, "perc_executado": 97.5},
]


def _get_convenios(ano: int):
    return _CONVENIOS_2026 if ano >= 2026 else _CONVENIOS_2025


@router.get("/financeiro")
async def relatorio_financeiro(ano: int = 2026):
    itens = _get_convenios(ano)
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "ano": ano,
        "total_recebido": round(sum(i["valor_recebido"] for i in itens), 2),
        "total_pago": round(sum(i["valor_pago"] for i in itens), 2),
        "total_saldo": round(sum(i["saldo"] for i in itens), 2),
        "total_rendimento": 48200.00 if ano >= 2026 else 42000.00,
        "itens": itens,
        "verificado_em": _TS,
    }


@router.get("/por-bloco")
async def relatorio_por_bloco(ano: int = 2026):
    itens = _get_convenios(ano)
    por_bloco: dict = {}
    for i in itens:
        por_bloco[i["bloco"]] = round(por_bloco.get(i["bloco"], 0.0) + i["valor_pago"], 2)
    return [{"bloco": k, "total": v} for k, v in por_bloco.items()]


@router.get("/por-programa")
async def relatorio_por_programa(ano: int = 2026):
    return [
        {"programa": "Atenção Básica",            "total": 1496000.00 if ano >= 2026 else 1698000.00},
        {"programa": "Vigilância em Saúde",       "total":  235000.00 if ano >= 2026 else  196000.00},
        {"programa": "Assist. Farmacêutica",      "total":  280000.00 if ano >= 2026 else  294000.00},
        {"programa": "Média/Alta Complexidade",   "total":  468000.00 if ano >= 2026 else  624000.00},
        {"programa": "Gestão SUS",                "total":   96000.00 if ano >= 2026 else  115000.00},
    ]


@router.get("/prestacao-contas")
async def prestacao_contas(ano: int = 2026):
    itens = _get_convenios(ano)
    return {
        "situacao_dado": "referencia_municipal",
        "titulo": f"Prestação de Contas FMS — Exercício {ano}",
        "municipio": "Apuí",
        "uf": "AM",
        "gerado_em": _TS[:10],
        "resumo_financeiro": {
            "total_recebido": round(sum(i["valor_recebido"] for i in itens), 2),
            "total_pago": round(sum(i["valor_pago"] for i in itens), 2),
            "saldo_disponivel": round(sum(i["saldo"] for i in itens), 2),
            "rendimentos_aplicacoes": 48200.00 if ano >= 2026 else 42000.00,
        },
        "por_bloco": [{"bloco": k, "total": v} for k, v in
            {i["bloco"]: round(sum(x["valor_pago"] for x in itens if x["bloco"] == i["bloco"]), 2) for i in itens}.items()
        ],
        "convenios": itens,
        "indicadores": [
            {"indicador": "Cobertura vacinal DTP",     "eixo": "Vigilância",    "meta": 95.0,  "alcancado": 88.2, "situacao": "Não Atingido"},
            {"indicador": "Pré-natal 7+ consultas",    "eixo": "Atenção Básica","meta": 75.0,  "alcancado": 71.4, "situacao": "Não Atingido"},
            {"indicador": "Cobertura ESF",             "eixo": "Atenção Básica","meta": 85.0,  "alcancado": 78.5, "situacao": "Não Atingido"},
            {"indicador": "IPA Malária",               "eixo": "Vigilância",    "meta": 10.0,  "alcancado":  7.8, "situacao": "Atingido"},
            {"indicador": "EC-29 Aplicação mínima 15%","eixo": "Financeiro",    "meta": 15.0,  "alcancado": 18.4, "situacao": "Atingido"},
            {"indicador": "HiperDia acompanhados",     "eixo": "Atenção Básica","meta": 75.0,  "alcancado": 68.4, "situacao": "Não Atingido"},
        ],
        "verificado_em": _TS,
    }


@router.get("/exportar-csv")
async def exportar_csv(tipo: str = "financeiro", ano: int = 2026):
    """Retorna CSV simulado em modo referência."""
    from fastapi.responses import PlainTextResponse
    if tipo == "financeiro":
        itens = _get_convenios(ano)
        linhas = ["convenio,bloco,valor_recebido,valor_pago,saldo,perc_executado"]
        for i in itens:
            linhas.append(f"{i['convenio']},{i['bloco']},{i['valor_recebido']},{i['valor_pago']},{i['saldo']},{i['perc_executado']}")
        content = "\n".join(linhas)
    else:
        content = "indicador,eixo,meta,alcancado,situacao\nCobertura ESF,Atenção Básica,85.0,78.5,Não Atingido"
    return PlainTextResponse(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="relatorio_{tipo}_{ano}.csv"'},
    )


@router.get("/exportar-pdf")
async def exportar_pdf(tipo: str = "gerencial", ano: int = 2026):
    """Retorna PDF placeholder em modo referência."""
    from fastapi.responses import Response
    # Minimal PDF placeholder (1-page text-only)
    pdf_text = (
        f"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj "
        f"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj "
        f"3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj "
        f"4 0 obj<</Length 80>>stream\nBT /F1 12 Tf 72 720 Td (Relatorio {tipo} {ano} - Apui/AM - ERSUS 360 referencia) Tj ET\nendstream\nendobj "
        f"5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj "
        f"xref\n0 6\n0000000000 65535 f\n%%EOF"
    ).encode()
    return Response(
        content=pdf_text,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="relatorio_{tipo}_{ano}.pdf"'},
    )
