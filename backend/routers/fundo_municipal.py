from fastapi import APIRouter

router = APIRouter(prefix="/api/fundo-municipal", tags=["fundo_municipal"])

_RECEITAS = [
    {"fonte": "Transferências Federais (MS)", "valor_previsto_r": 8_420_000, "valor_realizado_r": 7_984_200, "execucao_pct": 94.8, "status": "ok"},
    {"fonte": "Transferências Estaduais (SES-AM)", "valor_previsto_r": 1_840_000, "valor_realizado_r": 1_612_400, "execucao_pct": 87.6, "status": "atencao"},
    {"fonte": "Receitas Próprias Municipais", "valor_previsto_r": 3_240_000, "valor_realizado_r": 2_986_800, "execucao_pct": 92.2, "status": "ok"},
    {"fonte": "Emendas Parlamentares", "valor_previsto_r": 1_200_000, "valor_realizado_r": 684_000, "execucao_pct": 57.0, "status": "critico"},
    {"fonte": "Outros (convênios, royalties)", "valor_previsto_r": 420_000, "valor_realizado_r": 312_000, "execucao_pct": 74.3, "status": "atencao"},
]

_DESPESAS = [
    {"grupo": "Pessoal e Encargos", "valor_r": 9_842_400, "percentual_total": 62.4, "status": "critico"},
    {"grupo": "Medicamentos e Insumos", "valor_r": 1_648_200, "percentual_total": 10.5, "status": "ok"},
    {"grupo": "Serviços de Terceiros (PJ)", "valor_r": 1_284_600, "percentual_total": 8.2, "status": "atencao"},
    {"grupo": "Investimentos (obras/equipamentos)", "valor_r": 984_000, "percentual_total": 6.2, "status": "ok"},
    {"grupo": "Material de Consumo", "valor_r": 742_800, "percentual_total": 4.7, "status": "ok"},
    {"grupo": "Judicialização da Saúde", "valor_r": 612_000, "percentual_total": 3.9, "status": "critico"},
    {"grupo": "Outros", "valor_r": 645_000, "percentual_total": 4.1, "status": "ok"},
]

_APLICACAO_MINIMA = {
    "receita_imposto_r": 12_480_000,
    "minimo_constitucional_pct": 15.0,
    "minimo_constitucional_r": 1_872_000,
    "aplicado_saude_r": 15_759_000,
    "percentual_aplicado": 126.3,
    "status": "ok",
    "observacao": "126,3% da receita de impostos aplicada em saúde — acima do mínimo constitucional (15%)",
}

_BLOCOS = [
    {"bloco": "Atenção Básica (PAB)", "previsto_r": 3_284_000, "realizado_r": 3_142_800, "execucao_pct": 95.7, "status": "ok"},
    {"bloco": "Média e Alta Complexidade (MAC)", "previsto_r": 2_184_000, "realizado_r": 1_842_600, "execucao_pct": 84.4, "status": "atencao"},
    {"bloco": "Vigilância em Saúde", "previsto_r": 842_000, "realizado_r": 798_400, "execucao_pct": 94.8, "status": "ok"},
    {"bloco": "Assistência Farmacêutica", "previsto_r": 1_284_000, "realizado_r": 1_142_200, "execucao_pct": 89.0, "status": "atencao"},
    {"bloco": "Gestão do SUS", "previsto_r": 684_000, "realizado_r": 612_800, "execucao_pct": 89.6, "status": "ok"},
    {"bloco": "Investimentos (IMAS/IMOD)", "previsto_r": 1_200_000, "realizado_r": 684_000, "execucao_pct": 57.0, "status": "critico"},
]

_HISTORICO = [
    {"mes": "Jan", "receita_r": 1_284_200, "despesa_r": 1_242_800, "saldo_r": 41_400, "execucao_pct": 88.4},
    {"mes": "Fev", "receita_r": 1_198_400, "despesa_r": 1_186_200, "saldo_r": 12_200, "execucao_pct": 87.2},
    {"mes": "Mar", "receita_r": 1_412_800, "despesa_r": 1_384_600, "saldo_r": 28_200, "execucao_pct": 91.6},
    {"mes": "Abr", "receita_r": 1_284_600, "despesa_r": 1_298_400, "saldo_r": -13_800, "execucao_pct": 89.4},
    {"mes": "Mai", "receita_r": 1_384_200, "despesa_r": 1_342_800, "saldo_r": 41_400, "execucao_pct": 90.2},
    {"mes": "Jun", "receita_r": 1_314_800, "despesa_r": 1_348_200, "saldo_r": -33_400, "execucao_pct": 88.8},
]

_INDICADORES = [
    {"indicador": "Aplicação mínima constitucional (15%)", "valor": 126.3, "meta": 15.0, "unidade": "% receita impostos",
     "status": "ok", "observacao": "126,3% aplicado — bem acima do mínimo. Inclui transferências e recursos próprios"},
    {"indicador": "Pessoal / total despesa saúde", "valor": 62.4, "meta": 60.0, "unidade": "%",
     "status": "critico", "observacao": "Acima do limite prudencial — deixa apenas 37,6% para custeio e investimento"},
    {"indicador": "Execução emendas parlamentares", "valor": 57.0, "meta": 90.0, "unidade": "%",
     "status": "critico", "observacao": "43% das emendas não executadas — risco de devolução de recursos ao tesouro"},
    {"indicador": "Execução bloco investimentos", "valor": 57.0, "meta": 90.0, "unidade": "%",
     "status": "critico", "observacao": "IMAS/IMOD com baixa execução — obras e equipamentos paralisados"},
    {"indicador": "Custo judicialização / total saúde", "valor": 3.9, "meta": 2.0, "unidade": "%",
     "status": "critico", "observacao": "R$ 612k em demandas judiciais — crescente em 18% ao ano"},
    {"indicador": "Saldo acumulado FMS", "valor": 75_800, "meta": None, "unidade": "R$",
     "status": "atencao", "observacao": "Saldo positivo mas frágil — 2 meses com resultado negativo"},
]


@router.get("/dashboard")
def dashboard():
    return {
        "receita_total_prevista_r": 15_120_000,
        "receita_total_realizada_r": 13_579_400,
        "execucao_receita_pct": 89.8,
        "despesa_total_r": 15_759_000,
        "saldo_acumulado_r": 75_800,
        "percentual_impostos_saude": 126.3,
        "pessoal_pct_despesa": 62.4,
        "judicializacao_r": 612_000,
        "emendas_execucao_pct": 57.0,
    }


@router.get("/receitas")
def receitas():
    return _RECEITAS


@router.get("/despesas")
def despesas():
    return _DESPESAS


@router.get("/aplicacao-minima")
def aplicacao_minima():
    return _APLICACAO_MINIMA


@router.get("/blocos")
def blocos():
    return _BLOCOS


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
