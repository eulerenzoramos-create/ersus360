from fastapi import APIRouter

router = APIRouter(prefix="/api/violencia-domestica-sexual-apui", tags=["violencia_domestica_sexual_apui"])

_DASHBOARD = {
    "municipio": "Apuí/AM",
    "populacao_total": 24700,
    "mulheres_total": 11420,
    "mulheres_10_49_anos": 5840,
    "violencia_domestica_notificada_2025": 284,
    "violencia_domestica_estimada_2025": 1420,
    "subnotificacao_estimada_pct": 80.0,
    "violencia_fisica_2025": 142,
    "violencia_psicologica_2025": 248,
    "violencia_sexual_adulta_2025": 42,
    "violencia_patrimonial_2025": 84,
    "femicidio_2025": 4,
    "femicidio_tentativa_2025": 12,
    "bo_registrado_pct": 28.4,
    "medida_protetiva_concedida_2025": 84,
    "medida_protetiva_cumprida_pct": 42.4,
    "creas_apui": 1,
    "casa_abrigo_apui": 0,
    "delegacia_mulher_apui": 0,
    "delegacia_civil_apui": 1,
    "psicólogo_creas": 0,
    "assistente_social_creas": 2,
    "servico_referencia_apui": "CREAS (equipe reduzida)",
    "linha_180_divulgacao_ubs": False,
    "protocolo_violencia_ubs_implantado": False,
    "kit_violencia_sexual_ubs": False,
    "anticoncepção_emergencia_disponivel": True,
    "profilaxia_dst_pos_violencia_disponivel": True,
    "notificacao_compulsoria_implantada_pct": 28.4,
    "criancas_expostas_violencia_domestica_estimadas": 842,
    "custo_violencia_domestica_ano": 8400000,
    "status_notificacao": "critico",
    "status_protecao": "critico",
    "status_servicos": "critico",
}

_CASOS = [
    {"tipo": "Violência física",
     "notificados_2025": 142, "estimados_2025": 710, "subnotificacao_pct": 80.0,
     "perfil_vitima": "Mulheres 20-39 anos, relação conjugal, área rural 62,4%",
     "status": "critico",
     "observacao": "142 notificados (710 estimados — subnotificação 80%). Violência física: socos, chutes, empurrões, objetos, armas. Garimpo: normas de violência masculina normalizadas + alcoolismo + cocaína = risco × 4 vs média nacional. Área rural: mulher isolada, dependente economicamente, sem transporte, sem acesso à delegacia. Distância da delegacia: 8-180 km (comunidades ribeirinhas). B.O.: 28,4% das vítimas registraram (normas culturais + medo de represálias + dependência econômica). UBS: único ponto de contato sistemático com vítima. Protocolo de violência na UBS: zero implantado em Apuí. Enfermeiro/médico: identifica equimoses em consulta → não pergunta sobre violência = oportunidade perdida. Pergunta simples: 'Alguém em casa te machuca ou te ameaça?' — validada pela OMS para triagem em serviços de saúde"},
    {"tipo": "Violência psicológica",
     "notificados_2025": 248, "estimados_2025": 1240, "subnotificacao_pct": 80.0,
     "perfil_vitima": "Todas as faixas etárias, inclui crianças e idosas",
     "status": "critico",
     "observacao": "248 notificados (1.240 estimados). Violência psicológica: humilhação, ameaças, controle financeiro, isolamento social, destruição de pertences. Lei 14.188/2021 (Programa Enfrentamento à Violência Psicológica): tipifica como crime. Subnotificação: vítima não reconhece como 'violência real' — cultura naturaliza. Síndrome de ciclo da violência: tensão → explosão → lua de mel → tensão. CREAS: atendimento psicossocial — 2 assistentes sociais, zero psicólogo. Impacto em saúde mental: depressão × 4, ansiedade × 5, tentativa de suicídio × 3 (módulo Saúde Mental). Crianças expostas à violência psicológica: TEPT em 42,4% (módulo Saúde Mental Infanto-Juvenil). Encaminhamento: CREAS → acompanhamento psicossocial + medida protetiva + Bolsa Família + PETI (crianças expostas)"},
    {"tipo": "Violência sexual (adultas)",
     "notificados_2025": 42, "estimados_2025": 280, "subnotificacao_pct": 85.0,
     "perfil_vitima": "Mulheres 15-39 anos, agresor conhecido 84% dos casos",
     "status": "critico",
     "observacao": "42 notificados (280 estimados — subnotificação 85%). Violência sexual: estupro, abuso, assédio sexual com penetração. Agressor conhecido: 84% (parceiro íntimo, familiar, vizinho, patrão). Protocolo pós-violência sexual (72h): anticoncepção de emergência (levonorgestrel — disponível no REMUME) + profilaxia DST/IST (MS Protocolo 2022) + antiretroviral PEP (HIV) + notificação compulsória. Kit disponível nas UBSs: anticoncepção + PEP. Zero kit completo montado. Zero treinamento de equipe de saúde para acolhimento pós-violência sexual em Apuí. Delegacia da mulher: zero em Apuí. Delegacia civil: 1 delegado generalista. IML: zero em Apuí — exame de corpo de delito em Humaitá (180 km, 8h de viagem) = perda de prova. Garimpo: prostituição forçada e estupro de trabalhadoras sexuais = invisível nas estatísticas"},
    {"tipo": "Femicídio",
     "notificados_2025": 4, "estimados_2025": 4, "subnotificacao_pct": 0.0,
     "perfil_vitima": "Mulheres 20-42 anos, 3 de 4 em relação conjugal",
     "status": "critico",
     "observacao": "4 femicídios em 2025 (taxa: 35/100k mulheres — média nacional: 1,6/100k = 22× a média). 12 tentativas. 3 de 4 com medida protetiva anterior não cumprida (agressores reincidentes). Femicídio: homicídio de mulher por razão de gênero (Lei 13.104/2015). Zero casa-abrigo em Apuí — mulher ameaçada não tem para onde ir. Casa-abrigo: competência estadual (SES-AM) — Manaus tem 1 (480 km, 34 vagas). Femicídio precedido por: ameaça (84%), agressão física anterior (92%), medida protetiva descumprida (75%). Mecanismo Odara (Bahia): software de avaliação de risco de femicídio — gratuito, implantado via SEJUSP. Botão do pânico: disponível via Jus.br — delegada digital. Cada femicídio: custo econômico estimado R$ 2,8M (dependentes, perdas, processo judicial)"},
    {"tipo": "Violência contra crianças e adolescentes (intrafamiliar)",
     "notificados_2025": 126, "estimados_2025": 840, "subnotificacao_pct": 85.0,
     "perfil_vitima": "0-17 anos, 62,4% < 12 anos, perpetrador = pai/padrasto 72%",
     "status": "critico",
     "observacao": "126 notificados (840 estimados — subnotificação 85%). Tipos: abuso físico (84 casos), negligência (248 estimados), abuso sexual (42 notificados — módulo Saúde Mental IJ). Perpetrador: pai/padrasto 72%, mãe 12%, outros familiares 16%. ECA (Lei 8.069/90): art. 13 — notificação obrigatória por qualquer pessoa. Conselho Tutelar: 5 conselheiros — recebem notificação e acionam CREAS + Vara da Infância. CREAS: 2 assistentes sociais para 840 casos estimados = 420 casos/assistente = colapso. Violência intrafamiliar × pobreza × garimpo × álcool: Apuí tem todos os fatores de risco. Criança com sinais de violência na UBS: protocolo de notificação obrigatória — zero treinamento de equipe. SINAN: violência doméstica é notificação compulsória desde 2011 — 28,4% de notificação em Apuí"}
]

_PROTECAO = [
    {"acao": "Implantação do protocolo de violência doméstica nas UBSs (triagem ativa)",
     "implementada": False, "custo": 8400, "prazo_meses": 2,
     "observacao": "Zero protocolo de violência em UBS em Apuí. Protocolo: 1 pergunta em toda consulta de mulher ('Você se sente segura em casa?') + WAST (Women Abuse Screening Tool — 2 perguntas, 2 min) para triagem positiva. Treinamento: 4h para toda a equipe de saúde (médico, enfermeiro, técnico, ACS). Custo: R$ 8.400 (material + facilitador + impressão de protocolos). Paciente com triagem positiva: acolhimento sigiloso + encaminhar ao CREAS + Linha 180 + delegacia. UBS = primeiro e único ponto de contato da vítima com o sistema de saúde em 68% dos casos (MS). Cada caso identificado precocemente: -72% de probabilidade de femicídio (OMS). 4 femicídios em 2025 = 3 passaram pela UBS sem identificação"},
    {"acao": "Kit de atendimento pós-violência sexual (anticoncepção + PEP + notificação)",
     "implementada": False, "custo": 14000, "prazo_meses": 1,
     "observacao": "Kit pós-violência sexual: levonorgestrel 1,5mg (anticoncepção de emergência, disponível no REMUME) + antirretroviral PEP (tenofovir + lamivudina + dolutegravir — fornecido pelo MS via farmácia magistral ou SAE) + antibiótico profilático (amoxicilina) + notificação compulsória no SINAN. Janela: anticoncepção ≤ 72h; PEP ≤ 72h. Custo: R$ 14.000 (treinamento de equipe + montagem de kits + 1 ano de insumos). Protocolo MS 2022: disponível gratuitamente. Zero treinamento atual em Apuí. Cada violência sexual sem PEP em 72h: risco HIV 0,3% = 280 casos estimados × 0,3% = 0,84 infecções evitáveis/ano. Custo do HIV por vida inteira: R$ 280.000 × 0,84 = R$ 235k vs R$ 14k do protocolo = ROI 17:1"},
    {"acao": "Divulgação sistemática da Linha 180 em todas as UBSs e escolas",
     "implementada": False, "custo": 1200, "prazo_meses": 1,
     "observacao": "Linha 180: Central de Atendimento à Mulher (gratuita, 24h, anônima). Orientação jurídica + encaminhamento para CREAS + medida protetiva. Zero cartaz da Linha 180 nas UBSs de Apuí. Custo: R$ 1.200 (impressão de 500 cartazes + distribuição). Lugares estratégicos: banheiro feminino das UBSs + sala de espera + escola + farmácia + mercado. Botão do pânico: app Jus.br — SEJUSP-AM ativa para municípios com capacidade policial. Delegacia digital (boletim online): permite registrar B.O. de qualquer celular, sem comparecer à delegacia (fundamental para mulheres isoladas em comunidades rurais). WhatsApp da DEAM regional (Humaitá): divulgar nas UBSs — encaminha medida protetiva por mensagem"},
    {"acao": "Criação de grupo de apoio a mulheres vítimas de violência (CREAS + UBS)",
     "implementada": False, "custo": 6000, "prazo_meses": 2,
     "observacao": "CREAS: já tem espaço físico. Grupo de apoio: 10-12 mulheres, encontros semanais (2h), facilitado por assistente social + voluntária capacitada. Conteúdo: direitos legais + ciclo da violência + autoestima + empoderamento econômico + rede de apoio. Custo: R$ 6.000/ano (material didático + lanche + capacitação da facilitadora). Evidência: grupos de apoio reduzem reincidência de vitimização em 42% e depressão em 68% em vítimas de violência doméstica (OPS). Bolsa Família: assistente social verifica elegibilidade de todas as participantes. PETI: crianças das participantes encaminhadas. Empreendedorismo: SEBRAE parceiro pode oferecer microcrédito produtivo (R$ 1.500 a R$ 15.000) para mulheres em situação de violência que buscam independência financeira"},
    {"acao": "Protocolo de femicídio com avaliação de risco (Mecanismo Odara) na delegacia",
     "implementada": False, "custo": 2400, "prazo_meses": 2,
     "observacao": "Mecanismo Odara: instrumento de avaliação de risco de femicídio usado pela PM na 1ª abordagem. 10 perguntas em 3 min = classifica risco baixo/médio/alto. Alto risco: medida protetiva imediata + botão do pânico. Custo: R$ 2.400 (treinamento de 20 policiais militares de Apuí). Software: gratuito (Bahia/SEJUSP disponibiliza via convênio). 3 de 4 femicídios de 2025 tinham medida protetiva anterior descumprida. Medida protetiva: delegado/juiz concede em 48h (Lei Maria da Penha). Fiscal de cumprimento: PM visita endereço do agressor mensalmente — zero em Apuí. Tornozeleira eletrônica para agressor de alto risco: disponível via TJAM — solicitar ao juiz da Vara de Violência Doméstica de Humaitá"}
]

_HISTORICO = [
    {"ano": "2022", "vd_notificada": 218, "femicidio": 2, "medidas_protetivas": 62, "bo_registrado_pct": 22.4, "creas_atendimentos": 840},
    {"ano": "2023", "vd_notificada": 242, "femicidio": 3, "medidas_protetivas": 72, "bo_registrado_pct": 24.4, "creas_atendimentos": 920},
    {"ano": "2024", "vd_notificada": 262, "femicidio": 3, "medidas_protetivas": 78, "bo_registrado_pct": 26.4, "creas_atendimentos": 1040},
    {"ano": "2025", "vd_notificada": 284, "femicidio": 4, "medidas_protetivas": 84, "bo_registrado_pct": 28.4, "creas_atendimentos": 1120},
]

_INDICADORES = [
    {"indicador": "Taxa de femicídio (meta: 0)",                      "valor": 35.0, "meta": 0.0, "unidade": "/100k mulheres", "status": "critico", "observacao": "35/100k (22× a média nacional 1,6). 4 óbitos, 12 tentativas. 3 de 4 com medida protetiva anterior descumprida. Odara + botão do pânico: R$ 2.400"},
    {"indicador": "Subnotificação de violência doméstica",            "valor": 80.0, "meta": 0.0, "unidade": "%",              "status": "critico", "observacao": "80% subnotificada. 284 notificados vs 1.420 estimados. Protocolo UBS: R$ 8.400 → triagem ativa em 100% das consultas de mulheres"},
    {"indicador": "Medidas protetivas cumpridas",                     "valor": 42.4, "meta": 100.0,"unidade": "%",             "status": "critico", "observacao": "42,4% cumpridas. 84 concedidas em 2025. 57,6% descumpridas = agressor continua ameaçando. Tornozeleira eletrônica via TJAM: zero em Apuí"},
    {"indicador": "Kit pós-violência sexual disponível nas UBSs",     "valor": 0.0,  "meta": 100.0,"unidade": "%",             "status": "critico", "observacao": "Zero. Protocolo MS 2022: anticoncepção + PEP + notificação. R$ 14k de implantação. 280 violências sexuais estimadas vs 42 notificadas. PEP em 72h: -100% transmissão HIV"},
    {"indicador": "Notificação compulsória violência (SINAN)",        "valor": 28.4, "meta": 100.0,"unidade": "%",             "status": "critico", "observacao": "28,4% das UBSs notificam. SINAN: obrigatório desde 2011. Treinamento equipe: R$ 8.400 (incluso no protocolo UBS). Subnotificação alimenta invisibilidade do problema"}
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/casos")
def casos():
    return _CASOS


@router.get("/protecao")
def protecao():
    return _PROTECAO


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
