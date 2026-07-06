from fastapi import APIRouter

router = APIRouter(prefix="/api/educacao-permanente", tags=["educacao_permanente"])

_DASHBOARD = {
    "servidores_saude_total": 384,
    "servidores_capacitados_ano": 218,
    "cobertura_capacitacao_pct": 56.8,
    "meta_cobertura_pct": 80.0,
    "cursos_realizados_ano": 28,
    "cursos_ead_unasus": 12,
    "carga_horaria_media_anual": 24.4,
    "tutores_ativos": 8,
    "residentes_multiprofissionais": 0,
    "profissionais_pos_graduacao_pct": 18.4,
    "rotatividade_profissional_pct": 28.4,
    "status_cobertura": "atencao",
    "status_rotatividade": "critico",
}

_CURSOS_REALIZADOS = [
    {"curso": "Atenção Básica — ESF e NASF",             "modalidade": "Presencial", "ch_horas": 40, "participantes": 64,  "area": "APS",              "status": "concluido"},
    {"curso": "Saúde Indígena — Diversidade Cultural",   "modalidade": "Presencial", "ch_horas": 20, "participantes": 28,  "area": "Saúde Indígena",   "status": "concluido"},
    {"curso": "Protocolo Manchester (UPA)",               "modalidade": "Presencial", "ch_horas": 16, "participantes": 22,  "area": "Urgência",         "status": "concluido"},
    {"curso": "Vigilância Nutricional — SISVAN",         "modalidade": "EAD/UNASUS", "ch_horas": 30, "participantes": 18,  "area": "Nutrição",         "status": "concluido"},
    {"curso": "Manejo Clínico da Malária",               "modalidade": "EAD/UNASUS", "ch_horas": 20, "participantes": 42,  "area": "Vigilância",       "status": "concluido"},
    {"curso": "Saúde Mental — CAPS e RAPS",              "modalidade": "EAD/UNASUS", "ch_horas": 40, "participantes": 24,  "area": "Saúde Mental",     "status": "concluido"},
    {"curso": "e-SUS PEC — Prontuário Eletrônico",       "modalidade": "EAD/UNASUS", "ch_horas": 20, "participantes": 84,  "area": "Saúde Digital",    "status": "concluido"},
    {"curso": "Prevenção e Manejo de LTA/LV",            "modalidade": "Presencial", "ch_horas": 16, "participantes": 32,  "area": "Vigilância",       "status": "concluido"},
    {"curso": "Rede Cegonha — Boas Práticas de Parto",   "modalidade": "Presencial", "ch_horas": 24, "participantes": 18,  "area": "Saúde Materna",    "status": "em_andamento"},
    {"curso": "Gestão em Saúde para Coordenadores",      "modalidade": "Presencial", "ch_horas": 32, "participantes": 12,  "area": "Gestão",           "status": "em_andamento"},
    {"curso": "Farmácia Clínica e Uso Racional",         "modalidade": "EAD/UNASUS", "ch_horas": 30, "participantes": 14,  "area": "Assistência Farm.","status": "em_andamento"},
    {"curso": "Controle de Infecção Hospitalar (CCIH)",  "modalidade": "Presencial", "ch_horas": 16, "participantes": 16,  "area": "Hospitalar",       "status": "planejado"},
]

_NECESSIDADES_FORMACAO = [
    {"area": "Saúde Mental / CAPS",         "demanda": "alta",   "profissionais": 28,  "observacao": "Sem psiquiatra — ACS e técnicos precisam reconhecer crise"},
    {"area": "Saúde Indígena",              "demanda": "alta",   "profissionais": 22,  "observacao": "Diversidade étnica e cultural — EMSI sem formação específica"},
    {"area": "Urgência e Emergência",       "demanda": "alta",   "profissionais": 32,  "observacao": "Manchester, ACLS, ATLS — plantões com déficit de treinamento"},
    {"area": "Malária e Endemias",          "demanda": "alta",   "profissionais": 64,  "observacao": "Alta endemicidade — ACS precisam de treinamento em campo"},
    {"area": "Saúde Digital / e-SUS",       "demanda": "média",  "profissionais": 84,  "observacao": "Muitos profissionais ainda usam papel — completude baixa"},
    {"area": "Saúde Bucal",                 "demanda": "média",  "profissionais": 18,  "observacao": "Vaga ASB sem preenchimento — equipe reduzida"},
    {"area": "Gestão e Planejamento",       "demanda": "média",  "profissionais": 12,  "observacao": "Gestores sem formação em PMS, PPA, programação orçamentária"},
    {"area": "Agrotóxicos / Saúde Trab.",   "demanda": "alta",   "profissionais": 22,  "observacao": "Alta exposição — poucos profissionais capacitados para manejo"},
]

_HISTORICO = [
    {"ano": "2022", "capacitados": 148, "cursos": 18, "ch_media": 18.4, "rotatividade_pct": 24.2},
    {"ano": "2023", "capacitados": 184, "cursos": 22, "ch_media": 20.8, "rotatividade_pct": 26.4},
    {"ano": "2024", "capacitados": 198, "cursos": 24, "ch_media": 22.4, "rotatividade_pct": 27.8},
    {"ano": "2025", "capacitados": 218, "cursos": 28, "ch_media": 24.4, "rotatividade_pct": 28.4},
]

_INDICADORES = [
    {"indicador": "Cobertura de capacitação",           "valor": 56.8, "meta": 80.0,  "unidade": "%",       "status": "atencao", "observacao": "166 servidores sem nenhuma capacitação no ano — especialmente terceirizados e temporários"},
    {"indicador": "Rotatividade de profissionais",      "valor": 28.4, "meta": 10.0,  "unidade": "%",       "status": "critico", "observacao": "28,4% dos profissionais saem/ano — cada saída anula investimento em capacitação. Causa: baixos salários e isolamento"},
    {"indicador": "Residência multiprofissional",       "valor": 0,    "meta": 4,     "unidade": "resid.",  "status": "critico", "observacao": "Apuí não tem programa de residência multiprofissional — municípios isolados ficam sem esse incentivo de fixação"},
    {"indicador": "Pós-graduação entre os servidores",  "valor": 18.4, "meta": 40.0,  "unidade": "%",       "status": "atencao", "observacao": "Apenas 18,4% com especialização — dificuldade de acesso a pós-graduação presencial em município remoto"},
    {"indicador": "Cursos EAD / UNASUS utilizados",    "valor": 12,   "meta": 20,    "unidade": "cursos",  "status": "atencao", "observacao": "EAD é principal via de formação em Apuí — mas 38% dos servidores sem acesso a internet de qualidade"},
    {"indicador": "Tutores de EPS ativos",              "valor": 8,    "meta": 12,    "unidade": "tutores", "status": "atencao", "observacao": "8/12 tutores planejados — Educação Permanente precisa de profissional dedicado em tempo integral"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/cursos")
def cursos():
    return _CURSOS_REALIZADOS


@router.get("/necessidades")
def necessidades():
    return _NECESSIDADES_FORMACAO


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
