from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-homem-apui", tags=["saude_homem_apui"])

_DASHBOARD = {
    "populacao_total": 24700,
    "populacao_masculina": 13200,
    "populacao_masculina_pct": 53.4,
    "cadastro_homem_esf_pct": 42.4,
    "meta_cadastro_pct": 75.0,
    "consulta_medica_12m_pct": 28.4,
    "meta_consulta_pct": 60.0,
    "hipertensao_masculina_pct": 42.4,
    "hipertensao_controlada_masculina_pct": 28.4,
    "diabetes_masculino_pct": 14.4,
    "cancer_prostata_rastreio_pct": 18.4,
    "cancer_prostata_casos_ano": 8,
    "cancer_prostata_estadio_avancado_pct": 72.4,
    "urologo_municipio": 0,
    "urologo_referencia": "Humaitá (284 km) ou Manaus (784 km)",
    "psa_disponivel_municipio": True,
    "psa_espera_dias": 14,
    "obito_masculino_prematuro_pct": 68.4,
    "mortalidade_cv_masculina_100k": 218,
    "mortalidade_cv_feminina_100k": 148,
    "homicidio_masculino_pct_total": 87.4,
    "suicidio_masculino_pct_total": 76.4,
    "alcool_uso_nocivo_masculino_pct": 38.4,
    "tabagismo_masculino_pct": 22.4,
    "saude_mental_busca_tratamento_masculino_pct": 18.4,
    "vasectomia_disponivel": False,
    "status_prevencao": "critico",
    "status_oncologia": "critico",
    "status_saude_mental": "critico",
}

_CONDICOES = [
    {"condicao": "Hipertensão arterial (HAS)",     "prevalencia_pct": 42.4, "controlada_pct": 28.4, "acompanhamento_pct": 52.4, "status": "critico",
     "observacao": "Homem hipertenso: 71,6% sem controle adequado vs 58,4% nas mulheres. Principal barreira: negação do diagnóstico + recusa de medicação por medo de 'fraqueza'. Anti-hipertensivos e disfunção erétil: mito amplificado, causa abandono em 28,4% dos casos masculinos. ACS femininas relatam dificuldade de agendar visita domiciliar para homem em idade ativa. Mortalidade por AVC hipertensivo: 68,4% masculina em Apuí"},
    {"condicao": "Diabetes mellitus (DM)",          "prevalencia_pct": 14.4, "controlada_pct": 34.2, "acompanhamento_pct": 48.4, "status": "critico",
     "observacao": "Homem diabético: HbA1c controlada em 34,2% vs 48,4% nas mulheres. Diagnóstico tardio: homem busca serviço de saúde 7,2 anos mais tarde em média. DM + HAS + tabagismo: síndrome cardiometabólica masculina em 28,4% dos homens > 40a. Amputação diabética: 9/12 casos anuais são masculinos. Neuropatia periférica + disfunção erétil: barreira adicional ao diagnóstico por vergonha"},
    {"condicao": "Câncer de próstata",              "prevalencia_pct": 0,    "controlada_pct": 0,    "acompanhamento_pct": 18.4, "status": "critico",
     "observacao": "8 casos/ano: 72,4% diagnosticados em estágio avançado (T3-T4 ou metastático). Rastreio com PSA: realizado em apenas 18,4% dos homens > 50a. Urologista: zero em Apuí — consulta apenas via TFD em Humaitá (284 km) com espera de 3-6 meses. Biópsia de próstata: Manaus (784 km). Tratamento cirúrgico: Hospital Adriano Jorge ou HUGV Manaus. PSA disponível: espera 14 dias — atraso no diagnóstico"},
    {"condicao": "Saúde mental masculina",          "prevalencia_pct": 28.4, "controlada_pct": 18.4, "acompanhamento_pct": 12.4, "status": "critico",
     "observacao": "Depressão masculina: subdiagnosticada — homem externaliza (agressividade, alcoolismo) vs internaliza (mulheres). Busca por CAPS: 81,6% menor que feminina. Suicídio: 76,4% dos óbitos são masculinos (16,2/100k geral, estimado 26,4/100k masculino). Álcool como automedicação: 38,4% de uso nocivo masculino. CAPS em Apuí: sem sala separada/horário estendido para homem trabalhador rural"},
    {"condicao": "Tabagismo",                       "prevalencia_pct": 22.4, "controlada_pct": 0,    "acompanhamento_pct": 28.4, "status": "atencao",
     "observacao": "22,4% dos homens fumantes vs 11,4% das mulheres. Programa de cessação tabágica: disponível na UBS com bupropiona + reposição nicotínica — adesão masculina 28,4% vs 48,4% feminina. Garimpo: tabagismo 38,4% (pressão social + estresse físico). DPOC: 71,6% sem diagnóstico = homem fumante de 50a com dispneia atribuída ao 'esforço' e não à doença"},
    {"condicao": "Uso nocivo de álcool",            "prevalencia_pct": 38.4, "controlada_pct": 0,    "acompanhamento_pct": 8.4,  "status": "critico",
     "observacao": "38,4% de uso nocivo masculino vs 12,4% feminino. AUDIT: aplicado em 18,4% das consultas masculinas. CAPS-AD: sem leito para desintoxicação em Apuí (referência: CAPS-AD Humaitá ou Manaus). Alcoolismo + violência doméstica: 68,4% dos casos de violência conjugal têm uso de álcool pelo agressor. Cirrose alcoólica: 8/28 casos de cirrose em Apuí são alcoólicos"},
]

_BARREIRAS = [
    {"barreira": "Negação do adoecimento (cultura de invulnerabilidade)", "impacto": "alto",
     "observacao": "Homem não vai ao médico porque 'médico é coisa de fraco'. Na Amazônia rural: agravar a condição + rezadeira/chá antes da UBS é padrão. Chegada ao serviço de saúde: urgência/emergência (72,4% das consultas masculinas são no HMM, não na UBS). Diagnóstico tardio como consequência direta: câncer de próstata estágio avançado, DM com complicações, HAS com AVC"},
    {"barreira": "Horário de funcionamento incompatível com trabalho rural", "impacto": "alto",
     "observacao": "UBS em Apuí: 7h-17h, de segunda a sexta. Trabalhador rural/garimpo: sai às 5h, retorna às 18h. Consulta = dia perdido de trabalho = perda de renda. Solução de baixo custo: 1 dia/semana de atendimento noturno (18h-21h) ou sábado matutino. Custo adicional: 4h de hora extra de 1 médico/semana = R$ 280/semana vs 68,4% dos homens sem acesso efetivo"},
    {"barreira": "Ausência de espaço acolhedor masculino na UBS",         "impacto": "medio",
     "observacao": "UBS decorada com cartazes de pré-natal e materno-infantil. Sala de espera com predominância feminina. Homem sente-se deslocado e não retorna. Saúde do Homem (PNAISH): política nacional desde 2008 mas sem implementação prática em Apuí. ACS masculinos: apenas 28,4% do total — dificuldade de abordagem de homens por agentes do sexo oposto"},
    {"barreira": "Estigma de saúde mental + alcoolismo",                  "impacto": "alto",
     "observacao": "Pedir ajuda psicológica = 'fraqueza' cultural amazônica rural. Depressão masculina: apresenta-se como irritabilidade, agressividade, alcoolismo — não como tristeza. Médico clínico não treinado para rastreio de depressão masculina (PHQ-9: aplicado em 8,4% das consultas). CAPS sem estratégia específica de captação masculina"},
]

_HISTORICO = [
    {"ano": "2022", "cadastro_pct": 34.2, "consulta_12m_pct": 22.4, "psa_rastreio_pct": 12.4, "obito_prematuro_pct": 72.4},
    {"ano": "2023", "cadastro_pct": 36.8, "consulta_12m_pct": 24.8, "psa_rastreio_pct": 14.8, "obito_prematuro_pct": 70.8},
    {"ano": "2024", "cadastro_pct": 39.4, "consulta_12m_pct": 26.4, "psa_rastreio_pct": 16.4, "obito_prematuro_pct": 69.2},
    {"ano": "2025", "cadastro_pct": 42.4, "consulta_12m_pct": 28.4, "psa_rastreio_pct": 18.4, "obito_prematuro_pct": 68.4},
]

_INDICADORES = [
    {"indicador": "Homem com consulta médica nos últimos 12m", "valor": 28.4, "meta": 60.0,  "unidade": "%",       "status": "critico", "observacao": "71,6% dos homens sem consulta no último ano. Óbito masculino prematuro (< 60a): 68,4% do total vs 48,4% nas mulheres. A maior parte é evitável: HAS não tratada, DM descompensado, câncer em estágio avançado. Estratégia Saúde do Homem com busca ativa no domicílio: aumenta consulta em 28 pontos em 12 meses"},
    {"indicador": "Câncer de próstata — diagnóstico precoce",  "valor": 18.4, "meta": 70.0,  "unidade": "%",       "status": "critico", "observacao": "81,6% dos casos diagnosticados em estágio avançado (irressecável ou metastático). PSA: disponível no laboratório municipal (espera 14 dias). Protocolo: PSA + toque retal > 50a ou > 45a com histórico familiar. Rastreio sistemático: reduziria mortalidade por câncer de próstata em 42% em 5 anos"},
    {"indicador": "Hipertensão masculina controlada",          "valor": 28.4, "meta": 60.0,  "unidade": "%",       "status": "critico", "observacao": "71,6% fora de controle. Diferença de controle homem/mulher: 28,4% vs 42,4% (14 pontos). AVC é a primeira causa de óbito masculino em Apuí: 84,2% atribuíveis à HAS não controlada. Anti-hipertensivos disponíveis na REMUME: captopril, losartana, hidroclorotiazida, anlodipino — problema não é insumo, é adesão masculina"},
    {"indicador": "Suicídio — proporção masculina",            "valor": 76.4, "meta": 50.0,  "unidade": "%",       "status": "critico", "observacao": "76,4% dos suicídios são masculinos. Taxa masculina estimada: 26,4/100k vs 6,2/100k feminina. Métodos: enforcamento (48,4%), arma de fogo (28,4%), intoxicação (18,4%). CAPS sem grupo terapêutico exclusivo para homens. Risco aumentado: isolamento rural + alcoolismo + garimpo irregular + perda econômica"},
    {"indicador": "Uso nocivo de álcool — rastreio (AUDIT)",  "valor": 18.4, "meta": 80.0,  "unidade": "%",       "status": "critico", "observacao": "81,6% das consultas masculinas sem rastreio de álcool. AUDIT-C: 3 perguntas, 1 minuto. Custo: R$ 0. Intervenção breve no consultório: reduz uso nocivo em 28% em 6 meses. CAPS-AD: sem leito para desintoxicação — internação compulsória = TFD para Manaus (784 km)"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/condicoes")
def condicoes():
    return _CONDICOES


@router.get("/barreiras")
def barreiras():
    return _BARREIRAS


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
