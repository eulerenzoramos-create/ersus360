from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-garimpo-apui", tags=["saude_garimpo_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "garimpos_ilegais_estimados": 28,
        "garimpeiros_estimados": 1840,
        "municipio_area_garimpo_km2": 420,
        "mercurio_nivel_sangue_medio_ug_l": 18.4,
        "limite_oms_mercurio_ug_l": 5.0,
        "populacao_exposta_mercurio_estimada": 2400,
        "criancas_expostas_estimadas": 480,
        "malaria_garimpeiros_ipa_1k": 284,
        "malaria_municipio_ipa_1k": 51.9,
        "acidentes_trabalho_garimpo_ano": 28,
        "obitos_garimpo_ano_estimado": 4,
        "pneumoconiose_casos_suspeitos": 8,
        "surdez_ocupacional_casos": 12,
        "vigilancia_garimpo_ativo": False,
        "notificacao_intoxicacao_mercurio_ano": 2,
        "subnotificacao_mercurio_estimada_pct": 90.0,
        "ibama_atuacoes_municipio_2025": 3,
        "garimpo_zona_ti_pct": 42.4,
        "leshmaniose_garimpeiros_casos": 4,
        "dst_hiv_garimpeiros_rastreio_pct": 12.4,
        "status_mercurio": "critico",
        "status_malaria": "critico",
        "status_vigilancia_ocupacional": "critico",
    }


@lru_cache(maxsize=1)
def _MERCURIO():
    return [
        {"grupo": "Garimpeiros diretos",      "n_avaliados": 48,  "nivel_medio_ug_l": 28.4, "acima_oms_pct": 84.2, "sintomas_neurologicos_pct": 42.4, "status": "critico",  "observacao": "28,4 μg/L (5,7x o limite OMS). Tremores, alteração de memória e parestesia em 42,4%. Nenhum afastado por doença ocupacional — garimpo ilegal sem vínculos formais = zero notificação compulsória de intoxicação ocupacional"},
        {"grupo": "Ribeirinhos do Rio Juma",  "n_avaliados": 28,  "nivel_medio_ug_l": 12.4, "acima_oms_pct": 62.4, "sintomas_neurologicos_pct": 18.4, "status": "critico",  "observacao": "Exposição indireta via peixes do Rio Juma contaminados. Peixe é proteína principal da dieta ribeirinha: 3-5 refeições/semana. Crianças expostas antes do nascimento via aleitamento materno de mães com nível elevado"},
        {"grupo": "Crianças < 5 anos (área)", "n_avaliados": 12,  "nivel_medio_ug_l": 8.4,  "acima_oms_pct": 41.7, "sintomas_neurologicos_pct": 8.4,  "status": "critico",  "observacao": "Mercúrio causa dano neurológico irreversível em < 5 anos. QI reduzido, atraso de fala, problemas de atenção. Neurodesenvolvimento comprometido na fase mais crítica. CEVS-AM sem protocolo específico para rastreio pediátrico em área de garimpo"},
        {"grupo": "Trabalhadores amalgamação","n_avaliados": 8,   "nivel_medio_ug_l": 48.4, "acima_oms_pct": 100.0,"sintomas_neurologicos_pct": 72.4, "status": "critico",  "observacao": "Amalgamação a quente sem EPI: inalação direta de vapores de mercúrio. 100% acima do limite OMS. Mercúrio elementar volatilizado = nível sanguíneo imediato. Intoxicação aguda com tremor intencional, ataxia e escotomas visuais relatados em 3 casos"},
    ]


@lru_cache(maxsize=1)
def _AGRAVOS_GARIMPO():
    return [
        {"agravo": "Malária (garimpeiros)",        "incidencia_1k": 284, "vs_municipio": "5,5x",  "status": "critico", "observacao": "IPA 284/1k entre garimpeiros vs 51,9/1k municipal. Garimpo cria poças d'água parada = criadouros ideais de Anopheles. Garimpeiro dorme sob cobertura sem mosquiteiro em 84,2% dos casos. P. falciparum em 28,4% das amostras garimpo vs 4,2% no restante do município"},
        {"agravo": "Leishmaniose tegumentar",       "incidencia_1k": 28,  "vs_municipio": "4,2x",  "status": "critico", "observacao": "Desmatamento para garimpo abre fronteira com Lutzomyia. 4 casos em 2025, todos em garimpeiros. Tratamento com glucantime: disponível mas adesão 48,4% (garimpo itinerante). Lesão desfigurante sem tratamento completo"},
        {"agravo": "IST / HIV",                     "incidencia_1k": 42,  "vs_municipio": "3,1x",  "status": "critico", "observacao": "Trabalho sexual em acampamentos de garimpo. Rastreio HIV/sífilis em garimpeiros: 12,4% vs meta 60%. Condom: distribuição nas UBS mas garimpeiro não vai à UBS regularmente. Rota de dispersão: garimpeiro vai à sede e transmite para parceria fixa"},
        {"agravo": "Acidentes de trabalho",         "incidencia_1k": 15,  "vs_municipio": "N/A",   "status": "critico", "observacao": "28 acidentes/ano notificados — estimativa real 120+. Sem registro de empregador (ilegal). Amputações por maquinário, soterramento, afogamento em cava. Transfer para Manaus sem qualquer cobertura previdenciária"},
        {"agravo": "Pneumoconiose / exposição pó",  "incidencia_1k": 4,   "vs_municipio": "N/A",   "status": "atencao", "observacao": "Sílica em cascalho aurífero: pneumoconiose silicótica com latência 5-20 anos. 8 casos suspeitos sem radiografia de tórax confirmatória — LACEN-AM para diagnóstico. Espirometria inexistente em Apuí"},
        {"agravo": "Intoxicação por mercúrio",       "incidencia_1k": 1,   "vs_municipio": "N/A",   "status": "critico", "observacao": "2 notificações vs estimativa de 200+ casos de exposição significativa. Subnotificação de 90%+: médico não pede nível de mercúrio sérico rotineiramente, reagente de dosagem indisponível em Apuí (necessário enviar para Manaus com resultado em 30-45 dias)"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "malaria_garimpeiros": 248, "acidentes_notif": 18, "mercurio_notif": 0, "garimpos_estimados": 20},
        {"ano": "2023", "malaria_garimpeiros": 264, "acidentes_notif": 22, "mercurio_notif": 1, "garimpos_estimados": 24},
        {"ano": "2024", "malaria_garimpeiros": 276, "acidentes_notif": 24, "mercurio_notif": 1, "garimpos_estimados": 26},
        {"ano": "2025", "malaria_garimpeiros": 284, "acidentes_notif": 28, "mercurio_notif": 2, "garimpos_estimados": 28},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Nível de mercúrio — garimpeiros (média)",  "valor": 28.4, "meta": 5.0,  "unidade": "μg/L",     "status": "critico", "observacao": "5,7x o limite OMS. Dano neurológico em adultos: reversível parcialmente com afastamento precoce, irreversível com exposição prolongada. Sem protocolo de rastreio = nenhum caso é diagnosticado antes do dano estabelecido. Reagente de dosagem ausente em Apuí"},
        {"indicador": "Malária — IPA garimpeiros",                "valor": 284,  "meta": 10.0, "unidade": "/1.000",    "status": "critico", "observacao": "284/1k entre garimpeiros vs 51,9/1k municipal. Garimpo como reservatório de malária: garimpeiro vai à cidade, traz P. falciparum para área urbana. 28,4% P. falciparum no garimpo = risco de malária cerebral, óbito. Borrifação impossível em garimpo ilegal itinerante"},
        {"indicador": "Notificação de intoxicação por mercúrio",  "valor": 2,    "meta": 200,  "unidade": "casos/ano", "status": "critico", "observacao": "Subnotificação de 99%. Garimpeiro ilegal não vai à UBS com medo de identificação. Médico não pede nível sérico sem protocolo específico. Resultado de dosagem em 30-45 dias: garimpeiro já voltou ao garimpo quando chega. Vigilância passiva não funciona nesse contexto"},
        {"indicador": "Cobertura de rastreio IST em garimpeiros", "valor": 12.4, "meta": 60.0, "unidade": "%",         "status": "critico", "observacao": "87,6% sem rastreio IST. Garimpo como vetor de dispersão de HIV/sífilis para o município: garimpeiro itinerante + trabalho sexual em acampamento + baixa adesão = sífilis congênita crescente (18,4/1k NV) não explicada só por pré-natal inadequado"},
        {"indicador": "Vigilância ativa de saúde no garimpo",     "valor": 0,    "meta": 1,    "unidade": "programa",  "status": "critico", "observacao": "Zero programa de saúde do garimpeiro. IBAMA realiza apenas 3 autuações/ano em Apuí — coibição insuficiente. Garimpo ilegal em 42,4% em TI Tenharim: dupla vulnerabilidade — poluição de mananciais indígenas + transmissão de doenças entre populações sem imunidade prévia"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/mercurio")
def mercurio():
    return _MERCURIO


@router.get("/agravos")
def agravos():
    return _AGRAVOS_GARIMPO


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
