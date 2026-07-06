from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-ambiental-apui", tags=["saude_ambiental_apui"])

_DASHBOARD = {
    "agua_tratada_urbana_pct": 68.4,
    "agua_tratada_rural_pct": 0.0,
    "agua_tratada_ribeirinha_pct": 0.0,
    "esgotamento_sanitario_pct": 22.4,
    "meta_esgotamento_pct": 60.0,
    "residuos_coleta_urbana_pct": 84.2,
    "residuos_coleta_rural_pct": 0.0,
    "lixao_ativo": True,
    "aterro_sanitario": False,
    "fluoretacao_agua_pct": 48.4,
    "diarreias_por_agua_casos_ano": 284,
    "intoxicacoes_agrotoxico_ano": 12,
    "queimadas_exposicao_domicilios": 3840,
    "mercurio_garimpo_casos_suspeitos_ano": 18,
    "pocos_monitorados_vigilancia_pct": 28.4,
    "meta_pocos_pct": 80.0,
    "comunidades_sem_agua_tratada": 28,
    "populacao_sem_agua_tratada": 12800,
    "culex_indice_larval_pct": 4.8,
    "meta_culex_pct": 1.0,
    "status_agua": "critico",
    "status_esgoto": "critico",
    "status_residuos": "atencao",
}

_SANEAMENTO_LOCAL = [
    {"localidade": "Sede urbana (Apuí)",      "agua_tratada_pct": 68.4, "esgoto_pct": 28.4, "coleta_residuos_pct": 84.2, "status": "atencao"},
    {"localidade": "Ramal do Acará",          "agua_tratada_pct": 0.0,  "esgoto_pct": 0.0,  "coleta_residuos_pct": 0.0,  "status": "critico"},
    {"localidade": "Vila do Juma",            "agua_tratada_pct": 4.2,  "esgoto_pct": 0.0,  "coleta_residuos_pct": 0.0,  "status": "critico"},
    {"localidade": "Zona rural / assentam.",  "agua_tratada_pct": 0.0,  "esgoto_pct": 0.0,  "coleta_residuos_pct": 0.0,  "status": "critico"},
    {"localidade": "Área ribeirinha (rios)",  "agua_tratada_pct": 0.0,  "esgoto_pct": 0.0,  "coleta_residuos_pct": 0.0,  "status": "critico"},
    {"localidade": "Zona de garimpo",         "agua_tratada_pct": 0.0,  "esgoto_pct": 0.0,  "coleta_residuos_pct": 0.0,  "status": "critico"},
]

_RISCOS_AMBIENTAIS = [
    {"risco": "Mercúrio (garimpo ilegal)",       "afetados_estimados": 3200, "casos_suspeitos_ano": 18, "monitoramento": "ausente", "status": "critico", "descricao": "Garimpo ilegal nas cabeceiras do Juma e Acará — contaminação por mercúrio inorgânico e metilmercúrio via peixes (principal fonte proteica ribeirinha). Neurológico em crianças e adultos. ZERO monitoramento laboratorial no município"},
    {"risco": "Queimadas / fumaça sazonal",      "afetados_estimados": 18400, "casos_suspeitos_ano": 284,"monitoramento": "parcial", "status": "critico", "descricao": "Queimadas mai-out causam poluição severa — PM2,5 acima do limite WHO por 3-4 meses/ano. Internações por doença respiratória aumentam 38% no período. Crianças < 5a e idosos são os mais vulneráveis"},
    {"risco": "Agrotóxicos (assentamentos)",     "afetados_estimados": 4800, "casos_suspeitos_ano": 12,  "monitoramento": "ausente", "status": "critico", "descricao": "12 intoxicações/ano registradas — subnotificação estimada de 70%. Soja, milho e cacau nos assentamentos com uso de organofosforados. Nenhum agricultor recebe EPIs ou orientação técnica pela SMS"},
    {"risco": "Água sem tratamento (rural)",     "afetados_estimados": 12800,"casos_suspeitos_ano": 284, "monitoramento": "ausente", "status": "critico", "descricao": "100% das comunidades ribeirinhas sem água tratada — consumo direto de rios com coliformes fecais. 284 casos de diarreia/ano diretamente atribuídos. Diarreia é a 3ª causa de internação em menores de 5a"},
    {"risco": "Lixão a céu aberto (sede)",       "afetados_estimados": 8400, "casos_suspeitos_ano": 0,   "monitoramento": "ausente", "status": "critico", "descricao": "Lixão ativo sem impermeabilização — chorume contamina lençol freático da área periurbana. Catadores sem EPI, queima a céu aberto em período seco. Aterro sanitário não previsto no PMS"},
]

_HISTORICO = [
    {"ano": "2022", "agua_tratada_urbana_pct": 58.4, "esgoto_pct": 18.4, "diarreias": 312, "intox_agrotoxico": 8,  "queimadas_ha": 84200},
    {"ano": "2023", "agua_tratada_urbana_pct": 62.4, "esgoto_pct": 20.2, "diarreias": 298, "intox_agrotoxico": 10, "queimadas_ha": 112800},
    {"ano": "2024", "agua_tratada_urbana_pct": 65.8, "esgoto_pct": 21.4, "diarreias": 288, "intox_agrotoxico": 11, "queimadas_ha": 98400},
    {"ano": "2025", "agua_tratada_urbana_pct": 68.4, "esgoto_pct": 22.4, "diarreias": 284, "intox_agrotoxico": 12, "queimadas_ha": 124600},
]

_INDICADORES = [
    {"indicador": "Água tratada — área rural/ribeirinha",  "valor": 0.0,  "meta": 80.0, "unidade": "%",      "status": "critico", "observacao": "Zero cobertura nas 28 comunidades ribeirinhas e zona rural — 12.800 pessoas consumindo água sem tratamento. Diretamente ligado à malária (larvas no ambiente), diarreia e contaminação por mercúrio"},
    {"indicador": "Esgotamento sanitário",                 "valor": 22.4, "meta": 60.0, "unidade": "%",      "status": "critico", "observacao": "77,6% sem coleta de esgoto — fossas rudimentares e lançamento in natura em igarapés. Ciclo fecal-oral alimenta leptospirose, hepatite A e parasitoses intestinais. Sem previsão de expansão da rede"},
    {"indicador": "Mercúrio — monitoramento laboratorial", "valor": 0.0,  "meta": 100.0,"unidade": "%",      "status": "critico", "observacao": "Zero monitoramento de mercúrio — garimpo ilegal nas bacias do Juma e Acará. Biomagnificação via peixe (tucunaré, dourada). Toxicidade neurológica irreversível. LACEN/AM realiza dosagem, mas não há fluxo estabelecido"},
    {"indicador": "Lixão — aterro sanitário",              "valor": 0.0,  "meta": 1.0,  "unidade": "unidade","status": "critico", "observacao": "Lixão ativo sem licença ambiental. Lei 12.305/10 (PNRS) exigiu encerramento de lixões até 2014 — Apuí está em não conformidade legal há > 10 anos. Consórcio intermunicipal com Manicoré seria a solução viável"},
    {"indicador": "Vigilância de poços e fontes",          "valor": 28.4, "meta": 80.0, "unidade": "%",      "status": "critico", "observacao": "71,6% dos poços e fontes sem monitoramento de qualidade. VIGIAGUA prevê coleta mensal — não executada por falta de kit e RH. Comunidades assentadas usam poços artesianos sem qualquer análise"},
    {"indicador": "Intoxicações por agrotóxico",           "valor": 12,   "meta": None, "unidade": "casos/a","status": "critico", "observacao": "12 casos notificados — subnotificação de 70% estimada. Organofosforados e piretroides são os mais usados nos assentamentos. Ausência de vigilância em saúde do trabalhador rural. CEREST referência em Humaitá (280 km)"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/saneamento")
def saneamento():
    return _SANEAMENTO_LOCAL


@router.get("/riscos")
def riscos():
    return _RISCOS_AMBIENTAIS


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
