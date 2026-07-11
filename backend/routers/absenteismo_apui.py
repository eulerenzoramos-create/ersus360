from fastapi import APIRouter
router = APIRouter()

@router.get("/api/absenteismo-apui/dashboard")
def abs_dashboard():
    return {
        "total_servidores_saude": 312,
        "taxa_absenteismo_pct": 11.8,
        "meta_absenteismo_pct": 5.0,
        "dias_perdidos_mes": 438,
        "horas_extras_mes": 1240,
        "servidores_afastados_lts": 22,
        "servidores_afastados_maternidade": 8,
        "rotatividade_anual_pct": 34.2,
        "cargos_vazios": 28,
        "medicos_efetivos": 4,
        "medicos_contratados_rpa": 9,
        "enfermeiros_efetivos": 14,
        "tecnicos_enfermagem_efetivos": 62,
        "acs_efetivos": 48,
        "custo_estimado_absenteismo_ano": 1_840_000,
        "custo_horas_extras_ano": 612_000,
    }

@router.get("/api/absenteismo-apui/categorias")
def abs_categorias():
    return [
        {"categoria": "Licença por doença (LTS)",       "casos_mes": 22, "dias_perdidos": 198, "pct_total": 45.2, "status": "critico"},
        {"categoria": "Licença-prêmio / férias não gozadas", "casos_mes": 8, "dias_perdidos": 64,  "pct_total": 14.6, "status": "atencao"},
        {"categoria": "Falta injustificada",            "casos_mes": 14, "dias_perdidos": 56,  "pct_total": 12.8, "status": "critico"},
        {"categoria": "Afastamento maternidade/paternidade","casos_mes": 8,"dias_perdidos": 64,"pct_total": 14.6,"status": "ok"},
        {"categoria": "Afastamento acidente de trabalho","casos_mes": 3, "dias_perdidos": 30,  "pct_total":  6.8, "status": "atencao"},
        {"categoria": "Outros (conselho, capacitação)", "casos_mes": 6, "dias_perdidos": 26,  "pct_total":  5.9, "status": "ok"},
    ]

@router.get("/api/absenteismo-apui/cargos-criticos")
def abs_cargos():
    return [
        {"cargo": "Médico Clínico Geral",    "efetivos": 2, "necessarios": 6, "vacantes": 4, "cobertura_pct": 33.3, "status": "critico"},
        {"cargo": "Médico ESF",              "efetivos": 2, "necessarios": 9, "vacantes": 7, "cobertura_pct": 22.2, "status": "critico"},
        {"cargo": "Enfermeiro ESF",          "efetivos": 8, "necessarios": 10,"vacantes": 2, "cobertura_pct": 80.0, "status": "atencao"},
        {"cargo": "Odontólogo ESF",          "efetivos": 3, "necessarios": 5, "vacantes": 2, "cobertura_pct": 60.0, "status": "atencao"},
        {"cargo": "Técnico de Enfermagem",   "efetivos": 62,"necessarios": 72,"vacantes": 10,"cobertura_pct": 86.1, "status": "atencao"},
        {"cargo": "Farmacêutico",            "efetivos": 1, "necessarios": 3, "vacantes": 2, "cobertura_pct": 33.3, "status": "critico"},
        {"cargo": "Fisioterapeuta",          "efetivos": 0, "necessarios": 2, "vacantes": 2, "cobertura_pct":  0.0, "status": "critico"},
        {"cargo": "Psicólogo",              "efetivos": 1, "necessarios": 3, "vacantes": 2, "cobertura_pct": 33.3, "status": "critico"},
        {"cargo": "Assistente Social",       "efetivos": 2, "necessarios": 3, "vacantes": 1, "cobertura_pct": 66.7, "status": "atencao"},
        {"cargo": "ACS",                     "efetivos": 48,"necessarios": 52,"vacantes": 4, "cobertura_pct": 92.3, "status": "ok"},
    ]

@router.get("/api/absenteismo-apui/historico")
def abs_historico():
    return [
        {"ano": 2022, "absenteismo_pct": 8.2, "rotatividade_pct": 28.4, "cargos_vazios": 18, "horas_extras_k": 980},
        {"ano": 2023, "absenteismo_pct": 9.6, "rotatividade_pct": 31.0, "cargos_vazios": 22, "horas_extras_k": 1080},
        {"ano": 2024, "absenteismo_pct": 10.8,"rotatividade_pct": 33.1, "cargos_vazios": 25, "horas_extras_k": 1160},
        {"ano": 2025, "absenteismo_pct": 11.8,"rotatividade_pct": 34.2, "cargos_vazios": 28, "horas_extras_k": 1240},
    ]

@router.get("/api/absenteismo-apui/indicadores")
def abs_indicadores():
    return [
        {"indicador": "Taxa de Absenteísmo",          "valor": 11.8,  "meta": 5.0,  "unidade": "%",   "status": "critico",  "observacao": "2,4x a meta — médicos RPA somam 9 de 13 (sem vinculação estável)"},
        {"indicador": "Rotatividade Anual",           "valor": 34.2,  "meta": 15.0, "unidade": "%",   "status": "critico",  "observacao": "1 em cada 3 profissionais sai por ano — instabilidade crônica da equipe"},
        {"indicador": "Cargos Efetivos Vazios",       "valor": 28,    "meta": 0,    "unidade": "vagas","status": "critico", "observacao": "Médicos: 11 vagas em PSS sem qualificação — distância e salário afastam candidatos"},
        {"indicador": "Horas Extras/Mês",             "valor": 1240,  "meta": 400,  "unidade": "h",   "status": "critico",  "observacao": "Custo real: R$ 51k/mês — equivale a contratar 3 médicos a mais"},
        {"indicador": "LTS por Burnout/Transt. Mental","valor": 38.0,  "meta": 10.0, "unidade": "%",  "status": "critico",  "observacao": "38% dos afastamentos LTS são burnout ou transtorno mental — sobrecarga crônica"},
        {"indicador": "Fisioterapeutas Disponíveis",  "valor": 0,     "meta": 2,    "unidade": "prof.","status": "critico", "observacao": "Zero fisioterapeutas na rede — toda reabilitação depende de TFD para Manaus"},
    ]
