from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/dengue-arboviroses-apui", tags=["dengue_arboviroses_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 20647,  # IBGE Censo 2022,
        # Dengue
        "dengue_casos_2025": 1842,
        "dengue_incidencia_100k": 7456.7,
        "dengue_obitos_2025": 4,
        "dengue_graves_2025": 28,
        "dengue_taxa_lethalidade_pct": 0.22,
        "meta_letalidade_dengue_pct": 0.1,
        "dengue_sorotipo_dominante": "DENV-3",
        "dengue_hiperendemia_circulacao_sorotipo": True,
        # Índice de infestação
        "iip_aedes_atual_pct": 4.8,
        "iip_critico_threshold_pct": 1.0,
        "iip_alertas_pct": 0.5,
        "ib_breteau_atual": 8.4,
        "agentes_endemias_apui": 6,
        "meta_agentes_endemias": 18,
        "cobertura_liraa_pct": 48.4,
        # Zika e Chikungunya
        "zika_casos_2025": 184,
        "zika_gestante_2025": 28,
        "microcefalia_zika_2025": 4,
        "chikungunya_casos_2025": 842,
        "chikungunya_cronica_estimados": 280,
        # Estrutura
        "nebulizador_apui": 1,
        "ubs_nebulizacao_programada": False,
        "sala_hidratacao_dengue_ubs": 2,
        "hemoconcentracao_protocolo_ubs": True,
        "plano_contingencia_dengue_apui": False,
        "status_iip": "critico",
        "status_casos": "critico",
        "status_controle": "critico",
    }


@lru_cache(maxsize=1)
def _VETORES():
    return [
        {"arbovirose": "Dengue — DENV-3 (sorotipo dominante 2025)",
         "casos_2025": 1842, "obitos_2025": 4, "graves": 28,
         "status": "critico",
         "observacao": "1.842 casos (incidência 7.456/100k — 15× a média nacional 500/100k). DENV-3 dominante: sorotipos 1-4 circulando em Apuí = hiperendemia = epidemia periódica garantida a cada 3-5 anos. 4 óbitos por dengue grave: todos por hemoconcentração não detectada a tempo (protocolo: hematócrito > 20% do basal = alarme de dengue grave). Sala de hidratação na UBS: apenas 2 das 8 UBSs equipadas. Dengue grave: 1 óbito evitado = R$ 280.000 de custo hospitalar + meses de UTI. Sinal de alarme: dor abdominal intensa + vômito contínuo + hepatomegalia + hipotensão → internação imediata. Classificação pela OMS (2009): dengue sem sinais de alarme / com sinais de alarme / dengue grave. Formação de profissionais: 8 UBSs × protocolo de reconhecimento de sinais = custo R$ 8.400 (treinamento)."},
        {"arbovirose": "Zika — casos e impacto em gestantes",
         "casos_2025": 184, "obitos_2025": 0, "graves": 28,
         "status": "critico",
         "observacao": "184 casos de Zika em 2025 (estimativa, subnotificação 90% — maioria assintomático). 28 gestantes com suspeita de Zika. 4 casos de microcefalia/alteração neurológica associada ao Zika (2023-2025). Zika em gestante: acompanhamento especializado obrigatório. Diagnóstico: RT-PCR (até 5 dias dos sintomas) ou sorologia IgM (> 5 dias). Laboratório de arboviroses: LACEN-AM (Manaus, resultado em 5 dias). Ultrassonografia fetal mensal em gestante com Zika: disponível em Humaitá (1 aparelho). Zika × microcefalia: risco 1-13% quando exposição no 1º trimestre. Formulário de notificação de Zika em gestante: SINAN — obrigatório. Prevenção: mosquiteiro impregnado (gestante) + repelente DEET 15% (seguro na gestação)."},
        {"arbovirose": "Chikungunya — casos agudos e crônicos",
         "casos_2025": 842, "obitos_2025": 1, "graves": 42,
         "status": "critico",
         "observacao": "842 casos de chikungunya em 2025. 280 casos crônicos estimados (artralgia persistente > 3 meses = forma crônica em 30-40% dos casos). 1 óbito: idoso com comorbidade. Chikungunya crônica: artralgia debilitante + afastamento de trabalho + invalidez temporária. Custo: 1 caso crônico = 6 meses de afastamento = R$ 8.400 de auxílio-doença. Tratamento agudo: paracetamol 500mg (AAS proibido até descartar dengue). Forma crônica: hidroxicloroquina 400mg/dia (disponível REMUME) + fisioterapia. Fisioterapeuta no eMulti: 1 fisioterapeuta para 280 casos crônicos = agenda lotada. Nebulização (adulticida): controle vetorial temporário — não elimina criadouros. ACS: visita domiciliar semanal em surto = única solução definitiva."},
        {"arbovirose": "Aedes aegypti — Índice de Infestação Predial (IIP) 4,8%",
         "casos_2025": 0, "obitos_2025": 0, "graves": 0,
         "status": "critico",
         "observacao": "IIP 4,8% (nível de alerta: 0,5%; nível crítico: > 1,0% = epidemia iminente). Apuí: 4,8% = epidemia de dengue é CERTA sem controle vetorial imediato. 6 agentes de combate a endemias (ACEs) para 18.732 habitantes (meta: 1 ACE/750 hab = 33 ACEs). Déficit: 27 ACEs. LIRAA (Levantamento de Índice Rápido Aedes): realizado em 48,4% dos quarteirões (meta 100%). Principais criadouros Apuí: tonéis/tambores (garimpo) 34,8% + pneus 18,4% + laje/calha 14,2%. Plano de Contingência: não existe em Apuí (obrigatório pelo PNCD — Programa Nacional de Controle da Dengue). Larvitrapa biossensor: R$ 8.400/ano → IIP mensal em tempo real. Wolbachia (liberação de mosquitos estéreis): parceria Fiocruz — disponível para municípios no AM."},
    ]


@lru_cache(maxsize=1)
def _ACOES():
    return [
        {"acao": "Contratação emergencial de 12 ACEs (agentes de combate a endemias)",
         "implementada": False, "custo": 504000, "prazo_meses": 3,
         "observacao": "6 ACEs para 18.732 hab (meta 33 ACEs — 1/750 hab). Déficit crítico: IIP 4,8% com apenas 6 ACEs = impossível controlar. Custo: 12 ACEs × R$ 3.500/mês × 12 meses = R$ 504.000/ano. Financiamento: Piso de Atenção Básica Variável (PAB-V) para vigilância epidemiológica + emenda parlamentar. 12 ACEs adicionais: cobertura de 18.000 imóveis/mês → IIP projetado: < 1% em 6 meses. ROI: 1.842 casos atuais × R$ 840/caso (tratamento + produtividade) = R$ 1,55M evitados por ano vs R$ 504k de ACEs."},
        {"acao": "Plano de Contingência para Dengue — obrigatório pelo PNCD",
         "implementada": False, "custo": 8400, "prazo_meses": 2,
         "observacao": "Zero plano de contingência (obrigatório pelo PNCD/MS). Custo de elaboração: R$ 8.400 (2 meses, 1 técnico). Plano inclui: fluxo de atendimento (UBS → PA → hospital), capacidade de leitos, estoque de soro fisiológico, protocolo de dengue grave, comunicação de risco. Sem plano: epidemia vira caos (como 2023 no AM). PNCD/MS: município sem plano = bloqueado de acesso a recursos emergenciais federais para dengue."},
        {"acao": "Equipar todas as 8 UBSs com sala de hidratação para dengue",
         "implementada": False, "custo": 48000, "prazo_meses": 3,
         "observacao": "2 das 8 UBSs com sala de hidratação. 4 óbitos por dengue grave em 2025: todos por hemoconcentração não detectada a tempo. Sala de hidratação: 2 poltronas + 2 frascos SF 0,9% + hematócrito portátil = R$ 6.000/UBS. 6 UBSs restantes: R$ 36.000. Hematócrito portátil: R$ 2.000/UBS. Total: R$ 48.000. 1 óbito evitado = R$ 280.000 de internação em UTI evitada. ROI 5:1 na primeira epidemia."},
        {"acao": "Parceria Fiocruz — liberação de mosquitos com Wolbachia (controle biológico)",
         "implementada": False, "custo": 28000, "prazo_meses": 6,
         "observacao": "Wolbachia: bactéria inserida nos mosquitos que inibe replicação do vírus da dengue. Fiocruz: programa nacional de liberação em municípios endêmicos. Eficácia: -77% de casos de dengue (RCT 2021, NEJM). Custo municípios: R$ 28.000 (logística + comunicação). Fiocruz arca com produção dos mosquitos. Apuí: município pequeno = ideal para estudo piloto amazônico. Contato: WorldMosquito.org/programas-brasil + Fiocruz Manaus."},
        {"acao": "Nebulização seletiva durante epidemias + comunicação de risco com a população",
         "implementada": False, "custo": 18000, "prazo_meses": 1,
         "observacao": "1 nebulizador disponível (UBF Apuí). Nebulização programada: zero. Nebulização seletiva (não espacial): apenas áreas com > 3 casos/quarteirão. Adulticida: Malathion 44% (4g/min) — resistência já detectada em 68% das populações amazônicas. Comunicação de risco: WhatsApp municipal + carro de som + escola = eliminação de criadouros em 72h. Mutirão de eliminação de criadouros: sábado × 500 voluntários × 4 bairros = 2.000 imóveis vistoriados. Custo: R$ 18.000 (combustível + adulticida + materiais de comunicação)."},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "dengue": 984,  "zika": 84,  "chik": 284, "iip": 3.8, "obitos": 2},
        {"ano": "2023", "dengue": 2284, "zika": 142, "chik": 684, "iip": 5.4, "obitos": 6},
        {"ano": "2024", "dengue": 1284, "zika": 124, "chik": 584, "iip": 4.2, "obitos": 3},
        {"ano": "2025", "dengue": 1842, "zika": 184, "chik": 842, "iip": 4.8, "obitos": 4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "IIP Aedes aegypti (alerta: 0,5% | crítico: > 1%)",     "valor": 4.8,   "meta": 1.0,   "unidade": "%",    "status": "critico", "observacao": "4,8% = epidemia iminente. 6 ACEs para 18.732 hab (meta 33). Contratação emergencial 12 ACEs: R$ 504k. Wolbachia Fiocruz: -77% de casos."},
        {"indicador": "Dengue — incidência 2025 (meta: < 300/100k)",           "valor": 7456.7,"meta": 300.0, "unidade": "/100k","status": "critico", "observacao": "7.456/100k (24,9× a meta). 1.842 casos. 4 óbitos. Plano de contingência: R$ 8.400. Salas de hidratação: R$ 48.000 (6 UBSs)."},
        {"indicador": "Dengue grave — letalidade (meta: ≤ 0,1%)",              "valor": 0.22,  "meta": 0.1,   "unidade": "%",    "status": "critico", "observacao": "0,22% (2,2× a meta). 4 óbitos. Hematócrito portátil + SF 0,9% em todas UBSs. 1 óbito evitado: R$ 280k de UTI."},
        {"indicador": "Zika em gestantes (meta: zero)",                        "valor": 28,    "meta": 0,     "unidade": "casos","status": "critico", "observacao": "28 gestantes com Zika. 4 casos de microcefalia 2023-25. Mosquiteiro impregnado + repelente DEET 15% (seguro na gestação). RT-PCR: LACEN-AM."},
        {"indicador": "Chikungunya crônica (estimativa)",                      "valor": 280,   "meta": 0,     "unidade": "casos","status": "critico", "observacao": "280 com artralgia crônica. Hidroxicloroquina (REMUME) + fisioterapia. 1 caso crônico: 6 meses de afastamento = R$ 8.400 auxílio-doença."},
        {"indicador": "Cobertura LIRAA (meta: 100% dos quarteirões)",          "valor": 48.4,  "meta": 100.0, "unidade": "%",    "status": "critico", "observacao": "48,4%. 6 ACEs insuficientes. Tonéis garimpo: 34,8% dos criadouros. Larvitrapa biossensor: R$ 8.400/ano."},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/vetores")
def vetores():
    return _VETORES()


@router.get("/acoes")
def acoes():
    return _ACOES()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()