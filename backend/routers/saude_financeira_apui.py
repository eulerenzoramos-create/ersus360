from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-financeira-apui", tags=["Saúde Financeira Apuí"])

@router.get("/dashboard")
def dashboard():
    return {
        "orcamento_fms_2025": 14284000.0,
        "executado_valor": 10341856.0,
        "executado_pct": 72.4,
        "vinculacao_constitucional_pct": 15.0,
        "aplicado_saude_receitas_pct": 16.8,
        "custo_per_capita": 1428.40,
        "restos_a_pagar": 1284000.0,
        "inadimplencia_fornecedores": 284000.0,
        "transferencias_sus_pct_orcamento": 68.4,
        "recursos_proprios_pct": 18.4,
        "emendas_parlamentares_pct": 13.2,
        "status_execucao": "atencao",
        "status_vinculacao": "ok",
    }

@router.get("/orcamento")
def orcamento():
    return [
        {"area": "Atenção Básica (AB)", "orcado": 5485136.0,  "executado": 4142084.0, "exec_pct": 75.5, "status": "atencao",
         "obs": "Inclui 7 equipes ESF, NASF, ACS e UBS. Principal fonte: PAB Fixo + PAB Variável."},
        {"area": "Média e Alta Complexidade (MAC)", "orcado": 4056576.0, "executado": 2881657.0, "exec_pct": 71.0, "status": "atencao",
         "obs": "TFD, regulação, leitos hospitalares e serviços especializados. Alta dependência de Manaus."},
        {"area": "Vigilância Epidemiológica e Sanitária", "orcado": 2113232.0, "executado": 1635822.0, "exec_pct": 77.4, "status": "atencao",
         "obs": "VIEP, VISA, controle de zoonoses, laboratório."},
        {"area": "Gestão e Administração FMS", "orcado": 1771216.0, "executado": 1271108.0, "exec_pct": 71.8, "status": "atencao",
         "obs": "RH, jurídico, TI, supervisão, contratos."},
        {"area": "Assistência Farmacêutica", "orcado": 857840.0,  "executado": 411185.0,  "exec_pct": 47.9, "status": "critico",
         "obs": "Baixa execução reflexo de licitações desertas e desabastecimento de medicamentos."},
    ]

@router.get("/fontes")
def fontes():
    return [
        {"fonte": "Transferências Fundo Nacional de Saúde (FNS)", "valor": 9770256.0, "pct": 68.4,
         "status": "ok", "obs": "PAB Fixo, PAB Variável, CAPS, vigilâncias, emendas MS."},
        {"fonte": "Recursos próprios Tesouro Municipal",          "valor": 2628256.0, "pct": 18.4,
         "status": "ok", "obs": "Receita de impostos municipais (ISS, IPTU, cota FPM)."},
        {"fonte": "Emendas Parlamentares (bancada AM)",           "valor": 1885488.0, "pct": 13.2,
         "status": "atencao", "obs": "8 emendas ativas. 2 com execução suspensa por prestação de contas pendente."},
        {"fonte": "SES Amazonas — Piso MAC",                      "valor": 0.0, "pct": 0.0,
         "status": "critico", "obs": "Apuí não habilitado para repasse Piso MAC estadual. Solicitation em análise na SES."},
    ]

@router.get("/historico")
def historico():
    return [
        {"ano": 2022, "orcamento": 10284000.0, "executado_pct": 68.4, "per_capita": 1084.40, "vinculacao_pct": 15.4},
        {"ano": 2023, "orcamento": 11484000.0, "executado_pct": 70.2, "per_capita": 1184.40, "vinculacao_pct": 15.8},
        {"ano": 2024, "orcamento": 12884000.0, "executado_pct": 71.6, "per_capita": 1284.40, "vinculacao_pct": 16.4},
        {"ano": 2025, "orcamento": 14284000.0, "executado_pct": 72.4, "per_capita": 1428.40, "vinculacao_pct": 16.8},
    ]

@router.get("/indicadores")
def indicadores():
    return [
        {"indicador": "Execução orçamentária FMS",            "valor": 72.4, "unidade": "%", "meta": 90, "status": "atencao",
         "observacao": "27,6% do orçamento não executado. Restos a pagar: R$ 1.284.000 (9% do total)."},
        {"indicador": "Vinculação constitucional à saúde",    "valor": 16.8, "unidade": "%", "meta": 15, "status": "ok",
         "observacao": "Município cumpre a vinculação mínima de 15%. Aplicação de 16,8% das receitas municipais."},
        {"indicador": "Custo per capita em saúde",            "valor": 1428.40, "unidade": "R$/hab", "meta": 2000, "status": "atencao",
         "observacao": "Abaixo da média nacional estimada (R$ 2.000). Receita per capita municipal limitada."},
        {"indicador": "Execução Assistência Farmacêutica",    "valor": 47.9, "unidade": "%", "meta": 90, "status": "critico",
         "observacao": "Apenas 47,9% do orçamento de farmácia executado. Licitações desertas causam desabastecimento."},
        {"indicador": "Dependência de transferências FNS",    "valor": 68.4, "unidade": "%", "meta": None, "status": "atencao",
         "observacao": "68,4% do orçamento proveniente de transferências federais. Alta vulnerabilidade fiscal."},
    ]
