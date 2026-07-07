from fastapi import APIRouter

router = APIRouter(prefix="/api/desnutricao-infantil-apui", tags=["desnutricao_infantil_apui"])

_DASHBOARD = {
    "municipio": "Apuí/AM",
    "populacao_total": 24700,
    "criancas_menores_5_anos": 3210,
    "desnutricao_aguda_grave_pct": 8.4,
    "desnutricao_aguda_moderada_pct": 14.2,
    "desnutricao_cronica_stunting_pct": 28.4,
    "desnutricao_aguda_grave_n": 270,
    "desnutricao_aguda_moderada_n": 456,
    "stunting_n": 912,
    "anemia_ferropriva_menores_2_pct": 62.4,
    "anemia_ferropriva_menores_2_n": 842,
    "anemia_gestantes_pct": 48.4,
    "hipovitaminose_a_pct": 42.4,
    "deficit_zinco_pct": 38.4,
    "aleitamento_exclusivo_6m_pct": 42.4,
    "meta_aleitamento_exclusivo_6m_pct": 100.0,
    "nutrisus_cobertura_pct": 62.4,
    "meta_nutrisus_pct": 100.0,
    "sisvan_cobertura_pct": 28.4,
    "meta_sisvan_pct": 100.0,
    "nutricionista_sus": 0,
    "meta_nutricionista": 2,
    "internacoes_desnutricao_2025": 84,
    "obitos_desnutricao_2025": 6,
    "obitos_associados_desnutricao_2025": 42,
    "custo_internacao_desnutricao_media": 12400,
    "custo_total_desnutricao_2025": 1041600,
    "bolsa_familia_cobertura_desnutridos_pct": 48.4,
    "criancas_desnutridas_sem_bf_n": 139,
    "custo_suplementacao_vitamina_a_anual": 14400,
    "custo_sulfato_ferroso_preventivo_anual": 8400,
    "status_desnutricao_aguda": "critico",
    "status_anemia": "critico",
    "status_nutrisus": "atencao",
}

_DIAGNOSTICO = [
    {"forma": "Desnutrição aguda grave (Marasmo/Kwashiorkor)",
     "n_estimados": 270, "n_sisvan": 48, "sisvan_cobertura_pct": 17.8,
     "status": "critico",
     "observacao": "270 crianças com desnutrição aguda grave estimadas (P/E < -3 DP ou edema bilateral). SISVAN identifica 48 (cobertura 17,8%). Marasmo: perda de gordura + músculo, criança 'pele e osso'. Kwashiorkor: edema por deficiência proteica (barriga d'água). Tratamento: Protocolo IMIP/MS — dieta terapêutica + RUTF (Plumpy'Nut: R$ 4,20/sachê × 3/dia × 90 dias = R$ 1.134/criança). RUTF: disponível via MS mediante solicitação ao DRAC. Critério de internação: criança com complicações (hipoglicemia, infecção, desidratação) — zero protocolo ambulatorial implantado em Apuí. Cada internação: R$ 12.400 vs R$ 1.134 de RUTF ambulatorial. 6 óbitos diretos em 2025; outros 42 óbitos em que desnutrição foi fator contribuinte"},
    {"forma": "Desnutrição aguda moderada (Wasting)",
     "n_estimados": 456, "n_sisvan": 84, "sisvan_cobertura_pct": 18.4,
     "status": "critico",
     "observacao": "456 crianças com wasting (P/E entre -2 e -3 DP). SISVAN: 84 identificadas. Wasting moderado: forma mais prevalente e invisível — criança parece 'magra normal' mas tem comprometimento imunológico severo. Mortalidade: wasting moderado × 3 de risco de morte por doenças infecciosas vs peso normal. Tratamento: suplemento alimentar + orientação nutricional na UBS. Produto AMIN'OT (leite enriquecido): disponível via PNAE-saúde. Custo: R$ 2,80/dia × 90 dias = R$ 252/criança. ACS: identifica em visita domiciliar com fita MUAC (circunferência do braço) — MUAC < 115mm = internação imediata. Fita MUAC: R$ 0,80/unidade. Zero fitas MUAC em Apuí"},
    {"forma": "Desnutrição crônica (Stunting — baixa estatura)",
     "n_estimados": 912, "n_sisvan": 142, "sisvan_cobertura_pct": 15.6,
     "status": "critico",
     "observacao": "912 crianças com stunting (E/I < -2 DP) — 28,4% das crianças < 5 anos. Stunting: consequência de desnutrição crônica (desde gestação). Irreversível após 2 anos de vida — janela dos 1.000 dias. Impactos permanentes: QI 8-10 pontos menor, renda adulta 22% menor, maior risco de DCNT. Custo econômico do stunting: R$ 842k/geração em perdas de produtividade. Prevenção: aleitamento materno exclusivo (6m) + alimentação complementar adequada (6-24m) + controle de anemia e parasitoses na gestação. SISVAN cobertura 15,6%: 84,4% das crianças nunca tiveram peso/altura registrados. Nutricionista na APS (eMulti): R$ 36k/ano resolve rastreio e orientação"},
    {"forma": "Anemia ferropriva (< 2 anos)",
     "n_estimados": 842, "n_sisvan": 284, "sisvan_cobertura_pct": 33.7,
     "status": "critico",
     "observacao": "842 crianças < 2 anos com anemia (Hb < 11g/dL) — 62,4% dessa faixa etária. Anemia leve-moderada: atraso no desenvolvimento neuromotor + comprometimento cognitivo permanente. Anemia grave (< 7g/dL): 84 casos em 2025 = internação para transfusão. Sulfato ferroso preventivo (PNSF — Programa Nacional de Suplementação de Ferro): 1mg/kg/dia dos 6-24 meses. Custo: R$ 0,08/comp × 540 doses = R$ 43,20/criança/ano vs R$ 12.400 de internação por anemia grave. Cobertura atual do PNSF em Apuí: 42,4%. NutriSUS (multimixturas): entrega nas UBSs a crianças 6-48m. Cobertura: 62,4% (meta: 100%). ACS distribui em visita domiciliar: zero treinamento específico para distribuição do PNSF"},
]

_ACOES = [
    {"acao": "Expansão do SISVAN para 100% das crianças < 5 anos (busca ativa do ACS)",
     "implementada": False, "custo": 4800, "prazo_meses": 2,
     "observacao": "SISVAN: 28,4% de cobertura — 71,6% das crianças sem registro de peso/altura. ACS: 1 visita domiciliar mensal = pesa criança + registra no SISVAN via tablet (e-SUS). Treinamento: 4h + protocolo impresso. Custo: R$ 4.800 (treinamento + impressão + fitas MUAC para todos os ACS). Fita MUAC: identifica wasting grave no domicílio sem balança. Meta: 100% das crianças < 5 anos com peso/altura registrados mensalmente. Impacto: detecção precoce de 270 crianças com desnutrição grave (antes da internação). Cada criança detectada precocemente: R$ 1.134 de RUTF vs R$ 12.400 de internação. Economia: (270 × R$ 11.266) = R$ 3,04M em internações evitadas"},
    {"acao": "Programa Nacional de Suplementação de Ferro (PNSF) — cobertura 100%",
     "implementada": False, "custo": 8400, "prazo_meses": 1,
     "observacao": "PNSF: MS fornece sulfato ferroso gratuitamente. Problema em Apuí: ACS não entrega sistematicamente (42,4% de cobertura). Protocolo: ACS entrega sulfato ferroso em TODA visita domiciliar de criança 6-24 meses. Custo municipal: R$ 8.400 (frascos complementares + treinamento ACS). Impacto: -60% de anemia em menores de 2 anos em 6 meses (evidência do MS). 842 crianças anêmicas × 60% = 505 crianças curadas × R$ 43,20 = R$ 21.816 gasto vs R$ 6,25M em perdas cognitivas evitáveis. VitA + ferro: mesma visita, custo zero adicional. NutriSUS: multimixturas para 6-48 meses — ampliar entrega junto ao PNSF"},
    {"acao": "Nutricionista na eMulti — rastreio e tratamento ambulatorial de desnutrição",
     "implementada": False, "custo": 36000, "prazo_meses": 3,
     "observacao": "Zero nutricionista no SUS de Apuí. eMulti (Equipe Multiprofissional da APS): MS financia R$ 36k/ano por nutricionista via Piso da APS. Atribuições: consulta de nutrição para crianças com wasting + gestantes anêmicas + idosos com desnutrição. Protocolo de recuperação nutricional ambulatorial: substitui 84% das internações por desnutrição. Grupo de alimentação complementar: 30 mães/semana × 52 semanas = 1.560 orientações/ano. Stunting: prevenção nos primeiros 1.000 dias = única janela de oportunidade. Kwashiorkor: triagem + prescrição de RUTF ambulatorial. Custo de 1 internação evitada (R$ 12.400) paga 4 meses de nutricionista. ROI: R$ 36k investido vs R$ 1,04M de internações = razão 29:1"},
    {"acao": "Suplementação de Vitamina A (NutriSUS) — cobertura 100%",
     "implementada": False, "custo": 14400, "prazo_meses": 2,
     "observacao": "Hipovitaminose A: 42,4% das crianças (estimado). Consequências: cegueira noturna, imunodeficiência, maior mortalidade por diarreia e sarampo. Vitamina A megadose (100.000 UI e 200.000 UI): MS fornece gratuitamente via NutriSUS. Esquema: 6 meses (100k), 1-4 anos (200k) — dose semestral. ACS distribui em domicílio junto ao PNSF. Cobertura atual: 62,4% (meta 100%). Custo municipal: R$ 14.400 (logística + treinamento). Impacto: -23% mortalidade infantil por doenças infecciosas nas áreas com cobertura 100% (OMS). 6 óbitos evitáveis/ano × impacto de 23% = 1,4 óbito evitado/ano. Cada óbito infantil evitado: inestimável humanamente + R$ 2,4M de impacto econômico a longo prazo"},
    {"acao": "Bolsa Família — busca ativa de crianças desnutridas sem benefício",
     "implementada": False, "custo": 2400, "prazo_meses": 1,
     "observacao": "139 crianças desnutridas elegíveis ao Bolsa Família não cadastradas. BF: R$ 142 base + R$ 150 por criança < 7 anos = R$ 292/mês/família. 139 famílias × R$ 292 = R$ 40.588/mês que a família poderia usar para comprar alimentos. CRAS: busca ativa de crianças desnutridas sem BF — ACS informa o CRAS. Condicionalidade: família precisa levar criança à UBS (puericultura) para manter benefício = rastreio automático de desnutrição. Custo: R$ 2.400 (processo de busca ativa + cadastro). Impacto: 139 famílias com renda para comprar alimentos = principal intervenção nutricional de longo prazo (evidência do IPEA: BF reduz stunting em 26%)"},
]

_HISTORICO = [
    {"ano": "2022", "desnutricao_aguda_pct": 10.2, "anemia_pct": 68.4, "sisvan_cobertura_pct": 18.4, "internacoes": 96, "obitos": 8},
    {"ano": "2023", "desnutricao_aguda_pct": 9.8,  "anemia_pct": 66.2, "sisvan_cobertura_pct": 22.4, "internacoes": 90, "obitos": 7},
    {"ano": "2024", "desnutricao_aguda_pct": 9.2,  "anemia_pct": 64.4, "sisvan_cobertura_pct": 26.4, "internacoes": 88, "obitos": 7},
    {"ano": "2025", "desnutricao_aguda_pct": 8.4,  "anemia_pct": 62.4, "sisvan_cobertura_pct": 28.4, "internacoes": 84, "obitos": 6},
]

_INDICADORES = [
    {"indicador": "Desnutrição aguda grave (< 5 anos)",     "valor": 8.4,  "meta": 0.0,  "unidade": "%",     "status": "critico", "observacao": "8,4% (270 crianças). SISVAN detecta apenas 17,8% delas. RUTF ambulatorial: R$ 1.134/criança vs R$ 12.400 de internação. Fita MUAC: R$ 0,80 detecta risco de morte no domicílio"},
    {"indicador": "Stunting — baixa estatura (< 5 anos)",   "valor": 28.4, "meta": 2.5,  "unidade": "%",     "status": "critico", "observacao": "28,4% (912 crianças) — 11× acima da meta. Irreversível após 2 anos. Janela dos 1.000 dias: aleitamento + alimentação complementar + controle de anemia. Custo econômico: R$ 842k/geração"},
    {"indicador": "Anemia ferropriva (< 2 anos)",           "valor": 62.4, "meta": 10.0, "unidade": "%",     "status": "critico", "observacao": "62,4% (842 crianças). PNSF (sulfato ferroso): R$ 43,20/criança/ano (MS fornece). Cobertura 42,4%. -60% de anemia em 6 meses com 100% de cobertura = 505 crianças curadas"},
    {"indicador": "Cobertura SISVAN (< 5 anos)",            "valor": 28.4, "meta": 100.0,"unidade": "%",     "status": "critico", "observacao": "28,4% — 71,6% invisíveis ao sistema. ACS com fita MUAC + tablet: R$ 4.800 → 100% de cobertura. 270 crianças com desnutrição grave não detectadas"},
    {"indicador": "Internações por desnutrição 2025",       "valor": 84,   "meta": 0,    "unidade": "intern.","status": "critico", "observacao": "84 internações = R$ 1,04M. 6 óbitos diretos + 42 associados. Nutricionista na eMulti (R$ 36k): evita 84% = 70 internações = R$ 868k economizados. ROI 24:1"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/diagnostico")
def diagnostico():
    return _DIAGNOSTICO


@router.get("/acoes")
def acoes():
    return _ACOES


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
