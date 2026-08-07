from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/infeccoes-hospitalares-apui", tags=["infeccoes_hospitalares_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 18732,  # IBGE Censo 2022,
        "internacoes_anuais_apui": 2840,
        # IRAS
        "taxa_iras_estimada_pct": 12.4,
        "meta_iras_pct": 3.0,
        "iras_estimadas_2025": 352,
        "obitos_iras_estimados_2025": 28,
        "custo_iras_2025_estimado": 2816000,
        # CCIH
        "ccih_apui": False,
        "programa_controle_infeccao_apui": False,
        "microbiologista_apui": 0,
        "infectologista_apui": 0,
        "farmaceutico_clinico_apui": 0,
        # Estrutura de controle
        "alcool_gel_todas_ubs": False,
        "alcool_gel_cobertura_pct": 62.4,
        "paramentacao_correta_pct": 48.4,
        "higiene_maos_adesao_pct": 38.4,
        "meta_higiene_maos_pct": 80.0,
        "precaucao_contato_protocolo": False,
        # Antibioticoterapia
        "uso_racional_antibiotico_protocolo": False,
        "consumo_carbapenemos_ddd_1000pd": 8.4,
        "resistencia_gram_negativa_pct": 28.4,
        "kpc_casos_2025": 4,
        "mrsa_casos_2025": 8,
        "antibiograma_laboratorio": True,
        # Esterilização
        "autoclave_apui": 2,
        "validacao_autoclave_mensal": False,
        "indicador_biologico_autoclave": False,
        # Vigilância
        "notificacao_iras_sinan": False,
        "bundle_uti_aplicado": False,
        "status_ccih": "critico",
        "status_higiene": "critico",
        "status_resistencia": "critico",
    }


@lru_cache(maxsize=1)
def _TIPOS():
    return [
        {"tipo": "Infecção do Sítio Cirúrgico (ISC)",
         "taxa_estimada_pct": 8.4, "meta_pct": 2.0, "casos_estimados": 168,
         "status": "critico",
         "observacao": "8,4% das cirurgias com ISC (meta ≤ 2%). 2.000 cirurgias/ano estimadas em Apuí. 168 casos de ISC. Custo médio de 1 ISC: R$ 8.000 (antibiótico + reintervenção + internação prolongada). Total: R$ 1,34M. Profilaxia antibiótica cirúrgica: cefazolina 2g IV 30-60 min antes da incisão — protocolo ausente em Apuí. Tricotomia com lâmina (errada): aumenta ISC em 20% vs tricotomia com clipper elétrico. Normotermia intraoperatória: aquecimento do paciente = -40% ISC. Curativo: troca asséptica + técnica correta. CCIH: rastreamento de ISC por tipo de cirurgia. Custo da profilaxia com cefazolina: R$ 2,80/dose vs R$ 8.000/ISC = ROI 2.857:1."},
        {"tipo": "Pneumonia Associada à Ventilação Mecânica (PAV)",
         "taxa_estimada_pct": 18.4, "meta_pct": 5.0, "casos_estimados": 14,
         "status": "critico",
         "observacao": "18,4/1.000 dias de VM (meta ≤ 5/1.000). 14 casos estimados/ano. VM em Apuí: UTI ausente — casos em ventilação no pronto-socorro (transporte até Humaitá). PAV: mortalidade 30-40%. Bundle PAV: cabeceira 30-45°, higiene oral com clorexidina 0,12%, pausa diária de sedação, manejo do balonete (PCP 20-30 cmH2O). Custo: R$ 0 (mudança de protocolo). Clorexidina oral 0,12%: R$ 0,84/dia. PAV evitada: -10 dias de VM = R$ 28.000 por caso. A implementação do bundle em 5 dias úteis: redução de 70% de PAV."},
        {"tipo": "Infecção Primária de Corrente Sanguínea (IPCS) / Cateter central",
         "taxa_estimada_pct": 4.8, "meta_pct": 1.0, "casos_estimados": 8,
         "status": "critico",
         "observacao": "4,8/1.000 cateter-dia (meta ≤ 1/1.000). 8 casos estimados/ano. Cateter central: inserção sem bundle aumenta IPCS em 6×. Bundle inserção cateter: fricção de mãos + barreira máxima + antisséptico clorexidina alcóolica + escolha do sítio (subclávia preferencial). Kit de inserção: luva estéril + campo + máscara = R$ 28/kit. IPCS: mortalidade 15-20%. Custo de 1 IPCS: R$ 42.000 (antibiótico + internação prolongada + complicações). 8 casos/ano = R$ 336.000. Custo do bundle: R$ 28 × 8 inserções mínimas = R$ 224 → ROI 1.500:1."},
        {"tipo": "Infecção do Trato Urinário Associada a Cateter (IUAC)",
         "taxa_estimada_pct": 6.4, "meta_pct": 2.0, "casos_estimados": 84,
         "status": "critico",
         "observacao": "6,4/1.000 cateter-dia (meta ≤ 2/1.000). 84 casos estimados. IUAC: maior IRAS em volume, menor em mortalidade. 80% evitáveis. Bundle: indicação correta (cateterismo apenas quando necessário) + retirada precoce (avaliação diária). Sistema fechado de drenagem: obrigatório (evita contaminação). Custo de sonda vesical sistema fechado: R$ 18 (vs sistema aberto R$ 8). IUAC: 1 episódio = +5 dias de internação = R$ 2.800. 84 casos × R$ 2.800 = R$ 235.200. Bundle IUAC: -80% de casos = economia R$ 188.160/ano vs custo de treinamento R$ 4.200 = ROI 44:1."},
        {"tipo": "Resistência antimicrobiana — KPC e MRSA",
         "taxa_estimada_pct": 3.4, "meta_pct": 0.5, "casos_estimados": 12,
         "status": "critico",
         "observacao": "4 casos de KPC (Klebsiella produtora de carbapenemase) + 8 MRSA em 2025. KPC: mortalidade 50-70%. Antibiótico: polimixina B + meropenem (alto custo) = R$ 28.000/tratamento. MRSA: vancomicina (disponível REMUME). Uso racional de antibióticos: protocolo ausente em Apuí. Carbapenem: prescrito empiricamente sem antibiograma em 28,4% dos casos = seleção de KPC. Antibiograma: laboratório municipal disponível — mas resultado não guia a prescrição. Stewardship de antibióticos: farmacêutico clínico revisando prescrições — zero em Apuí. Custo: R$ 84.000/ano (farmacêutico clínico). Economia: -50% de consumo de carbapenemos = -R$ 280.000/ano. ROI 3,3:1."},
    ]


@lru_cache(maxsize=1)
def _ACOES():
    return [
        {"acao": "Criação da CCIH (Comissão de Controle de Infecção Hospitalar) — obrigatória por lei",
         "implementada": False, "custo": 4200, "prazo_meses": 1,
         "observacao": "CCIH obrigatória pela RDC ANVISA 42/2010 para todo estabelecimento com internação. Custo de criação: R$ 4.200 (ata + resolução + treinamento). CCIH: 1 médico presidente + 1 enfermeiro executor + 1 farmacêutico (pode ser designado). Reunião mensal: análise das taxas de IRAS + intervenção. Sem CCIH: ANVISA pode interditar o estabelecimento. Primeiro relatório: mapear os 5 tipos de IRAS e as taxas brutas em 30 dias."},
        {"acao": "Campanha de higiene de mãos — Programa SAVE LIVES, Clean Your Hands (OMS)",
         "implementada": False, "custo": 8400, "prazo_meses": 2,
         "observacao": "38,4% de adesão à higiene de mãos (meta OMS 80%). 62/100 IRAS evitáveis com higiene correta de mãos. 5 momentos OMS: antes do contato com paciente / antes de procedimento asséptico / após exposição a fluidos / após contato com paciente / após contato com ambiente. Custo: R$ 8.400 (álcool gel + pôsteres + treinamento 2h). Retorno: -62% das 352 IRAS = 218 IRAS evitadas × R$ 8.000/IRAS = R$ 1,74M economizados. ROI 207:1."},
        {"acao": "Bundle de prevenção de ISC — profilaxia com cefazolina 2g IV pré-operatório",
         "implementada": False, "custo": 2800, "prazo_meses": 1,
         "observacao": "8,4% de ISC (meta 2%). 168 casos/ano. Cefazolina 2g: R$ 2,80/dose × 2.000 cirurgias = R$ 5.600/ano (já incluso no REMUME). Bundle: cefazolina 30-60 min pré-incisão + clipper elétrico + normotermia + curativo técnico. Protocolo: formulário checklist cirúrgico (adaptado WHO Surgical Safety Checklist). Custo de impressão: R$ 280. ROI: 168 ISC × R$ 8.000 = R$ 1,34M economizados/ano vs R$ 2.800 de protocolo."},
        {"acao": "Uso racional de antibióticos — protocolo de prescrição + farmacêutico clínico",
         "implementada": False, "custo": 84000, "prazo_meses": 3,
         "observacao": "4 casos de KPC + 8 MRSA — resistência crescente. Farmacêutico clínico: R$ 84.000/ano (eMulti ou contratação). Stewardship: antibiograma guia prescrição + carbapenem restrito a casos comprovados. Economia esperada: -50% de carbapenemos = -R$ 280.000/ano. ROI 3,3:1. Protocolo de antibiótico: formulário de justificativa para carbapenemo + aprovação do farmacêutico. Custo do protocolo: R$ 0 (impressão). Treinamento: 4h para toda a equipe de prescrição."},
        {"acao": "Validação de autoclaves — indicador biológico mensal (RDC ANVISA 15/2012)",
         "implementada": False, "custo": 4200, "prazo_meses": 1,
         "observacao": "2 autoclaves. Validação mensal com indicador biológico (Geobacillus stearothermophilus): obrigatória (RDC 15/2012). Custo: R$ 4.200/ano (fita + indicador biológico + registro). Autoclave não validada: material estéril em falsa segurança → ISC + IRAS. ANVISA pode interditar bloco cirúrgico com autoclave sem validação. Indicador biológico: kit disponível em distribuidores nacionais (R$ 350/kit × 12 = R$ 4.200/ano)."},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "taxa_iras_pct": 14.4, "isc_pct": 10.4, "higiene_maos_pct": 28.4, "resistencia_pct": 18.4, "obitos_iras": 34},
        {"ano": "2023", "taxa_iras_pct": 13.4, "isc_pct": 9.4,  "higiene_maos_pct": 32.4, "resistencia_pct": 22.4, "obitos_iras": 31},
        {"ano": "2024", "taxa_iras_pct": 12.8, "isc_pct": 8.8,  "higiene_maos_pct": 36.4, "resistencia_pct": 25.4, "obitos_iras": 29},
        {"ano": "2025", "taxa_iras_pct": 12.4, "isc_pct": 8.4,  "higiene_maos_pct": 38.4, "resistencia_pct": 28.4, "obitos_iras": 28},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Taxa geral de IRAS (meta: ≤ 3%)",              "valor": 12.4, "meta": 3.0,  "unidade": "%",        "status": "critico", "observacao": "12,4% (4,1× meta). 352 IRAS/ano. R$ 2,8M custo. Higiene de mãos R$ 8.400 → -62% = R$ 1,74M economizados. ROI 207:1."},
        {"indicador": "ISC — infecção do sítio cirúrgico (meta: ≤ 2%)", "valor": 8.4,  "meta": 2.0,  "unidade": "%",      "status": "critico", "observacao": "8,4% (4,2× meta). Cefazolina R$ 2,80/dose + checklist WHO. ROI 2.857:1 vs custo da ISC."},
        {"indicador": "Adesão à higiene de mãos (meta: ≥ 80%)",       "valor": 38.4, "meta": 80.0, "unidade": "%",        "status": "critico", "observacao": "38,4%. 5 momentos OMS. Álcool gel R$ 8.400. 62/100 IRAS evitadas com higienização correta."},
        {"indicador": "KPC + MRSA (meta: zero novos)",                "valor": 12,   "meta": 0,    "unidade": "casos",    "status": "critico", "observacao": "4 KPC + 8 MRSA 2025. Stewardship: farmacêutico clínico R$ 84.000/ano. Economia carbapenemos: R$ 280.000/ano."},
        {"indicador": "CCIH ativa (obrigatória RDC 42/2010)",          "valor": 0,    "meta": 1,    "unidade": "comissões","status": "critico", "observacao": "Zero CCIH. Criação: R$ 4.200. ANVISA pode interditar sem CCIH. Primeiro relatório: 30 dias."},
        {"indicador": "Validação de autoclaves (meta: mensal)",        "valor": 0,    "meta": 12,   "unidade": "meses/ano","status": "critico", "observacao": "Zero validações/ano. RDC 15/2012: obrigatório. Indicador biológico: R$ 4.200/ano. Autoclave não validada = ISC garantida."},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/tipos")
def tipos():
    return _TIPOS()


@router.get("/acoes")
def acoes():
    return _ACOES()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()