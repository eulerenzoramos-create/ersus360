from fastapi import APIRouter
from functools import lru_cache
router = APIRouter(prefix="/api/suas-sus-apui", tags=["Interface SUAS/SUS Apuí"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "familias_cras_referenciadas": 2840,
        "familias_vulnerabilidade_extrema": 684,
        "beneficiarios_bpc_saude": 184,
        "beneficiarios_bolsa_familia_com_condicionalidades": 1248,
        "condicionalidades_saude_cumpridas_pct": 82.4,
        "casos_interface_suas_sus_abertos": 124,
        "casos_interface_encerrados_mes": 38,
        "criancas_acompanhamento_conjunto": 284,
        "idosos_vulneraveis_acompanhamento": 148,
        "violencia_casos_referidos_creas": 42,
        "reunioes_intersetoriais_2025": 6,
        "protocolos_interface_vigentes": 3,
        "status_condicionalidades": "atencao",
        "status_casos_interface": "atencao",
        "status_bpc": "ok",
    }


@lru_cache(maxsize=1)
def _CONDICIONALIDADES():
    return [
        {"acao": "Acompanhamento Pré-natal (≥6 consultas)",  "meta_beneficiarias": 148, "acompanhadas": 122, "cumprimento_pct": 82.4, "status": "atencao", "pendencias": "26 gestantes sem 3ª consulta registrada — 18 são ribeirinhas com acesso irregular à UBS"},
        {"acao": "Vacinação em Dia (0-7 anos)",               "meta_beneficiarios": 384, "acompanhados": 348, "cumprimento_pct": 90.6, "status": "ok",      "pendencias": "36 crianças com cartão desatualizado — maior parte em garimpo e comunidades rurais"},
        {"acao": "Vigilância Nutricional SISVAN",             "meta_beneficiarios": 624, "acompanhados": 484, "cumprimento_pct": 77.6, "status": "atencao", "pendencias": "140 crianças <5a não acompanhadas — dificuldade de acesso e inconsistência no SISVAN"},
        {"acao": "Frequência Escolar (6-15 anos)",            "meta_beneficiarios": 528, "acompanhados": 496, "cumprimento_pct": 94.0, "status": "ok",      "pendencias": "32 crianças em descumprimento — trabalho infantil em garimpo (19 casos)"},
    ]


@lru_cache(maxsize=1)
def _BPC_SAUDE():
    return [
        {"categoria": "Pessoa com Deficiência — 0 a 14 anos",  "beneficiarios": 48,  "acompanhamento_saude": "UBS + NASF-AB", "requerimentos_pendentes": 12, "media_renda_pc": "R$ 184"},
        {"categoria": "Pessoa com Deficiência — 15 a 59 anos", "beneficiarios": 84,  "acompanhamento_saude": "UBS + CAPS",    "requerimentos_pendentes": 18, "media_renda_pc": "R$ 176"},
        {"categoria": "Pessoa com Deficiência — 60+ anos",     "beneficiarios": 28,  "acompanhamento_saude": "UBS + Domiciliar","requerimentos_pendentes": 4, "media_renda_pc": "R$ 168"},
        {"categoria": "Idoso — 65+ anos em vulnerabilidade",   "beneficiarios": 24,  "acompanhamento_saude": "UBS + Domiciliar","requerimentos_pendentes": 8, "media_renda_pc": "R$ 162"},
    ]


@lru_cache(maxsize=1)
def _CASOS_INTERFACE():
    return [
        {"tipo": "Criança em situação de risco + saúde mental", "abertos": 28, "encerrados_mes": 8, "equipes": "CRAS + CAPS Infanto + UBS", "prioridade": "alta"},
        {"tipo": "Idoso em abandono familiar + doenças crônicas","abertos": 22, "encerrados_mes": 7, "equipes": "CREAS + UBS + SAD",        "prioridade": "alta"},
        {"tipo": "Mulher em situação de violência + saúde",     "abertos": 18, "encerrados_mes": 6, "equipes": "CREAS + UPA + UBS",         "prioridade": "alta"},
        {"tipo": "PCD aguardando BPC + reabilitação",           "abertos": 24, "encerrados_mes": 9, "equipes": "CRAS + UBS + INSS",         "prioridade": "media"},
        {"tipo": "Gestante em vulnerabilidade social",          "abertos": 16, "encerrados_mes": 5, "equipes": "CRAS + UBS + Maternidade",  "prioridade": "alta"},
        {"tipo": "Usuário de drogas — abordagem intersetorial", "abertos": 16, "encerrados_mes": 3, "equipes": "CREAS + CAPS AD + SUAS",    "prioridade": "media"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "familias_cras": 2480, "condicionalidades_pct": 74.2, "bpc_beneficiarios": 148, "casos_interface": 88,  "reunioes": 4},
        {"ano": "2023", "familias_cras": 2640, "condicionalidades_pct": 78.4, "bpc_beneficiarios": 162, "casos_interface": 104, "reunioes": 5},
        {"ano": "2024", "familias_cras": 2748, "condicionalidades_pct": 80.4, "bpc_beneficiarios": 174, "casos_interface": 116, "reunioes": 6},
        {"ano": "2025", "familias_cras": 2840, "condicionalidades_pct": 82.4, "bpc_beneficiarios": 184, "casos_interface": 124, "reunioes": 6},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Condicionalidades Saúde Cumpridas",   "valor": "82,4%", "meta": "≥ 90%", "status": "atencao", "observacao": "17,6% das famílias com Bolsa Família em descumprimento de condicionalidade de saúde — pré-natal, vacinação ou SISVAN. Principal barreira: acesso à UBS em área ribeirinha e rural"},
        {"indicador": "Cobertura BPC com Acompanhamento",    "valor": "91,3%", "meta": "≥ 95%", "status": "atencao", "observacao": "16 beneficiários sem acompanhamento regular de saúde — maioria com 80+ anos ou deficiência severa sem cuidador formal"},
        {"indicador": "Casos Interface SUAS/SUS Encerrados", "valor": "30,6%", "meta": "≥ 50%", "status": "atencao", "observacao": "Resolutividade baixa: fluxo intersetorial informal, sem protocolo formalizado. CRAS e UBS operam em turnos diferentes e sem reunião de caso regular"},
        {"indicador": "Reuniões Intersetoriais",             "valor": "6/ano", "meta": "≥ 12",   "status": "atencao", "observacao": "Apenas 6 reuniões anuais — uma por bimestre. Câmara técnica SUAS/SUS não institucionalizada. Gestão compartilhada depende de relação pessoal entre coordenadores"},
        {"indicador": "Protocolos Interface Vigentes",       "valor": "3",     "meta": "≥ 8",    "status": "critico", "observacao": "Somente 3 protocolos formalizados (violência, saúde mental, BPC). Ausência de fluxos para: gestante em vulnerabilidade, criança em risco, idoso em abandono, usuário de drogas"},
    ]


@router.get("/dashboard")
def dashboard(): return _DASHBOARD

@router.get("/condicionalidades")
def condicionalidades(): return _CONDICIONALIDADES

@router.get("/bpc-saude")
def bpc_saude(): return _BPC_SAUDE

@router.get("/casos-interface")
def casos_interface(): return _CASOS_INTERFACE

@router.get("/historico")
def historico(): return _HISTORICO

@router.get("/indicadores")
def indicadores(): return _INDICADORES
