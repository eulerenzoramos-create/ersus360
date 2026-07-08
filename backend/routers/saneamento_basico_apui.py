from fastapi import APIRouter

router = APIRouter(prefix="/api/saneamento-basico-apui", tags=["saneamento_basico_apui"])

_DASHBOARD = {
    "municipio": "Apuí/AM",
    "populacao_total": 24700,
    "populacao_urbana": 18400,
    "populacao_rural_ribeirinha": 6300,
    "abastecimento_agua_tratada_urbana_pct": 62.4,
    "abastecimento_agua_tratada_rural_pct": 8.4,
    "meta_agua_tratada_pct": 100.0,
    "agua_sem_tratamento_estimados": 14284,
    "coleta_esgoto_urbana_pct": 18.4,
    "coleta_esgoto_rural_pct": 0.0,
    "meta_esgoto_pct": 100.0,
    "populacao_sem_esgoto_estimada": 20163,
    "defecacao_ceu_aberto_estimados": 4284,
    "coleta_lixo_urbana_pct": 72.4,
    "coleta_lixo_rural_pct": 4.4,
    "lixao_ativo_apui": True,
    "aterro_sanitario_apui": False,
    "aterro_mais_proximo_km": 280,
    "lixo_queimado_rural_pct": 62.4,
    "agua_fluor_apui": False,
    "eta_apui": True,
    "eta_capacidade_m3_dia": 2800,
    "demanda_m3_dia": 4200,
    "eta_cobertura_pct": 66.7,
    "pocos_artesianos_comunidades": 48,
    "pocos_sem_cloracao_pct": 84.4,
    "fossas_negras_pct": 72.4,
    "fossas_septicas_pct": 18.4,
    "diarreia_internacoes_2025": 284,
    "diarreia_internacoes_criancas_pct": 62.4,
    "cholera_historico_apui": False,
    "hepatite_a_casos_2025": 42,
    "leptospirose_casos_2025": 42,
    "helmintoses_prevalencia_pct": 42.4,
    "custo_doencas_veiculadas_agua_2025": 2840000,
    "plano_saneamento_municipal_pmisb": False,
    "status_agua": "critico",
    "status_esgoto": "critico",
    "status_residuos": "critico",
}

_COMPONENTES = [
    {"componente": "Abastecimento de Água",
     "cobertura_pct": 62.4, "meta_pct": 100.0, "status": "critico",
     "populacao_sem_acesso": 14284,
     "observacao": "62,4% de cobertura urbana de água tratada. Rural: 8,4% (5.292 habitantes sem água tratada). ETA (Estação de Tratamento de Água): capacidade 2.800 m³/dia vs demanda 4.200 m³/dia = déficit 33,3%. Expansão da ETA: R$ 2,8M (FUNASA + PAC Saneamento). 48 poços artesianos em comunidades rurais/ribeirinhas: 84,4% sem cloração. Hipoclorito de sódio (cloração): R$ 0,42/1.000 litros. 48 poços × R$ 8.400/ano cloração = R$ 403.200/ano — custo mensal por família ribeirinha: R$ 2,80. Zero cloração em 40 dos 48 poços. Água sem tratamento: risco de cólera, hepatite A, diarreia aguda, leptospirose, helmintoses. Fluoretação: zero em Apuí — -60% de cárie quando implementada (módulo Saúde Bucal). PNSB (Programa Nacional de Saneamento Básico): Apuí elegível para R$ 28M em 10 anos via PAC"},
    {"componente": "Esgotamento Sanitário",
     "cobertura_pct": 18.4, "meta_pct": 100.0, "status": "critico",
     "populacao_sem_acesso": 20163,
     "observacao": "18,4% de coleta de esgoto (apenas área central urbana). Rural: 0% de rede de esgoto. 4.284 pessoas defecam a céu aberto (estimado). 72,4% usam fossas negras (contaminam lençol freático + solo). 18,4% usam fossas sépticas adequadas. Fossa séptica biodigestora (Embrapa): R$ 1.200/unidade — adequada para habitações isoladas em área rural. Custo para cobrir 4.000 domicílios rurais sem fossa séptica: R$ 4,8M (FUNASA + FNHIS). Esgoto a céu aberto: transmissão de helmintos (62,4% em crianças), hepatite A (42 casos 2025), leptospirose (42 casos 2025), cólera (risco). ETE (Estação de Tratamento de Esgoto): R$ 8,4M + operação R$ 420k/ano (PMSB obrigatório para municípios acima de 20k hab). Marco Legal do Saneamento (Lei 14.026/2020): universalização até 2033 — Apuí necessita urgência"},
    {"componente": "Resíduos Sólidos",
     "cobertura_pct": 72.4, "meta_pct": 100.0, "status": "critico",
     "populacao_sem_acesso": 6813,
     "observacao": "Coleta de lixo urbana: 72,4%. Rural: 4,4% (2 comunidades servidas). Lixão ativo: zero aterro sanitário em Apuí. Aterro mais próximo: 280 km. Lixão: vetor de doenças (ratos = leptospirose, moscas = diarreia), contaminação do lençol freático e rios, queima de lixo = dioxinas (cancerígenas). 62,4% das famílias rurais queimam o lixo no quintal. PNRS (Política Nacional de Resíduos Sólidos): lixão = ilegal desde 2014. Multa por lixão ativo: IBAMA pode autuar município. Consórcio intermunicipal de resíduos sólidos: Apuí + Humaitá + Novo Aripuanã = viabilidade de aterro sanitário regional (custo R$ 12M / 3 municípios = R$ 4M/Apuí). Coleta seletiva: PNRS obriga. Cooperativa de catadores: 40 famílias do lixão de Apuí = renda + redução de resíduos. Custo de 1 caso de hepatite A veiculado por lixo: R$ 18.000 de tratamento"},
    {"componente": "Drenagem Urbana",
     "cobertura_pct": 28.4, "meta_pct": 100.0, "status": "critico",
     "populacao_sem_acesso": 13152,
     "observacao": "28,4% de cobertura de drenagem pluvial adequada. Enchentes: bairros periféricos inundados 4-8×/ano (fevereiro-abril). Enchente + lixão = lixo espalhado nos rios. Enchente + fossa negra = esgoto no lençol freático e nas vias. Dengue: Aedes aegypti em poças formadas por drenagem inadequada (IIP 4,8% — módulo Doenças Negligenciadas). Leptospirose: enchente + lixo = água contaminada (42 casos + 4 óbitos 2025). Infraestrutura de drenagem: R$ 18M (PAC Drenagem Urbana). Custo imediato de baixo impacto: limpeza de canais existentes + retirada de entulho = R$ 420k = -40% de pontos de alagamento. Mapa de risco de enchente: custo R$ 42k (drone + SIG). Comunidades ribeirinhas: palafitas em áreas de várzea = inundação garantida no período chuvoso. Solução palafita: elevação das casas + banheiro seco suspendo = R$ 18k/domicílio (FGTS Habitação)"},
]

_ACOES = [
    {"acao": "Cloração de 100% dos poços artesianos em comunidades rurais",
     "implementada": False, "custo": 403200, "prazo_meses": 3,
     "observacao": "48 poços artesianos em comunidades rurais/ribeirinhas. 84,4% sem cloração (40 poços). Hipoclorito de sódio a 10% (solução de uso): R$ 0,42/1.000 litros. Dosagem: 2 mg/L de cloro residual livre. ACS instala clorador de gotejamento artesanal (PVC + hipoclorito) = R$ 180/poço. Custo total instalação: R$ 7.200 (40 poços × R$ 180). Custo recorrente hipoclorito: R$ 396.000/ano (40 poços × consumo médio). Monitoramento: ACS verifica cloro residual mensalmente com kit colorimétrico simples (R$ 28/kit). 1 caso de hepatite A veiculada por água: R$ 18.000 de tratamento. 42 casos em 2025 × R$ 18.000 = R$ 756.000 vs R$ 403.200 de cloração. ROI 1,9:1 apenas na hepatite A. Diarreia em crianças < 5a: -65% com cloração de água (Cochrane)"},
    {"acao": "Implantação de fossas sépticas biodigestoras (Embrapa) nas comunidades rurais",
     "implementada": False, "custo": 4800000, "prazo_meses": 12,
     "observacao": "4.000 domicílios rurais sem fossa séptica adequada. Fossa biodigestora Embrapa: R$ 1.200/unidade — 3 tambores plásticos (fácil construção, baixa manutenção, efluente reutilizável como adubo). 4.000 × R$ 1.200 = R$ 4.800.000. Financiamento: FUNASA (R$ 3M) + FNHIS (R$ 1,8M) = custo municipal R$ 0. ACS instala e treina família em 4h. Alternativa emergencial: fossa seca (cathole) = R$ 120/domicílio × 4.000 = R$ 480.000 (elimina defecação a céu aberto imediatamente). Helmintoses em crianças: 62,4% — fossa séptica reduz prevalência em -70% em 5 anos (OMS). Leptospirose: fossa impede contato de ratos com esgoto → -40% de casos. Fossa biodigestora + horta: efluente tratado rega vegetais (produção de alimentos = impacto nutricional)"},
    {"acao": "Plano Municipal de Saneamento Básico (PMSB) — habilitação ao PAC",
     "implementada": False, "custo": 84000, "prazo_meses": 6,
     "observacao": "PMSB (Lei 11.445/2007): obrigatório para acessar recursos federais de saneamento. Apuí: zero PMSB. Sem PMSB: município bloqueado de R$ 28M em PAC Saneamento. Custo do PMSB: R$ 84.000 (empresa especializada licitada pelo município). Conteúdo: diagnóstico + metas + programas + investimentos para 20 anos. PAC Saneamento 2024-2027: R$ 118 bilhões para o Brasil — municípios com PMSB aprovado têm prioridade. Apuí com PMSB: elegível a R$ 28M para ETA + ETE + aterro sanitário + fossas. R$ 84.000 investidos agora = chave para R$ 28M em recursos. FUNASA: presta apoio técnico gratuito para municípios pequenos na elaboração do PMSB. Prazo: PMSB elaborado em 6 meses, aprovado na Câmara = habilitado imediatamente"},
    {"acao": "Consórcio intermunicipal para aterro sanitário (Apuí + Humaitá + Novo Aripuanã)",
     "implementada": False, "custo": 4000000, "prazo_meses": 18,
     "observacao": "Lixão ativo: ilegal desde 2014 (PNRS). Aterro sanitário individual para Apuí: R$ 12M (inviável). Consórcio com Humaitá (55k hab) + Novo Aripuanã (22k hab): R$ 12M / 3 = R$ 4M para Apuí. Financiamento: FNMA (Fundo Nacional do Meio Ambiente) + BNDES + PAC. Distância: Humaitá 180km — logística de transporte de resíduos: R$ 840k/ano (caminhão compactador). Alternativa de curto prazo: encerramento do lixão existente (aterramento + cobertura vegetal + monitoramento = R$ 420k) + coleta seletiva + reciclagem = reduz volume transportado 40%. Cooperativa de catadores: formalização de 40 famílias do lixão = renda + redução de resíduos. IBAMA pode autuar município por lixão ativo: multa R$ 84k a R$ 840k + encerramento forçado"},
    {"acao": "Monitoramento de qualidade da água (vigilância) nas UBSs e comunidades",
     "implementada": False, "custo": 28000, "prazo_meses": 2,
     "observacao": "Zero monitoramento de qualidade da água em Apuí (vigilância epidemiológica de água para consumo — Portaria GM/MS 888/2021). Parâmetros mínimos: cloro residual + turbidez + coliformes totais + E. coli. Kit de análise de campo: R$ 4.200 (cloro + turbidez + pH). Kits para 14 pontos de coleta: R$ 58.800. Alternativa econômica: ACS coleta amostra e envia ao LACEN-AM mensalmente = R$ 28.000/ano (transporte + análise). Resultado LACEN-AM em 7 dias. Cada resultado positivo para E. coli: ação imediata de hipercloração + interdição do ponto + comunicação à comunidade. SISÁGUA (Sistema de Informação de Vigilância da Qualidade da Água): alimentado pelos municípios com dados mensais. Apuí: zero dados no SISÁGUA em 2025 = impossível monitorar epidemias de doenças de veiculação hídrica"}
]

_HISTORICO = [
    {"ano": "2022", "agua_tratada_pct": 54.4, "esgoto_pct": 14.4, "lixo_coleta_pct": 64.4, "diarreia_intern": 318, "hepatite_a": 52, "helmintoses_pct": 48.4},
    {"ano": "2023", "agua_tratada_pct": 56.4, "esgoto_pct": 15.4, "lixo_coleta_pct": 66.4, "diarreia_intern": 304, "hepatite_a": 48, "helmintoses_pct": 46.4},
    {"ano": "2024", "agua_tratada_pct": 59.2, "esgoto_pct": 16.8, "lixo_coleta_pct": 69.2, "diarreia_intern": 294, "hepatite_a": 45, "helmintoses_pct": 44.2},
    {"ano": "2025", "agua_tratada_pct": 62.4, "esgoto_pct": 18.4, "lixo_coleta_pct": 72.4, "diarreia_intern": 284, "hepatite_a": 42, "helmintoses_pct": 42.4},
]

_INDICADORES = [
    {"indicador": "Água tratada (meta: 100%)",               "valor": 62.4, "meta": 100.0,"unidade": "%",    "status": "critico", "observacao": "62,4% — 14.284 sem água tratada. Rural: 8,4%. Cloração de 48 poços: R$ 403k. ROI 1,9:1 só na hepatite A. ETA: déficit 33% de capacidade — expansão via FUNASA"},
    {"indicador": "Coleta de esgoto (meta: 100%)",           "valor": 18.4, "meta": 100.0,"unidade": "%",    "status": "critico", "observacao": "18,4% — 20.163 sem coleta. 4.284 defecam a céu aberto. Fossa biodigestora Embrapa: R$ 1.200/domicílio × 4.000 = R$ 4,8M (FUNASA financia)"},
    {"indicador": "Coleta de lixo (meta: 100%)",             "valor": 72.4, "meta": 100.0,"unidade": "%",    "status": "critico", "observacao": "72,4% urbano, 4,4% rural. Lixão ativo (ilegal desde 2014). Consórcio aterro sanitário: R$ 4M. IBAMA: multa R$ 84k–840k por lixão ativo"},
    {"indicador": "Internações por diarreia aguda 2025",     "valor": 284,  "meta": 0,    "unidade": "casos","status": "critico", "observacao": "284 internações (62,4% em crianças < 5a). Custo R$ 2,84M. Cloração + fossa séptica = -65% de diarreia. Doença veiculada por água = saneamento deficiente"},
    {"indicador": "PMSB (Plano Municipal de Saneamento)",    "valor": 0,    "meta": 1,    "unidade": "plano","status": "critico", "observacao": "Zero PMSB — município bloqueado de R$ 28M em PAC Saneamento. Elaboração: R$ 84k + 6 meses. FUNASA: apoio técnico gratuito disponível"}
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/componentes")
def componentes():
    return _COMPONENTES


@router.get("/acoes")
def acoes():
    return _ACOES


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
