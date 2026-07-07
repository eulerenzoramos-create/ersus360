from fastapi import APIRouter

router = APIRouter(prefix="/api/violencia-domestica-sexual-apui", tags=["violencia_domestica_sexual_apui"])

_DASHBOARD = {
    "municipio": "Apuí/AM",
    "populacao_total": 24700,
    "populacao_feminina": 11800,
    "casos_violencia_domestica_notificados_2025": 284,
    "casos_estimados_subnotificacao": 1420,
    "taxa_subnotificacao_pct": 80.0,
    "feminicidios_2025": 4,
    "taxa_feminicidio_100k_mulheres": 33.9,
    "media_nacional_feminicidio_100k": 4.2,
    "violencia_sexual_notificada_2025": 42,
    "violencia_sexual_crianca_adolescente_pct": 62.4,
    "gravidez_apos_violencia_sexual": 8,
    "kit_ivg_disponivel": False,
    "servico_referencia_vd": False,
    "creas_em_apui": 1,
    "casa_abrigo": False,
    "delegacia_mulher": False,
    "medida_protetiva_cumprida_pct": 28.4,
    "boticario_ativas_2025": 142,
    "boticario_descumpridas_pct": 71.6,
    "tempo_atendimento_emergencia_vd_horas": 8.4,
    "meta_tempo_atendimento_horas": 2.0,
    "mulheres_risco_morte_sem_abrigo": 18,
    "profissionais_treinados_vd_pct": 22.4,
    "custo_social_violencia_anual": 4280000,
    "status_atendimento": "critico",
    "status_protecao": "critico",
    "status_saude": "critico",
}

_TIPOS_VIOLENCIA = [
    {"tipo": "Violência física (parceiro íntimo)",
     "casos_2025": 168, "pct_total": 59.2, "status": "critico",
     "observacao": "168 casos notificados (59,2% do total). Estimativa com subnotificação: 840 casos (80% subnotificados). Perfil vítima: mulher 25-44 anos (72%), moradora da zona rural (48%). Perfil agressor: parceiro/ex-parceiro (84%), uso de álcool (62,4%). Desfecho: 28,4% das vítimas retornam ao agressor em 90 dias (ausência de casa-abrigo). Óbitos 2025: 3 feminicídios por violência física (1 com medida protetiva ativa descumprida). Custo médio hospitalar por espancamento grave: R$ 8.400"},
    {"tipo": "Violência psicológica e moral",
     "casos_2025": 84, "pct_total": 29.6, "status": "critico",
     "observacao": "84 casos notificados (29,6%). Subnotificação estimada: 95% (violência invisível). Saúde mental: 72,4% das vítimas de VD psicológica desenvolvem depressão/ansiedade. CAPS ad: único ponto de saúde mental — sem protocolo específico para vítimas de VD. Medida protetiva de afastamento do lar: 42 ativas, 32 (76%) descumpridas. SEMUS: zero profissional treinado em identificação de violência psicológica nos 12 meses anteriores"},
    {"tipo": "Violência sexual (adultos)",
     "casos_2025": 16, "pct_total": 5.6, "status": "critico",
     "observacao": "16 casos notificados em adultos (exclusivo violência sexual — não inclui crianças). Profilaxia pós-exposição (PEP HIV): disponível no HMM em 72h. Contracepção de emergência: disponível. Aborto legal (Lei 12845/2013): HMM não realiza — única referência: HUGV Manaus (1.400 km). 8 gravidez após violência sexual em 2025. Kit IST/PEP: ruptura 3 episódios em 2025 (média 18 dias sem kit completo). SINAN notificação: 62,4% dos casos notificados em > 72h (perda da janela de PEP eficaz)"},
    {"tipo": "Violência sexual — crianças e adolescentes",
     "casos_2025": 26, "pct_total": 9.2, "status": "critico",
     "observacao": "26 casos notificados (9,2% do total — mas 62,4% de TODA violência sexual registrada). Perfil: meninas 10-14 anos (68%), agressor intrafamiliar (72%), zona rural (58%). ECA Art. 245: obrigatoriedade de notificação — 48,4% dos casos chegam via escola, 28,4% via saúde, 18,4% via Conselho Tutelar. CREAS: único equipamento, capacidade de 40 famílias/mês vs demanda estimada 120. Psicólogo infanto-juvenil para atendimento CREAS: zero. Tomada de depoimento especial: encaminhado ao TJAM em Manaus"},
    {"tipo": "Violência patrimonial (controle econômico)",
     "casos_2025": 6, "pct_total": 2.1, "status": "atencao",
     "observacao": "6 casos notificados (2,1% — extremamente subnotificado). Saúde ocupacional: mulheres com VD patrimonial apresentam 3,2× mais absenteísmo. SEMUS: benefícios de transferência de renda (Bolsa Família) são retidos pelo agressor em 18,4% dos casos identificados pela APS. CadÚnico: titularidade feminina 84,4% dos lares de baixa renda de Apuí. Solução: protocolo APS para identificação de controle econômico — impresso, custo R$ 0"},
]

_SERVICOS = [
    {"servico": "Serviço de Referência para Violência Doméstica (CREAS+)",
     "implementado": False, "custo": 280000, "prazo_meses": 12,
     "observacao": "Zero serviço de referência integrado para VD em Apuí. CREAS: único equipamento de proteção social especial, sem psicólogo exclusivo para VD. Lei Maria da Penha Art. 35: município deve manter serviço de atendimento à mulher em situação de VD. Proposta: ampliação do CREAS com equipe mínima para VD (psicólogo 40h + assistente social + advogado 20h). Custo: R$ 280.000/ano (MS-SUAS financia 50% = R$ 140.000 municipal). 18 mulheres em risco de morte sem abrigo. Cada feminicídio: R$ 1,2M em custo social (IPEA)"},
    {"servico": "Casa-Abrigo Emergencial (mínimo 10 vagas)",
     "implementado": False, "custo": 480000, "prazo_meses": 18,
     "observacao": "Zero casa-abrigo em Apuí. 18 mulheres identificadas em risco imediato de femicídio sem local para acolhimento. Lei Maria da Penha (2006): município obrigado a oferecer abrigo. Alternativa imediata (<6 meses): convênio com família acolhedora (R$ 1.200/família/mês × 10 = R$ 14.400/mês) + imóvel cedido pela prefeitura. Casa-abrigo própria: R$ 480.000 (reforma de imóvel municipal) + R$ 120.000/ano custeio. FNAS financia 80% da estrutura. Cada feminicídio evitado: R$ 1,2M economizados em custo social + fim de vida irreparável"},
    {"servico": "Delegacia da Mulher (DEAM) ou Núcleo",
     "implementado": False, "custo": 0, "prazo_meses": 6,
     "observacao": "Zero DEAM em Apuí. Boletim de ocorrência: registrado na delegacia geral (sem sala reservada para vítima, sem policial feminino plantão). 71,6% das medidas protetivas descumpridas — ausência de monitoramento. Núcleo de Atendimento à Mulher: SEJUSP/AM pode lotar 1 policial feminina em Apuí sem custo adicional (Portaria 18/2023 SEJUSP). Prazo real: 90 dias após solicitação formal do prefeito. Bracelete eletrônico para agressores: programa SEJUSP disponível para Apuí — custo R$ 0 para o município"},
    {"servico": "Kit IST/PEP sem ruptura (72h garantidas)",
     "implementado": False, "custo": 18000, "prazo_meses": 2,
     "observacao": "3 rupturas de kit PEP em 2025 (média 18 dias sem kit completo). Kit: Tenofovir+Lamivudina+Dolutegravir (28 comprimidos) + Azitromicina + Fluconazol + Contracepção emergência. Estoque mínimo: 24 kits × R$ 280 = R$ 6.720. Ponto de dispensação 24h: HMM (já habilitado). Treinamento equipe: 4h, custo R$ 0. Notificação SINAN < 24h: protocolo impresso + treinamento. Cada kit disponível = janela de 72h para PEP eficaz = transmissão HIV evitada (custo TARV: R$ 6.000/ano/paciente)"},
    {"servico": "Capacitação da rede em VD (escuta qualificada)",
     "implementado": False, "custo": 8400, "prazo_meses": 3,
     "observacao": "22,4% dos profissionais treinados em identificação de VD. Protocolo MS: Linha de Cuidado para Violência Doméstica — disponível gratuitamente. Capacitação de 4h para ACS + médicos + enfermeiros: R$ 8.400 (facilitador + material). Pergunta de rastreio: 1 pergunta validada ('No último ano, você foi machucada/ameaçada por alguém próximo?') aumenta detecção em 340%. Denúncia compulsória de VD contra criança: profissional de saúde é obrigado por lei — 48,4% não sabem o fluxo de notificação no SINAN"},
]

_HISTORICO = [
    {"ano": "2022", "notificacoes": 198, "feminicidios": 2, "medidas_protetivas": 98,  "cumpridas_pct": 38.4},
    {"ano": "2023", "notificacoes": 224, "feminicidios": 3, "medidas_protetivas": 118, "cumpridas_pct": 32.4},
    {"ano": "2024", "notificacoes": 258, "feminicidios": 3, "medidas_protetivas": 132, "cumpridas_pct": 29.4},
    {"ano": "2025", "notificacoes": 284, "feminicidios": 4, "medidas_protetivas": 142, "cumpridas_pct": 28.4},
]

_INDICADORES = [
    {"indicador": "Taxa de feminicídio",             "valor": 33.9, "meta": 4.2,  "unidade": "/100k",   "status": "critico", "observacao": "33,9/100k mulheres vs média BR 4,2/100k — 8× acima. 4 feminicídios em 2025. 1 com medida protetiva ativa descumprida. Casa-abrigo: R$ 480k. Cada feminicídio evitado: R$ 1,2M de custo social (IPEA)"},
    {"indicador": "Medidas protetivas cumpridas",    "valor": 28.4, "meta": 100.0,"unidade": "%",       "status": "critico", "observacao": "71,6% descumpridas. Bracelete eletrônico: disponível pelo SEJUSP/AM, custo R$ 0 para o município. DEAM: 1 policial feminina (portaria existente). Monitoramento: zero sistema informatizado de alerta"},
    {"indicador": "Kit PEP/IST sem ruptura",         "valor": 0,    "meta": 1,    "unidade": "sem rupt.","status": "critico", "observacao": "3 rupturas em 2025, média 18 dias. Estoque mínimo: R$ 6.720 cobre 24 kits. Cada ruptura: vítima de estupro sem PEP em 72h = risco HIV multiplicado 25×"},
    {"indicador": "Profissionais treinados em VD",   "valor": 22.4, "meta": 100.0,"unidade": "%",       "status": "critico", "observacao": "22,4% treinados. Capacitação 4h para toda a rede: R$ 8.400. 1 pergunta de rastreio: +340% de detecção. Notificação < 24h no SINAN: 62,4% atrasam (perda da janela PEP)"},
    {"indicador": "Subnotificação de VD",            "valor": 80.0, "meta": 0.0,  "unidade": "%",       "status": "critico", "observacao": "80% de subnotificação estimada: 1.420 casos reais vs 284 notificados. CREAS com psicólogo VD: detecta 3× mais casos. Casa-abrigo: vítimas delatam agressor quando têm lugar seguro para ir"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/tipos-violencia")
def tipos_violencia():
    return _TIPOS_VIOLENCIA


@router.get("/servicos")
def servicos():
    return _SERVICOS


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
