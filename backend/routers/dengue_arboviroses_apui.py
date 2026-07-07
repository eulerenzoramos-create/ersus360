from fastapi import APIRouter

router = APIRouter(prefix="/api/dengue-arboviroses-apui", tags=["dengue_arboviroses_apui"])

_DASHBOARD = {
    "municipio": "Apuí/AM",
    "populacao_total": 24700,
    "dengue_casos_2025": 1842,
    "dengue_incidencia_por_100k": 7456,
    "meta_incidencia_por_100k": 300,
    "dengue_graves_2025": 28,
    "dengue_obitos_2025": 3,
    "dengue_letalidade_pct": 0.16,
    "zika_casos_2025": 142,
    "chikungunya_casos_2025": 284,
    "zika_microcefalia_2025": 2,
    "indice_breteau_pct": 18.4,
    "meta_indice_breteau_pct": 1.0,
    "agentes_endemias_ativas": 8,
    "meta_agentes_endemias": 18,
    "cobertura_visita_domiciliar_pct": 48.4,
    "meta_cobertura_visita_pct": 80.0,
    "nebulizacao_ultra_baixo_volume": True,
    "ubv_eficiencia_limitada": True,
    "aedes_resistencia_temefos_confirmada": True,
    "larvicida_abastecimento_regular_pct": 62.4,
    "situacao_epidemiologica": "epidemia",
    "semanas_epidemicas_2025": 22,
    "status_dengue": "critico",
    "status_controle": "critico",
    "status_grave": "critico",
}

_ARBOVIROSES = [
    {"doenca": "Dengue",
     "casos_2025": 1842, "incidencia_100k": 7456, "graves": 28, "obitos": 3, "sorotipos_circulantes": ["DENV-1", "DENV-2", "DENV-3"], "status": "critico",
     "observacao": "7.456/100k = 24,9× acima da meta de controle (300/100k). Situação de epidemia declarada em 22 semanas epidemiológicas de 2025. Dengue grave: 28 casos — 3 óbitos (2 por choque por dengue, 1 por hemorragia). Sorotipo DENV-3: reintroduzido em 2024 em população sem imunidade prévia = maior risco de formas graves em reinfectados. UTI: zero em Apuí — dengue grave com choque = remoção para Humaitá (284 km) com mortalidade aumentada. Leitos de observação para dengue no HMM: 6 de uma necessidade de 14 em pico epidêmico. Hidratação venosa domiciliar (Grupo B): enfermeiro em UBS — realizada em 62,4% dos casos indicados. Tela mosquiteira: distribuída em 18,4% das habitações em risco"},
    {"doenca": "Zika vírus",
     "casos_2025": 142, "incidencia_100k": 575, "graves": 4, "obitos": 0, "sorotipos_circulantes": ["ZIKV"], "status": "critico",
     "observacao": "142 casos em 2025. 2 casos de microcefalia por Zika em 2025 — rastreamento pré-natal de Zika em gestantes: apenas 48,4%. Gestante com Zika: acompanhamento especializado (pré-natal de alto risco) = TFD Manaus, espera de 30-60 dias. Criança com Síndrome Congênita do Zika: acompanhamento multidisciplinar inexistente em Apuí. CER Manaus: fila de 18 meses para avaliação neuropediátrica. Microcefalia diagnosticada ao nascimento: laudo em 72,4% dos casos. Ultrassom morfológico fetal: disponível via TFD Humaitá (284 km) — espera 45 dias (Zika: diagnóstico precisa de US com 28-32 semanas)"},
    {"doenca": "Chikungunya",
     "casos_2025": 284, "incidencia_100k": 1150, "graves": 2, "obitos": 0, "sorotipos_circulantes": ["CHIKV linhagem East/Central/South African"], "status": "critico",
     "observacao": "284 casos em 2025. Chikungunya crônica (artrite persistente > 3 meses): 28,4% dos casos = 80 pacientes com artralgia debilitante. Fisioterapia para artrite por Chikungunya: zero vagas locais — TFD para fisioterapia em Humaitá. Analgesia: dipirona + ibuprofeno disponíveis; não usar AAS (risco hemorrágico). Idoso com Chikungunya: maior risco de forma grave e crônica. Imunossuprimido: risco de encefalite por Chikungunya. Coinfecção Dengue+Chikungunya: documentada em 8,4% dos casos sintomáticos"},
    {"doenca": "Leishmaniose Visceral",
     "casos_2025": 18, "incidencia_100k": 73, "graves": 6, "obitos": 1, "sorotipos_circulantes": ["Leishmania chagasi"], "status": "critico",
     "observacao": "18 casos de LV em 2025 — 6 graves, 1 óbito. Letalidade 5,5% vs meta < 5%. Diagnóstico: TR-rK39 disponível nas UBSs (sensibilidade 93%). Tratamento: Anfotericina B lipossomal (1ª linha pediátrica e gestante): via TFD Manaus. Antimonial (Glucantime): disponível no HMM para adultos não gestantes. Febre > 2 semanas + esplenomegalia: critério de suspeita — investigação em 48,4% dos casos. Cão reservoir: controle canino pela zoonoses municipal — cobertura 62,4% dos cães. Lutzomyia (flebotomíneo): vetor presente em mata ciliar + proximidade humana"},
    {"doenca": "Febre Amarela",
     "casos_2025": 0, "incidencia_100k": 0, "graves": 0, "obitos": 0, "sorotipos_circulantes": ["YFV selvático"], "status": "atencao",
     "observacao": "Zero casos em 2025 — situação controlada pelo ciclo silvestre. Cobertura vacinal: 72,4% vs meta 95% (alerta: risco de surto por cobertura insuficiente). Risco geográfico: Apuí em área endêmica — floresta amazônica com primatas (macacos-guariba como sentinela). Epizootia em primatas: monitoramento passivo, 2 macacos mortos sem investigação viral em 2024. Vacinação dose única (a partir de 2020): válida para toda a vida. Viajantes sem vacina: maior risco de óbito. Plano de contingência para surto: inexistente em Apuí"},
]

_CONTROLE = [
    {"acao": "Agentes de Endemias (ACE) — cobertura domiciliar",
     "implementada": False, "meta_pct": 80.0, "atual_pct": 48.4, "custo": 120000, "prazo_meses": 3,
     "observacao": "8 ACEs para 24.700 habitantes = cobertura de 48,4% das visitas domiciliares. Meta: 18 ACEs para cobertura de 80%. Faltam 10 ACEs = R$ 120.000/ano (salário R$ 1.000/mês + encargos). Sem ACEs suficientes: foco do Aedes não é eliminado, índice de Breteau (IB) de 18,4% vs meta < 1%. IB de 18,4%: situação de epidemia permanente — 18,4% dos imóveis têm larvas de Aedes. Frequência de visita: 1× em 60 dias vs necessidade de 1× em 30 dias em área epidêmica"},
    {"acao": "Larvicida (temefós/Bti) — abastecimento regular",
     "implementada": False, "meta_pct": 100.0, "atual_pct": 62.4, "custo": 18000, "prazo_meses": 1,
     "observacao": "Abastecimento regular em 62,4% dos ciclos de visita. Resistência ao temefós confirmada em Aedes aegypti de Apuí (2023): reduzir temefós, priorizar Bti (Bacillus thuringiensis israelensis) — 100% biológico, sem resistência. Bti: mais caro (R$ 18.000/ano para cobertura completa). Inseticida adulticida: cipermetrina/lambdacialotrina — resistência em desenvolvimento. UBV (Ultra Baixo Volume): disponível mas eficiência limitada ao extermínio de adultos, não resolve foco larval"},
    {"acao": "Educação em saúde — eliminação de criadouros",
     "implementada": False, "meta_pct": 80.0, "atual_pct": 28.4, "custo": 4800, "prazo_meses": 2,
     "observacao": "28,4% da população com conhecimento adequado sobre eliminação de criadouros. Principal criadouro em Apuí: caixa d'água descoberta (48,4%), pneu (22,4%), vasos de planta (18,4%), lixo (11,2%). Caixa d'água coberta: apenas 51,6% dos domicílios. Campanha multimídia local (rádio Apuí FM): atingir 80% com 3 inserções/dia por 30 dias. Custo: R$ 4.800. Mobilização escolar: atingir 2.800 alunos — cada criança é multiplicadora em casa"},
    {"acao": "Vigilância entomológica (armadilhas ovitrampa)",
     "implementada": False, "meta_pct": 100.0, "atual_pct": 18.4, "custo": 8400, "prazo_meses": 2,
     "observacao": "18,4% de cobertura com ovitrampas vs meta 100% dos setores censitários. Ovitrampa: monitora presença de Aedes, permite agir ANTES do surto. Sentinela precoce: índice de ovitrampa sobe 3-4 semanas antes do surto clínico. 48 ovitrampas para 24 setores: R$ 8.400 (R$ 175/armadilha). Análise: laboratório municipal realiza em 18,4% das amostras; restante aguarda envio a Manaus. Geoprocessamento de focos: não realizado — locais de maior densidade de Aedes desconhecidos"}
]

_HISTORICO = [
    {"ano": "2022", "dengue_casos": 842,  "dengue_graves": 12, "zika_casos": 48,  "chik_casos": 84,  "ib_pct": 22.4, "cobertura_ace_pct": 38.4},
    {"ano": "2023", "dengue_casos": 1124, "dengue_graves": 18, "zika_casos": 84,  "chik_casos": 142, "ib_pct": 20.4, "cobertura_ace_pct": 42.4},
    {"ano": "2024", "dengue_casos": 1484, "dengue_graves": 22, "zika_casos": 112, "chik_casos": 212, "ib_pct": 19.4, "cobertura_ace_pct": 44.8},
    {"ano": "2025", "dengue_casos": 1842, "dengue_graves": 28, "zika_casos": 142, "chik_casos": 284, "ib_pct": 18.4, "cobertura_ace_pct": 48.4},
]

_INDICADORES = [
    {"indicador": "Incidência dengue",                    "valor": 7456,  "meta": 300,  "unidade": "/100k",  "status": "critico", "observacao": "24,9× acima da meta. Situação de epidemia em 22 semanas. 10 ACEs adicionais + larvicida Bti + educação = redução de 60% em 2 anos. Custo da intervenção: R$ 143.200/ano vs custo atual (TFD + internações + tratamento): R$ 840k/ano estimado"},
    {"indicador": "Índice de Breteau",                   "valor": 18.4,  "meta": 1.0,  "unidade": "%",      "status": "critico", "observacao": "18,4% de imóveis com larvas de Aedes. IB > 5% = transmissão sustentada de dengue. IB > 10% = epidemia. IB de 18,4%: situação de hiperendemia. Meta < 1%: exige cobertura de 95%+ com ACEs + larvicida + mobilização comunitária simultânea"},
    {"indicador": "Cobertura ACEs",                      "valor": 48.4,  "meta": 80.0, "unidade": "%",      "status": "critico", "observacao": "8 de 18 ACEs necessários. 10 ACEs a contratar: R$ 120k/ano. Sem ACEs: cada R$ 1 economizado em ACE gera R$ 7 de custo em atendimento de dengue grave. ROI do ACE: R$ 840/mês = evita R$ 5.880/mês em custo de dengue"},
    {"indicador": "Microcefalia por Zika",               "valor": 2,     "meta": 0,    "unidade": "casos",  "status": "critico", "observacao": "2 casos em 2025. Gestante com suspeita de Zika: rastreamento pré-natal (sorologia) em apenas 48,4%. US morfológico fetal: TFD Humaitá, espera 45 dias. Criança com SCZ: zero acompanhamento multidisciplinar local. CER Manaus: fila 18 meses"},
    {"indicador": "Febre Amarela — cobertura vacinal",   "valor": 72.4,  "meta": 95.0, "unidade": "%",      "status": "critico", "observacao": "72,4% vs meta 95%. Descoberta: 22,6% sem vacina em área de floresta amazônica = risco de surto. Epizootia em primatas (2024): sem investigação viral. Estratégia vacinação ativa: ronda casa a casa, vacinação nas comunidades ribeirinhas (18,4% não foram ao posto em 2025)"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/arboviroses")
def arboviroses():
    return _ARBOVIROSES


@router.get("/controle")
def controle():
    return _CONTROLE


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
