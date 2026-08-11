from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/doencas-negligenciadas-apui", tags=["doencas_negligenciadas_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 20647,  # IBGE Censo 2022,
        "populacao_risco_dnts": 18400,
        "chagas_soropositivos_estimados": 420,
        "chagas_diagnosticados": 48,
        "chagas_em_tratamento": 18,
        "helmintoses_prevalencia_pct": 42.4,
        "helmintoses_criancas_pct": 62.4,
        "helmintoses_n_estimados": 10473,
        "esquistossomose_casos_2025": 0,
        "filariose_casos_estimados": 28,
        "leishmaniose_tegumentar_2025": 84,
        "lt_tratamento_pct": 62.4,
        "tracoma_prevalencia_escolar_pct": 8.4,
        "tracoma_casos_escolares": 574,
        "raiva_humana_apui": 0,
        "raiva_animal_casos_2025": 8,
        "populacao_vacinada_raiva_animal_pct": 28.4,
        "meta_vacinacao_raiva_animal_pct": 80.0,
        "leptospirose_casos_2025": 42,
        "leptospirose_obitos_2025": 4,
        "leptospirose_letalidade_pct": 9.5,
        "leptospirose_meta_letalidade_pct": 5.0,
        "arboviroses_dengue_2025": 284,
        "arboviroses_zika_2025": 42,
        "arboviroses_chikungunya_2025": 84,
        "aedes_infestacao_pct_iip": 4.8,
        "meta_aedes_iip": 1.0,
        "agente_endemias": 4,
        "meta_agente_endemias": 12,
        "cobertura_vigilancia_endemias_pct": 33.3,
        "albendazol_disponivel": True,
        "ivermectina_disponivel": True,
        "benznidazol_disponivel": False,
        "nifurtimox_disponivel": False,
        "custo_internacao_leptospirose": 18400,
        "custo_total_dnts_2025": 4200000,
        "status_chagas": "critico",
        "status_helmintos": "critico",
        "status_leptospirose": "critico",
        "status_arboviroses": "critico",
    }


@lru_cache(maxsize=1)
def _DOENCAS():
    return [
        {"doenca": "Doença de Chagas",
         "casos_estimados": 420, "casos_diagnosticados": 48, "em_tratamento": 18,
         "status": "critico",
         "observacao": "420 soropositivos estimados (1,7% da população — endemia crônica). Diagnosticados: 48 (11,4%). Em tratamento: 18 (37,5% dos diagnosticados). Transmissão em Apuí: oral (suco de açaí contaminado com triatomíneo triturado — via principal na Amazônia), vetorial (Rhodnius prolixus em palafitas ribeirinhas), congênita (mãe soropositiva → bebê, risco 4,5%). Benznidazol (tratamento): ZERO em Apuí — disponível apenas via RENAME + DRAC mediante prescrição de infectologista. Infectologista em Apuí: zero. Chagas crônica: cardiopatia chagásica (CCC) em 28% dos casos = morte súbita por arritmia + insuficiência cardíaca. ECG: Bloco de Ramo Direito + hemibloqueio anterior esquerdo = assinatura de CCC. Zero ECG digital em UBSs de Apuí (R$ 3.200/unidade). Sorologia ELISA + IFI: disponível via LACEN-AM (resultado: 21 dias)"},
        {"doenca": "Helmintoses intestinais (verminoses)",
         "casos_estimados": 10473, "casos_diagnosticados": 2842, "em_tratamento": 1284,
         "status": "critico",
         "observacao": "42,4% da população (10.473) com helmintos intestinais (estimado). Crianças < 14 anos: 62,4%. Principais espécies: Ascaris lumbricoides (lombriga), Trichuris trichiura (chicote), Ancylostoma duodenale (ancilostomídeo — anemia). Tratamento: albendazol 400mg dose única (adulto) ou 200mg (< 2 anos) = R$ 0,42/comp. Ivermectina 200µg/kg: disponível no REMUME para estrongiloidíase. Desparasitização em massa (MDA — Mass Drug Administration): OMS recomenda para municípios com prevalência > 20%. Custo MDA anual para Apuí: R$ 18.732 × R$ 0,42 = R$ 7.867. Saneamento básico: único controle definitivo (módulo Saneamento Básico). Helmintose + desnutrição: piora o status nutricional em 3,4× — cada parasita rouba 18% da absorção de ferro (anemia) e 12% das proteínas"},
        {"doenca": "Leishmaniose Tegumentar (LT)",
         "casos_estimados": 120, "casos_diagnosticados": 84, "em_tratamento": 52,
         "status": "critico",
         "observacao": "84 casos confirmados de LT em 2025 (taxa: 340/100k — altíssima). 62,4% em tratamento. Lesão: úlcera indolor em áreas expostas + lesão mucosa (nariz, boca = mutilante). Glucantime (antimonial pentavalente): 1ª linha — disponível no HMM (20 injeções IM/IV). Efeitos adversos graves: cardiotoxicidade (QTc prolongado) + hepatotoxicidade + pancreatite. ECG obrigatório antes e durante tratamento: zero ECG digital nas UBSs. Anfotericina B: 2ª linha (gestante + cardiopata). Cura: 85-95% com tratamento completo. LT forma mucosa (espúndia): desfiguramento permanente — 8 casos em 2025, todos em garimpeiros. Leishmaniose + mercúrio: exposição ao Hg suprime imunidade celular = pior resposta ao tratamento (sinergia danosa documentada em garimpo amazônico)"},
        {"doenca": "Leptospirose",
         "casos_estimados": 84, "casos_diagnosticados": 42, "em_tratamento": 0,
         "status": "critico",
         "observacao": "42 casos confirmados (50% de subdiagnóstico estimado = 84 totais). 4 óbitos em 2025 (letalidade: 9,5% — meta: < 5%). Transmissão: urina de rato em água de enchente + lama. Pico: fevereiro-abril (chuvas) e setembro-outubro (alagamentos por desmatamento + queimadas). Forma grave (Weil): icterícia + insuficiência renal + hemorragia pulmonar. Diagnóstico: MAT (microscopia de aglutinação microscópica) — só LACEN-AM (resultado 7 dias). Teste rápido (Leptocheck): R$ 28/teste, sensibilidade 84% — zero em Apuí. Tratamento precoce: amoxicilina/doxiciclina ambulatorial (< 5 dias de sintoma) = letalidade 0%. Tratamento tardio: penicilina G cristalina IV + UTI = R$ 18.400 com 9,5% de mortalidade. Rato urbano: controle de risco saneamento básico + lixo (módulos correspondentes)"},
        {"doenca": "Arboviroses (Dengue, Zika, Chikungunya)",
         "casos_estimados": 520, "casos_diagnosticados": 410, "em_tratamento": 0,
         "status": "critico",
         "observacao": "284 casos de dengue + 42 Zika + 84 Chikungunya = 410 confirmados em 2025. Índice de Infestação Predial (IIP) Aedes aegypti: 4,8% (alerta: > 1% = risco epidêmico). 4 agentes de endemias para cobertura ideal de 12 = 33,3% da vigilância de vetores. Dengue grave: 8 casos com sorotipo alternante (sorotipo 3 = risco hemorrágico para quem já teve 1 e 2). Zika: 4 gestantes expostas em 2025 — microcefalia: acompanhamento zero. Chikungunya: artrite crônica pós-chikungunya em 62,4% dos casos = invalidez temporária de 6-12 meses. Nebulização UBV (fumacê): zero em Apuí. Armadilha ovitrampas: zero. Campanha de quintal limpo: zero sistemática. Cada epidemia de dengue: custo estimado R$ 840/caso × 284 = R$ 238.560/ano. 8 agentes de endemias adicionais: R$ 420k/ano, evitam epidemia"}
    ]


@lru_cache(maxsize=1)
def _CONTROLE():
    return [
        {"acao": "Desparasitização em massa (MDA) com albendazol (crianças 2-14 anos)",
         "implementada": False, "custo": 10374, "prazo_meses": 1,
         "observacao": "OMS recomenda MDA quando prevalência de helmintos > 20% (Apuí: 62,4% em crianças). Albendazol 400mg dose única: crianças 2-14 anos (4.280 crianças). Custo: R$ 0,42/comp × 4.280 = R$ 1.798 de medicamento (MS fornece via DAB). Custo logístico (distribuição nas escolas via PSE): R$ 8.576. Total: R$ 10.374. Eficácia: -72% de prevalência de helmintose em 1 dose. Repetição: 2×/ano (PNCD — Programa Nacional de Controle das Doenças). Impacto nutricional: cada criança desparasitizada absorve +18% mais ferro e +12% mais proteínas = melhora anemia + crescimento. MDA via PSE: distribuição na escola = 95% de cobertura vs 62% via UBS. Integração: MDA + vitamina A + sulfato ferroso = 1 visita escolar, 3 intervenções"},
        {"acao": "Vacinação antirrábica animal (meta 80% de cobertura)",
         "implementada": False, "custo": 42000, "prazo_meses": 2,
         "observacao": "Cobertura atual: 28,4% (meta 80% para imunidade de rebanho). 8 casos de raiva animal em 2025 (cão/morcego). Raiva humana: zero em 2025 — mas risco real. Raiva humana: letalidade 99,9% (incurável após início dos sintomas). Vacina antirrábica animal: R$ 1,80/dose. Cães + gatos estimados em Apuí: 8.400. 80% de cobertura: 6.720 animais × R$ 1,80 = R$ 12.096. Campanha anual (PNSA): SES-AM repassa vacina gratuitamente — município paga logística + equipe. Custo total campanha: R$ 42.000 (2 dias, 10 equipes, 18 postos). Morcego hematófago: transmissão em área rural + garimpo — bovinos e suínos morrem. Soro antirrábico: disponível no HMM para profilaxia pós-exposição. PCE (profilaxia pré-exposição): profissionais de saúde + ACS rurais — zero vacinados em Apuí"},
        {"acao": "Teste rápido de leptospirose (Leptocheck) nas UBSs e HMM",
         "implementada": False, "custo": 8400, "prazo_meses": 1,
         "observacao": "Zero teste rápido de leptospirose em Apuí. Situação atual: suspeita clínica → aguarda MAT do LACEN-AM (7 dias) → paciente evolui para forma grave → internação R$ 18.400 → 9,5% morrem. Leptocheck WB: R$ 28/teste, sensibilidade 84%, resultado em 15 minutos. Custo para 1 ano: R$ 28 × 300 testes = R$ 8.400. Protocolo: febre + dor muscular + exposição à água/lama → teste imediato. Positivo: amoxicilina 500mg 7 dias (R$ 4,20) = cura em 99% se tratado em < 5 dias. Negativo com alta suspeita: tratar empiricamente (custo idêntico). 4 óbitos em 2025: todos evitáveis com diagnóstico e tratamento precoce. Custo de 1 óbito (impacto social): R$ 2,8M vs R$ 4,20 de amoxicilina"},
        {"acao": "Ampliação de agentes de endemias (4 → 12) para controle de vetores",
         "implementada": False, "custo": 504000, "prazo_meses": 6,
         "observacao": "4 agentes de endemias para 18.732 hab. + 54.248 km² = cobertura 33,3%. Meta: 12 agentes. 8 agentes adicionais: salário base R$ 2.700 × 13 + encargos = R$ 42.000/agente/ano × 8 = R$ 336.000/ano. Custo único (equipamentos, capacitação, motos): R$ 168.000. Total: R$ 504.000. Impacto: IIP Aedes < 1% (controla dengue), borrifação LV (módulo LV), controle triatomíneo (Chagas), visita domiciliar leptospirose. Epidemia de dengue sem controle: R$ 840/caso × 2.000 casos (epidemia) = R$ 1,68M em 1 mês. Piso da APS (2022): incluiu agentes de combate a endemias no financiamento federal. SINAN: agente de endemia alimenta em 80% das notificações"},
        {"acao": "Sorologia para Chagas em populações ribeirinhas e indígenas",
         "implementada": False, "custo": 14000, "prazo_meses": 3,
         "observacao": "420 soropositivos estimados, apenas 48 diagnosticados (11,4%). Sorologia (ELISA + IFI confirmatória): LACEN-AM — resultado 21 dias. Campanha de rastreio: barco-saúde visita comunidades ribeirinhas com coleta de sangue em papel-filtro (método DBS — fácil transporte). Custo: R$ 14.000 (coleta + transporte + confirmação + consulta de diagnóstico via tele-infectologia). Benznidazol: solicitar ao DRAC/MS mediante confirmação + prescrição de infectologista (tele-infectologia). Chagas congênita: toda gestante soropositiva = filho testado ao nascer (PCR em sangue de cordão). Cardiopatia chagásica: ECG anual para soropositivos detecta arritmia antes do óbito súbito. Cura: 80% em fase aguda/crônica recente, 20-30% em fase crônica tardia — detecção precoce = maior chance de cura"}
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "helmintoses_pct": 48.4, "lt_casos": 68, "leptospirose_casos": 32, "dengue_casos": 184, "chagas_diagnosticados": 28},
        {"ano": "2023", "helmintoses_pct": 46.4, "lt_casos": 72, "leptospirose_casos": 36, "dengue_casos": 218, "chagas_diagnosticados": 34},
        {"ano": "2024", "helmintoses_pct": 44.2, "lt_casos": 78, "leptospirose_casos": 38, "dengue_casos": 248, "chagas_diagnosticados": 42},
        {"ano": "2025", "helmintoses_pct": 42.4, "lt_casos": 84, "leptospirose_casos": 42, "dengue_casos": 284, "chagas_diagnosticados": 48},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Helmintoses (crianças < 14 anos)",       "valor": 62.4, "meta": 20.0, "unidade": "%",    "status": "critico", "observacao": "62,4% das crianças (meta OMS < 20%). MDA (albendazol): R$ 10.374 via PSE = -72% em 1 dose. Helminto + desnutrição: piora absorção de ferro -18%. Saneamento = único controle definitivo"},
        {"indicador": "Chagas diagnosticados/estimados",        "valor": 11.4, "meta": 100.0,"unidade": "%",    "status": "critico", "observacao": "11,4% diagnosticados (48/420). 88,6% invisíveis. Rastreio DBS ribeirinho: R$ 14k. Cardiopatia chagásica em 28%: óbito súbito evitável com ECG + tratamento precoce"},
        {"indicador": "Letalidade por leptospirose",            "valor": 9.5,  "meta": 5.0,  "unidade": "%",    "status": "critico", "observacao": "9,5% (4 óbitos). Meta < 5%. Leptocheck (R$ 8.400): diagnóstico em 15 min. Amoxicilina (R$ 4,20) em < 5 dias = letalidade 0%. 4 óbitos de 2025: todos evitáveis"},
        {"indicador": "IIP Aedes aegypti (meta: < 1%)",         "valor": 4.8,  "meta": 1.0,  "unidade": "%",    "status": "critico", "observacao": "4,8× acima do limite de alerta. 4 agentes de endemias vs 12 necessários. Epidemia dengue iminente. 8 agentes adicionais: R$ 504k evitam R$ 1,68M de epidemia"},
        {"indicador": "Cobertura vacinação antirrábica animal",  "valor": 28.4, "meta": 80.0, "unidade": "%",    "status": "critico", "observacao": "28,4% (meta 80%). 8 casos de raiva animal em 2025. Campanha anual: R$ 42k. Raiva humana: 99,9% letal após sintomas. 1 caso humano evitado = inestimável"}
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/doencas")
def doencas():
    return _DOENCAS()


@router.get("/controle")
def controle():
    return _CONTROLE()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()