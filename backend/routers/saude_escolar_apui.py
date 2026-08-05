from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-escolar-apui", tags=["saude_escolar_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "escolas_municipio_total": 28,
        "escolas_pse_parceiras": 18,
        "cobertura_escolas_pse_pct": 64.3,
        "meta_escolas_pct": 100.0,
        "alunos_total": 6848,
        "alunos_cobertos_pse": 4284,
        "cobertura_alunos_pct": 62.6,
        "avaliacao_antropometrica_pct": 58.4,
        "meta_antropometrica_pct": 80.0,
        "saude_bucal_escola_pct": 38.4,
        "meta_saude_bucal_pct": 70.0,
        "vacinacao_escola_pct": 72.4,
        "triagem_visual_pct": 28.4,
        "triagem_auditiva_pct": 22.4,
        "saude_mental_adolescente_pct": 18.4,
        "escolas_zona_rural_sem_pse": 8,
        "escolas_ribeirinhas_sem_pse": 4,
        "distorcao_idade_serie_pct": 38.4,
        "evasao_escolar_pct": 12.4,
        "maternidade_adolescente_pct": 18.2,
        "meta_gravidez_adol_pct": 10.0,
        "uso_drogas_triagem_pct": 8.4,
        "status_cobertura": "atencao",
        "status_bucal": "critico",
        "status_mental": "critico",
    }


@lru_cache(maxsize=1)
def _ACOES_PSE():
    return [
        {"acao": "Avaliação antropométrica",          "realizado_pct": 58.4, "meta_pct": 80.0, "alunos_beneficiados": 2502, "status": "atencao", "observacao": "Déficit nutricional detectado em 13,2% dos avaliados — desnutrição e excesso de peso coexistindo"},
        {"acao": "Saúde bucal (avaliação + flúor)",   "realizado_pct": 38.4, "meta_pct": 70.0, "alunos_beneficiados": 1645, "status": "critico", "observacao": "3 UBS sem ESB impossibilita ação nas escolas de suas áreas. CEO-d 4,2 em crianças de 5 anos"},
        {"acao": "Vacinação na escola",               "realizado_pct": 72.4, "meta_pct": 90.0, "alunos_beneficiados": 3102, "status": "atencao", "observacao": "HPV 53,3% — vacinação escolar é a principal estratégia de recuperação da cobertura"},
        {"acao": "Triagem visual",                    "realizado_pct": 28.4, "meta_pct": 70.0, "alunos_beneficiados": 1217, "status": "critico", "observacao": "71,6% sem triagem — distúrbio visual não corrigido é causa de fracasso escolar. Sem oftalmologista no município"},
        {"acao": "Triagem auditiva",                  "realizado_pct": 22.4, "meta_pct": 70.0, "alunos_beneficiados": 960,  "status": "critico", "observacao": "77,6% sem triagem — perda auditiva não diagnosticada afeta aprendizado de linguagem em crianças"},
        {"acao": "Saúde mental / prevenção violência","realizado_pct": 18.4, "meta_pct": 60.0, "alunos_beneficiados": 788,  "status": "critico", "observacao": "18,4% — uso de drogas, bullying e gravidez na adolescência exigem abordagem sistêmica. NASF sem psicólogo em 50% das equipes"},
        {"acao": "Prevenção de IST / DST",            "realizado_pct": 22.4, "meta_pct": 60.0, "alunos_beneficiados": 960,  "status": "critico", "observacao": "Gravidez na adolescência 18,2% (meta 10%) — educação sexual nas escolas é a intervenção mais custo-efetiva disponível"},
        {"acao": "Saúde ambiental / parasitoses",     "realizado_pct": 48.4, "meta_pct": 70.0, "alunos_beneficiados": 2074, "status": "atencao", "observacao": "Parasitoses intestinais endêmicas — água sem tratamento em escolas rurais e ribeirinhas. Desverminação semestral com cobertura de 48,4%"},
    ]


@lru_cache(maxsize=1)
def _ESCOLAS():
    return [
        {"localidade": "Sede urbana",          "escolas": 12, "pse_parceiras": 10, "cobertura_pct": 83.3, "alunos": 3840, "status": "atencao"},
        {"localidade": "Ramal do Acará",       "escolas": 4,  "pse_parceiras": 3,  "cobertura_pct": 75.0, "alunos": 1024, "status": "atencao"},
        {"localidade": "Vila do Juma",         "escolas": 3,  "pse_parceiras": 2,  "cobertura_pct": 66.7, "alunos": 684,  "status": "atencao"},
        {"localidade": "Zona rural / assentam.","escolas": 5,  "pse_parceiras": 2,  "cobertura_pct": 40.0, "alunos": 840,  "status": "critico"},
        {"localidade": "Área ribeirinha",      "escolas": 4,  "pse_parceiras": 1,  "cobertura_pct": 25.0, "alunos": 460,  "status": "critico"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "cobertura_escolas_pct": 50.0, "antrop_pct": 48.4, "bucal_pct": 28.4, "vacinacao_pct": 64.2, "gravidez_adol_pct": 20.4},
        {"ano": "2023", "cobertura_escolas_pct": 53.6, "antrop_pct": 52.4, "bucal_pct": 32.4, "vacinacao_pct": 66.8, "gravidez_adol_pct": 19.8},
        {"ano": "2024", "cobertura_escolas_pct": 57.1, "antrop_pct": 55.8, "bucal_pct": 35.4, "vacinacao_pct": 70.2, "gravidez_adol_pct": 18.8},
        {"ano": "2025", "cobertura_escolas_pct": 64.3, "antrop_pct": 58.4, "bucal_pct": 38.4, "vacinacao_pct": 72.4, "gravidez_adol_pct": 18.2},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Cobertura PSE (escolas)",          "valor": 64.3, "meta": 100.0,"unidade": "%",  "status": "atencao", "observacao": "10 escolas sem PSE — especialmente zona rural (60% descoberta) e ribeirinha (75% descoberta). Logística fluvial e distância são as barreiras. Alunos ribeirinhos têm as piores condições nutricionais e menor acesso a serviços"},
        {"indicador": "Saúde bucal na escola",            "valor": 38.4, "meta": 70.0, "unidade": "%",  "status": "critico", "observacao": "3 UBS sem ESB não realizam ação bucal escolar. CEO-d 4,2 (meta OMS 2,0) — escola é o único ponto de contato preventivo para muitas crianças ribeirinhas e rurais que não frequentam a UBS"},
        {"indicador": "Triagem visual escolar",           "valor": 28.4, "meta": 70.0, "unidade": "%",  "status": "critico", "observacao": "71,6% sem triagem — distúrbio visual não corrigido é a principal causa evitável de fracasso escolar. Sem oftalmologista no município: encaminhamento para Manaus (784 km). Distorção idade-série 38,4%"},
        {"indicador": "Gravidez na adolescência",         "valor": 18.2, "meta": 10.0, "unidade": "%",  "status": "critico", "observacao": "18,2% vs meta 10% — taxa estável desde 2022. Educação sexual com apenas 22,4% de cobertura nas escolas. Evasão escolar de gestantes adolescentes retroalimenta pobreza e vulnerabilidade"},
        {"indicador": "Saúde mental / prevenção drogas",  "valor": 18.4, "meta": 60.0, "unidade": "%",  "status": "critico", "observacao": "81,6% dos alunos sem abordagem de saúde mental. 8,4% com uso de drogas identificado em triagem. CAPS sem NASF psicólogo. O PSE é a única janela para saúde mental de adolescentes em comunidades ribeirinhas"},
        {"indicador": "Vacinação na escola (HPV/Meningo)","valor": 72.4, "meta": 90.0, "unidade": "%",  "status": "atencao", "observacao": "27,6% sem vacinação escolar — HPV 53,3% de cobertura geral. Campanha escolar é a estratégia mais eficaz para recuperação. Escolas ribeirinhas têm cobertura estimada < 40% por acesso irregular das equipes"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/acoes")
def acoes():
    return _ACOES_PSE


@router.get("/escolas")
def escolas():
    return _ESCOLAS


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
