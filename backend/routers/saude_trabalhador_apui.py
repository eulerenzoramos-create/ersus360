from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-trabalhador-apui", tags=["saude_trabalhador_apui"])

_DASHBOARD = {
    "populacao_trabalhadora_estimada": 8420,
    "cat_registradas_ano": 84,
    "cat_subnotificadas_estimativa_pct": 62.0,
    "doencas_trabalho_notificadas_ano": 28,
    "afastamentos_inss_ano": 312,
    "acidentes_fatais_ano": 2,
    "acidentes_agricolas_pct": 48.4,
    "intoxicacoes_agrotoxicos_ano": 32,
    "expostos_agrotoxicos_estimativa": 1840,
    "trabalhadores_informais_pct": 64.2,
    "cobertura_pcmso_empresas_pct": 22.4,
    "cerest_referencia": "CEREST Regional Humaitá/AM",
    "distancia_cerest_km": 284,
    "status_cat": "atencao",
    "status_agrotoxicos": "critico",
}

_SETORES_RISCO = [
    {"setor": "Agricultura / Agropecuária",   "trabalhadores": 2840, "cat_ano": 38, "doencas_notif": 12, "risco": "alto",  "principais_riscos": "Agrotóxico, esforço físico, insolação, animais peçonhentos", "status": "critico"},
    {"setor": "Extração Madeireira",           "trabalhadores": 680,  "cat_ano": 14, "doencas_notif": 4,  "risco": "alto",  "principais_riscos": "Máquinas cortantes, queda, ruído, poeira de madeira",        "status": "atencao"},
    {"setor": "Saúde Pública (FMS)",           "trabalhadores": 384,  "cat_ano": 8,  "doencas_notif": 6,  "risco": "médio", "principais_riscos": "Biológico, estresse, sobrecarga de trabalho, violência",     "status": "atencao"},
    {"setor": "Construção Civil",              "trabalhadores": 420,  "cat_ano": 12, "doencas_notif": 2,  "risco": "alto",  "principais_riscos": "Queda de altura, soterramento, elétrico, químico",             "status": "atencao"},
    {"setor": "Comércio / Serviços",           "trabalhadores": 1240, "cat_ano": 6,  "doencas_notif": 2,  "risco": "baixo", "principais_riscos": "Ergonômico, estresse, assalto",                               "status": "ok"},
    {"setor": "Transporte Fluvial/Terrestre",  "trabalhadores": 312,  "cat_ano": 4,  "doencas_notif": 1,  "risco": "alto",  "principais_riscos": "Acidente veicular, naufrágio, lombalgia",                      "status": "atencao"},
    {"setor": "Educação (municipal)",          "trabalhadores": 284,  "cat_ano": 2,  "doencas_notif": 1,  "risco": "baixo", "principais_riscos": "Estresse, distúrbio de voz, LER/DORT",                        "status": "ok"},
]

_INTOXICACOES_AGROTOXICOS = [
    {"mes": "Jan/25", "casos": 4, "hospitalizacoes": 1, "fatais": 0, "produto_principal": "Glifosato"},
    {"mes": "Fev/25", "casos": 3, "hospitalizacoes": 0, "fatais": 0, "produto_principal": "Paraquat"},
    {"mes": "Mar/25", "casos": 5, "hospitalizacoes": 2, "fatais": 0, "produto_principal": "Glifosato/Atrazina"},
    {"mes": "Abr/25", "casos": 4, "hospitalizacoes": 1, "fatais": 0, "produto_principal": "Organofosforado"},
    {"mes": "Mai/25", "casos": 6, "hospitalizacoes": 2, "fatais": 1, "produto_principal": "Paraquat (fatal)"},
    {"mes": "Jun/25", "casos": 10, "hospitalizacoes": 3,"fatais": 1, "produto_principal": "Múltiplos — safra soja"},
]

_HISTORICO = [
    {"ano": "2022", "cat": 64,  "doencas": 18, "fatais": 1, "intox_agrotox": 22, "afastamentos": 248},
    {"ano": "2023", "cat": 72,  "doencas": 22, "fatais": 2, "intox_agrotox": 26, "afastamentos": 278},
    {"ano": "2024", "cat": 78,  "doencas": 24, "fatais": 2, "intox_agrotox": 28, "afastamentos": 298},
    {"ano": "2025", "cat": 84,  "doencas": 28, "fatais": 2, "intox_agrotox": 32, "afastamentos": 312},
]

_INDICADORES = [
    {"indicador": "CAT registradas / ano",                 "valor": 84,   "meta": None,  "unidade": "CATs",    "status": "atencao", "observacao": "Tendência de aumento anual (+31% em 3 anos). Subnotificação estimada em 62% — maioria no setor informal"},
    {"indicador": "Intoxicações por agrotóxicos",          "valor": 32,   "meta": 0,     "unidade": "casos",   "status": "critico", "observacao": "32 casos confirmados em 2025 — Apuí está no corredor da soja e usa agrotóxicos de alto grau de perigo"},
    {"indicador": "Trabalhadores informais expostos",       "valor": 64.2, "meta": None,  "unidade": "%",       "status": "critico", "observacao": "64,2% dos trabalhadores sem carteira — sem PCMSO, PPRA ou acesso a CEREST"},
    {"indicador": "Cobertura PCMSO nas empresas",          "valor": 22.4, "meta": 100.0, "unidade": "%",       "status": "critico", "observacao": "Apenas 22,4% das empresas com PCMSO (Programa de Controle Médico de Saúde Ocupacional)"},
    {"indicador": "Acidentes fatais / ano",                "valor": 2,    "meta": 0,     "unidade": "óbitos",  "status": "critico", "observacao": "2 óbitos em 2025 — 1 por intoxicação aguda (Paraquat) e 1 por acidente máquina agrícola"},
    {"indicador": "Distância ao CEREST de referência",     "valor": 284,  "meta": None,  "unidade": "km",      "status": "critico", "observacao": "Humaitá/AM — trabalhadores rurais intoxicados dependem de transporte de 284 km para atendimento especializado"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/setores-risco")
def setores_risco():
    return _SETORES_RISCO


@router.get("/intoxicacoes")
def intoxicacoes():
    return _INTOXICACOES_AGROTOXICOS


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
