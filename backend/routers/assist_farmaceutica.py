from fastapi import APIRouter

router = APIRouter(prefix="/api/assist-farmaceutica", tags=["assist_farmaceutica"])

_MEDICAMENTOS_BASICOS = [
    {"medicamento": "Metformina 500mg/850mg", "estoque_dias": 68, "demanda_mensal": 1842,
     "dispensado_mes": 1842, "ruptura_historica": False, "status": "ok"},
    {"medicamento": "Enalapril 5mg/10mg", "estoque_dias": 54, "demanda_mensal": 2184,
     "dispensado_mes": 2184, "ruptura_historica": False, "status": "ok"},
    {"medicamento": "Atenolol 25mg/50mg", "estoque_dias": 62, "demanda_mensal": 1642,
     "dispensado_mes": 1612, "ruptura_historica": False, "status": "ok"},
    {"medicamento": "Amoxicilina 500mg", "estoque_dias": 18, "demanda_mensal": 3412,
     "dispensado_mes": 2984, "ruptura_historica": True, "status": "critico"},
    {"medicamento": "Insulina NPH 100UI/mL", "estoque_dias": 24, "demanda_mensal": 312,
     "dispensado_mes": 298, "ruptura_historica": True, "status": "atencao"},
    {"medicamento": "Insulina Regular 100UI/mL", "estoque_dias": 28, "demanda_mensal": 142,
     "dispensado_mes": 138, "ruptura_historica": False, "status": "atencao"},
    {"medicamento": "Salbutamol Spray", "estoque_dias": 8, "demanda_mensal": 684,
     "dispensado_mes": 512, "ruptura_historica": True, "status": "critico"},
    {"medicamento": "Dipirona 500mg", "estoque_dias": 84, "demanda_mensal": 4812,
     "dispensado_mes": 4812, "ruptura_historica": False, "status": "ok"},
    {"medicamento": "Omeprazol 20mg", "estoque_dias": 42, "demanda_mensal": 2642,
     "dispensado_mes": 2642, "ruptura_historica": False, "status": "ok"},
    {"medicamento": "Sulfato Ferroso 40mg", "estoque_dias": 14, "demanda_mensal": 1284,
     "dispensado_mes": 984, "ruptura_historica": True, "status": "critico"},
    {"medicamento": "Ácido Fólico 5mg", "estoque_dias": 32, "demanda_mensal": 824,
     "dispensado_mes": 824, "ruptura_historica": False, "status": "atencao"},
    {"medicamento": "Azitromicina 500mg", "estoque_dias": 12, "demanda_mensal": 1124,
     "dispensado_mes": 842, "ruptura_historica": True, "status": "critico"},
]

_COMPONENTE_ESPECIALIZADO = [
    {"medicamento": "Adalimumabe (artrite/psoríase)", "pacientes": 8, "custo_mensal_r": 12480,
     "fornecimento_estadual": True, "ruptura_mes": 0, "status": "ok"},
    {"medicamento": "Insulina Glargina", "pacientes": 42, "custo_mensal_r": 6720,
     "fornecimento_estadual": True, "ruptura_mes": 1, "status": "atencao"},
    {"medicamento": "Clozapina (esquizofrenia refratária)", "pacientes": 14, "custo_mensal_r": 2184,
     "fornecimento_estadual": True, "ruptura_mes": 0, "status": "ok"},
    {"medicamento": "Metotrexato (doenças autoimunes)", "pacientes": 18, "custo_mensal_r": 1260,
     "fornecimento_estadual": True, "ruptura_mes": 0, "status": "ok"},
    {"medicamento": "Rivaroxabana / Anticoagulantes DOAC", "pacientes": 24, "custo_mensal_r": 3840,
     "fornecimento_estadual": False, "ruptura_mes": 2, "status": "critico"},
]

_HISTORICO = [
    {"mes": "Jan", "dispensacoes": 28412, "itens_em_falta": 3, "custo_basico_r": 42180, "receitas_atendidas_pct": 91.2},
    {"mes": "Fev", "dispensacoes": 26984, "itens_em_falta": 4, "custo_basico_r": 40620, "receitas_atendidas_pct": 89.8},
    {"mes": "Mar", "dispensacoes": 29842, "itens_em_falta": 5, "custo_basico_r": 44280, "receitas_atendidas_pct": 88.4},
    {"mes": "Abr", "dispensacoes": 28964, "itens_em_falta": 4, "custo_basico_r": 43120, "receitas_atendidas_pct": 90.1},
    {"mes": "Mai", "dispensacoes": 31248, "itens_em_falta": 6, "custo_basico_r": 46240, "receitas_atendidas_pct": 87.6},
    {"mes": "Jun", "dispensacoes": 30612, "itens_em_falta": 4, "custo_basico_r": 45180, "receitas_atendidas_pct": 88.9},
]

_INDICADORES = [
    {"indicador": "Medicamentos básicos em falta", "valor": 4, "meta": 0, "unidade": "itens",
     "status": "critico", "observacao": "Amoxicilina, Salbutamol, Sulfato Ferroso e Azitromicina em ruptura"},
    {"indicador": "Receitas atendidas integralmente", "valor": 88.9, "meta": 95.0, "unidade": "%",
     "status": "critico", "observacao": "11% das receitas com algum item em falta — pacientes sem tratamento"},
    {"indicador": "Estoque Salbutamol Spray", "valor": 8, "meta": 30, "unidade": "dias",
     "status": "critico", "observacao": "Broncodilatador essencial com menos de 1 semana de estoque"},
    {"indicador": "Estoque Sulfato Ferroso", "valor": 14, "meta": 30, "unidade": "dias",
     "status": "critico", "observacao": "Suplementação de ferro com estoque crítico — impacto na nutrição"},
    {"indicador": "Componente especializado sem ruptura", "valor": 60.0, "meta": 100.0, "unidade": "%",
     "status": "critico", "observacao": "2 de 5 medicamentos especializados com ruptura no semestre"},
    {"indicador": "Cobertura RENAME básica", "valor": 94.2, "meta": 100.0, "unidade": "%",
     "status": "atencao", "observacao": "94% dos itens RENAME disponíveis — 4 itens em ruptura momentânea"},
]


@router.get("/dashboard")
def dashboard():
    return {
        "medicamentos_basicos_monitorados": 12,
        "itens_em_falta": 4,
        "dispensacoes_mes": 30612,
        "receitas_atendidas_pct": 88.9,
        "custo_basico_mes_r": 45180,
        "componente_especializado_pacientes": 106,
        "componente_especializado_custo_r": 26484,
        "farmacia_popular_convenios": 3,
        "vencimento_proximo_30d": 6,
    }


@router.get("/medicamentos-basicos")
def medicamentos_basicos():
    return _MEDICAMENTOS_BASICOS


@router.get("/componente-especializado")
def componente_especializado():
    return _COMPONENTE_ESPECIALIZADO


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
