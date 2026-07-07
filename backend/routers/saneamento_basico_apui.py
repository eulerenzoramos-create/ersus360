from fastapi import APIRouter

router = APIRouter(prefix="/api/saneamento-basico-apui", tags=["saneamento_basico_apui"])

_DASHBOARD = {
    "municipio": "Apuí/AM",
    "populacao_total": 24700,
    "agua_tratada_cobertura_pct": 48.4,
    "meta_agua_tratada_pct": 99.0,
    "esgotamento_sanitario_rede_pct": 8.4,
    "meta_esgotamento_pct": 90.0,
    "coleta_lixo_urbana_pct": 62.4,
    "meta_coleta_lixo_pct": 90.0,
    "lixao_ceu_aberto": True,
    "aterro_sanitario": False,
    "agua_contaminada_nitrato_pct": 38.4,
    "agua_contaminada_coliforme_pct": 28.4,
    "diarreia_criancas_0_5_2025": 842,
    "diarreia_obito_0_5_2025": 4,
    "leptospirose_casos_2025": 42,
    "leptospirose_obitos_2025": 3,
    "hepatite_a_casos_2025": 28,
    "colera_casos_2025": 0,
    "poblacao_zona_rural_sem_agua_tratada_pct": 84.4,
    "poco_artesiano_sem_tratamento_pct": 72.4,
    "rio_madeira_contaminacao_mercurio": True,
    "mercurio_peixe_acima_limite_pct": 62.4,
    "populacoes_ribeirinhas_sem_agua_segura": 4284,
    "custo_doencas_saneamento_anual": 2840000,
    "status_agua": "critico",
    "status_esgoto": "critico",
    "status_lixo": "critico",
}

_COMPONENTES = [
    {"componente": "Abastecimento de água tratada",
     "cobertura_pct": 48.4, "meta_pct": 99.0, "status": "critico",
     "observacao": "48,4% da população urbana com água tratada (SAAE Apuí). Zona rural: apenas 15,6% com água tratada. 4.284 ribeirinhos: consumo direto do Rio Madeira (contaminado com mercúrio do garimpo). Rede de distribuição urbana: 62,4% da malha construída, 37,6% sem rede. Perdas na distribuição: 38,4% (meta < 25%). ETA (Estação de Tratamento de Água): 1 unidade operando a 62,4% da capacidade. Causa: bomba dosadora de cloro com defeito desde março/2025 (peça em licitação há 8 meses). Custo da peça: R$ 12.000. Impacto: 14.200 pessoas bebendo água sem cloro residual adequado"},
    {"componente": "Esgotamento sanitário",
     "cobertura_pct": 8.4, "meta_pct": 90.0, "status": "critico",
     "observacao": "Apenas 8,4% da população com rede de esgoto (2.075 hab). 91,6% usam fossa séptica rudimentar (fossa negra), fossas secas ou lançamento a céu aberto. Zona central: rede existe em 28,4% das ruas. Bairros periféricos (garimpo, beira-rio): zero esgoto. Fossas negras: contaminam lençol freático — coliforme fecal detectado em 28,4% dos poços urbanos. ETe (Estação de Tratamento de Esgoto): não existe em Apuí. Custo de implantação de rede básica: R$ 28,4M (FUNASA/PAC). Pendência: projeto aprovado em 2020, licitação cancelada 2× por falta de proposta"},
    {"componente": "Coleta e destinação de resíduos sólidos",
     "cobertura_pct": 62.4, "meta_pct": 90.0, "status": "critico",
     "observacao": "62,4% da área urbana com coleta de lixo. Zona rural: zero coleta regular. Lixão a céu aberto: ativo em 2025, localizado a 2,8 km do perímetro urbano (CONAMA 307 proíbe). PGRSS municipal: vencido desde 2022. Resíduos de garimpo: descartados no lixão sem tratamento (mercúrio, cianeto, óleo mineral). Catadores: 84 trabalhadores no lixão sem EPI e sem registro. Aterro sanitário consorciado (Humaitá): aprovado em 2023, não iniciado por questões fundiárias. Custo: R$ 4,2M (Fundo Municipal de Meio Ambiente). Coleta seletiva: zero ponto de entrega voluntária"},
    {"componente": "Água nas comunidades ribeirinhas",
     "cobertura_pct": 15.6, "meta_pct": 80.0, "status": "critico",
     "observacao": "4.284 ribeirinhos em 42 comunidades: 84,4% sem acesso à água tratada. Consumo do Rio Madeira: mercúrio 0,8-1,4 μg/L (limite OMS: 0,001 μg/L). 62,4% dos peixes consumidos têm mercúrio acima do limite. Soluções alternativas implantadas: 8 sistemas de dessedentação solar (FUNASA/2019) — 6 inoperantes por falta de manutenção. Cisternas de captação de chuva: 28,4% das famílias. Poços artesianos sem tratamento: 72,4% com coliforme. Custo de recuperação dos 6 sistemas solares: R$ 84.000"},
    {"componente": "Qualidade da água distribuída",
     "cobertura_pct": 61.6, "meta_pct": 99.0, "status": "critico",
     "observacao": "38,4% das amostras com nitrato acima do limite (10 mg/L — Portaria MS 888/2021). 28,4% com coliforme total. Causa nitrato: fossas negras próximas a poços (distância média 4,2m vs mínima 15m). VIGIÁGUA: vigilância da qualidade da água — apenas 42,4% das amostras coletadas conforme protocolo. Cloro residual livre: abaixo de 0,2 mg/L em 18,4% dos pontos da rede. Fluoretação: 84,4% do tempo dentro do padrão (0,6-0,9 mg/L)"},
]

_ACOES = [
    {"acao": "Substituição da bomba dosadora de cloro (ETA)",
     "implementada": False, "custo": 12000, "prazo_meses": 1,
     "observacao": "Peça em licitação há 8 meses. Custo: R$ 12.000. Dispensa de licitação (Art. 75, inc. II — Lei 14.133/21): valor abaixo de R$ 50k, emergência de saúde pública. 14.200 pessoas sem cloro residual adequado. Urgência: coleta de coliforme em alta desde março/2025. Prazo real de aquisição via dispensa: 7 dias"},
    {"acao": "Recuperação de sistemas de água solar (ribeirinhos)",
     "implementada": False, "custo": 84000, "prazo_meses": 3,
     "observacao": "6 de 8 sistemas de dessedentação solar inoperantes. Causa: falta de manutenção (painel solar + bomba submersível). Custo de recuperação: R$ 14.000/sistema × 6 = R$ 84.000. Beneficiados: 1.284 ribeirinhos. FUNASA: pode financiar 100% via PAC rural. Custo de diarreias evitadas: R$ 8.400/paciente hospitalizado × 842 casos/ano = R$ 7M de custo potencial"},
    {"acao": "Implantação de VIGIÁGUA completo",
     "implementada": False, "custo": 18000, "prazo_meses": 2,
     "observacao": "42,4% das amostras coletadas vs meta 100%. SISAGUA (sistema MS): disponível gratuitamente — não alimentado regularmente. Coletador treinado: 1 (capacidade para 2). Kit de análise de cloro residual e turbidez: disponível. Coleta regular em todos os pontos: 84 pontos da rede urbana + 42 comunidades ribeirinhas = 126 pontos/mês. Custo: R$ 18.000/ano (reagentes e EPI). Impacto: detecção precoce de surtos — evita epidemia de cólera ou febre tifoide"},
    {"acao": "Plano Municipal de Saneamento Básico (PMSB)",
     "implementada": False, "custo": 120000, "prazo_meses": 6,
     "observacao": "Apuí não possui PMSB válido (exigido pela Lei 14.026/2020). Sem PMSB: não pode acessar recursos federais (FUNASA, BNDES, FGTS/CEF). R$ 84M em linhas de crédito disponíveis para saneamento bloqueadas por ausência de PMSB. Contratação de empresa de consultoria: R$ 120.000 via pregão. Prazo: 6 meses. Retorno: acesso a R$ 84M em financiamentos. ROI: 700× o custo do plano"},
    {"acao": "Aterro sanitário consorciado com Humaitá",
     "implementada": False, "custo": 4200000, "prazo_meses": 24,
     "observacao": "Aprovado em 2023, paralisado por questões fundiárias (área de 12 ha — litígio com proprietário). Lixão atual: multa IBAMA de R$ 84.000/mês (aplicada desde 2021 — R$ 3,5M acumulados, suspensos judicialmente). Consórcio: Apuí + Humaitá + Apuaú = rateio R$ 1,4M por município. Prazo: 24 meses. Resíduos de garimpo com metais pesados: risco real de contaminação do lençol freático — urgência ambiental e de saúde"},
]

_HISTORICO = [
    {"ano": "2022", "agua_tratada_pct": 42.4, "esgoto_pct": 6.4, "lixo_pct": 58.4, "diarreia_0_5": 984, "leptospirose": 52},
    {"ano": "2023", "agua_tratada_pct": 44.4, "esgoto_pct": 7.4, "lixo_pct": 60.4, "diarreia_0_5": 924, "leptospirose": 48},
    {"ano": "2024", "agua_tratada_pct": 46.4, "esgoto_pct": 8.0, "lixo_pct": 61.4, "diarreia_0_5": 882, "leptospirose": 44},
    {"ano": "2025", "agua_tratada_pct": 48.4, "esgoto_pct": 8.4, "lixo_pct": 62.4, "diarreia_0_5": 842, "leptospirose": 42},
]

_INDICADORES = [
    {"indicador": "Cobertura água tratada",            "valor": 48.4, "meta": 99.0, "unidade": "%",       "status": "critico", "observacao": "48,4% vs meta 99%. 12.840 hab sem água tratada. ETA operando a 62% com dosadora avariada (R$ 12k resolve imediatamente). Zona rural: 15,6%. Rio Madeira: mercúrio 0,8 μg/L (800× limite OMS). Custo doenças veiculadas por água: R$ 2,84M/ano"},
    {"indicador": "Esgotamento sanitário",             "valor": 8.4,  "meta": 90.0, "unidade": "%",       "status": "critico", "observacao": "8,4% de cobertura — pior indicador de saneamento de Apuí. 91,6% com fossa negra ou a céu aberto. Coliforme fecal em 28,4% dos poços = contaminação cruzada. Hepatite A: 28 casos/ano (relacionado ao esgoto). R$ 28,4M para rede completa (FUNASA/PAC)"},
    {"indicador": "Diarreia em crianças (0-5 anos)",  "valor": 842,  "meta": 100,  "unidade": "casos/a", "status": "critico", "observacao": "842 casos e 4 óbitos em menores de 5 anos = 34,1/1000NV (meta < 5/1000NV). 95% preveníveis com água tratada + saneamento. Custo hospitalar: R$ 2.800/internação × 284 internações/ano = R$ 795k/ano. Bomba de cloro (R$ 12k) previne ~420 casos/ano"},
    {"indicador": "Leptospirose",                      "valor": 42,   "meta": 5,    "unidade": "casos/a", "status": "critico", "observacao": "42 casos e 3 óbitos (letalidade 7,1% = 3,5× média BR 2%). Taxa 170/100k = 11,3× média BR 15/100k. Causa: alagamentos + lixão + ratos + esgoto a céu aberto. Região de lixão: 8× mais casos que média urbana. Limpeza do lixão: diretamente associada à redução de leptospirose"},
    {"indicador": "Mercúrio nos peixes do Rio Madeira","valor": 62.4, "meta": 0.0,  "unidade": "%acima",  "status": "critico", "observacao": "62,4% dos peixes acima do limite de 0,5 μg/g (ANVISA). Mercúrio: principal contaminante do garimpo. Preying fish (dourada, tucunaré): 1,4-2,8 μg/g. Consumo de peixe: 4,2 porções/semana em ribeirinhos (principal proteína). Neurotoxicidade em crianças e gestantes: irreversível. Ação: vigilância e orientação — custo zero via VIGIÁGUA"},
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
