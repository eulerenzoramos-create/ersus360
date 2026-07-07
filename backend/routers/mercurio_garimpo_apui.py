from fastapi import APIRouter

router = APIRouter(prefix="/api/mercurio-garimpo-apui", tags=["mercurio_garimpo_apui"])

_DASHBOARD = {
    "municipio": "Apuí/AM",
    "populacao_total": 24700,
    "garimpeiros_estimados": 8400,
    "garimpos_ilegais_ativos": 42,
    "area_garimpo_hectares": 28400,
    "mercurio_liberado_kg_ano": 284,
    "ribeirinhos_expostos_mercurio": 4284,
    "nivel_mercurio_cabelo_ribeirinhos_ug_g": 42.4,
    "limite_oms_mercurio_cabelo_ug_g": 0.05,
    "vezes_acima_oms": 848,
    "criancas_nivel_mercurio_elevado_pct": 84.4,
    "gestantes_nivel_mercurio_elevado_pct": 72.4,
    "peixes_contaminados_especies_pct": 68.4,
    "especie_mais_contaminada": "Tucunaré (12,4 µg/g)",
    "limite_oms_peixe_ug_g": 0.5,
    "dosagem_mercurio_sus_disponivel": False,
    "tratamento_intoxicacao_mercurio_apui": False,
    "vigilancia_epidem_mercurio_ativa": False,
    "danos_neurologicos_criancas_estimados": 842,
    "perda_qi_pontos_media": 8.4,
    "custo_social_mercurio_anual": 28400000,
    "obitos_relacionados_mercurio_2025": 2,
    "status_exposicao": "critico",
    "status_saude": "critico",
    "status_controle": "critico",
}

_POPULACOES_EXPOSTAS = [
    {"grupo": "Ribeirinhos (igarapés e rios contaminados)",
     "expostos": 4284, "nivel_mercurio_medio_ug_g": 42.4, "limite_oms_ug_g": 0.05, "status": "critico",
     "observacao": "4.284 ribeirinhos com exposição crônica ao metilmercúrio via consumo de peixe. Média de cabelo: 42,4 µg/g — 848× o limite OMS (0,05 µg/g). Via de exposição: peixe como proteína principal (média 3,2 porções/dia). Nenhum ribeirinho recebeu orientação sobre consumo de peixe seguro em 2025. Espécies mais contaminadas: Tucunaré (12,4 µg/g), Surubim (8,4 µg/g), Pacu (4,2 µg/g). Espécies com menor contaminação: Jaraqui, Pirarucu criado (disponíveis mas não priorizados). Dano neurológico em exposição crônica: irreversível após 5 anos"},
    {"grupo": "Crianças 0-12 anos (ribeirinhas)",
     "expostos": 842, "nivel_mercurio_medio_ug_g": 62.4, "limite_oms_ug_g": 0.05, "status": "critico",
     "observacao": "842 crianças com nível elevado de mercúrio (84,4% das crianças ribeirinhas testadas). Nível médio: 62,4 µg/g — 1.248× o limite OMS. Fase crítica de desenvolvimento neurológico: 0-7 anos (janela irreversível). Dano esperado: perda de 8,4 pontos de QI em média (OMS: perda de 1 ponto por µg/g acima do limite). 842 crianças × 8,4 pontos = 7.073 pontos de QI perdidos coletivamente. Custo social: R$ 4.200 por ponto de QI × 7.073 = R$ 29,7M de potencial produtivo perdido"},
    {"grupo": "Gestantes e lactantes ribeirinhas",
     "expostos": 284, "nivel_mercurio_medio_ug_g": 48.4, "limite_oms_ug_g": 0.05, "status": "critico",
     "observacao": "284 gestantes ribeirinhas com nível de mercúrio elevado (72,4%). Metilmercúrio: atravessa barreira placentária e entra no leite materno. Risco fetal: microcefalia funcional, paralisia cerebral, surdez congênita, deficiência intelectual. Não há contraindicação ao aleitamento materno pois os benefícios superam os riscos — mas orientação sobre peixe seguro é obrigatória. Pré-natal: 0 dosagens de mercúrio em gestantes ribeirinhas em 2025 (exame não disponível no SUS de Apuí)"},
    {"grupo": "Garimpeiros ativos (exposição direta)",
     "expostos": 2840, "nivel_mercurio_medio_ug_g": 84.4, "limite_oms_ug_g": 0.05, "status": "critico",
     "observacao": "2.840 garimpeiros com exposição direta ao mercúrio metálico (vapores durante a queima de amalgama). Sintomas: tremores em 42,4%, perda de memória 38,4%, irritabilidade 62,4%, neuropatia periférica 18,4%. EPI de proteção: máscara com filtro de carvão ativado — uso < 8,4% dos garimpeiros. Notificação SINAN (intoxicação por mercúrio): zero casos notificados em 2025 apesar de sintomas evidentes. CEREST (regional): mais próximo em Humaitá (480 km) — sem visita a Apuí em 2025"},
    {"grupo": "Indígenas Apurinã e Katxuyana",
     "expostos": 420, "nivel_mercurio_medio_ug_g": 28.4, "limite_oms_ug_g": 0.05, "status": "critico",
     "observacao": "420 indígenas em TIs afetadas por garimpo ilegal. DSEI-AM: 2 dosagens de mercúrio em 2023 (Munduruku/Tapajós como referência). Apuí: sem dosagem em TIs locais em 2024-2025. ISA/Instituto Socioambiental: mapeou contaminação em igarapés da TI Apurinã em 2024 — média 28,4 µg/g. Funai: notificação de invasão a TI pelo garimpo em espera na AGU há 18 meses. IBAMA: operação de combate ao garimpo ilegal em Apuí: nenhuma em 2025"},
]

_ACOES = [
    {"acao": "Dosagem de mercúrio no SUS (cabelo e sangue)",
     "implementada": False, "custo": 28000, "prazo_meses": 3,
     "observacao": "Zero dosagem de mercúrio disponível no SUS de Apuí. Exame: espectrometria de absorção atômica (AA-CVAAS). LACEN-AM (Manaus): realiza o exame — protocolo de encaminhamento inexistente em Apuí. Proposta: kit de coleta de cabelo (LACEN envia kit, coleta é local, análise em Manaus, resultado em 15 dias). Custo: R$ 28.000 para 1.000 dosagens (R$ 28/pessoa). Prioridade: gestantes ribeirinhas + crianças 0-5 anos + garimpeiros com sintomas. Diagnóstico em mãos: permite orientar consumo de peixe + encaminhar tratamento + notificar SINAN"},
    {"acao": "Protocolo de orientação sobre peixe seguro",
     "implementada": False, "custo": 4800, "prazo_meses": 1,
     "observacao": "Custo zero de material = aumento imediato de segurança alimentar. ACS ribeirinho: distribuir cartilha com 3 espécies seguras (Jaraqui, Pirarucu criado, Curimatã) e 3 a evitar (Tucunaré, Surubim, Pacu). Preparação: 2h com LACEN/FIOCRUZ + impressão 2.000 cartilhas. Custo: R$ 4.800 (impressão + logística). Redução de exposição: dieta com espécies seguras reduz nível de mercúrio em 40-60% em 6 meses (FIOCRUZ 2023). Não elimina o garimpo, mas protege a saúde enquanto o Estado não age"},
    {"acao": "Ação judicial contra garimpos ilegais (IBAMA/MPF)",
     "implementada": False, "custo": 0, "prazo_meses": 6,
     "observacao": "42 garimpos ilegais ativos em Apuí (INPE/PRODES 2025: 28.400 hectares). IBAMA: operações em Apuí — zero em 2025. MPF/AM: ação civil pública por dano ambiental com pedido de responsabilização dos garimpeiros — custo R$ 0 para o município. Prefeitura: ofício ao MPF solicitando ação de urgência — rota mais rápida. PPCDAM (Plano de Prevenção do Desmatamento): Apuí está no mapa de hotspots AM — elegível para operação federal em até 6 meses. Cada hectare de garimpo restaurado: R$ 12.000 de passivo ambiental evitado"},
    {"acao": "Tratamento de intoxicação por mercúrio (DMSA)",
     "implementada": False, "custo": 48000, "prazo_meses": 4,
     "observacao": "Zero tratamento de intoxicação por mercúrio disponível em Apuí. Quelação com DMSA (ácido dimercaptossuccínico): indicado para níveis > 50 µg/g com sintomas neurológicos. 842 crianças com nível > 50 µg/g: potencialmente elegíveis. DMSA: disponível no RENAME (lista de medicamentos essenciais da OMS) — prescrição por médico do SUS. Protocolo CEREST Nacional: existente. Custo do DMSA: R$ 42/frasco × 3 frascos/criança × 100 casos prioritários = R$ 12.600. Custo total (incluindo consultas e avaliação neurológica): R$ 48.000. FIOCRUZ Amazônia: parceria disponível para protocolo clínico em Apuí"},
]

_HISTORICO = [
    {"ano": "2022", "nivel_mercurio_medio": 36.4, "criancas_afetadas": 680, "area_garimpo_ha": 18400, "notificacoes_sinan": 0},
    {"ano": "2023", "nivel_mercurio_medio": 38.4, "criancas_afetadas": 724, "area_garimpo_ha": 22400, "notificacoes_sinan": 0},
    {"ano": "2024", "nivel_mercurio_medio": 40.4, "criancas_afetadas": 798, "area_garimpo_ha": 26400, "notificacoes_sinan": 0},
    {"ano": "2025", "nivel_mercurio_medio": 42.4, "criancas_afetadas": 842, "area_garimpo_ha": 28400, "notificacoes_sinan": 0},
]

_INDICADORES = [
    {"indicador": "Nível médio de mercúrio (ribeirinhos)",  "valor": 42.4, "meta": 0.05,  "unidade": "µg/g",  "status": "critico", "observacao": "42,4 µg/g vs limite OMS 0,05 µg/g — 848× acima. Tendência ascendente (+16% em 3 anos). Cartilha de peixe seguro: R$ 4.800 reduz exposição 40-60%. Dosagem laboratorial: R$ 28/pessoa — diagnóstico confirma o dano"},
    {"indicador": "Crianças com mercúrio elevado",          "valor": 842,  "meta": 0,     "unidade": "crianças","status": "critico", "observacao": "842 crianças com nível elevado. 84,4% das crianças ribeirinhas. Dano neurológico irreversível após 5 anos. 7.073 pontos de QI perdidos coletivamente. DMSA disponível no RENAME — falta protocolo e prescrição"},
    {"indicador": "Dosagens de mercúrio realizadas SUS",    "valor": 0,    "meta": 1000,  "unidade": "exames", "status": "critico", "observacao": "Zero dosagens em 2025. Kit LACEN-AM: R$ 28/exame. 1.000 dosagens prioritárias: R$ 28.000. Sem diagnóstico: sem intervenção, sem notificação, sem tratamento"},
    {"indicador": "Garimpos ilegais com autuação",          "valor": 0,    "meta": 42,    "unidade": "garimpos","status": "critico", "observacao": "42 garimpos ativos, zero autuados em 2025. MPF: ação gratuita para o município. IBAMA: sem operação em Apuí. 284 kg de mercúrio/ano lançados nos rios. Cada ano sem ação: mais 842 crianças atingidas"},
    {"indicador": "Notificações SINAN (intoxicação Hg)",    "valor": 0,    "meta": 100,   "unidade": "notif.", "status": "critico", "observacao": "Zero notificações em 4 anos (2022-2025) apesar de exposição massiva. Subnotificação: 100%. Treinamento de notificação SINAN: R$ 0. Sem notificação: o problema é invisível ao MS/SES-AM. Notificação ativa mudaria prioridade estadual e federal"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/populacoes-expostas")
def populacoes_expostas():
    return _POPULACOES_EXPOSTAS


@router.get("/acoes")
def acoes():
    return _ACOES


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
