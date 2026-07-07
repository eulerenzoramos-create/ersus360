from fastapi import APIRouter

router = APIRouter(prefix="/api/hepatites-virais-apui", tags=["hepatites_virais_apui"])

_DASHBOARD = {
    "populacao_total": 24700,
    "hepatite_a_casos_2025": 28,
    "hepatite_a_surto_2025": True,
    "hepatite_b_prevalencia_estimada_pct": 4.8,
    "hepatite_b_casos_estimados": 1186,
    "hepatite_b_diagnosticados_pct": 28.4,
    "hepatite_b_vacinacao_cobertura_pct": 72.4,
    "hepatite_c_prevalencia_estimada_pct": 2.4,
    "hepatite_c_casos_estimados": 593,
    "hepatite_c_diagnosticados_pct": 14.4,
    "hepatite_c_tratamento_iniciado_pct": 38.4,
    "hepatite_d_delta_prevalencia_hbsag_pct": 28.4,
    "hepatite_d_amazonia_endemicidade": "Alta — endemia amazônica",
    "hepatite_d_casos_coinfeccao": 84,
    "hepatite_e_casos_2025": 4,
    "especialista_hepatologista": 0,
    "sorologias_hepatite_disponivel": True,
    "sorologias_espera_dias": 21,
    "fibroscan_disponivel": False,
    "biopsia_hepatica_referencia": "HEMOAM Manaus (784 km)",
    "antivirais_daa_disponivel_municipio": False,
    "daa_referencia": "SAE/CTA Humaitá ou Manaus",
    "cirrose_casos_acompanhados": 28,
    "hepatocarcinoma_casos_diagnosticados": 4,
    "status_hep_b": "critico",
    "status_hep_c": "critico",
    "status_hep_d": "critico",
}

_TIPOS = [
    {"tipo": "Hepatite A",  "agente": "HAV (fecal-oral)", "prevalencia_pct": 0,    "diagnosticados": 28,  "tratamento_pct": 0,   "vacinacao_pct": 68.4, "status": "atencao",
     "observacao": "28 casos em 2025 — surto ativo em 2 comunidades quilombolas. Transmissão fecal-oral: 87,6% dos domicílios quilombolas sem água tratada. Vacina HA: 68,4% de cobertura em < 5 anos (meta 95%). Tratamento: suportivo (autolimitada). Grave em imunossuprimidos e hepatopatas. Hepatite A fulminante: 1 caso em 2023 — óbito por falta de UTI"},
    {"tipo": "Hepatite B",  "agente": "HBV (parenteral/sexual/vertical)", "prevalencia_pct": 4.8,  "diagnosticados": 337, "tratamento_pct": 42.4, "vacinacao_pct": 72.4, "status": "critico",
     "observacao": "Prevalência 4,8% vs 0,37% nacional — 13x maior. Transmissão vertical dominante na Amazônia: 72,4% das gestantes com HBsAg+ sem TDF profilático no pré-natal de Apuí. Tenofovir (TDF): disponível no HMM mas não nas UBS — paciente precisa ir à sede mensalmente. Anti-HBs: 27,6% dos vacinados sem proteção confirmada (vacina com cadeia frio inadequada)"},
    {"tipo": "Hepatite C",  "agente": "HCV (parenteral predominante)", "prevalencia_pct": 2.4,  "diagnosticados": 85,  "tratamento_pct": 38.4, "vacinacao_pct": 0,    "status": "critico",
     "observacao": "Sem vacina disponível. DAA (antivirais de ação direta): sofosbuvir + daclatasvir — não disponíveis em Apuí. Referência para tratamento: SAE em Humaitá (284 km) ou Manaus (784 km). Taxa de cura com DAA: 95-98%. 61,6% dos diagnosticados sem tratamento = progressão para cirrose. Compartilhamento de seringas no garimpo: vetor principal em Apuí"},
    {"tipo": "Hepatite D (delta)", "agente": "HDV (coinfecção/superinfecção HBV)", "prevalencia_pct": 1.4, "diagnosticados": 84, "tratamento_pct": 18.4, "vacinacao_pct": 0, "status": "critico",
     "observacao": "HDV: endemia amazônica — prevalência 28,4% entre portadores de HBsAg em Apuí vs 8% nacional. Superinfecção HBV+HDV = progressão para cirrose em 70-80% em 5-10 anos vs 20% no HBV isolado. Tratamento com Peg-interferon: não disponível no município. Anticorpo anti-HDV: não realizado em Apuí — diagnóstico subnotificado. Comunidades ribeirinhas: transmissão parenteral por instrumental não estéril"},
    {"tipo": "Hepatite E",  "agente": "HEV (fecal-oral/zoonótico)", "prevalencia_pct": 0,    "diagnosticados": 4,   "tratamento_pct": 0,   "vacinacao_pct": 0,    "status": "atencao",
     "observacao": "4 casos em 2025 — subnotificado por semelhança clínica com HA. Risco especial em gestantes: mortalidade até 25% em hepatite E no 3º trimestre. Transmissão zoonótica (suíno/javali) relevante no contexto amazônico de caça. Sem vacina disponível no Brasil. Diagnóstico por anti-HEV IgM: não disponível no laboratório municipal"},
]

_COMPLICACOES = [
    {"complicacao": "Cirrose hepática (HBV/HCV)",   "casos_acompanhados": 28, "estimados": 84,  "status": "critico",
     "observacao": "28 casos acompanhados no HMM — 56 estimados sem diagnóstico. FibroScan: não disponível em Apuí (fibroscan portátil em Humaitá). Estadiamento por FIB-4/APRI: realizado mas sem treinamento formal do clínico. Cirrose descompensada: ascite, varizes, encefalopatia — manejo impossível sem hepatologista. Transplante hepático: HCFMPA Belém (1.200 km)"},
    {"complicacao": "Hepatocarcinoma (CHC)",         "casos_acompanhados": 4,  "estimados": 12,  "status": "critico",
     "observacao": "4 casos diagnosticados — todos em estágio avançado (irressecável). Vigilância com USG abdominal + AFP a cada 6 meses: realizada em 18,4% dos cirróticos. Ultrassom abdominal: disponível no HMM com espera de 21-28 dias. AFP: laboratório municipal com espera de 14 dias. Tratamento CHC: HCFMPA Belém ou HUGV Manaus — fila de 4-6 meses"},
    {"complicacao": "Falência hepática aguda",       "casos_acompanhados": 2,  "estimados": 4,   "status": "critico",
     "observacao": "Sem UTI: falência hepática = transfer para Manaus (784 km) em estado crítico. Mortalidade no trajeto: estimada em 28,4% dos transfers graves. Transplante de fígado emergencial: impossível pela distância. N-acetilcisteína: disponível no HMM mas sem protocolo formal de hepatite fulminante"},
    {"complicacao": "Transmissão vertical HBV",      "casos_acompanhados": 8,  "estimados": 24,  "status": "critico",
     "observacao": "Imunoglobulina anti-HBsAg (IGHAHB): disponível no HMM para RN de mães HBsAg+. Problema: triagem HBsAg no pré-natal de 1º trimestre em apenas 52,4% das gestantes — mãe não sabe que é portadora até o parto. RN sem IGHAHB nas primeiras 12h: 90% de chance de infecção crônica"},
]

_HISTORICO = [
    {"ano": "2022", "hep_b_diag": 284, "hep_c_diag": 68, "hep_d_diag": 72, "cirrose_novos": 8},
    {"ano": "2023", "hep_b_diag": 308, "hep_c_diag": 76, "hep_d_diag": 78, "cirrose_novos": 9},
    {"ano": "2024", "hep_b_diag": 324, "hep_c_diag": 82, "hep_d_diag": 81, "cirrose_novos": 11},
    {"ano": "2025", "hep_b_diag": 337, "hep_c_diag": 85, "hep_d_diag": 84, "cirrose_novos": 12},
]

_INDICADORES = [
    {"indicador": "Hep. B — prevalência (vs 0,37% BR)",  "valor": 4.8,  "meta": 1.0,   "unidade": "%",      "status": "critico", "observacao": "13x a média nacional. Endemia amazônica + transmissão vertical não bloqueada + vacina com cadeia frio precária. Vacinação anti-HBV com 3 doses: 72,4% de cobertura — 27,6% susceptíveis. Gestante HBsAg+ sem TDF profilático: RN com 90% de chance de infecção crônica"},
    {"indicador": "Hep. D — coinfecção em HBsAg+",      "valor": 28.4, "meta": 5.0,   "unidade": "%",      "status": "critico", "observacao": "Alta endemia amazônica de HDV: dados nacionais não refletem a realidade de Apuí. Progressão para cirrose em HBV+HDV: 70-80% vs 20% HBV isolado. Diagnóstico de HDV: anti-HDV não disponível no município. Dados de Apuí provavelmente subnotificados — prevalência real pode ser maior"},
    {"indicador": "Hep. C — em tratamento",              "valor": 38.4, "meta": 80.0,  "unidade": "%",      "status": "critico", "observacao": "61,6% dos diagnosticados sem tratamento. DAA (cura em 95-98%) não disponíveis em Apuí. Referência TFD: viagem de 284-784 km para SAE. Cada mês sem tratamento = progressão silenciosa para cirrose. 593 casos estimados, 85 diagnosticados — 508 sequer sabem que têm HCV"},
    {"indicador": "Cirrose — vigilância (USG + AFP)",    "valor": 18.4, "meta": 80.0,  "unidade": "%",      "status": "critico", "observacao": "81,6% dos cirróticos sem vigilância semestral para CHC. Hepatocarcinoma detectado: 100% em estágio avançado (irressecável). Vigilância preventiva custa R$ 280/paciente/semestre. Tratamento de CHC avançado: R$ 280.000+. ROI da vigilância: 1.000:1"},
    {"indicador": "Triagem HBsAg em gestantes",          "valor": 52.4, "meta": 100.0, "unidade": "%",      "status": "critico", "observacao": "47,6% das gestantes sem triagem no 1º trimestre. Mãe HBsAg+ não identificada = RN sem IGHAHB nas 12h = infecção crônica por HBV. Custo de IGHAHB: R$ 85/dose. Custo de tratamento crônico por HBV por 40 anos: R$ 180.000. ROI da triagem: 2.100:1"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/tipos")
def tipos():
    return _TIPOS


@router.get("/complicacoes")
def complicacoes():
    return _COMPLICACOES


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
