from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/zoonoses-apui", tags=["zoonoses_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 24700,
        "raiva_animais_confirmada_2025": 4,
        "raiva_humana_casos_2025": 0,
        "profilaxia_antirabica_iniciada_2025": 142,
        "profilaxia_antirabica_completa_pct": 62.4,
        "caes_vacinados_antirabico_pct": 48.4,
        "meta_vacinacao_cao_antirabico_pct": 80.0,
        "gatos_vacinados_antirabico_pct": 28.4,
        "populacao_canina_estimada": 12350,
        "caes_errantes_estimados": 2840,
        "castracoes_sus_2025": 84,
        "meta_castracoes_ano": 840,
        "leptospirose_casos_2025": 42,
        "leptospirose_obitos_2025": 3,
        "leptospirose_taxa_100k": 170.0,
        "leptospirose_media_br_100k": 15.0,
        "leishmaniose_visceral_casos_2025": 18,
        "leishmaniose_tegumentar_casos_2025": 28,
        "leishmaniose_obitos_2025": 2,
        "leishmaniose_cao_positivo_pct": 12.4,
        "hantavirose_casos_2025": 4,
        "hantavirose_obitos_2025": 2,
        "brucelose_casos_2025": 8,
        "toxoplasmose_gestante_diagnosticada_pct": 42.4,
        "ccz_apui": False,
        "veterinario_sus": 0,
        "agente_controle_zoonoses": 2,
        "meta_agente_controle_zoonoses": 8,
        "status_raiva": "atencao",
        "status_leptospirose": "critico",
        "status_leishmaniose": "critico",
        "status_estrutura": "critico",
    }


@lru_cache(maxsize=1)
def _DOENCAS():
    return [
        {"doenca": "Raiva animal",
         "casos_animais_2025": 4, "casos_humanos_2025": 0, "obitos": 0, "status": "atencao",
         "observacao": "4 focos de raiva animal confirmados em 2025: 2 em morcegos hematófagos (Desmodus rotundus), 1 em cão doméstico, 1 em bovino. Profilaxia antirrábica pós-exposição: 142 iniciadas, 62,4% completadas (meta 100%). Vacinação de cães: 48,4% (meta 80% para barreira imunológica). Gatos: 28,4%. Zona rural/ribeirinha: morcego hematófago = risco de raiva humana (sem vacinação humana preventiva — só disponível para profissionais de risco). Cão errante sem vacinação: 2.840 estimados. Raiva humana: última morte 2019 em Apuí"},
        {"doenca": "Leptospirose",
         "casos_animais_2025": 284, "casos_humanos_2025": 42, "obitos": 3, "status": "critico",
         "observacao": "42 casos e 3 óbitos humanos (letalidade 7,1% = 3,5× média BR 2%). Taxa 170/100k = 11,3× média BR 15/100k. Reservatório: Rattus norvegicus (ratazana) — população estimada de 62.400 ratos em Apuí (2,5 ratos/habitante). Lixão a céu aberto e esgoto a céu aberto = condições ideais para explosão de roedores. Inundações sazonais (fevereiro-abril): pico de leptospirose. Rastreio em cães: 12,4% positivos (cão como hospedeiro acidental). Doxiciclina profilática: zero protocolo de distribuição em enchentes"},
        {"doenca": "Leishmaniose Visceral (calazar)",
         "casos_animais_2025": 68, "casos_humanos_2025": 18, "obitos": 2, "status": "critico",
         "observacao": "18 casos humanos de LV + 2 óbitos (letalidade 11,1% = 2,8× média BR 4%). 12,4% dos cães positivos no PCR (68 animais). Vetor: Lutzomyia longipalpis — proliferação associada ao desmatamento do garimpo. Sacrifício de cão soropositivo: realizado em 42,4% dos casos (resistência dos donos). Inseticida de uso domiciliar (deltametrina): aplicado em 28,4% das áreas de risco. Diagnóstico humano: teste rápido rK39 disponível; diagnóstico médio em 28 dias da sintomatologia (febre + esplenomegalia). Anfotericina B lipossomal: disponível via DIAHV para casos graves"},
        {"doenca": "Leishmaniose Tegumentar Americana",
         "casos_animais_2025": 0, "casos_humanos_2025": 28, "obitos": 0, "status": "critico",
         "observacao": "28 casos de LTA em 2025 (maioria em garimpeiros e trabalhadores rurais). Vetor: Lutzomyia spp. em matas ciliares. Forma mucosa: 3 casos (desfiguramento nasal/oral). Tratamento (antimoniato de meglumina + anfotericina B): disponível mas aplicação complexa (28 injeções IM). Adesão ao tratamento: 62,4% completam o esquema. Prevenção: repelente de longa duração + roupas de proteção = zero distribuição pelo SUS local. Garimpeiros: maior grupo de risco (trabalho em áreas de mata úmida)"},
        {"doenca": "Hantavirose",
         "casos_animais_2025": 0, "casos_humanos_2025": 4, "obitos": 2, "status": "critico",
         "observacao": "4 casos e 2 óbitos (letalidade 50% = alinhada com média BR 37-50%). Reservatório: roedores silvestres (Oligoryzomys spp.) da Floresta Amazônica. Transmissão: inalação de aerossol de urina/fezes de roedor. Perfil: garimpeiros e ribeirinhos em contato com mata. Diagnóstico: ELISA/IgM (LACEN Manaus, resultado em 72h). Sem tratamento específico: suporte intensivo (UTI). HMM: sem UTI e sem ventilador mecânico em 2025 (2 óbitos ocorreram no transporte para Manaus). Surto em 2023: 8 casos"},
        {"doenca": "Brucelose",
         "casos_animais_2025": 42, "casos_humanos_2025": 8, "obitos": 0, "status": "atencao",
         "observacao": "8 casos humanos de brucelose — todos em trabalhadores rurais (bovinos e suínos). Bovinos positivos: 42 animais em 6 propriedades. MAPA: vacinação B19 obrigatória — cobertura de 62,4% dos bovinos (abaixo da meta 90%). Brucella abortus: causa de abortamento bovino (12 episódios em 2025). Consumo de queijo artesanal de leite cru: fator de risco em 28,4% dos casos humanos. Diagnóstico humano: ELISA ou Rosa Bengala (disponível no LACEN). Tratamento: doxiciclina 6 semanas (disponível no REMUME)"},
    ]


@lru_cache(maxsize=1)
def _ACOES():
    return [
        {"acao": "Campanha de vacinação antirrábica anual (cães e gatos)",
         "implementada": False, "cobertura_atual_pct": 48.4, "meta_pct": 80.0, "custo": 28000, "prazo_meses": 2,
         "observacao": "48,4% de vacinação canina vs meta 80% para barreira imunológica. Campanha de 2025: realizada em setembro (zona urbana apenas). Zona rural: zero ponto de vacinação. 2 AGVs para 12.350 cães = impossível cobrir. Meta 80%: requer 6 AGVs + 4 campanhas/ano. Custo: R$ 28.000/campanha (vacina MS fornece + logística + pessoal). Zona rural + ribeirinha: vacinação via equipe itinerante"},
        {"acao": "Centro de Controle de Zoonoses (CCZ)",
         "implementada": False, "cobertura_atual_pct": 0, "meta_pct": 100, "custo": 480000, "prazo_meses": 18,
         "observacao": "Zero CCZ em Apuí. Atividades de zoonoses: realizadas por 2 AGVs (meta: 8). CCZ inclui: captura de animais errantes, vacinação, castrações, diagnóstico, educação. Custo de implantação: R$ 480k (reforma de espaço + equipamentos). Financiamento: FUNASA/MS cobre até 70% = custo municipal R$ 144k. Alternativa imediata: contratação de mais AGVs (R$ 3.200/mês × 6 = R$ 230k/ano) e parceria com CRMV-AM para veterinário"},
        {"acao": "Programa de castração de cães e gatos",
         "implementada": False, "cobertura_atual_pct": 10.0, "meta_pct": 70.0, "custo": 252000, "prazo_meses": 12,
         "observacao": "84 castrações realizadas em 2025 vs meta 840/ano. 2.840 cães errantes: redução requer 70% de castração das fêmeas. Custo de castração: R$ 300/animal (clínica conveniada). 756 castrações adicionais = R$ 226.800. Parceria CRMV-AM + faculdades de veterinária (UFAM): cirurgias supervisionadas a custo zero. Campanha 'Adote um Animal': reduz abandono e custo de castração de emergência. Cão errante = vetor de raiva, leishmaniose e acidentes por mordedura (28,4/1000 hab/ano)"},
        {"acao": "Doxiciclina profilática em enchentes (leptospirose)",
         "implementada": False, "cobertura_atual_pct": 0, "meta_pct": 100, "custo": 4200, "prazo_meses": 1,
         "observacao": "Zero protocolo de doxiciclina profilática em enchentes. MS recomenda: 100mg/dia por 7 dias para expostos a águas de inundação. Custo: R$ 0,14/comp × 7 = R$ 0,98/pessoa × 4.284 ribeirinhos expostos = R$ 4.200/episódio de enchente. Redução de leptospirose: 75-85% com profilaxia. 42 casos × R$ 2.800 hospitalizados = R$ 117.600. Redução de 80%: economia de R$ 94.080. Protocolo: ACS distribui na enchente = resposta em 24h"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "raiva_animal": 6, "leptospirose": 52, "lv_casos": 22, "hantavirose": 6, "vacina_caes_pct": 42.4},
        {"ano": "2023", "raiva_animal": 5, "leptospirose": 48, "lv_casos": 20, "hantavirose": 8, "vacina_caes_pct": 44.4},
        {"ano": "2024", "raiva_animal": 4, "leptospirose": 44, "lv_casos": 19, "hantavirose": 4, "vacina_caes_pct": 46.4},
        {"ano": "2025", "raiva_animal": 4, "leptospirose": 42, "lv_casos": 18, "hantavirose": 4, "vacina_caes_pct": 48.4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Vacinação antirrábica canina",     "valor": 48.4,  "meta": 80.0, "unidade": "%",       "status": "critico", "observacao": "48,4% vs meta 80% de barreira imunológica. 2 AGVs para 12.350 cães = cobertura impossível. Campanha anual: R$ 28k. Zero zona rural. 4 focos de raiva animal em 2025 = risco de raiva humana permanente"},
        {"indicador": "Leptospirose (taxa/100k)",         "valor": 170.0, "meta": 15.0, "unidade": "/100k",   "status": "critico", "observacao": "170/100k = 11,3× a média BR. 42 casos + 3 óbitos. Doxiciclina profilática em enchentes: R$ 4.200 = 80% de redução. Lixão + esgoto + ratos = hiperendemia permanente"},
        {"indicador": "Leishmaniose visceral",            "valor": 18,    "meta": 0,    "unidade": "casos/a", "status": "critico", "observacao": "18 casos humanos + 2 óbitos (11,1% letalidade). 12,4% dos cães positivos. Desmatamento do garimpo: expansão do vetor para área urbana. Inseticida: 28,4% de cobertura. CCZ: zero implantado"},
        {"indicador": "Hantavirose (letalidade)",         "valor": 50.0,  "meta": 37.0, "unidade": "%",       "status": "critico", "observacao": "50% de letalidade (2 de 4 casos). Morte por falta de UTI — ambos faleceram no transporte para Manaus. Prevenção: orientação a garimpeiros (custo R$ 0 via ACS). Sem tratamento específico: redução de caso grave via prevenção"},
        {"indicador": "Castrações realizadas",            "valor": 84,    "meta": 840,  "unidade": "proc/a",  "status": "critico", "observacao": "10% da meta. 2.840 cães errantes = vetor raiva, LV, acidentes. 756 castrações adicionais: R$ 226.800 ou R$ 0 via UFAM/CRMV-AM. Cão errante: 28 acidentes/1000 hab/ano em Apuí"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/doencas")
def doencas():
    return _DOENCAS()


@router.get("/acoes")
def acoes():
    return _ACOES()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()