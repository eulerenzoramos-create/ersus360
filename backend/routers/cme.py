"""
CME — Central de Material e Esterilização · Ciclos · Biológicos · Rastreabilidade · FMS Apuí/AM
Dados de referência municipal — situacao_dado = referencia_municipal
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/cme", tags=["cme"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "Jun 2026",
        "ciclos_autoclave_mes": 148,
        "indicadores_biologicos_aprovados_pct": 98.6,
        "indicadores_biologicos_reprovados": 2,
        "ite_pct": 0.9,
        "materiais_processados_mes": 4320,
        "expurgos_mes": 3,
        "ncx_abertas": 2,
        "ncx_encerradas_mes": 5,
        "nota": "Referência baseada em parâmetros típicos CME hospitais e UBS amazônicas ~20 mil hab.",
    }


@router.get("/ciclos")
async def ciclos():
    return [
        {"situacao_dado": "referencia_municipal", "equipamento": "Autoclave Vertical 21L (UBS Central)", "ciclos_mes": 92,  "aprovados": 90, "reprovados": 2, "disponibilidade_pct": 97.8, "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "equipamento": "Autoclave Horizontal 40L (Hosp. Mun.)", "ciclos_mes": 56, "aprovados": 56, "reprovados": 0, "disponibilidade_pct": 100,  "status": "ok"},
    ]


@router.get("/biologicos")
async def biologicos():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "indicadores_biologicos_mes": 148,
        "aprovados": 146,
        "reprovados": 2,
        "taxa_aprovacao_pct": 98.6,
        "acoes_reprovados": "Ciclo reprocessado imediatamente. Lote retido. CCIH notificada.",
        "frequencia_teste": "A cada carga (ABNT NBR ISO 11135)",
        "lote_IQ_atual": "IQ mensal — aprovado em 12/06/2026",
        "nota": "Referência municipal Apuí/AM.",
    }


@router.get("/rastreabilidade")
async def rastreabilidade():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "sistema": "Planilha + etiquetas manuais (transição para SIGMA prevista 3T/2026)",
        "pacotes_rastreados_pct": 84.2,
        "validade_maxima_pacotes_dias": 180,
        "repacotamento_vencido_mes": 12,
        "itens": [
            {"categoria": "Instrumental cirúrgico básico", "processamentos_mes": 1840, "rastreado_pct": 90.0},
            {"categoria": "Bandeja curativo",              "processamentos_mes": 1200, "rastreado_pct": 85.0},
            {"categoria": "Material odontológico",         "processamentos_mes": 680,  "rastreado_pct": 75.0},
            {"categoria": "Caixa parto humanizado",        "processamentos_mes": 90,   "rastreado_pct": 95.0},
            {"categoria": "Materiais UBS zona rural",      "processamentos_mes": 510,  "rastreado_pct": 70.0},
        ],
        "nota": "Referência municipal Apuí/AM.",
    }


@router.get("/ncx")
async def ncx():
    return [
        {"situacao_dado": "referencia_municipal", "numero": "NCX-2026-041", "descricao": "Indicador biológico reprovado — Autoclave 21L",     "gravidade": "alta",  "status": "encerrada", "prazo_dias": 2, "acao": "Reprocessamento e calibração."},
        {"situacao_dado": "referencia_municipal", "numero": "NCX-2026-038", "descricao": "Pacote com rastreabilidade incompleta (etiqueta)",  "gravidade": "media", "status": "encerrada", "prazo_dias": 5, "acao": "Reemissão de etiqueta e treinamento."},
        {"situacao_dado": "referencia_municipal", "numero": "NCX-2026-044", "descricao": "Atraso no envio de material UBS rural (>48h)",      "gravidade": "media", "status": "aberta",    "prazo_dias": 7, "acao": "Revisão do circuito de coleta — logística balsas."},
        {"situacao_dado": "referencia_municipal", "numero": "NCX-2026-046", "descricao": "Falta de EPI (avental plumbífero) no expurgo",      "gravidade": "alta",  "status": "aberta",    "prazo_dias": 3, "acao": "Compra emergencial — processo em andamento."},
    ]


@router.get("/indicadores")
async def indicadores():
    return [
        {"situacao_dado": "referencia_municipal", "indicador": "ITE — Índice de Teste Empacotamento (%)", "valor": 0.9,  "meta": 2.0,  "unidade": "%",    "status": "ok",      "observacao": "Abaixo da meta (<2%). Qualidade boa."},
        {"situacao_dado": "referencia_municipal", "indicador": "Indicador Biológico Aprovado (%)",        "valor": 98.6, "meta": 100,  "unidade": "%",    "status": "atencao", "observacao": "2 falhas — Autoclave 21L. Calibração solicitada."},
        {"situacao_dado": "referencia_municipal", "indicador": "Disponibilidade Autoclave (%)",            "valor": 97.8, "meta": 95,   "unidade": "%",    "status": "ok",      "observacao": "Autoclave 21L com 1 parada mensal para manutenção preventiva."},
        {"situacao_dado": "referencia_municipal", "indicador": "NCX Abertas",                              "valor": 2,    "meta": 0,    "unidade": "NCX",  "status": "atencao", "observacao": "EPI e logística rural — prazo 3 e 7 dias."},
        {"situacao_dado": "referencia_municipal", "indicador": "Rastreabilidade Completa (%)",             "valor": 84.2, "meta": 100,  "unidade": "%",    "status": "atencao", "observacao": "Sistema manual. Implantação SIGMA prevista 3T/2026."},
    ]
