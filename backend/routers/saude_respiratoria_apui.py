from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-respiratoria-apui", tags=["saude_respiratoria_apui"])

_DASHBOARD = {
    "asma_prevalencia_estimada_pct": 8.4,
    "asma_casos_estimados": 2075,
    "asma_controlada_pct": 38.4,
    "meta_asma_controlada_pct": 70.0,
    "dpoc_prevalencia_estimada_pct": 4.2,
    "dpoc_casos_estimados": 1038,
    "dpoc_diagnosticada_pct": 28.4,
    "espirometria_municipio": False,
    "espirometria_referencia": "HEMOAM/HUGV Manaus (784 km)",
    "pneumonia_internacoes_ano": 148,
    "pneumonia_mortalidade_hospitalar_pct": 8.4,
    "influenza_cobertura_vacinal_pct": 64.2,
    "meta_influenza_pct": 90.0,
    "broncodilatador_disponibilidade_ubs_pct": 72.4,
    "corticoide_inalatorio_disponibilidade_pct": 48.4,
    "oxigenio_hospitalar_interrupção_horas_ano": 72,
    "nebulizador_ubs_funcionando_pct": 62.5,
    "silicose_casos_suspeitos": 8,
    "tuberculose_incidencia_100k": 89.0,
    "covid_sequelas_acompanhadas": 28,
    "status_asma": "critico",
    "status_dpoc": "critico",
    "status_pneumonia": "atencao",
}

_CONDICOES = [
    {"condicao": "Asma (adultos e crianças)",         "prevalencia_estimada": 2075, "controlada_pct": 38.4, "hospitalizacoes_ano": 48,  "status": "critico", "observacao": "Asma é a doença respiratória crônica mais prevalente. 61,6% sem controle adequado: nebulizações na UPA ao invés de uso regular de corticoide inalatório. Corticoide inalatório: disponível em 48,4% das UBS — desabastecimento médio 42 dias/ano. Custo de 1 hospitalização por asma = custo de 18 meses de tratamento preventivo"},
    {"condicao": "DPOC (adultos > 40 anos)",           "prevalencia_estimada": 1038, "controlada_pct": 22.4, "hospitalizacoes_ano": 38,  "status": "critico", "observacao": "71,6% sem diagnóstico — espirometria inexistente em Apuí. Diagnóstico clínico em 28,4%: sem espirometria, estadiamento impossível. DPOC diagnosticada tardiamente (GOLD 3-4) em 72,4% dos casos. Fumantes: 18,4% da população adulta. Exposição à fumaça de lenha em 42,4% dos domicílios rurais"},
    {"condicao": "Pneumonia (todas as faixas etárias)","prevalencia_estimada": 0,    "controlada_pct": 0,    "hospitalizacoes_ano": 148, "status": "atencao", "observacao": "148 internações/ano — 18,4% crianças < 5 anos, 28,4% idosos > 60 anos. Mortalidade hospitalar 8,4% (meta < 5%). Pneumococo vacina: 72,4% de cobertura em < 2 anos (abaixo da meta 95%). Pneumonia grave sem UTI = transfer para Humaitá/Manaus com risco elevado no trajeto"},
    {"condicao": "Influenza e Síndrome Gripal",        "prevalencia_estimada": 0,    "controlada_pct": 0,    "hospitalizacoes_ano": 28,  "status": "atencao", "observacao": "Cobertura vacinal 64,2% vs meta 90%. Surto de síndrome gripal em 2025: 648 casos, 2 óbitos suspeitos. Tamiflu: disponível apenas no HMM (não nas UBS). SRAG graves: transfer para UTI em Manaus — 784 km sem UTI no trajeto"},
    {"condicao": "Silicose (garimpo/mineração)",       "prevalencia_estimada": 48,   "controlada_pct": 0,    "hospitalizacoes_ano": 2,   "status": "critico", "observacao": "8 casos suspeitos sem confirmação por falta de espirometria e radiografia de tórax interpretada por especialista. Garimpeiros com exposição a sílica por anos: silicose simples evolui para fibrose maciça progressiva. Doença ocupacional não registrada — garimpo ilegal sem nexo trabalhista"},
    {"condicao": "COVID-19 — sequelas (Long COVID)",   "prevalencia_estimada": 84,   "controlada_pct": 0,    "hospitalizacoes_ano": 4,   "status": "atencao", "observacao": "28 casos acompanhados — estimativa real 84+. Dispneia crônica, fadiga e névoa cognitiva pós-COVID em adultos ativos. Reabilitação pulmonar: inexistente em Apuí (zero fisioterapeuta respiratório). Retorno ao trabalho comprometido: impacto econômico não quantificado"},
]

_INTERVENCOES = [
    {"intervencao": "Corticoide inalatório (DPOC/asma)", "cobertura_pct": 48.4, "meta_pct": 90.0, "status": "critico",  "observacao": "Desabastecimento médio 42 dias/ano. Paciente sem corticoide = 3-5 nebulizações/mês na UPA vs custo 10x menor do preventivo. Licitação: especificação sem critério amazônico de entrega"},
    {"intervencao": "Broncodilatador de curta ação",     "cobertura_pct": 72.4, "meta_pct": 90.0, "status": "atencao",  "observacao": "Salbutamol disponível em 72,4% das UBS. Nebulizador funcionando: 62,5% (5/8 UBS). Nebulizador com peças defeituosas sem manutenção: paciente asmático na crise não consegue nebulização na UBS mais próxima"},
    {"intervencao": "Vacinação Influenza",                "cobertura_pct": 64.2, "meta_pct": 90.0, "status": "critico",  "observacao": "Meta não atingida por 4 anos consecutivos. Campanha de vacinação: 1 dia/UBS em área ribeirinha. Idosos e gestantes: grupos prioritários com menor acesso. Estratégia outreach fluvial para ribeirinhos aumentaria cobertura em 15-20 pontos percentuais"},
    {"intervencao": "Vacinação Pneumococo (< 2 anos)",   "cobertura_pct": 72.4, "meta_pct": 95.0, "status": "atencao",  "observacao": "Pneumo 13: 72,4% em < 2 anos. Perda de oportunidade vacinal na maternidade: protocolos de alta sem checagem de calendário vacinal. 2.700 crianças < 2 anos em Apuí — 756 sem imunização completa"},
    {"intervencao": "Espirometria diagnóstica",           "cobertura_pct": 0.0,  "meta_pct": 100.0,"status": "critico",  "observacao": "Zero espirometria disponível no município. DPOC e asma: diagnóstico clínico sem estadiamento. Espirômetro de bancada: R$ 12.000 + treinamento = viável. Sem espirometria: 71,6% do DPOC não diagnosticado, tratamento empírico sem estadiamento funcional"},
]

_HISTORICO = [
    {"ano": "2022", "asma_controlada_pct": 28.4, "pneumonia_intern": 162, "influenza_vacinal_pct": 58.4, "dpoc_diagnosticada_pct": 18.4},
    {"ano": "2023", "asma_controlada_pct": 31.4, "pneumonia_intern": 156, "influenza_vacinal_pct": 60.4, "dpoc_diagnosticada_pct": 22.4},
    {"ano": "2024", "asma_controlada_pct": 35.4, "pneumonia_intern": 152, "influenza_vacinal_pct": 62.4, "dpoc_diagnosticada_pct": 25.8},
    {"ano": "2025", "asma_controlada_pct": 38.4, "pneumonia_intern": 148, "influenza_vacinal_pct": 64.2, "dpoc_diagnosticada_pct": 28.4},
]

_INDICADORES = [
    {"indicador": "Asma controlada",                "valor": 38.4, "meta": 70.0,  "unidade": "%",       "status": "critico", "observacao": "61,6% dos asmáticos sem controle. Corticoide inalatório ausente 42 dias/ano = paciente usa apenas broncodilatador de resgate = asma nunca controlada. Custo de 1 hospitalização por crise asmática: R$ 1.872 (6 dias HMM) vs R$ 28/mês de beclometasona preventiva. ROI de 66:1 no tratamento preventivo"},
    {"indicador": "DPOC diagnosticada",             "valor": 28.4, "meta": 80.0,  "unidade": "%",       "status": "critico", "observacao": "71,6% sem diagnóstico. Sem espirometria = diagnóstico clínico tardio na fase avançada. DPOC oculto é a maior causa de hospitalizações respiratórias evitáveis. Fumaça de lenha em 42,4% dos domicílios rurais: fator de risco não abordado em consulta de APS"},
    {"indicador": "Cobertura vacinal Influenza",    "valor": 64.2, "meta": 90.0,  "unidade": "%",       "status": "critico", "observacao": "25,8 pontos abaixo da meta. 4 anos consecutivos sem atingir meta. Estratégia atual: campanha pontual em sede urbana. Ribeirinha e ramal: sem estratégia adaptada. Idoso > 60 anos: grupo de maior risco com menor cobertura (58,4%)"},
    {"indicador": "Mortalidade hospitalar pneumonia","valor": 8.4,  "meta": 5.0,   "unidade": "%",       "status": "atencao", "observacao": "8,4% vs meta 5%. Sem UTI: pneumonia grave = transfer para Humaitá/Manaus. Mortalidade no trajeto não contabilizada. Oxigênio hospitalar: 72h de interrupção/ano por falha de suprimento. Paciente em sepse respiratória sem O2 = óbito evitável"},
    {"indicador": "Espirometria disponível",        "valor": 0,    "meta": 1,     "unidade": "serviço", "status": "critico", "observacao": "Zero espirometria. Investimento para solucionar: R$ 12.000 em equipamento + R$ 4.000 em treinamento = R$ 16.000. Impacto: 1.038 DPOC estimados + 2.075 asmáticos com diagnóstico correto e estadiamento funcional. Custo de não fazer: hospitalização desnecessária de 38-48 casos/ano"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/condicoes")
def condicoes():
    return _CONDICOES


@router.get("/intervencoes")
def intervencoes():
    return _INTERVENCOES


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
