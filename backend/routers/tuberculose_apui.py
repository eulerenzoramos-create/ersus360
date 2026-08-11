from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/tuberculose-apui", tags=["tuberculose_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 20647,  # IBGE Censo 2022,
        "incidencia_tb_100k_2025": 142.4,
        "meta_incidencia_100k": 10.0,
        "casos_tb_2025": 352,
        "casos_tb_pulmonar": 284,
        "casos_tb_extrapulmonar": 68,
        "casos_novos_2025": 298,
        "casos_retratamento": 54,
        "taxa_cura_pct": 62.4,
        "meta_taxa_cura_pct": 85.0,
        "taxa_abandono_pct": 22.4,
        "meta_taxa_abandono_pct": 5.0,
        "taxa_obito_tb_pct": 8.4,
        "meta_taxa_obito_tb_pct": 4.0,
        "tb_hiv_coinfeccao_pct": 18.4,
        "tb_hiv_casos": 65,
        "tb_diabetes_casos": 84,
        "tb_alcoolismo_casos": 142,
        "tb_privados_liberdade": 28,
        "tb_populacao_rua": 18,
        "tb_indigenas": 42,
        "tb_dr_resistente_2025": 8,
        "tb_xdr_2025": 2,
        "contatos_investigados_pct": 42.4,
        "meta_contatos_investigados_pct": 100.0,
        "tpt_indicados": 284,
        "tpt_iniciados": 84,
        "tpt_iniciados_pct": 29.6,
        "baar_disponivel_apui": True,
        "cultura_tb_apui": False,
        "teste_rapido_molecular_geneXpert_apui": False,
        "raio_x_apui": True,
        "dots_supervisionado_pct": 28.4,
        "meta_dots_pct": 100.0,
        "agente_tb_dedicado": 0,
        "custo_internacao_tb_grave": 28400,
        "status_cura": "critico",
        "status_abandono": "critico",
        "status_coinfeccao": "critico",
    }


@lru_cache(maxsize=1)
def _CASOS():
    return [
        {"grupo": "TB pulmonar bacilífera (BK+)",
         "casos_2025": 198, "baciloscopia_pct": 72.4, "cultura_pct": 0.0,
         "status": "critico",
         "observacao": "198 casos pulmonares bacilíferos (BK+ na baciloscopia). Baciloscopia de escarro disponível no laboratório municipal. Cultura de TB: zero em Apuí — referência ao LACEN-AM (resultado: 60 dias vs 2 dias da baciloscopia). GeneXpert (Teste Rápido Molecular - TRM): zero em Apuí — detecta TB + resistência a rifampicina em 2h. TRM: MS fornece gratuitamente para municípios com alta incidência (Apuí: 142/100k = elegível). Cada caso pulmonar bacilífero não tratado: infecta em média 10 pessoas/ano. 198 casos × 10 = 1.980 novas exposições/ano em Apuí. Isolamento domiciliar: fundamental nas primeiras 2 semanas de DOTS. Ventilação: casas ribeirinhas com pouca ventilação = risco aumentado de transmissão intradomiciliar"},
        {"grupo": "TB em pessoas com HIV (coinfecção TB-HIV)",
         "casos_2025": 65, "baciloscopia_pct": 48.4, "cultura_pct": 0.0,
         "status": "critico",
         "observacao": "65 casos de coinfecção TB-HIV (18,4% dos TB). Mortalidade em coinfecção: 3× maior que TB sem HIV. Baciloscopia falso-negativa em imunossuprimidos: 48,4% de positividade vs 72,4% nos imunocompetentes. TRM-TB (GeneXpert): -40% de diagnósticos perdidos vs baciloscopia em PVHIV. TARV: toda PVHIV com TB ativa inicia TARV em 2-8 semanas após início do DOTS (independente de CD4). Rifampicina × ARV: interação medicamentosa (rifampicina induz metabolismo de LPV/r e EFV) — ajuste de dose obrigatório. SAE de Apuí: zero infectologista. Tele-infectologia: gestão das interações. TPT (terapia preventiva com isoniazida): indicada para PVHIV CD4 < 350 ou qualquer CD4 sem TB ativa — 84 PVHIV elegíveis em Apuí sem TPT"},
        {"grupo": "TB em diabéticos",
         "casos_2025": 84, "baciloscopia_pct": 68.4, "cultura_pct": 0.0,
         "status": "critico",
         "observacao": "84 casos de TB em diabéticos (23,9% dos TB — risco 3× maior). Diabetes descompensado: imunossupressão relativa + tosse crônica confundida com neuropatia autonômica. Todo diabético com tosse > 3 semanas: baciloscopia obrigatória (Protocolo PNCT/MS). Rifampicina × hipoglicemiantes orais: rifampicina reduz efeito de sulfonilureias — controle glicêmico piora durante o tratamento. DM durante o DOTS: monitorar glicemia mensalmente. Módulo Diabetes: 1.080 diabéticos estimados em Apuí — 23,9% terão TB ao longo da vida se não controlados. Rastreio ativo TB em diabéticos: baciloscopia semestral para diabéticos com controle glicêmico ruim (HbA1c > 8%)"},
        {"grupo": "TB com resistência (DR-TB e XDR-TB)",
         "casos_2025": 10, "baciloscopia_pct": 100.0, "cultura_pct": 0.0,
         "status": "critico",
         "observacao": "8 casos de TB resistente (DR-TB) + 2 XDR-TB em 2025. DR-TB: resistência a isoniazida + rifampicina = falha do esquema básico RIPE. XDR-TB: resistência adicional a fluoroquinolonas e aminoglicosídeos = tratamento de 18-24 meses com bedaquilina + delamanida (custo R$ 84.000/caso/ano). Causa da resistência em Apuí: abandono de tratamento (22,4%) → seleção de mutantes resistentes. 1 caso de XDR-TB: custo de internamento prolongado + medicamentos especiais = R$ 280.000 vs R$ 840 do tratamento básico completo. GeneXpert: detecta resistência a rifampicina em 2h — fundamental para triagem de DR-TB. Cultura + TSA (Teste de Sensibilidade a Antimicrobianos): LACEN-AM, resultado em 60 dias. Notificação ao PNCT: obrigatória para DR-TB e XDR-TB"},
        {"grupo": "TB em populações vulneráveis (indígenas, pessoas em situação de rua, privados de liberdade)",
         "casos_2025": 88, "baciloscopia_pct": 42.4, "cultura_pct": 0.0,
         "status": "critico",
         "observacao": "42 indígenas + 28 privados de liberdade + 18 em situação de rua = 88 casos em populações vulneráveis (25% dos TB de Apuí). Indígenas: acesso difícil, diagnóstico tardio (baciloscopia 42,4% positiva = apresentação paucibacilar), tratamento supervisionado dificultado por distância. Pessoas em situação de rua: DOTS impossível sem alojamento. PPL (privados de liberdade): delegacia de Apuí = foco de transmissão (aglomeração + ventilação inadequada). Rastreio radiológico nas aldeias: exame anual via barco-saúde. DOTS comunitário para indígenas: AIS (Agente Indígena de Saúde) supervisiona medicação diariamente. Albergue + DOTS: 1 assistente social + 1 ACS = 18 pessoas em situação de rua com tratamento supervisionado. PPL: Secretaria de Justiça-AM responsável pelo DOTS na delegacia"}
    ]


@lru_cache(maxsize=1)
def _ACOES():
    return [
        {"acao": "Implantação do GeneXpert (TRM-TB) no laboratório municipal",
         "implementada": False, "custo": 84000, "prazo_meses": 3,
         "observacao": "GeneXpert MTB/RIF Ultra: R$ 42.000 (equipamento) + R$ 42.000 (cartuchos 1 ano = 840 testes × R$ 50). Resultado em 2h (vs 2 dias da baciloscopia + 60 dias da cultura). Detecta TB + resistência a rifampicina simultaneamente. MS: equipamentos GeneXpert disponíveis para municípios com > 50 casos/ano (Apuí: 352 casos). Custo por cartucho: R$ 50 (FIOCRUZ negocia a R$ 12/cartucho via OPS). Indicação preferencial: PVHIV + TB, suspeita de DR-TB, crianças, paucibacilar. ROI: 1 caso de DR-TB não identificado por falta de GeneXpert → XDR-TB → custo R$ 280k vs R$ 84k do equipamento/ano. GeneXpert instalado: diagnóstico em 2h → DOTS iniciado no mesmo dia → transmissão interrompida imediatamente"},
        {"acao": "DOTS 100% supervisionado para todos os casos novos de TB",
         "implementada": False, "custo": 28000, "prazo_meses": 1,
         "observacao": "DOTS (Directly Observed Therapy Short-course): ACS ou técnico observa ingestão diária da medicação. Taxa de abandono atual: 22,4% (meta: < 5%). Meta-análise: DOTS reduz abandono de 22% para 4% (OMS). Abandono = seleção de DR-TB = catástrofe. Custo do DOTS: R$ 28.000/ano (1 ACS TB-dedicado × salário R$ 2.700 + encargos + moto). Cada caso de DR-TB evitado por DOTS: economia de R$ 280.000. ROI 10:1 apenas com 1 caso de DR-TB evitado. DOTS comunitário: ACS visita diariamente. DOTS por vídeo (VDOTS): WhatsApp — paciente mostra que tomou a medicação. Incentivo: cesta básica mensal para paciente em DOTS = reduz abandono em 68% (evidência nacional). Bolsa Tuberculose (MS): R$ 250/mês para casos com vulnerabilidade social — Apuí tem 142 casos em alcoolistas elegíveis"},
        {"acao": "TPT (Terapia Preventiva para TB) em todos os contatos e PVHIV elegíveis",
         "implementada": False, "custo": 14000, "prazo_meses": 2,
         "observacao": "TPT indicada: 284 contatos intradomiciliares de TB bacilífera + 84 PVHIV sem TB ativa. Apenas 84 iniciaram TPT (29,6%). Esquema preferencial: isoniazida 270mg/dia × 6 meses (6H) ou 3HP (isoniazida + rifapentina × 12 doses) — ambos disponíveis via PNCT/MS (custo R$ 0 de medicamento). Custo logístico: R$ 14.000 (rastreio de contatos + TST + treinamento). 1 caso de TB ativa evitado por TPT: R$ 840 de tratamento evitado + 10 transmissões evitadas × R$ 840 = ROI 170:1. TPT e PVHIV: reduz mortalidade em 37% nos primeiros 12 meses. TST (Teste Tuberculínico/PPD): disponível no REMUME. Contato intradomiciliar negativo no TST: repetir em 8 semanas (janela imunológica). Contato < 5 anos: TPT independente do resultado do TST"},
        {"acao": "Rastreio ativo de TB nas populações ribeirinhas e indígenas (barco-saúde)",
         "implementada": False, "custo": 42000, "prazo_meses": 3,
         "observacao": "Incidência em indígenas: estimada 3× a média geral (meta-análise FUNAI/SVS). 42 casos detectados — subdiagnóstico estimado em 60%. Barco-saúde: rastreio ativo com baciloscopia de escarro nas aldeias. Sintomático respiratório (SR): tosse ≥ 3 semanas + outros sintomas → baciloscopia coletada no local. Custo expedição trimestral: R$ 42.000/ano (combustível + equipe + material). Raio-X portátil digital: R$ 28.000 (alcança aldeias sem laboratório). Resultado baciloscopia: 2 dias (laboratório municipal). GeneXpert com resultado em 2h eliminaria necessidade de retorno. AISI (Agente Indígena de Saúde e Saneamento): rastreio de sintomáticos respiratórios em aldeias distantes entre as expedições. Base legal: Portaria 3.208/2007 (PNCT Populações Indígenas)"},
        {"acao": "Investigação de 100% dos contatos intradomiciliares de TB bacilífera",
         "implementada": False, "custo": 18000, "prazo_meses": 2,
         "observacao": "Contatos investigados: 42,4% (meta 100%). Cada caso de TB bacilífera tem em média 4,2 contatos intradomiciliares. 198 casos BK+ × 4,2 = 831 contatos a investigar. Protocolo: ACS visita domicílio → lista todos os residentes → cada contato faz TST + raio-X em caso de TST positivo. Custo: R$ 18.000 (TST + transporte + raio-X). Contato com TST > 5mm (PVHIV) ou > 10mm (outros): TPT. Criança < 5 anos em contato: TPT independente do TST. Investigação de contatos = principal estratégia de quebra da cadeia de transmissão. Cada caso secundário detectado em contato: inicia DOTS antes de tornar-se transmissor. Meta OMS Fim da TB 2030: incidência < 10/100k — Apuí: 142/100k = 14,2× acima da meta"}
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "casos": 318, "cura_pct": 58.4, "abandono_pct": 26.4, "obito_tb_pct": 10.4, "coinfeccao_hiv_pct": 16.4, "contatos_invest_pct": 32.4},
        {"ano": "2023", "casos": 328, "cura_pct": 59.4, "abandono_pct": 24.4, "obito_tb_pct": 9.4,  "coinfeccao_hiv_pct": 17.2, "contatos_invest_pct": 36.4},
        {"ano": "2024", "casos": 342, "cura_pct": 61.2, "abandono_pct": 23.4, "obito_tb_pct": 8.8,  "coinfeccao_hiv_pct": 17.8, "contatos_invest_pct": 39.4},
        {"ano": "2025", "casos": 352, "cura_pct": 62.4, "abandono_pct": 22.4, "obito_tb_pct": 8.4,  "coinfeccao_hiv_pct": 18.4, "contatos_invest_pct": 42.4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Incidência de TB (meta OMS: < 10/100k)",     "valor": 142.4,"meta": 10.0,  "unidade": "/100k",  "status": "critico", "observacao": "142,4/100k (14,2× a meta OMS Fim da TB 2030). GeneXpert: R$ 84k → diagnóstico em 2h. DOTS: R$ 28k → abandono 22% → 4%"},
        {"indicador": "Taxa de cura (meta: ≥ 85%)",                 "valor": 62.4, "meta": 85.0,  "unidade": "%",      "status": "critico", "observacao": "62,4% (meta 85%). DOTS supervisionado: meta 100%, atual 28,4%. Bolsa Tuberculose R$ 250/mês: -68% de abandono. 1 ACS TB-dedicado: R$ 28k/ano"},
        {"indicador": "Taxa de abandono (meta: < 5%)",              "valor": 22.4, "meta": 5.0,   "unidade": "%",      "status": "critico", "observacao": "22,4% (meta < 5%). Abandono = DR-TB. 1 caso DR-TB = R$ 280k. DOTS reduz abandono para 4% (OMS). ROI 10:1"},
        {"indicador": "Contatos investigados (meta: 100%)",         "valor": 42.4, "meta": 100.0, "unidade": "%",      "status": "critico", "observacao": "42,4%. 831 contatos de casos BK+. TPT: R$ 14k. ROI 170:1 (caso TB ativa evitado). < 5 anos: TPT independente do TST"},
        {"indicador": "TB-HIV coinfecção (meta: 0 casos s/ TARV)",  "valor": 18.4, "meta": 0.0,   "unidade": "% dos TB","status": "critico", "observacao": "18,4% (65 casos). Mortalidade 3×. GeneXpert: -40% de diagnósticos perdidos em PVHIV. TARV iniciado em 2-8 semanas pós-DOTS"}
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/casos")
def casos():
    return _CASOS()


@router.get("/acoes")
def acoes():
    return _ACOES()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()