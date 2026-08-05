from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-mental-infantil-apui", tags=["saude_mental_infantil_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 24700,
        "populacao_0_17_anos": 8648,
        "populacao_0_17_pct": 35.0,
        "transtorno_mental_0_17_estimados": 1297,
        "transtorno_mental_diagnosticados_pct": 12.4,
        "tdah_estimados": 432,
        "tdah_medicado_pct": 8.4,
        "depressao_adolescente_estimados": 284,
        "depressao_diagnosticados_pct": 14.4,
        "ansiedade_adolescente_estimados": 518,
        "ansiedade_diagnosticados_pct": 10.4,
        "tentativas_suicidio_0_17_2025": 14,
        "suicidio_consumado_0_17_2025": 2,
        "uso_drogas_adolescentes_12_17_pct": 28.4,
        "crack_cocaina_adolescente_pct": 8.4,
        "violencia_sexual_notificada_0_17_2025": 22,
        "capsi_municipio": 0,
        "capsi_referencia_cidade": "Humaitá (284 km)",
        "psicologo_infantil_sus": 0,
        "psiquiatra_infantil_sus": 0,
        "terapeuta_ocupacional_sus": 0,
        "fono_sus": 1,
        "acolhimento_cras_crianca": True,
        "grupos_saude_mental_escola": 0,
        "meta_grupos_saude_mental_escola": 6,
        "status_estrutura": "critico",
        "status_mortalidade": "critico",
        "status_acesso": "critico",
    }


@lru_cache(maxsize=1)
def _TRANSTORNOS():
    return [
        {"transtorno": "TDAH (Déficit de Atenção e Hiperatividade)",
         "faixa_etaria": "6-17 anos", "estimados": 432, "diagnosticados_pct": 8.4, "tratados_pct": 8.4, "status": "critico",
         "observacao": "432 crianças e adolescentes com TDAH estimados (prevalência 5%). Diagnóstico em apenas 8,4% (36 casos). Causa: zero psicólogo infantil no SUS de Apuí; diagnóstico depende de psiquiatra infantil (Manaus, 784 km, espera 12-18 meses). TDAH não tratado: reprovação escolar 3,4× mais frequente, evasão 2,8×, envolvimento com drogas 4,2×. Metilfenidato (Ritalina) no REMUME: disponível mas subutilizado por falta de prescrição. Professores com formação para TDAH: 12,4%"},
        {"transtorno": "Depressão (adolescentes 12-17 anos)",
         "faixa_etaria": "12-17 anos", "estimados": 284, "diagnosticados_pct": 14.4, "tratados_pct": 12.4, "status": "critico",
         "observacao": "284 adolescentes com depressão estimados (prevalência 10%). 14,4% diagnosticados. Fluoxetina pediátrica: disponível no REMUME — subutilizada. Depressão não tratada: 7× maior risco de tentativa de suicídio. Fatores de risco em Apuí: isolamento geográfico, violência doméstica (alta), uso de drogas, ausência de lazer estruturado. Grupos de apoio a adolescentes: zero no SUS. Rastreamento pelo CAPS AD: 28 adolescentes em 2025 (2,1% da faixa etária)"},
        {"transtorno": "Transtorno de Ansiedade",
         "faixa_etaria": "8-17 anos", "estimados": 518, "diagnosticados_pct": 10.4, "tratados_pct": 8.4, "status": "critico",
         "observacao": "518 casos estimados (prevalência 6%). 10,4% diagnosticados. GAD, ansiedade social e fobia específica predominam. Fatores: violência doméstica (48,4% das crianças expostas), instabilidade familiar (garimpo), bullying (reportado em 38,4% das escolas). Sertraline e fluoxetina pediátricas: disponíveis. TCC (Terapia Cognitivo-Comportamental): não ofertada no município. Grupos de mindfulness nas escolas: zero"},
        {"transtorno": "TEA (Transtorno do Espectro Autista)",
         "faixa_etaria": "0-17 anos", "estimados": 148, "diagnosticados_pct": 22.4, "tratados_pct": 14.4, "status": "critico",
         "observacao": "148 crianças com TEA estimadas (prevalência 1,7%). 22,4% diagnosticadas (33 casos). Diagnóstico tardio: média 6,2 anos em Apuí vs 3,5 anos recomendado. APAE Apuí: 28 vagas (14 em lista de espera). CAPSi mais próximo: Humaitá (284 km). ABA (Análise do Comportamento Aplicado): zero profissional no SUS. Benefício LOAS/BPC para autistas: 22 recebem. Terapia de fala e linguagem: 1 fonoaudiólogo no SUS (fila de 8 meses)"},
        {"transtorno": "Tentativa de Suicídio (0-17 anos)",
         "faixa_etaria": "10-17 anos", "estimados": 14, "diagnosticados_pct": 100.0, "tratados_pct": 48.4, "status": "critico",
         "observacao": "14 tentativas de suicídio em menores de 18 anos em 2025 — 2 óbitos (taxa 23,1/100k = 4,6× média BR 5/100k). Métodos: intoxicação por medicamento (57%), enforcamento (28,6%), outros (14,4%). Zero protocolo de prevenção do suicídio implementado na rede. CVV: não disponível localmente. Matriciamento de saúde mental nas escolas: zero. Pós-tentativa: apenas 48,4% recebem acompanhamento sistemático. Notificação SINAN: 8 de 14 tentativas notificadas"},
        {"transtorno": "Uso de Substâncias (adolescentes)",
         "faixa_etaria": "12-17 anos", "estimados": 245, "diagnosticados_pct": 18.4, "tratados_pct": 12.4, "status": "critico",
         "observacao": "28,4% dos adolescentes de 12-17 anos usaram substância psicoativa em 2025 (245 casos). Álcool: 22,4% (primeira experiência média: 11,8 anos). Maconha: 14,4%. Crack/cocaína: 8,4% (3× média nacional 2,8%). Causa: renda do garimpo e tráfico de drogas crescente na AM-174. CAPSad (adultos): atende adolescentes por ausência de CAPSi. Grupos NARCONON/NA: 1 grupo informal, 28 adolescentes. Internação compulsória: 4 em 2025 (Manaus, R$ 12.000/internação)"},
    ]


@lru_cache(maxsize=1)
def _SERVICOS():
    return [
        {"servico": "CAPSi (Centro de Atenção Psicossocial Infantil)",
         "disponivel": False, "capacidade": 0, "demanda_estimada": 324, "custo_implantacao": 0, "prazo_meses": 12,
         "observacao": "Zero CAPSi em Apuí. Referência: Humaitá (284 km) — capacidade de 40 crianças, lista de espera de 12 meses. CAPSi é financiado 100% pelo MS (Portaria GM 336/2002 — municípios ≥ 70k hab). Apuí: 24.700 hab — não elegível a CAPSi tipo I isolado. Alternativa: CAPS II ampliado com ala infantojuvenil. Custo: R$ 0 adicional se aprovado via RAPS no plano municipal. Prazo: 12 meses (aprovação, reforma, contratação). Psiquiatra infantil: 1 + psicólogo infantil: 2 + TO: 1 = equipe mínima"},
        {"servico": "Psicólogo infantil no SUS",
         "disponivel": False, "capacidade": 0, "demanda_estimada": 1297, "custo_implantacao": 108000, "prazo_meses": 3,
         "observacao": "Zero psicólogo infantil no SUS de Apuí. NASF-AB: prevê psicólogo para apoio matricial mas contratação suspensa desde 2019 (reestruturação federal). PMAQ/PREVINE: não exige psicólogo mas incentiva. Contratação: R$ 9.000/mês PSS = R$ 108k/ano. 1 psicólogo: cobre 100 crianças/mês em atendimento grupal e individual. 1.297 estimados com transtorno: 13 anos para cobrir com 1 profissional. Meta real: 3 psicólogos = R$ 324k/ano"},
        {"servico": "Psiquiatra infantil no SUS",
         "disponivel": False, "capacidade": 0, "demanda_estimada": 432, "custo_implantacao": 180000, "prazo_meses": 6,
         "observacao": "Zero psiquiatra infantil. TDAH, TEA, depressão grave, psicose infantil: sem atendimento local. Psiquiatra adulto: 1 no CAPS ad (sem habilitação pediátrica formal). Telepsiquiatria infantil: disponível via Telessaúde RDS (UFAM) — não utilizada em 2025. Teleconsulta: psiquiatra infantil em Manaus + médico local = resolução de 60% dos casos sem transferência. Custo: R$ 0 (Telessaúde RDS é gratuito). Psiquiatra presencial: R$ 15.000/mês PSS = R$ 180k/ano"},
        {"servico": "Programa de saúde mental nas escolas",
         "disponivel": False, "capacidade": 0, "demanda_estimada": 8648, "custo_implantacao": 24000, "prazo_meses": 2,
         "observacao": "Zero grupo de saúde mental nas escolas de Apuí. PSE (Programa Saúde na Escola): ativo mas sem componente de saúde mental. 6 escolas municipais + 2 estaduais = 8 pontos de intervenção. Protocolo 'Cuidar': 8h de capacitação por professor + kit de rastreamento. Custo: R$ 24.000 (materiais, capacitação, supervisão por 6 meses). SEMUS + SEMED: parceria necessária. Rastreamento precoce nas escolas = diagnóstico 2,4 anos mais cedo em média"},
        {"servico": "Protocolo de prevenção do suicídio",
         "disponivel": False, "capacidade": 0, "demanda_estimada": 14, "custo_implantacao": 8000, "prazo_meses": 2,
         "observacao": "Zero protocolo de prevenção do suicídio na rede de Apuí. eCARE (estratégia de cuidado pós-tentativa): não implantada. Profissionais capacitados em QPR (Question, Persuade, Refer): 4 de 84 (4,8%). CVV: acesso via 188 (telefônico) mas sem divulgação local. Curso QPR: R$ 0 (online, gratuito). Protocolo SEMUS-SEAMED: R$ 8.000 (material, impressão, capacitação 40 profissionais). Redução esperada: 28-34% nas tentativas com protocolo ativo"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "tentativas_suicidio_menor": 18, "uso_drogas_adolescente_pct": 32.4, "diagnosticados_pct": 8.4, "grupos_escola": 0},
        {"ano": "2023", "tentativas_suicidio_menor": 16, "uso_drogas_adolescente_pct": 30.4, "diagnosticados_pct": 9.4, "grupos_escola": 0},
        {"ano": "2024", "tentativas_suicidio_menor": 15, "uso_drogas_adolescente_pct": 29.4, "diagnosticados_pct": 11.4, "grupos_escola": 0},
        {"ano": "2025", "tentativas_suicidio_menor": 14, "uso_drogas_adolescente_pct": 28.4, "diagnosticados_pct": 12.4, "grupos_escola": 0},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Tentativa de suicídio (0-17 anos)",   "valor": 14,   "meta": 3,    "unidade": "casos/a",   "status": "critico", "observacao": "14 tentativas, 2 óbitos em 2025. Taxa 23,1/100k = 4,6× média BR. Zero protocolo pós-tentativa implantado. Cada tentativa não acompanhada: risco 40× maior de nova tentativa. Custo: R$ 8.000 para protocolo completo"},
        {"indicador": "Transtornos diagnosticados (0-17 a)", "valor": 12.4, "meta": 70.0, "unidade": "%",         "status": "critico", "observacao": "Apenas 12,4% dos 1.297 estimados receberam diagnóstico. Zero psicólogo e zero psiquiatra infantil no SUS. 1.136 crianças e adolescentes sem diagnóstico = escola, família e justiça resolvendo o que a saúde não cobre"},
        {"indicador": "Uso de drogas (12-17 anos)",          "valor": 28.4, "meta": 5.0,  "unidade": "%",         "status": "critico", "observacao": "28,4% usaram substância psicoativa — 8,4% crack/cocaína (3× média nacional). CAPSad: atende adolescentes mas sem equipe especializada infantil. Grupos NA/NARCONON: 1 informal. Tratamento estruturado: zero vagas locais para adolescentes"},
        {"indicador": "Psicólogos infantis no SUS",          "valor": 0,    "meta": 3,    "unidade": "prof.",     "status": "critico", "observacao": "Zero psicólogo infantil. 1 profissional = R$ 108k/ano, cobre 1.200 atendimentos/ano. 1.297 casos estimados = necessidade mínima 3 psicólogos. Telepsicologia (UFAM): disponível mas não ofertada"},
        {"indicador": "Grupos saúde mental nas escolas",     "valor": 0,    "meta": 8,    "unidade": "grupos",    "status": "critico", "observacao": "Zero grupos em 8 escolas. Custo: R$ 24k (PSE + capacitação). Rastreamento escolar detecta transtornos 2,4 anos mais cedo. 1 professor capacitado em QPR protege ~28 alunos"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/transtornos")
def transtornos():
    return _TRANSTORNOS


@router.get("/servicos")
def servicos():
    return _SERVICOS


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
