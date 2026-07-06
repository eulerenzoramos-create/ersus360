from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-idoso-apui", tags=["saude_idoso_apui"])

_DASHBOARD = {
    "populacao_60_mais": 2470,
    "pct_populacao_60_mais": 10.0,
    "populacao_80_mais": 420,
    "caderneta_idoso_preenchida_pct": 42.4,
    "meta_caderneta_pct": 100.0,
    "avaliacao_funcional_pct": 28.4,
    "meta_avaliacao_pct": 80.0,
    "demencia_rastreada_pct": 18.4,
    "meta_demencia_rastreio_pct": 70.0,
    "demencia_diagnosticada_estimada": 148,
    "demencia_acompanhada_caps_aps": 28,
    "quedas_com_lesao_ano": 84,
    "fratura_quadril_ano": 8,
    "polifarmacia_5_mais_pct": 38.4,
    "polif_revisao_sistematica_pct": 12.4,
    "ilpi_municipio": 0,
    "fragilidade_moderada_grave_pct": 22.4,
    "depressao_idoso_pct": 18.4,
    "incontinencia_urinaria_tratada_pct": 8.4,
    "geriatras_municipio": 0,
    "influenza_idosos_pct": 72.4,
    "meta_influenza_idosos_pct": 90.0,
    "pneumococica_idosos_pct": 48.4,
    "meta_pneumococica_pct": 85.0,
    "status_funcional": "critico",
    "status_demencia": "critico",
    "status_quedas": "critico",
}

_CONDICOES_IDOSO = [
    {"condicao": "Hipertensão arterial (HAS)",        "prevalencia_pct": 68.4, "controlados_pct": 38.4, "meta_controle_pct": 70.0,  "status": "critico", "observacao": "68,4% dos idosos hipertensos — HAS não controlada em 61,6% é a principal causa de AVC, IC e DRC na faixa etária. Polifarmácia aumenta risco de interação e não-adesão. Medição PA domiciliar não sistematizada"},
    {"condicao": "Diabetes mellitus (DM)",             "prevalencia_pct": 28.4, "controlados_pct": 38.4, "meta_controle_pct": 60.0,  "status": "critico", "observacao": "Complicações: 4 amputações/ano, cegueira por retinopatia, DRC avançada. Hipoglicemia em idoso é emergência frequente — insulina sem ajuste de dose para função renal reduzida"},
    {"condicao": "Demência (todas as causas)",         "prevalencia_pct": 6.0,  "controlados_pct": None, "meta_controle_pct": None,  "status": "critico", "observacao": "~148 idosos com demência estimada — apenas 28 diagnosticados e acompanhados. Sem geriatra e sem neuropsicólogo: diagnóstico tardio, em fase de dependência grave. Cuidador informal (familiar) sem suporte ou capacitação"},
    {"condicao": "Depressão / ansiedade em idosos",    "prevalencia_pct": 18.4, "controlados_pct": 38.4, "meta_controle_pct": 60.0,  "status": "critico", "observacao": "Depressão em idoso subdiagnosticada — confundida com 'frescura' ou 'coisa da idade'. Antidepressivos prescritos sem psicoterapia. Isolamento social de idoso ribeirinho é determinante não reconhecido"},
    {"condicao": "Osteoporose / sarcopenia",           "prevalencia_pct": 22.4, "controlados_pct": 18.4, "meta_controle_pct": 50.0,  "status": "critico", "observacao": "Densitometria não disponível no município — sem diagnóstico, sem profilaxia de fratura. 8 fraturas de quadril/ano: cirurgia em Humaitá/Manaus, mortalidade pós-cirúrgica 18% em 1 ano em idosos frágeis"},
    {"condicao": "Polifarmácia (≥ 5 medicamentos)",    "prevalencia_pct": 38.4, "controlados_pct": 12.4, "meta_controle_pct": 80.0,  "status": "critico", "observacao": "38,4% em polifarmácia sem revisão sistematizada. Interações medicamentosas causa quedas, confusão mental e hospitalização evitável. Farmacêutico clínico inexistente — revisão depende de médico sobrecarregado"},
]

_QUEDAS = [
    {"categoria": "Queda sem lesão",          "casos_ano": 168, "hospitalizacoes": 0,  "obitos": 0, "custo_estimado_R": 0,     "observacao": "Subnotificação alta — ACS registra apenas quedas com lesão"},
    {"categoria": "Queda com lesão leve",     "casos_ano": 56,  "hospitalizacoes": 0,  "obitos": 0, "custo_estimado_R": 8400,  "observacao": "Escoriações, contusões — tratamento na UBS"},
    {"categoria": "Queda com fratura (exceto quadril)", "casos_ano": 20, "hospitalizacoes": 20, "obitos": 0, "custo_estimado_R": 84000, "observacao": "Fraturas de punho, vértebra, úmero — imobilização em Apuí, cirurgia em Humaitá/Manaus"},
    {"categoria": "Fratura de quadril",       "casos_ano": 8,   "hospitalizacoes": 8,  "obitos": 1, "custo_estimado_R": 120000,"observacao": "Mortalidade 18% em 1 ano. Cirurgia em Manaus (784 km). Sem fisioterapia pós-operatória no retorno: dependência permanente"},
]

_HISTORICO = [
    {"ano": "2022", "avaliacao_func_pct": 18.4, "demencia_diag": 12, "quedas_lesao": 96, "influenza_pct": 64.2, "polifarmacia_pct": 42.4},
    {"ano": "2023", "avaliacao_func_pct": 21.4, "demencia_diag": 16, "quedas_lesao": 91, "influenza_pct": 66.8, "polifarmacia_pct": 40.8},
    {"ano": "2024", "avaliacao_func_pct": 24.8, "demencia_diag": 22, "quedas_lesao": 88, "influenza_pct": 69.4, "polifarmacia_pct": 39.4},
    {"ano": "2025", "avaliacao_func_pct": 28.4, "demencia_diag": 28, "quedas_lesao": 84, "influenza_pct": 72.4, "polifarmacia_pct": 38.4},
]

_INDICADORES = [
    {"indicador": "Avaliação funcional do idoso (VGI)", "valor": 28.4, "meta": 80.0, "unidade": "%", "status": "critico", "observacao": "71,6% sem avaliação funcional sistematizada (VGI). Idoso frágil não identificado até a queda ou internação. IVCF-20 pode ser aplicado pelo ACS em 10 minutos — capacitação inexistente. Rastreio precoce evita institucionalização"},
    {"indicador": "Demência diagnosticada",              "valor": 18.9, "meta": 70.0, "unidade": "% est.",  "status": "critico", "observacao": "28/148 estimados diagnosticados — 81,1% sem diagnóstico. Sem geriatra, sem neuropsicólogo. MEEM pode ser aplicado na APS mas não está no fluxo. Cuidador informal sem capacitação = violência doméstica ao idoso por exaustão"},
    {"indicador": "Quedas com lesão / ano",              "valor": 84,   "meta": 0,    "unidade": "casos",   "status": "critico", "observacao": "84 quedas com lesão = 8 fraturas de quadril/ano. Fisioterapia preventiva inexistente. Adaptação domiciliar (corrimão, tapete antiderrapante) não é ação programática do ACS. R$ 120k em fratura de quadril vs R$ 8k em prevenção sistematizada"},
    {"indicador": "Polifarmácia revisada",               "valor": 12.4, "meta": 80.0, "unidade": "%",       "status": "critico", "observacao": "87,6% dos idosos em polifarmácia sem revisão. Critérios de Beers (medicamentos inadequados para idosos): prescrições detectáveis na APS mas sem protocolo de revisão. Benzodiazepínico em idoso = queda; AINE = sangramento; digitálico sem ajuste = intoxicação"},
    {"indicador": "Influenza idosos",                    "valor": 72.4, "meta": 90.0, "unidade": "%",       "status": "atencao", "observacao": "27,6% dos idosos sem vacinação anual. Idoso ribeirinho sem transporte regular = campanha de vacinação domiciliar pelo ACS necessária mas não sistematizada. Internação por influenza em idoso frágil = descompensação em cascata"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/condicoes")
def condicoes():
    return _CONDICOES_IDOSO


@router.get("/quedas")
def quedas():
    return _QUEDAS


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
