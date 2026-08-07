from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/judicializacao-saude", tags=["judicializacao_saude"])

@lru_cache(maxsize=1)
def _PROCESSOS():
    return [
        {"processo": "0012847-22.2026.8.04.0001", "autor": "Paciente A.S.M.", "objeto": "Fornecimento Adalimumabe 40mg",
         "valor_mensal_r": 1_560, "prazo_cumprimento_d": 15, "status_cumprimento": "cumprido",
         "advogado_mp": False, "origem": "Defensoria Pública", "status": "ativo"},
        {"processo": "0014221-88.2026.8.04.0001", "autor": "Paciente J.R.L.", "objeto": "Cirurgia bariátrica — obesidade grau III",
         "valor_mensal_r": 28_400, "prazo_cumprimento_d": 30, "status_cumprimento": "atrasado",
         "advogado_mp": True, "origem": "Advogado particular", "status": "ativo"},
        {"processo": "0009841-14.2025.8.04.0001", "autor": "Paciente M.F.C.", "objeto": "Oxigênio domiciliar + BIPAP",
         "valor_mensal_r": 2_840, "prazo_cumprimento_d": 7, "status_cumprimento": "cumprido",
         "advogado_mp": False, "origem": "Defensoria Pública", "status": "ativo"},
        {"processo": "0018442-33.2026.8.04.0001", "autor": "Paciente T.A.S.", "objeto": "Medicamento Rivaroxabana 20mg",
         "valor_mensal_r": 640, "prazo_cumprimento_d": 10, "status_cumprimento": "cumprido",
         "advogado_mp": False, "origem": "Defensoria Pública", "status": "ativo"},
        {"processo": "0021887-61.2026.8.04.0001", "autor": "Paciente E.N.O.", "objeto": "Vaga UTI adulto — Manaus",
         "valor_mensal_r": 18_200, "prazo_cumprimento_d": 2, "status_cumprimento": "descumprido",
         "advogado_mp": True, "origem": "MP Estadual", "status": "ativo"},
        {"processo": "0016284-44.2026.8.04.0001", "autor": "Paciente C.R.P.", "objeto": "Prótese ortopédica joelho",
         "valor_mensal_r": 14_200, "prazo_cumprimento_d": 45, "status_cumprimento": "em_andamento",
         "advogado_mp": False, "origem": "Advogado particular", "status": "ativo"},
    ]


@lru_cache(maxsize=1)
def _POR_OBJETO():
    return [
        {"objeto": "Medicamentos alto custo", "processos": 18, "custo_mensal_r": 124_800, "tendencia": "crescente"},
        {"objeto": "Internação/UTI (Manaus)", "processos": 6, "custo_mensal_r": 168_400, "tendencia": "crescente"},
        {"objeto": "Cirurgias eletivas", "processos": 8, "custo_mensal_r": 142_600, "tendencia": "estavel"},
        {"objeto": "Órteses e próteses", "processos": 9, "custo_mensal_r": 86_400, "tendencia": "crescente"},
        {"objeto": "Exames de imagem (Manaus)", "processos": 4, "custo_mensal_r": 28_800, "tendencia": "estavel"},
        {"objeto": "Oxigênio/equipamentos domiciliares", "processos": 7, "custo_mensal_r": 32_400, "tendencia": "crescente"},
        {"objeto": "Outros", "processos": 12, "custo_mensal_r": 28_600, "tendencia": "estavel"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"mes": "Jan", "novos_processos": 4, "total_ativos": 48, "custo_mensal_r": 498_400, "cumprimento_pct": 84.2},
        {"mes": "Fev", "novos_processos": 5, "total_ativos": 52, "custo_mensal_r": 524_800, "cumprimento_pct": 82.7},
        {"mes": "Mar", "novos_processos": 8, "total_ativos": 58, "custo_mensal_r": 548_200, "cumprimento_pct": 79.3},
        {"mes": "Abr", "novos_processos": 4, "total_ativos": 60, "custo_mensal_r": 572_400, "cumprimento_pct": 81.7},
        {"mes": "Mai", "novos_processos": 6, "total_ativos": 64, "custo_mensal_r": 598_600, "cumprimento_pct": 78.1},
        {"mes": "Jun", "novos_processos": 5, "total_ativos": 64, "custo_mensal_r": 612_000, "cumprimento_pct": 79.7},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Custo judicialização/mês", "valor": 612_000, "meta": None, "unidade": "R$",
         "status": "critico", "observacao": "R$ 612k/mês — crescimento de 23% em 6 meses. Medicamentos alto custo e internações dominam"},
        {"indicador": "Processos ativos", "valor": 64, "meta": None, "unidade": "processos",
         "status": "critico", "observacao": "64 ações ativas — média de 10 novos/mês em 2026"},
        {"indicador": "Taxa cumprimento das ordens", "valor": 79.7, "meta": 95.0, "unidade": "%",
         "status": "critico", "observacao": "20% das ordens judiciais com cumprimento atrasado ou descumprido — risco de multas diárias"},
        {"indicador": "Processos c/ descumprimento", "valor": 4, "meta": 0, "unidade": "processos",
         "status": "critico", "observacao": "4 processos em descumprimento — multa diária de R$ 500–5.000 por processo"},
        {"indicador": "Custo judicial / despesa total saúde", "valor": 3.9, "meta": 2.0, "unidade": "%",
         "status": "critico", "observacao": "Crescimento impacta diretamente o custeio da rede — recursos desviados de ações coletivas"},
    ]



@router.get("/dashboard")
def dashboard():
    return {
        "processos_ativos": 64,
        "novos_mes": 5,
        "custo_mensal_r": 612_000,
        "custo_acumulado_ano_r": 3_354_000,
        "cumprimento_pct": 79.7,
        "descumprimentos": 4,
        "atrasados": 8,
        "origem_defensoria_pct": 58.2,
        "origem_advogado_pct": 32.8,
        "origem_mp_pct": 9.0,
    }


@router.get("/processos")
def processos():
    return _PROCESSOS()


@router.get("/por-objeto")
def por_objeto():
    return _POR_OBJETO()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()