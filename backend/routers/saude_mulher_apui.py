from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-mulher-apui", tags=["saude_mulher_apui"])

_DASHBOARD = {
    "populacao_feminina_estimada": 12350,
    "mulheres_10_49_anos": 7210,
    "mulheres_25_64_anos": 5420,
    "papanicolau_cobertura_pct": 28.4,
    "meta_papanicolau_pct": 80.0,
    "papanicolau_resultado_prazo_dias": 45,
    "meta_resultado_dias": 30,
    "mamografia_cobertura_pct": 18.4,
    "meta_mamografia_pct": 70.0,
    "mamografo_municipio": False,
    "mamografia_fila_dias": 128,
    "ca_colo_novos_casos_estimados_ano": 8,
    "ca_mama_novos_casos_estimados_ano": 6,
    "ca_colo_diagnostico_avancado_pct": 72.4,
    "gravidez_nao_planejada_pct": 64.2,
    "metodo_contraceptivo_pct": 48.4,
    "meta_contraceptivo_pct": 80.0,
    "esterilizacao_fila_meses": 28,
    "climatério_acompanhamento_pct": 8.4,
    "meta_climatério_pct": 50.0,
    "violencia_contra_mulher_notif_ano": 48,
    "feminicidios_tentados_ano": 4,
    "casa_acolhimento_municipio": False,
    "ginecologista_municipio": 0,
    "obstetriz_municipio": 0,
    "hpv_cobertura_d2_pct": 52.4,
    "status_rastreamento": "critico",
    "status_violencia": "critico",
    "status_planejamento": "atencao",
}

_RASTREAMENTO = [
    {
        "programa": "CA de Colo do Útero (Papanicolau)",
        "cobertura_pct": 28.4,
        "meta_pct": 80.0,
        "status": "critico",
        "lesoes_detectadas_ano": 12,
        "casos_cancer_confirmados_ano": 8,
        "estagio_avancado_pct": 72.4,
        "observacao": "71,6% sem exame nos últimos 3 anos. AM tem incidência de CA colo entre as mais altas do Brasil. Resultado LACEN-AM em 30-45 dias: mulher positiva frequentemente não retorna para buscar resultado. Zero colposcópio no município — lesão suspeita = transfer para Manaus imediato",
    },
    {
        "programa": "CA de Mama (Mamografia)",
        "cobertura_pct": 18.4,
        "meta_pct": 70.0,
        "status": "critico",
        "lesoes_detectadas_ano": 4,
        "casos_cancer_confirmados_ano": 6,
        "estagio_avancado_pct": 84.2,
        "observacao": "Mamógrafo inexistente em Apuí — exame via TFD em Humaitá/Manaus com fila de 128 dias. 81,6% sem mamografia nos últimos 2 anos. CA mama diagnosticado em estágio III/IV em 84,2% dos casos. Ultrassonografia mamária disponível mas inadequada como triagem primária",
    },
    {
        "programa": "HPV (vacinação preventiva)",
        "cobertura_pct": 52.4,
        "meta_pct": 80.0,
        "status": "critico",
        "lesoes_detectadas_ano": None,
        "casos_cancer_confirmados_ano": None,
        "estagio_avancado_pct": None,
        "observacao": "Cobertura HPV feminino D2 de 52,4% — 47,6% das meninas 9-14 anos sem proteção. HPV é responsável por 99% dos CA de colo. Vacinação escolar depende de PSE (64,3% das escolas) — escolas sem PSE não recebem vacinação regular",
    },
]

_PLANEJAMENTO_FAMILIAR = [
    {"metodo": "Anticoncepcional oral",      "uso_estimado_pct": 28.4, "disponibilidade": "regular",    "observacao": "Disponível na farmácia básica mas com desabastecimento de 2-3 meses/ano. Orientação insuficiente sobre uso correto: taxa de falha por uso inadequado estimada em 8%"},
    {"metodo": "Preservativo masculino",     "uso_estimado_pct": 18.4, "disponibilidade": "regular",    "observacao": "Distribuição gratuita nas UBS mas adesão baixa — especialmente em zona rural e ribeirinha. ACS distribui mas não há educação sexual sistematizada"},
    {"metodo": "Injetável trimestral",       "uso_estimado_pct": 12.4, "disponibilidade": "irregular",  "observacao": "Desabastecimento em 4 dos últimos 12 meses. Mulher que depende do injetável sem alternativa imediata = gravidez não planejada"},
    {"metodo": "DIU (inserção SUS)",         "uso_estimado_pct": 4.8,  "disponibilidade": "restrita",   "observacao": "Inserção disponível mas com fila de 3-4 meses. Apenas 2/8 UBS com enfermeiro capacitado para inserção. DIU é método de alta eficácia e baixo custo subutilizado"},
    {"metodo": "Laqueadura (SUS)",           "uso_estimado_pct": 2.4,  "disponibilidade": "fila longa", "observacao": "Fila de 28 meses para esterilização cirúrgica feminina — direito garantido pela lei 9.263 mas inacessível na prática. Vasectomia: procedimento ambulatorial simples com fila de 18 meses"},
    {"metodo": "Implante subdérmico",        "uso_estimado_pct": 1.8,  "disponibilidade": "ausente",    "observacao": "Não disponível no município — alto custo unitário. Ideal para populações de acesso irregular como ribeirinhos: eficácia 3 anos sem reposição mensal"},
]

_VIOLENCIA = [
    {"tipo": "Violência física",             "notificacoes_ano": 28, "subnotificacao_estimada_pct": 70.0, "status": "critico", "observacao": "28 notificações vs estimativa de 93 casos reais. Delegacia da mulher em Humaitá (284 km). Mulher em área ribeirinha não tem acesso a serviços de proteção: agressor e vítima isolados"},
    {"tipo": "Violência sexual",             "notificacoes_ano": 8,  "subnotificacao_estimada_pct": 85.0, "status": "critico", "observacao": "8 notificações — estimativa real de 53 casos. Profilaxia HIV/IST pós-violência disponível na UPA mas fluxo não protocolado. Coleta de vestígios sem IML no município: perícia em Manaus meses depois"},
    {"tipo": "Violência psicológica",        "notificacoes_ano": 8,  "subnotificacao_estimada_pct": 90.0, "status": "critico", "observacao": "Subdiagnosticada — ACS não capacitado para identificação. Relação entre violência psicológica e depressão, ansiedade e uso de medicamentos psicotrópicos não reconhecida como nexo causal"},
    {"tipo": "Feminicídio (tentado)",        "notificacoes_ano": 4,  "subnotificacao_estimada_pct": 0.0,  "status": "critico", "observacao": "4 tentativas de feminicídio em 2025. Casa de acolhimento: inexistente em Apuí — mulher em risco tem que ir para Humaitá (284 km) abandonando filhos, emprego e rede. CRAS sem equipe de proteção especializada"},
]

_HISTORICO = [
    {"ano": "2022", "papanicolau_pct": 18.4, "mamografia_pct": 8.4,  "contraceptivo_pct": 42.4, "violencia_notif": 32, "hpv_d2_pct": 42.4},
    {"ano": "2023", "papanicolau_pct": 21.4, "mamografia_pct": 11.4, "contraceptivo_pct": 44.8, "violencia_notif": 38, "hpv_d2_pct": 46.8},
    {"ano": "2024", "papanicolau_pct": 24.8, "mamografia_pct": 14.8, "contraceptivo_pct": 46.4, "violencia_notif": 44, "hpv_d2_pct": 49.4},
    {"ano": "2025", "papanicolau_pct": 28.4, "mamografia_pct": 18.4, "contraceptivo_pct": 48.4, "violencia_notif": 48, "hpv_d2_pct": 52.4},
]

_INDICADORES = [
    {"indicador": "Rastreamento CA de colo (Papanicolau)",  "valor": 28.4, "meta": 80.0, "unidade": "%", "status": "critico", "observacao": "71,6% sem exame. AM tem incidência 3x a média nacional. Diagnóstico em estágio avançado em 72,4% — doença curável se detectada precocemente. Resultado em 45 dias (meta 30d): janela de abandono. Zero ginecologista, zero colposcópio no município"},
    {"indicador": "Rastreamento CA de mama (mamografia)",   "valor": 18.4, "meta": 70.0, "unidade": "%", "status": "critico", "observacao": "Mamógrafo inexistente — TFD com fila de 128 dias. 84,2% dos CA de mama diagnosticados em estágio III/IV. Tratamento oncológico via TFD em Manaus: 784 km, família desestruturada, abandono de tratamento em 28,4% dos casos"},
    {"indicador": "Gravidez não planejada",                 "valor": 64.2, "meta": 30.0, "unidade": "%", "status": "critico", "observacao": "64,2% das gestações não planejadas — injetável trimestral em falta 4 meses/ano, DIU com fila de 3-4 meses, esterilização cirúrgica fila de 28 meses. Planejamento familiar é direito garantido mas operacionalmente inviável em Apuí"},
    {"indicador": "Violência contra mulher (notificada)",   "valor": 48,   "meta": 0,    "unidade": "casos/ano", "status": "critico", "observacao": "48 notificações, estimativa real 160+ casos. Casa de acolhimento inexistente. Delegacia da mulher em Humaitá (284 km). Mulher ribeirinha sem acesso a rede de proteção = permanência em situação de risco por ausência de alternativa"},
    {"indicador": "Climatério acompanhado",                 "valor": 8.4,  "meta": 50.0, "unidade": "%", "status": "critico", "observacao": "91,6% das mulheres em climatério sem acompanhamento específico. Osteoporose, cardiovascular, qualidade de vida — negligenciados. Zero ginecologista: atendimento climático por clínico geral sem especialização. TRH: prescrita por 2,4% (meta 20% com indicação)"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/rastreamento")
def rastreamento():
    return _RASTREAMENTO


@router.get("/planejamento-familiar")
def planejamento_familiar():
    return _PLANEJAMENTO_FAMILIAR


@router.get("/violencia")
def violencia():
    return _VIOLENCIA


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
