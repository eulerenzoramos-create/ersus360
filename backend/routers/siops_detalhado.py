"""SIOPS Detalhado — EC29 · Vinculação · Teto MAC · Execução por Bloco · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/siops-detalhado", tags=["siops_detalhado"])

@router.get("/dashboard")
async def dashboard():
    return {
        "receita_impostos_arrecadada": 18_640_000.00,
        "vinculacao_minima_ec29_pct": 15.0,
        "aplicacao_saude_pct": 19.8,
        "aplicacao_saude_valor": 3_690_720.00,
        "superavit_ec29_pct": 4.8,
        "superavit_ec29_valor": 895_920.00,
        "teto_mac_anual": 4_284_000.00,
        "mac_executado_pct": 74.2,
        "mac_executado_valor": 3_178_728.00,
        "total_transferencias_recebidas": 5_514_728.00,
        "total_recursos_proprios": 2_875_992.00,
        "total_despesa_saude": 8_390_720.00,
        "bloco_atencao_basica_pct": 38.4,
        "bloco_mac_pct": 28.6,
        "bloco_vigilancia_pct": 12.4,
        "bloco_assistencia_farm_pct": 14.8,
        "bloco_gestao_pct": 5.8,
        "competencia": "Mar/2026",
        "status_geral": "ok",
    }

@router.get("/blocos")
async def blocos():
    return [
        {"bloco": "Atenção Básica",           "federal": 1_284_000, "estadual": 284_000, "municipal": 848_000, "total": 2_416_000, "executado": 2_286_400, "pct_exec": 94.6, "pct_total": 38.4, "status": "ok"},
        {"bloco": "Média e Alta Complexidade", "federal": 3_178_728, "estadual": 0,       "municipal": 620_000, "total": 3_798_728, "executado": 3_178_728, "pct_exec": 83.7, "pct_total": 28.6, "status": "ok"},
        {"bloco": "Vigilância em Saúde",       "federal": 284_000,   "estadual": 48_000,  "municipal": 448_000, "total": 780_000,   "executado": 718_400,   "pct_exec": 92.1, "pct_total": 12.4, "status": "ok"},
        {"bloco": "Assistência Farmacêutica",  "federal": 684_000,   "estadual": 84_000,  "municipal": 164_000, "total": 932_000,   "executado": 886_400,   "pct_exec": 95.1, "pct_total": 14.8, "status": "ok"},
        {"bloco": "Gestão do SUS",             "federal": 0,         "estadual": 0,        "municipal": 364_000, "total": 364_000,   "executado": 320_192,   "pct_exec": 87.9, "pct_total": 5.8,  "status": "ok"},
    ]

@router.get("/ec29")
async def ec29():
    return {
        "receita_base": 18_640_000.00,
        "minimo_legal_pct": 15.0,
        "minimo_legal_valor": 2_796_000.00,
        "aplicado_pct": 19.8,
        "aplicado_valor": 3_690_720.00,
        "superavit_pct": 4.8,
        "superavit_valor": 895_920.00,
        "serie_historica": [
            {"ano": 2021, "receita": 14_280_000, "aplicado_pct": 16.2, "aplicado_valor": 2_313_360},
            {"ano": 2022, "receita": 15_640_000, "aplicado_pct": 17.4, "aplicado_valor": 2_721_360},
            {"ano": 2023, "receita": 16_480_000, "aplicado_pct": 18.6, "aplicado_valor": 3_065_280},
            {"ano": 2024, "receita": 17_640_000, "aplicado_pct": 19.2, "aplicado_valor": 3_386_880},
            {"ano": 2025, "receita": 18_120_000, "aplicado_pct": 19.6, "aplicado_valor": 3_551_520},
            {"ano": 2026, "receita": 18_640_000, "aplicado_pct": 19.8, "aplicado_valor": 3_690_720},
        ],
    }

@router.get("/historico")
async def historico():
    return [
        {"mes": "Out/25", "receita_base": 18_120_000, "aplicado": 2_958_480, "pct_ec29": 16.3, "mac_exec_pct": 68.4},
        {"mes": "Nov/25", "receita_base": 18_120_000, "aplicado": 3_040_320, "pct_ec29": 16.8, "mac_exec_pct": 70.2},
        {"mes": "Dez/25", "receita_base": 18_120_000, "aplicado": 3_386_880, "pct_ec29": 18.7, "mac_exec_pct": 72.4},
        {"mes": "Jan/26", "receita_base": 18_640_000, "aplicado": 3_541_600, "pct_ec29": 19.0, "mac_exec_pct": 71.8},
        {"mes": "Fev/26", "receita_base": 18_640_000, "aplicado": 3_616_160, "pct_ec29": 19.4, "mac_exec_pct": 73.6},
        {"mes": "Mar/26", "receita_base": 18_640_000, "aplicado": 3_690_720, "pct_ec29": 19.8, "mac_exec_pct": 74.2},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Vinculação EC29 (receita aplicada)",   "valor": 19.8, "meta": 15.0, "unidade": "%","status": "ok",      "observacao": "Superávit de 4.8 p.p. acima do mínimo constitucional"},
        {"indicador": "Teto MAC executado",                    "valor": 74.2, "meta": 90.0, "unidade": "%","status": "atencao", "observacao": "R$3.178.728 de R$4.284.000 — saldo de R$1.105.272 ainda disponível"},
        {"indicador": "Bloco Atenção Básica — execução",       "valor": 94.6, "meta": 90.0, "unidade": "%","status": "ok",      "observacao": "Execução acima da meta — reforço de custeio nas UBS"},
        {"indicador": "Bloco Assistência Farmacêutica",        "valor": 95.1, "meta": 90.0, "unidade": "%","status": "ok",      "observacao": "COMBASE e CEAF com execução adequada"},
        {"indicador": "Bloco Gestão do SUS — execução",        "valor": 87.9, "meta": 90.0, "unidade": "%","status": "atencao", "observacao": "Treinamentos e capacitações com menor execução no trimestre"},
        {"indicador": "Despesa total em saúde / habitante/ano","valor": 668.4,"meta": 600,  "unidade": "R$","status": "ok",     "observacao": "Acima da média regional para municípios do porte de Apuí"},
        {"indicador": "Recursos próprios aplicados em saúde",  "valor": 34.3, "meta": 30.0, "unidade": "%","status": "ok",     "observacao": "R$2.875.992 de recursos municipais próprios — acima da meta"},
        {"indicador": "Empenho sobre dotação anual",           "valor": 72.4, "meta": 80.0, "unidade": "%","status": "atencao","observacao": "Ritmo de empenho abaixo do esperado para o 1º trimestre"},
    ]

# ── Novas abas detalhadas ────────────────────────────────────────────────────

@router.get("/transferencias")
async def transferencias():
    """Transferências fundo a fundo recebidas pelo FMS — detalhamento por programa/incentivo"""
    return [
        # Atenção Básica
        {"programa": "PAB Fixo — Atenção Básica",         "bloco": "AB",   "fonte": "FNS",  "valor_anual": 480_000,   "valor_recebido": 480_000,   "pct_exec": 100.0, "competencia": "Jan–Mar/26", "status": "ok",      "obs": "Piso da Atenção Básica fixo — 4 eSF × R$120k"},
        {"programa": "PAB Variável — eSF",                "bloco": "AB",   "fonte": "FNS",  "valor_anual": 384_000,   "valor_recebido": 384_000,   "pct_exec": 100.0, "competencia": "Jan–Mar/26", "status": "ok",      "obs": "4 equipes SF com cobertura ≥85%"},
        {"programa": "PAB Variável — ACS",                "bloco": "AB",   "fonte": "FNS",  "valor_anual": 168_000,   "valor_recebido": 168_000,   "pct_exec": 100.0, "competencia": "Jan–Mar/26", "status": "ok",      "obs": "42 ACS × R$4k/ano"},
        {"programa": "Incentivo NASF-AB / eMultiprofissional","bloco":"AB", "fonte": "FNS",  "valor_anual": 120_000,   "valor_recebido": 90_000,    "pct_exec": 75.0,  "competencia": "Jan–Mar/26", "status": "atencao", "obs": "Parcela de Jan/26 pendente — aguardando validação SISPREP"},
        {"programa": "Incentivo CEO — Centro Especialidades","bloco": "AB", "fonte": "FNS",  "valor_anual": 132_000,   "valor_recebido": 132_000,   "pct_exec": 100.0, "competencia": "Jan–Mar/26", "status": "ok",      "obs": "CEO Tipo I — 3 especialidades habilitadas"},
        {"programa": "UBS — Manutenção / Implantação",    "bloco": "AB",   "fonte": "FNS",  "valor_anual": 0,         "valor_recebido": 0,         "pct_exec": 0.0,   "competencia": "—",          "status": "crit",    "obs": "Projeto UBS Nova Floresta aguardando aprovação MS — R$480k previsto"},
        # MAC
        {"programa": "Teto Financeiro MAC",               "bloco": "MAC",  "fonte": "FNS",  "valor_anual": 4_284_000, "valor_recebido": 3_178_728, "pct_exec": 74.2,  "competencia": "Jan–Mar/26", "status": "atencao", "obs": "Saldo R$1.105.272 — 4º trimestre com execução crítica"},
        {"programa": "FAEC — Procedimentos Especiais",    "bloco": "MAC",  "fonte": "FNS",  "valor_anual": 284_000,   "valor_recebido": 218_640,   "pct_exec": 77.0,  "competencia": "Jan–Mar/26", "status": "atencao", "obs": "Cirurgias eletivas e procedimentos de alto custo"},
        {"programa": "SAMU 192 — Custeio",                "bloco": "MAC",  "fonte": "FNS",  "valor_anual": 196_000,   "valor_recebido": 196_000,   "pct_exec": 100.0, "competencia": "Jan–Mar/26", "status": "ok",      "obs": "Parcela mensal R$16.333 — regularizada"},
        # Vigilância
        {"programa": "VISA — Vigilância Sanitária",       "bloco": "VIG",  "fonte": "FNS",  "valor_anual": 84_000,    "valor_recebido": 84_000,    "pct_exec": 100.0, "competencia": "Jan–Mar/26", "status": "ok",      "obs": "Incentivo VISA municipal — contrapartida 40% municipal"},
        {"programa": "SVS — Epidemiologia e Controle",    "bloco": "VIG",  "fonte": "FNS",  "valor_anual": 120_000,   "valor_recebido": 120_000,   "pct_exec": 100.0, "competencia": "Jan–Mar/26", "status": "ok",      "obs": "PNCD, malária, leishmaniose — região endêmica"},
        {"programa": "CGPNI — Imunizações PNI",           "bloco": "VIG",  "fonte": "FNS",  "valor_anual": 80_000,    "valor_recebido": 80_000,    "pct_exec": 100.0, "competencia": "Jan–Mar/26", "status": "ok",      "obs": "Sala de vacinas — cadeia de frio própria"},
        {"programa": "Fundo Estadual de Saúde (FES/AM)",  "bloco": "VIG",  "fonte": "FES",  "valor_anual": 48_000,    "valor_recebido": 48_000,    "pct_exec": 100.0, "competencia": "Jan–Mar/26", "status": "ok",      "obs": "Repasse SUSAM — vigilância ambiental e endemias"},
        # Farmácia
        {"programa": "COMBASE — Farmácia Básica",         "bloco": "FARM", "fonte": "FNS",  "valor_anual": 420_000,   "valor_recebido": 420_000,   "pct_exec": 100.0, "competencia": "Jan–Mar/26", "status": "ok",      "obs": "Componente básico — R$35k/mês"},
        {"programa": "CEAF — Medicamentos Especializados","bloco": "FARM", "fonte": "FNS",  "valor_anual": 264_000,   "valor_recebido": 264_000,   "pct_exec": 100.0, "competencia": "Jan–Mar/26", "status": "ok",      "obs": "Componente especializado — dispensação na farmácia hospitalar"},
        {"programa": "Farmácia Popular",                  "bloco": "FARM", "fonte": "FNS",  "valor_anual": 0,         "valor_recebido": 0,         "pct_exec": 0.0,   "competencia": "—",          "status": "crit",    "obs": "Município não habilitado — credenciamento em andamento"},
    ]

@router.get("/execucao-orcamentaria")
async def execucao_orcamentaria():
    """Pipeline dotação → empenho → liquidação → pagamento por ação orçamentária"""
    return [
        {"acao": "Atenção Básica — Custeio UBS",      "funcao": "10.301",  "dotacao": 2_080_000, "creditos_adic": 240_000, "dotacao_atual": 2_320_000, "empenhado": 1_986_400, "liquidado": 1_842_800, "pago": 1_786_400, "a_empenhar": 333_600, "status": "ok"},
        {"acao": "Média e Alta Complexidade — MAC",   "funcao": "10.302",  "dotacao": 3_500_000, "creditos_adic": 284_000, "dotacao_atual": 3_784_000, "empenhado": 3_178_728, "liquidado": 2_984_200, "pago": 2_840_000, "a_empenhar": 605_272, "status": "atencao"},
        {"acao": "Vigilância Epidemiológica",         "funcao": "10.303",  "dotacao": 680_000,   "creditos_adic": 48_000,  "dotacao_atual": 728_000,   "empenhado": 648_400,   "liquidado": 612_000,   "pago": 586_400,   "a_empenhar": 79_600,  "status": "ok"},
        {"acao": "Assistência Farmacêutica",          "funcao": "10.304",  "dotacao": 820_000,   "creditos_adic": 112_000, "dotacao_atual": 932_000,   "empenhado": 886_400,   "liquidado": 864_000,   "pago": 848_000,   "a_empenhar": 45_600,  "status": "ok"},
        {"acao": "Gestão do SUS — Administração FMS","funcao": "10.122",  "dotacao": 340_000,   "creditos_adic": 24_000,  "dotacao_atual": 364_000,   "empenhado": 320_192,   "liquidado": 298_400,   "pago": 284_000,   "a_empenhar": 43_808,  "status": "atencao"},
        {"acao": "Saúde Mental / CAPS",              "funcao": "10.305",  "dotacao": 384_000,   "creditos_adic": 0,       "dotacao_atual": 384_000,   "empenhado": 312_480,   "liquidado": 298_400,   "pago": 284_000,   "a_empenhar": 71_520,  "status": "atencao"},
        {"acao": "Urgência e Emergência — UPA/SAMU", "funcao": "10.302",  "dotacao": 480_000,   "creditos_adic": 0,       "dotacao_atual": 480_000,   "empenhado": 428_640,   "liquidado": 412_000,   "pago": 396_800,   "a_empenhar": 51_360,  "status": "ok"},
        {"acao": "Vigilância Sanitária",             "funcao": "10.303",  "dotacao": 120_000,   "creditos_adic": 12_000,  "dotacao_atual": 132_000,   "empenhado": 118_400,   "liquidado": 108_000,   "pago": 104_000,   "a_empenhar": 13_600,  "status": "ok"},
        {"acao": "Saúde Indígena — Parceria",        "funcao": "10.301",  "dotacao": 84_000,    "creditos_adic": 0,       "dotacao_atual": 84_000,    "empenhado": 48_000,    "liquidado": 36_000,    "pago": 36_000,    "a_empenhar": 36_000,  "status": "atencao"},
        {"acao": "Investimento — Infraestrutura",    "funcao": "10.122",  "dotacao": 480_000,   "creditos_adic": 0,       "dotacao_atual": 480_000,   "empenhado": 148_000,   "liquidado": 84_000,    "pago": 48_000,    "a_empenhar": 332_000, "status": "crit"},
    ]

@router.get("/despesa-natureza")
async def despesa_natureza():
    """Despesa por natureza (pessoal, custeio, investimento) com breakdown mensal"""
    return {
        "resumo": [
            {"natureza": "Pessoal e Encargos",    "cod": "31+32", "dotacao": 3_840_000, "empenhado": 3_284_000, "pct": 39.1, "cor": "#1e3a5f"},
            {"natureza": "Material de Consumo",   "cod": "33.90.30", "dotacao": 1_280_000, "empenhado": 1_148_400, "pct": 13.7, "cor": "#1d4ed8"},
            {"natureza": "Serviços de Terceiros", "cod": "33.90.39", "dotacao": 1_920_000, "empenhado": 1_684_800, "pct": 20.1, "cor": "#0891b2"},
            {"natureza": "Material Farmacológico","cod": "33.90.32", "dotacao": 980_000,  "empenhado": 886_400,  "pct": 10.6, "cor": "#7c3aed"},
            {"natureza": "Transporte / TFD",      "cod": "33.90.33", "dotacao": 420_000,  "empenhado": 348_000,  "pct": 4.1,  "cor": "#d97706"},
            {"natureza": "Investimentos (obras)",  "cod": "44.90",   "dotacao": 480_000,  "empenhado": 148_000,  "pct": 1.8,  "cor": "#dc2626"},
            {"natureza": "Outros Custeios",       "cod": "33.90.xx", "dotacao": 890_000,  "empenhado": 891_120,  "pct": 10.6, "cor": "#16a34a"},
        ],
        "mensal": [
            {"mes": "Out/25", "pessoal": 284_000, "custeio": 188_400, "farmacia": 72_400, "investimento": 12_000},
            {"mes": "Nov/25", "pessoal": 284_000, "custeio": 196_800, "farmacia": 74_000, "investimento": 8_000},
            {"mes": "Dez/25", "pessoal": 320_000, "custeio": 224_000, "farmacia": 78_400, "investimento": 48_000},
            {"mes": "Jan/26", "pessoal": 284_000, "custeio": 192_000, "farmacia": 72_000, "investimento": 24_000},
            {"mes": "Fev/26", "pessoal": 284_000, "custeio": 198_400, "farmacia": 73_200, "investimento": 18_000},
            {"mes": "Mar/26", "pessoal": 284_000, "custeio": 204_800, "farmacia": 74_800, "investimento": 36_000},
        ],
    }

@router.get("/receita-despesa")
async def receita_despesa():
    """Fluxo mensal receita arrecadada vs despesa realizada"""
    return [
        {"mes": "Out/25", "receita_propria": 218_000, "transferencias": 448_400, "total_receita": 666_400, "despesa_saude": 576_800, "saldo": 89_600},
        {"mes": "Nov/25", "receita_propria": 224_000, "transferencias": 462_000, "total_receita": 686_000, "despesa_saude": 598_400, "saldo": 87_600},
        {"mes": "Dez/25", "receita_propria": 364_000, "transferencias": 484_000, "total_receita": 848_000, "despesa_saude": 684_400, "saldo": 163_600},
        {"mes": "Jan/26", "receita_propria": 218_000, "transferencias": 456_400, "total_receita": 674_400, "despesa_saude": 572_000, "saldo": 102_400},
        {"mes": "Fev/26", "receita_propria": 228_000, "transferencias": 468_000, "total_receita": 696_000, "despesa_saude": 588_400, "saldo": 107_600},
        {"mes": "Mar/26", "receita_propria": 238_000, "transferencias": 481_200, "total_receita": 719_200, "despesa_saude": 599_600, "saldo": 119_600},
    ]
