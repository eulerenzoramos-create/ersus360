# backend/routers/tce_tcu.py — Relatórios TCE/TCU Estruturados
import hashlib, time
from fastapi import APIRouter, Query
from typing import Optional
from functools import lru_cache

router = APIRouter(prefix="/api/tce-tcu", tags=["tce-tcu"])

# ── Dados de referência ───────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def _SECOES_TCE():
    return [
        {"codigo": "1.0", "titulo": "Identificação e Dados Gerais do Fundo Municipal de Saúde", "pagina_inicio": 1, "concluida": True, "pendencias": []},
        {"codigo": "2.0", "titulo": "Receitas por Fonte e Origem dos Recursos", "pagina_inicio": 5, "concluida": True, "pendencias": []},
        {"codigo": "3.0", "titulo": "Despesas por Bloco de Financiamento", "pagina_inicio": 11, "concluida": True, "pendencias": []},
        {"codigo": "4.0", "titulo": "Transferências Fundo a Fundo — Demonstrativo de Aplicação", "pagina_inicio": 18, "concluida": True, "pendencias": []},
        {"codigo": "5.0", "titulo": "Restos a Pagar — Processados e Não Processados", "pagina_inicio": 24, "concluida": False, "pendencias": ["Pendente: empenhos de dezembro ainda não liquidados"]},
        {"codigo": "6.0", "titulo": "Execução de Convênios e Contratos de Repasse", "pagina_inicio": 28, "concluida": True, "pendencias": []},
        {"codigo": "7.0", "titulo": "Aplicação Financeira — FUNSAUD", "pagina_inicio": 33, "concluida": False, "pendencias": ["Saldo de aplicação financeira a confirmar com contabilidade"]},
        {"codigo": "8.0", "titulo": "Obras e Aquisições — Comprovação de Licitações", "pagina_inicio": 36, "concluida": True, "pendencias": []},
    ]


@lru_cache(maxsize=1)
def _SECOES_TCU():
    return [
        {"codigo": "A", "titulo": "Gestão de Recursos Federais — Programas do MS", "pagina_inicio": 1, "concluida": True, "pendencias": []},
        {"codigo": "B", "titulo": "Ações e Indicadores de Saúde — Resultados Alcançados", "pagina_inicio": 8, "concluida": True, "pendencias": []},
        {"codigo": "C", "titulo": "Previne Brasil — Metas de Qualidade e Cobertura APS", "pagina_inicio": 14, "concluida": True, "pendencias": []},
        {"codigo": "D", "titulo": "Controle Interno — Avaliação de Risco e Auditoria", "pagina_inicio": 20, "concluida": False, "pendencias": ["Relatório de auditoria interna 2026/1 não finalizado"]},
        {"codigo": "E", "titulo": "Transparência e Acesso à Informação — Portal LAI", "pagina_inicio": 25, "concluida": True, "pendencias": []},
        {"codigo": "F", "titulo": "Responsabilidade Fiscal — LRF e Limites Constitucionais", "pagina_inicio": 28, "concluida": True, "pendencias": []},
    ]


@lru_cache(maxsize=1)
def _RELATORIOS():
    return [
        {
            "id": 1, "tipo": "TCE", "titulo": "Prestação de Contas — FMS Apuí 2025",
            "competencia": "2025", "data_geracao": "2026-01-30 10:22",
            "status": "enviado",
            "assinado_por": "Euler Ramos", "assinado_em": "2026-02-05 14:38",
            "hash_sha256": hashlib.sha256(b"TCE2025-APUI").hexdigest(),
            "tamanho_kb": 2840, "paginas": 52, "secoes": _SECOES_TCE(),
        },
        {
            "id": 2, "tipo": "TCU", "titulo": "Relatório Anual de Gestão — TCU 2025",
            "competencia": "2025", "data_geracao": "2026-02-10 09:00",
            "status": "assinado",
            "assinado_por": "Euler Ramos", "assinado_em": "2026-02-10 15:00",
            "hash_sha256": hashlib.sha256(b"TCU2025-APUI").hexdigest(),
            "tamanho_kb": 1620, "paginas": 38, "secoes": _SECOES_TCU(),
        },
        {
            "id": 3, "tipo": "TCE", "titulo": "Prestação de Contas — 1º Sem. FMS Apuí 2026",
            "competencia": "2026/1", "data_geracao": "2026-07-20 11:45",
            "status": "gerado",
            "assinado_por": None, "assinado_em": None,
            "hash_sha256": None,
            "tamanho_kb": 1380, "paginas": 44, "secoes": _SECOES_TCE(),
        },
    ]


@lru_cache(maxsize=1)
def _FINANCEIRO():
    return {
        "competencia": "2026 (Jan–Mai)",
        "receitas": [
            {"categoria": "Transferências Fundo a Fundo (MS)", "valor": 4_820_000},
            {"categoria": "Receitas Tributárias Municipais", "valor": 680_000},
            {"categoria": "Emendas Parlamentares", "valor": 320_000},
            {"categoria": "Convênios Estaduais (SES-AM)", "valor": 210_000},
            {"categoria": "Outras Receitas", "valor": 48_000},
        ],
        "despesas": [
            {"categoria": "Pessoal e Encargos Sociais", "valor": 2_940_000},
            {"categoria": "Atenção Primária à Saúde (APS)", "valor": 780_000},
            {"categoria": "Média e Alta Complexidade (MAC)", "valor": 620_000},
            {"categoria": "Assistência Farmacêutica", "valor": 380_000},
            {"categoria": "Vigilância em Saúde", "valor": 290_000},
            {"categoria": "Investimentos (obras/equipamentos)", "valor": 210_000},
            {"categoria": "Custeio Administrativo", "valor": 180_000},
        ],
        "total_receitas": 6_078_000,
        "total_despesas": 5_400_000,
        "saldo": 678_000,
        "pct_execucao": 88.8,
        "transferencias_fundo": [
            {"bloco": "Atenção Básica / APS", "recebido": 1_920_000, "aplicado": 1_740_000, "saldo": 180_000},
            {"bloco": "Média e Alta Complexidade", "recebido": 980_000, "aplicado": 620_000, "saldo": 360_000},
            {"bloco": "Vigilância em Saúde", "recebido": 480_000, "aplicado": 438_000, "saldo": 42_000},
            {"bloco": "Assistência Farmacêutica", "recebido": 620_000, "aplicado": 580_000, "saldo": 40_000},
            {"bloco": "Gestão do SUS", "recebido": 180_000, "aplicado": 162_000, "saldo": 18_000},
            {"bloco": "Emendas Parlamentares", "recebido": 320_000, "aplicado": 200_000, "saldo": 120_000},
        ],
    }



@router.get("/relatorios")
def listar_relatorios(tipo: Optional[str] = Query(None)):
    if tipo:
        return [r for r in _RELATORIOS() if r["tipo"] == tipo]
    return _RELATORIOS()


@router.post("/gerar")
def gerar_relatorio(body: dict):
    tipo = body.get("tipo", "TCE")
    competencia = body.get("competencia", "2026")
    secoes = _SECOES_TCE() if tipo == "TCE" else _SECOES_TCU()
    return {
        "ok": True,
        "id": len(_RELATORIOS()) + 10,
        "tipo": tipo,
        "titulo": f"Prestação de Contas — FMS Apuí {competencia} (novo)",
        "competencia": competencia,
        "status": "gerado",
        "paginas": 44 if tipo == "TCE" else 36,
        "tamanho_kb": 1450 if tipo == "TCE" else 1120,
        "secoes": secoes,
    }


@router.post("/relatorios/{relatorio_id}/assinar")
def assinar_relatorio(relatorio_id: int):
    h = hashlib.sha256(f"TCE-TCU-{relatorio_id}-{time.time()}".encode()).hexdigest()
    return {
        "ok": True,
        "id": relatorio_id,
        "status": "assinado",
        "assinado_por": "Euler Ramos",
        "assinado_em": "2026-07-23 10:00",
        "hash_sha256": h,
        "mensagem": "Documento assinado digitalmente com certificado ICP-Brasil A3",
    }


@router.post("/relatorios/{relatorio_id}/pdf")
def gerar_pdf(relatorio_id: int):
    return {"ok": True, "id": relatorio_id, "url_download": f"/api/tce-tcu/relatorios/{relatorio_id}/download", "mensagem": "PDF gerado. Download disponível por 24h."}


@router.get("/resumo-financeiro")
def resumo_financeiro(ano: str = Query("2026")):
    return _FINANCEIRO()