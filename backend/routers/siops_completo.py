"""
SIOPS Completo — Módulo de Gestão Orçamentária e Financeira da Saúde
FMS Apuí/AM · Exercício 2026
Fonte: dados de referência SIOPS/STN · RREO · Lei 4.320/64 · LC 141/2012
"""
from fastapi import APIRouter, Query
from typing import Optional

router = APIRouter(prefix="/api/siops-completo", tags=["SIOPS Completo"])

# ── Metadados de importação ───────────────────────────────────────────────────

_META_IMPORTACAO = {
    "fonte": "Dados de referência SIOPS/STN · RREO",
    "status": "referencia",
    "descricao": "Dados baseados no RREO/SIOPS de referência para Apuí/AM. "
                 "A integração automática com o sistema municipal está pendente de credenciais.",
    "data_referencia": "2026-08-03",
    "periodo": "1º ao 4º Bimestre/2026 (4º parcial)",
    "exercicio": 2026,
    "responsavel": "FMS Apuí/AM · Setor de Finanças",
    "proxima_atualizacao": "Ao final do 4º Bimestre (31/ago/2026)",
}

# ── Painel Geral ──────────────────────────────────────────────────────────────

_PAINEL_GERAL = {
    # Receitas
    "receita_prevista_total":        19_518_000.00,
    "receita_atualizada":            19_518_000.00,
    "receita_arrecadada":            11_229_000.00,   # 1º-4º bim (4º parcial)
    "receita_propria_saude":          1_799_000.00,   # soma gasto próprio bim encerrados
    "transferencias_uniao":           8_081_000.00,   # soma transferências SUS bim encerrados
    "transferencias_estado":                   0.00,   # AM: sem transf. estadual específica
    "outras_receitas_saude":               1_349_000.00,
    # Despesas
    "dotacao_inicial":               10_510_000.00,
    "dotacao_atualizada":            10_510_000.00,
    "empenhado":                      7_160_000.00,
    "liquidado":                      4_930_000.00,
    "pago":                           4_930_000.00,
    "saldo_empenhar":                 3_350_000.00,   # dotação - empenhado
    "saldo_liquidar":                 2_230_000.00,   # empenhado - liquidado
    "saldo_pagar":                             0.00,   # liquidado - pago (quitado)
    # Restos a pagar
    "restos_pagar_inscritos":           842_000.00,
    "restos_pagar_processados":         612_000.00,
    "restos_pagar_nao_processados":     230_000.00,
    "restos_pagar_pagos":               498_000.00,
    "restos_pagar_cancelados":           28_000.00,
    # ASPS — mínimo constitucional (LC 141/2012)
    "pct_asps_acumulado":                    16.02,
    "pct_asps_meta":                         15.00,
    "receita_propria_base_calculo":   9_589_000.00,   # receita própria acumulada (1º-3º bim)
    "valor_minimo_exigido":           1_438_350.00,   # 15% da base de cálculo
    "valor_efetivamente_aplicado":    1_993_000.00,   # soma gastos próprios 1º-3º bim
    "diferenca_minimo":                 554_650.00,   # aplicado - exigido
    "status_minimo_constitucional":     "atingido",
    "alerta_minimo": None,
    # Meta de execução
    "pct_execucao_orcamentaria":             68.13,   # empenhado / dotação
    "pct_execucao_financeira":               46.91,   # pago / dotação
}

# ── Programas (LOA detalhada) ─────────────────────────────────────────────────

_PROGRAMAS = [
    {
        "id": 1, "codigo": "0301",
        "programa": "Atenção Básica em Saúde",
        "acao": "Manutenção da APS e ESF",
        "subfuncao": "Atenção Básica",
        "funcao": "Saúde",
        "dotacao_inicial":  1_850_000.00,
        "dotacao_atualizada": 1_850_000.00,
        "empenhado":        1_320_000.00,
        "liquidado":          980_000.00,
        "pago":               980_000.00,
        "fonte": "Recursos Próprios + FNS/PAB",
        "tipo_recurso": "proprio_federal",
        "status": "em_execucao",
        "meta_fisica": "9 equipes eSF / 65 ACS",
        "acoes": [
            {"descricao": "Custeio equipes eSF", "empenhado": 820_000, "pago": 620_000},
            {"descricao": "Custeio ACS", "empenhado": 380_000, "pago": 280_000},
            {"descricao": "PAB Fixo FNS", "empenhado": 120_000, "pago": 80_000},
        ],
    },
    {
        "id": 2, "codigo": "0302",
        "programa": "Média e Alta Complexidade",
        "acao": "Custeio MAC — Regulação e Referência",
        "subfuncao": "Assistência Hospitalar e Ambulatorial",
        "funcao": "Saúde",
        "dotacao_inicial":  1_200_000.00,
        "dotacao_atualizada": 1_200_000.00,
        "empenhado":          492_000.00,
        "liquidado":          320_000.00,
        "pago":               320_000.00,
        "fonte": "Recursos Próprios + SIA/SIH",
        "tipo_recurso": "proprio_federal",
        "status": "critico",
        "meta_fisica": "66 aut. amb./mês",
        "acoes": [
            {"descricao": "Regulação e referência", "empenhado": 280_000, "pago": 190_000},
            {"descricao": "TFD — Tratamento Fora do Domicílio", "empenhado": 212_000, "pago": 130_000},
        ],
    },
    {
        "id": 3, "codigo": "0303",
        "programa": "Assistência Farmacêutica",
        "acao": "Aquisição e distribuição de medicamentos",
        "subfuncao": "Assistência Farmacêutica",
        "funcao": "Saúde",
        "dotacao_inicial":    620_000.00,
        "dotacao_atualizada": 620_000.00,
        "empenhado":          480_000.00,
        "liquidado":          380_000.00,
        "pago":               380_000.00,
        "fonte": "Recursos Próprios + Farmácia Básica FNS",
        "tipo_recurso": "proprio_federal",
        "status": "em_execucao",
        "meta_fisica": "≥ 98% dispensação",
        "acoes": [
            {"descricao": "Medicamentos essenciais", "empenhado": 320_000, "pago": 260_000},
            {"descricao": "Farmácia básica FNS", "empenhado": 160_000, "pago": 120_000},
        ],
    },
    {
        "id": 4, "codigo": "0304",
        "programa": "Vigilância em Saúde",
        "acao": "Ações de Vigilância Epidemiológica e Sanitária",
        "subfuncao": "Vigilância Epidemiológica",
        "funcao": "Saúde",
        "dotacao_inicial":    480_000.00,
        "dotacao_atualizada": 480_000.00,
        "empenhado":          245_000.00,
        "liquidado":          180_000.00,
        "pago":               180_000.00,
        "fonte": "Recursos Próprios + VISA/VIEP FNS",
        "tipo_recurso": "proprio_federal",
        "status": "em_execucao",
        "meta_fisica": "100% notificações compulsórias",
        "acoes": [
            {"descricao": "Vigilância epidemiológica", "empenhado": 140_000, "pago": 110_000},
            {"descricao": "Vigilância sanitária", "empenhado": 105_000, "pago": 70_000},
        ],
    },
    {
        "id": 5, "codigo": "0305",
        "programa": "Infraestrutura e Equipamentos",
        "acao": "Obras e reformas UBS",
        "subfuncao": "Infraestrutura Urbana",
        "funcao": "Saúde",
        "dotacao_inicial":  1_600_000.00,
        "dotacao_atualizada": 1_600_000.00,
        "empenhado":          680_000.00,
        "liquidado":          204_000.00,
        "pago":               204_000.00,
        "fonte": "Recursos Próprios + Emendas Parlamentares",
        "tipo_recurso": "proprio_emenda",
        "status": "em_execucao",
        "meta_fisica": "Reform. UBS Kennedy + nova UBS",
        "acoes": [
            {"descricao": "Reforma UBS Kennedy", "empenhado": 480_000, "pago": 144_000},
            {"descricao": "Aquisição equipamentos", "empenhado": 200_000, "pago": 60_000},
        ],
    },
    {
        "id": 6, "codigo": "0306",
        "programa": "Recursos Humanos em Saúde",
        "acao": "Contratação e capacitação de servidores",
        "subfuncao": "Recursos Humanos",
        "funcao": "Saúde",
        "dotacao_inicial":  3_200_000.00,
        "dotacao_atualizada": 3_200_000.00,
        "empenhado":        2_800_000.00,
        "liquidado":        2_100_000.00,
        "pago":             2_100_000.00,
        "fonte": "Recursos Próprios",
        "tipo_recurso": "proprio",
        "status": "em_execucao",
        "meta_fisica": "≤ 8% absenteísmo",
        "acoes": [
            {"descricao": "Folha de pagamento servidores efetivos", "empenhado": 1_800_000, "pago": 1_400_000},
            {"descricao": "Contratos temporários / ACS", "empenhado": 700_000, "pago": 520_000},
            {"descricao": "Capacitação e educação permanente", "empenhado": 300_000, "pago": 180_000},
        ],
    },
    {
        "id": 7, "codigo": "0307",
        "programa": "Gestão e Administração da Saúde",
        "acao": "Custeio administrativo FMS",
        "subfuncao": "Administração Geral",
        "funcao": "Saúde",
        "dotacao_inicial":    420_000.00,
        "dotacao_atualizada": 420_000.00,
        "empenhado":          280_000.00,
        "liquidado":          210_000.00,
        "pago":               210_000.00,
        "fonte": "Recursos Próprios",
        "tipo_recurso": "proprio",
        "status": "em_execucao",
        "meta_fisica": "Gestão eficiente FMS",
        "acoes": [
            {"descricao": "Custeio administrativo", "empenhado": 190_000, "pago": 142_000},
            {"descricao": "Tecnologia da informação (gestão)", "empenhado": 90_000, "pago": 68_000},
        ],
    },
    {
        "id": 8, "codigo": "0308",
        "programa": "Saúde Bucal",
        "acao": "Manutenção das equipes eSB",
        "subfuncao": "Atenção Básica",
        "funcao": "Saúde",
        "dotacao_inicial":    380_000.00,
        "dotacao_atualizada": 380_000.00,
        "empenhado":          260_000.00,
        "liquidado":          195_000.00,
        "pago":               195_000.00,
        "fonte": "Recursos Próprios + FNS/Saúde Bucal",
        "tipo_recurso": "proprio_federal",
        "status": "em_execucao",
        "meta_fisica": "10 equipes eSB ativas",
        "acoes": [
            {"descricao": "Custeio equipes eSB", "empenhado": 180_000, "pago": 135_000},
            {"descricao": "Insumos odontológicos", "empenhado": 80_000, "pago": 60_000},
        ],
    },
    {
        "id": 9, "codigo": "0309",
        "programa": "Transporte Sanitário",
        "acao": "Locação de veículos e TFD",
        "subfuncao": "Transporte Rodoviário",
        "funcao": "Saúde",
        "dotacao_inicial":    480_000.00,
        "dotacao_atualizada": 480_000.00,
        "empenhado":          324_000.00,
        "liquidado":          162_000.00,
        "pago":               162_000.00,
        "fonte": "Recursos Próprios",
        "tipo_recurso": "proprio",
        "status": "em_execucao",
        "meta_fisica": "100% solicitações TFD atendidas",
        "acoes": [
            {"descricao": "Locação frota veicular", "empenhado": 200_000, "pago": 100_000},
            {"descricao": "TFD — passagens e hospedagem", "empenhado": 124_000, "pago": 62_000},
        ],
    },
    {
        "id": 10, "codigo": "0310",
        "programa": "Tecnologia da Informação",
        "acao": "Sistemas informatizados em saúde",
        "subfuncao": "Tecnologia da Informação",
        "funcao": "Saúde",
        "dotacao_inicial":    280_000.00,
        "dotacao_atualizada": 280_000.00,
        "empenhado":          276_000.00,
        "liquidado":          196_000.00,
        "pago":               196_000.00,
        "fonte": "Recursos Próprios",
        "tipo_recurso": "proprio",
        "status": "em_execucao",
        "meta_fisica": "100% UBS com RNDS/SISAB",
        "acoes": [
            {"descricao": "Contratos de software e licenças", "empenhado": 176_000, "pago": 124_000},
            {"descricao": "Infraestrutura de TI", "empenhado": 100_000, "pago": 72_000},
        ],
    },
]

# ── Alertas gerenciais ─────────────────────────────────────────────────────────

_ALERTAS = [
    {
        "id": 1, "nivel": "vermelho", "tipo": "baixa_execucao",
        "programa": "Média e Alta Complexidade",
        "titulo": "Execução crítica — MAC",
        "descricao": "Apenas 26,7% de execução financeira (pago/dotação). Risco de devolução de recursos ao FNS ao final do exercício.",
        "valor_referencia": 1_200_000.00, "valor_executado": 320_000.00,
        "pct": 26.7, "acao_recomendada": "Aceleração dos processos de autorização e liquidação no 2º semestre.",
    },
    {
        "id": 2, "nivel": "amarelo", "tipo": "empenho_sem_liquidacao",
        "programa": "Infraestrutura e Equipamentos",
        "titulo": "Empenho sem liquidação — Infraestrutura",
        "descricao": "R$ 476.000,00 empenhados sem liquidação (70% do empenhado). Obras em andamento.",
        "valor_referencia": 680_000.00, "valor_executado": 204_000.00,
        "pct": 30.0, "acao_recomendada": "Monitorar cronograma de obras e atualizar medições para liquidação.",
    },
    {
        "id": 3, "nivel": "amarelo", "tipo": "baixa_execucao",
        "programa": "Transporte Sanitário",
        "titulo": "Execução financeira em 33,8%",
        "descricao": "Pago/dotação em 33,8%. Avaliar se o ritmo de pagamentos acompanha o cronograma do contrato de locação.",
        "valor_referencia": 480_000.00, "valor_executado": 162_000.00,
        "pct": 33.8, "acao_recomendada": "Verificar cronograma de pagamentos com setor financeiro.",
    },
    {
        "id": 4, "nivel": "verde", "tipo": "asps_conforme",
        "programa": "Mínimo Constitucional (ASPS)",
        "titulo": "Mínimo constitucional atingido",
        "descricao": "16,02% aplicados em ASPS nos bimestres encerrados (meta 15%). Superávit de R$ 554.650,00.",
        "valor_referencia": 1_438_350.00, "valor_executado": 1_993_000.00,
        "pct": 16.02, "acao_recomendada": "Manter ritmo atual para garantir conformidade ao final do exercício.",
    },
    {
        "id": 5, "nivel": "amarelo", "tipo": "restos_a_pagar",
        "programa": "Geral",
        "titulo": "Restos a pagar — monitorar",
        "descricao": "R$ 344.000,00 em restos a pagar ainda não pagos (processados + não processados).",
        "valor_referencia": 842_000.00, "valor_executado": 498_000.00,
        "pct": 59.1, "acao_recomendada": "Priorizar liquidação dos restos a pagar processados para evitar cancelamento.",
    },
    {
        "id": 6, "nivel": "cinza", "tipo": "dados_parciais",
        "programa": "4º Bimestre",
        "titulo": "4º Bimestre em andamento",
        "descricao": "Dados do 4º Bimestre (Jul–Ago/2026) são parciais. Percentual de 12,56% de recursos próprios apurado até 03/ago. Apuração encerra em 31/ago.",
        "valor_referencia": None, "valor_executado": None,
        "pct": 12.56, "acao_recomendada": "Aguardar encerramento do bimestre em 31/ago para apuração definitiva.",
    },
]

# ── Comparativos ──────────────────────────────────────────────────────────────

_COMPARATIVOS = {
    "previsto_vs_arrecadado": [
        {"bimestre": "1º Bim", "previsto": 3_090_000, "arrecadado": 3_104_000},
        {"bimestre": "2º Bim", "previsto": 3_210_000, "arrecadado": 3_288_000},
        {"bimestre": "3º Bim", "previsto": 3_180_000, "arrecadado": 3_197_000},
        {"bimestre": "4º Bim", "previsto": 3_250_000, "arrecadado": 1_640_000},  # parcial
        {"bimestre": "5º Bim", "previsto": 3_310_000, "arrecadado": None},
        {"bimestre": "6º Bim", "previsto": 3_368_000, "arrecadado": None},
    ],
    "dotacao_vs_empenhado": [
        {"bimestre": "1º Bim", "dotacao": 10_510_000, "empenhado": 1_180_000},
        {"bimestre": "2º Bim", "dotacao": 10_510_000, "empenhado": 3_240_000},
        {"bimestre": "3º Bim", "dotacao": 10_510_000, "empenhado": 5_620_000},
        {"bimestre": "4º Bim", "dotacao": 10_510_000, "empenhado": 7_160_000},
    ],
    "empenhado_vs_pago": [
        {"bimestre": "1º Bim", "empenhado": 1_180_000, "liquidado": 740_000, "pago": 740_000},
        {"bimestre": "2º Bim", "empenhado": 3_240_000, "liquidado": 2_100_000, "pago": 2_100_000},
        {"bimestre": "3º Bim", "empenhado": 5_620_000, "liquidado": 3_690_000, "pago": 3_690_000},
        {"bimestre": "4º Bim", "empenhado": 7_160_000, "liquidado": 4_930_000, "pago": 4_930_000},
    ],
    "proprios_vs_transferencias": [
        {"bimestre": "1º Bim", "proprios": 421_000, "transferencias_sus": 1_903_000},
        {"bimestre": "2º Bim", "proprios": 598_000, "transferencias_sus": 2_142_000},
        {"bimestre": "3º Bim", "proprios": 574_000, "transferencias_sus": 1_986_000},
        {"bimestre": "4º Bim", "proprios": 206_000, "transferencias_sus": 1_050_000},
    ],
    "por_programa": [
        {"programa": "APS", "dotacao": 1_850_000, "empenhado": 1_320_000, "pago": 980_000},
        {"programa": "MAC", "dotacao": 1_200_000, "empenhado": 492_000, "pago": 320_000},
        {"programa": "Farm.", "dotacao": 620_000, "empenhado": 480_000, "pago": 380_000},
        {"programa": "Vigil.", "dotacao": 480_000, "empenhado": 245_000, "pago": 180_000},
        {"programa": "Infra.", "dotacao": 1_600_000, "empenhado": 680_000, "pago": 204_000},
        {"programa": "RH", "dotacao": 3_200_000, "empenhado": 2_800_000, "pago": 2_100_000},
        {"programa": "Gestão", "dotacao": 420_000, "empenhado": 280_000, "pago": 210_000},
        {"programa": "Bucal", "dotacao": 380_000, "empenhado": 260_000, "pago": 195_000},
        {"programa": "Transp.", "dotacao": 480_000, "empenhado": 324_000, "pago": 162_000},
        {"programa": "TI", "dotacao": 280_000, "empenhado": 276_000, "pago": 196_000},
    ],
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _enriquecer_programa(p: dict, filtros: dict) -> dict:
    dot = p["dotacao_atualizada"]
    emp = p["empenhado"]
    liq = p["liquidado"]
    pago = p["pago"]
    return {
        **p,
        "saldo_empenhar":   round(dot - emp, 2),
        "saldo_liquidar":   round(emp - liq, 2),
        "saldo_pagar":      round(liq - pago, 2),
        "pct_exec_orc":     round(emp / dot * 100, 2) if dot else 0.0,
        "pct_exec_fin":     round(pago / dot * 100, 2) if dot else 0.0,
    }


def _aplicar_filtros(programas: list, filtros: dict) -> list:
    resultado = programas
    if filtros.get("programa"):
        resultado = [p for p in resultado if filtros["programa"].lower() in p["programa"].lower()]
    if filtros.get("fonte"):
        resultado = [p for p in resultado if filtros["fonte"].lower() in p["fonte"].lower()]
    if filtros.get("status"):
        resultado = [p for p in resultado if p["status"] == filtros["status"]]
    if filtros.get("tipo_recurso"):
        resultado = [p for p in resultado if p.get("tipo_recurso") == filtros["tipo_recurso"]]
    return resultado


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/painel-geral")
async def painel_geral():
    """Painel geral com todos os indicadores financeiros da saúde municipal."""
    return {
        "indicadores": _PAINEL_GERAL,
        "importacao": _META_IMPORTACAO,
    }


@router.get("/programas")
async def listar_programas(
    programa: Optional[str] = Query(None, description="Filtrar por nome do programa"),
    fonte:    Optional[str] = Query(None, description="Filtrar por fonte de recurso"),
    status:   Optional[str] = Query(None, description="Filtrar por status"),
    tipo_recurso: Optional[str] = Query(None),
):
    filtros = dict(programa=programa, fonte=fonte, status=status, tipo_recurso=tipo_recurso)
    programas_filtrados = _aplicar_filtros(_PROGRAMAS, filtros)
    enriquecidos = [_enriquecer_programa(p, filtros) for p in programas_filtrados]
    total_dot   = sum(p["dotacao_atualizada"] for p in enriquecidos)
    total_emp   = sum(p["empenhado"] for p in enriquecidos)
    total_liq   = sum(p["liquidado"] for p in enriquecidos)
    total_pago  = sum(p["pago"] for p in enriquecidos)
    return {
        "programas": enriquecidos,
        "totais": {
            "dotacao_atualizada": round(total_dot, 2),
            "empenhado":          round(total_emp, 2),
            "liquidado":          round(total_liq, 2),
            "pago":               round(total_pago, 2),
            "saldo_empenhar":     round(total_dot - total_emp, 2),
            "pct_exec_orc":       round(total_emp / total_dot * 100, 2) if total_dot else 0.0,
            "pct_exec_fin":       round(total_pago / total_dot * 100, 2) if total_dot else 0.0,
        },
        "filtros_ativos": {k: v for k, v in filtros.items() if v},
        "importacao": _META_IMPORTACAO,
    }


@router.get("/programas/{programa_id}")
async def detalhe_programa(programa_id: int):
    """Detalhamento completo de um programa: ações, natureza de despesa, saldos."""
    prog = next((p for p in _PROGRAMAS if p["id"] == programa_id), None)
    if not prog:
        return {"erro": "Programa não encontrado", "id": programa_id}
    enriquecido = _enriquecer_programa(prog, {})
    return {
        "programa": enriquecido,
        "importacao": _META_IMPORTACAO,
    }


@router.get("/alertas")
async def alertas_gerenciais():
    """Alertas automáticos classificados por nível de criticidade."""
    vermelhos = [a for a in _ALERTAS if a["nivel"] == "vermelho"]
    amarelos  = [a for a in _ALERTAS if a["nivel"] == "amarelo"]
    verdes    = [a for a in _ALERTAS if a["nivel"] == "verde"]
    cinzas    = [a for a in _ALERTAS if a["nivel"] == "cinza"]
    return {
        "alertas": _ALERTAS,
        "resumo": {
            "total": len(_ALERTAS),
            "criticos": len(vermelhos),
            "atencao":  len(amarelos),
            "regulares": len(verdes),
            "sem_dado":  len(cinzas),
        },
        "importacao": _META_IMPORTACAO,
    }


@router.get("/comparativos")
async def comparativos():
    """Dados para gráficos comparativos: previsto vs arrecadado, dotação vs empenhado, etc."""
    return {
        "comparativos": _COMPARATIVOS,
        "importacao": _META_IMPORTACAO,
    }


@router.get("/exportar-csv")
async def exportar_csv():
    """Exporta programas em formato CSV para download."""
    from fastapi.responses import StreamingResponse
    import csv
    import io

    linhas = []
    cabecalho = [
        "Código", "Programa", "Ação", "Subfunção", "Fonte",
        "Dotação Atualizada", "Empenhado", "Liquidado", "Pago",
        "Saldo a Empenhar", "Saldo a Liquidar",
        "% Exec. Orçamentária", "% Exec. Financeira", "Status",
    ]

    for p in _PROGRAMAS:
        e = _enriquecer_programa(p, {})
        linhas.append([
            p["codigo"], p["programa"], p["acao"], p["subfuncao"], p["fonte"],
            f"{p['dotacao_atualizada']:.2f}", f"{p['empenhado']:.2f}",
            f"{p['liquidado']:.2f}", f"{p['pago']:.2f}",
            f"{e['saldo_empenhar']:.2f}", f"{e['saldo_liquidar']:.2f}",
            f"{e['pct_exec_orc']:.2f}%", f"{e['pct_exec_fin']:.2f}%", p["status"],
        ])

    buf = io.StringIO()
    w = csv.writer(buf, delimiter=";")
    w.writerow(["SIOPS — LOA por Programa · FMS Apuí/AM · Exercício 2026"])
    w.writerow([f"Emitido em: 2026-08-03 | Fonte: {_META_IMPORTACAO['fonte']}"])
    w.writerow([])
    w.writerow(cabecalho)
    w.writerows(linhas)
    buf.seek(0)

    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=siops_loa_2026.csv"},
    )
