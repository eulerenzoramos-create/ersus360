from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-indigena-apui", tags=["saude_indigena_apui"])

_DASHBOARD = {
    "populacao_indigena_estimada": 420,
    "etnias": 2,
    "aldeias_territorio_municipal": 3,
    "aldeia_principal": "TI Tenharim do Igarapé Preto",
    "dsei_referencia": "DSEI Madeira",
    "polo_base": "Polo Base Marmelos",
    "casai_referencia": "CASAI Porto Velho",
    "distancia_casai_km": 680,
    "mortalidade_infantil_por_mil_nv": 42.0,
    "media_nacional_mort_inf": 12.0,
    "malaria_incidencia_por_mil": 384.0,
    "media_municipal_malaria_por_mil": 52.0,
    "desnutricao_cronica_menores_5_pct": 28.4,
    "meta_desnutricao_pct": 5.0,
    "vacinacao_cobertura_pct": 28.4,
    "meta_vacinacao_pct": 95.0,
    "parto_institucional_pct": 38.4,
    "meta_parto_institucional_pct": 100.0,
    "equipes_emsi_municipio": 1,
    "meta_emsi": 2,
    "medico_emsi": False,
    "enfermeiro_emsi": True,
    "microscopista_aldeia": True,
    "agente_saude_indigena": 4,
    "status_vacinacao": "critico",
    "status_desnutricao": "critico",
    "status_malaria": "critico",
}

_AGRAVOS = [
    {"agravo": "Malária",                  "incidencia_indigena_por_mil": 384.0, "incidencia_municipal_por_mil": 52.0, "casos_ano": 161,  "obitos_ano": 2, "status": "critico", "observacao": "IPA indígena 7,4x superior à média municipal — sem borrifação intradomiciliar, sem telas, construção tradicional sem vedação. Microscopista aldeado mas sem ACT em estoque regular"},
    {"agravo": "Desnutrição < 5 anos",     "incidencia_indigena_por_mil": None,  "incidencia_municipal_por_mil": None, "casos_ano": 24,   "obitos_ano": 1, "status": "critico", "observacao": "Desnutrição crônica 28,4% (nacional indígena ~22%) — SISVAN com cobertura 38% nas aldeias. Insegurança alimentar relacionada à redução da área de caça/pesca por pressão garimpeira"},
    {"agravo": "Tuberculose",              "incidencia_indigena_por_mil": 12.0,  "incidencia_municipal_por_mil": 0.9,  "casos_ano": 5,    "obitos_ano": 0, "status": "critico", "observacao": "Incidência 13x superior — DOTS implementado pelo EMSI mas abandono 40% por deslocamento interaldeia. Contatos não rastreados por logística"},
    {"agravo": "IST / sífilis congênita",  "incidencia_indigena_por_mil": None,  "incidencia_municipal_por_mil": None, "casos_ano": 4,    "obitos_ano": 0, "status": "critico", "observacao": "4 casos sífilis congênita/ano em população de 420 — pré-natal irregular, VDRL apenas em visita do EMSI. Penicilina benzatina em falta em 3 dos últimos 12 meses"},
    {"agravo": "Diarreia / parasitoses",   "incidencia_indigena_por_mil": 284.0, "incidencia_municipal_por_mil": 48.0, "casos_ano": 119,  "obitos_ano": 0, "status": "critico", "observacao": "Sem água tratada nas aldeias — igarapé como única fonte. Helmintíase em 64% das crianças triadas. Desverminação semestral com cobertura 42%"},
    {"agravo": "Violência / autoagressão", "incidencia_indigena_por_mil": None,  "incidencia_municipal_por_mil": None, "casos_ano": 8,    "obitos_ano": 0, "status": "atencao", "observacao": "Conflito territorial com garimpeiros afeta saúde mental da comunidade. 8 notificações de violência/ano — subnotificação alta. Sem psicólogo no EMSI"},
]

_ACESSO = [
    {"indicador": "Cobertura vacinal completa",     "valor": 28.4,  "meta": 95.0, "unidade": "%", "status": "critico"},
    {"indicador": "Pré-natal ≥ 6 consultas",        "valor": 42.4,  "meta": 80.0, "unidade": "%", "status": "critico"},
    {"indicador": "Parto institucional",             "valor": 38.4,  "meta": 100.0,"unidade": "%", "status": "critico"},
    {"indicador": "Acesso a NASF/especialista",      "valor": 8.4,   "meta": 60.0, "unidade": "%", "status": "critico"},
    {"indicador": "Consultas EMSI / habitante / ano","valor": 1.8,   "meta": 4.0,  "unidade": "cons/hab", "status": "critico"},
    {"indicador": "Remoção aérea disponível",        "valor": 28.4,  "meta": 80.0, "unidade": "% tempo", "status": "critico"},
]

_HISTORICO = [
    {"ano": "2022", "mortalidade_infantil": 52.0, "malaria_ipa_por_mil": 428.0, "vacinacao_pct": 18.4, "desnutricao_cronica_pct": 34.2, "parto_institucional_pct": 28.4},
    {"ano": "2023", "mortalidade_infantil": 48.0, "malaria_ipa_por_mil": 408.0, "vacinacao_pct": 22.4, "desnutricao_cronica_pct": 31.8, "parto_institucional_pct": 32.4},
    {"ano": "2024", "mortalidade_infantil": 44.0, "malaria_ipa_por_mil": 394.0, "vacinacao_pct": 25.8, "desnutricao_cronica_pct": 30.2, "parto_institucional_pct": 35.8},
    {"ano": "2025", "mortalidade_infantil": 42.0, "malaria_ipa_por_mil": 384.0, "vacinacao_pct": 28.4, "desnutricao_cronica_pct": 28.4, "parto_institucional_pct": 38.4},
]

_INDICADORES = [
    {"indicador": "Mortalidade infantil indígena",    "valor": 42.0, "meta": 12.0, "unidade": "/1.000 NV", "status": "critico", "observacao": "3,5x a média nacional — partos domiciliares 61,6%, desnutrição 28,4%, malária sem tratamento imediato. CASAI a 680 km. Óbito neonatal por sepse e prematuridade evitáveis com pré-natal e parto institucional"},
    {"indicador": "IPA malária indígena",             "valor": 384.0,"meta": 10.0, "unidade": "/1.000 hab","status": "critico", "observacao": "38,4x superior à meta nacional — TI sem borrifação, sem telas, sem bed nets universais. Microscopista no polo mas ACT desabastecido 3 meses/ano. Pressão garimpeira impede desmatamento zero e amplia criadouros"},
    {"indicador": "Desnutrição crônica < 5a",         "valor": 28.4, "meta": 5.0,  "unidade": "%",         "status": "critico", "observacao": "Queda de 34% (2022) para 28% (2025) — ainda 5,7x acima da meta. SISVAN cobertura 38% nas aldeias. Programa de suplementação alimentar do DSEI com entregas irregulares (2-4x/ano)"},
    {"indicador": "Cobertura vacinal",                "valor": 28.4, "meta": 95.0, "unidade": "%",         "status": "critico", "observacao": "71,6% sem vacinação completa — EMSI visita aldeias a cada 30-45 dias mas a logística fluvial suspende em piracema/cheia. Sem câmara fria aldeada: vacina perde cadeia de frio no transporte fluvial"},
    {"indicador": "EMSI / equipes de saúde",          "valor": 1,    "meta": 2,    "unidade": "equipes",   "status": "critico", "observacao": "1 EMSI sem médico (apenas enfermeiro + técnico + AIS) para 420 pessoas em 3 aldeias. Médico mais próximo: UBS sede (distância fluvial 3-8h). Sem médico indígena formado no município"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/agravos")
def agravos():
    return _AGRAVOS


@router.get("/acesso")
def acesso():
    return _ACESSO


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
