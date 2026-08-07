from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/clima-saude-apui", tags=["clima_saude_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "area_km2": 54200,
        "desmatamento_acumulado_pct": 28.4,
        "desmatamento_2024_km2": 284,
        "temperatura_media_1980": 26.2,
        "temperatura_media_2025": 28.8,
        "aumento_temperatura_graus": 2.6,
        "dias_calor_extremo_ano": 84,
        "seca_extrema_dias_2024": 128,
        "nivel_rio_apui_minimo_2024_cm": 48,
        "queimadas_focos_2024": 2842,
        "qualidade_ar_dias_ruins_2024": 68,
        "pm25_pico_ug_m3": 284,
        "doencas_vetoriais_aumento_pct_10a": 42.4,
        "malaria_aumento_seca_pct": 38.4,
        "dengue_aumento_chuva_pct": 28.4,
        "intoxicacao_agrotoxicos_casos_ano": 28,
        "mercurio_exposicao_garimpo_casos": 142,
        "desnutricao_seca_aumento_pct": 18.4,
        "saneamento_basico_pct": 22.4,
        "agua_tratada_pct": 38.4,
        "diarreia_seca_aumento_pct": 48.4,
        "status_temperatura": "critico",
        "status_queimadas": "critico",
        "status_vetores": "critico",
    }


@lru_cache(maxsize=1)
def _IMPACTOS():
    return [
        {"impacto": "Queimadas e qualidade do ar",           "magnitude": "critico",
         "observacao": "2.842 focos de queimada em 2024 — Apuí em ranking nacional de desmatamento. Fumaça: PM2,5 chegando a 284 μg/m³ (meta OMS: 15 μg/m³ — 19x acima). 68 dias/ano com qualidade do ar 'ruim' ou 'muito ruim'. Impacto na saúde: asma (exacerbação em 284 pacientes durante queimadas), conjuntivite química, gestantes com baixo peso ao nascer (PM2,5 > 25 μg/m³ durante gravidez = 28,4% mais risco de prematuridade). Zero máscara PFF2 distribuída nas UBS durante período crítico. Hospitalização por crise respiratória durante queimadas: aumento de 38,4%"},
        {"impacto": "Seca extrema e colapso hídrico",        "magnitude": "critico",
         "observacao": "Rio Apuí em nível histórico mínimo: 48 cm em outubro/2024 (normal: 320 cm). Seca extrema: 128 dias em 2024. Impactos na saúde: (1) Abastecimento de água: 62,4% da população sem água tratada durante a seca. (2) Diarreia e cólera: aumento de 48,4% em crianças < 5a durante seca por concentração de bactérias na água parada. (3) Acesso a serviços de saúde: UBS de comunidades ribeirinhas isoladas por 28-42 dias na seca (barco não consegue navegar). (4) Desnutrição: pesca reduzida = proteína animal disponível cai 38,4% — desnutrição aguda em crianças ribeirinhas"},
        {"impacto": "Aumento de temperatura e calor extremo","magnitude": "critico",
         "observacao": "2,6°C de aumento em 45 anos (1980→2025). 84 dias/ano com temperatura > 35°C (sensação térmica > 40°C). Populações de risco: idoso > 65a, lactente, trabalhador rural, garimpeiro. Internação por golpe de calor: 12 casos/ano (subnotificado). Hipertensão: descompensada em 38,4% dos pacientes durante ondas de calor (vasodilatação + desidratação). Trabalho rural em altas temperaturas: produtividade reduzida em 42,4% e risco de exaustão térmica. Ar-condicionado nas UBS: 2 de 8 postos sem climatização — consulta médica em 38°C"},
        {"impacto": "Vetores e doenças transmissíveis",      "magnitude": "critico",
         "observacao": "Mudança climática = expansão geográfica dos vetores. Malária: aumento de 38,4% na seca (concentração de criadouros). Dengue/Chikungunya/Zika: aumento de 28,4% nas chuvas de dezembro. Leishmaniose: expansão do Lutzomyia com desmatamento — 22 casos LTA em 2025 vs 12 em 2020. Febre amarela silvestre: zona de risco ampliada — cobertura vacinal 72,4% (meta 95%). Oncocercose: foco residual em comunidades Yanomami próximas. Leptospirose: aumento de 38,4% durante enchentes (rato + água + pé descalço)"},
        {"impacto": "Contaminação por mercúrio (garimpo)",   "magnitude": "critico",
         "observacao": "142 casos de exposição ao mercúrio em 2025 (8 com sintomas neurológicos). Garimpo ilegal: principal fonte de mercúrio orgânico (metilmercúrio) nos peixes do rio Apuí. Peixe: principal proteína animal para 72,4% da população ribeirinha. Mercúrio acumula na cadeia trófica: peixe carnívoro (tucunaré, dourado) com teores 8,4x acima do limite OMS. Dosagem de mercúrio urinário: não disponível em Apuí (referência HEMOAM Manaus). Criança com exposição crônica ao mercúrio: déficit cognitivo irreversível"},
        {"impacto": "Agrotóxicos e saúde",                  "magnitude": "atencao",
         "observacao": "28 intoxicações por agrotóxicos notificadas/ano (subnotificação estimada 5x). Principal produto: glifosato + 2,4-D na soja/milho nos assentamentos. SINAN: notificação de intoxicação realizada em 48,4% dos casos suspeitos. Centro de informações toxicológicas (CIT-AM): Manaus (784 km). Lavagem gástrica: disponível no HMM. Carvão ativado: disponível. Antídotos específicos (atropina para organofosforado): disponível em quantidade limitada. Trabalhador rural sem EPI durante aplicação: 72,4% dos casos"}
    ]


@lru_cache(maxsize=1)
def _ADAPTACAO():
    return [
        {"medida": "Alerta precoce de queimadas (INPE/IBAMA)",   "implementada": False, "custo_implantacao": 0,     "status": "critico",
         "observacao": "Sistema de monitoramento de queimadas INPE: gratuito online. FMS Apuí: não tem protocolo de alerta de saúde quando focos > 50/dia. Medida proposta: integração do mapa INPE com notificação automática no ERSUS 360 → ativação de protocolo de saúde (distribuição de máscara + orientação para grupos de risco + suspensão de atividades ao ar livre para crianças)"},
        {"medida": "Cisterna rural para seca",                   "implementada": True,  "custo_implantacao": 2400,  "status": "atencao",
         "observacao": "284 cisternas instaladas pelo P1MC (Programa 1 Milhão de Cisternas). Meta: 1.200. 916 famílias ribeirinhas ainda sem cisterna. Seca 2024: 72,4% das cisternas existentes secaram por seca mais severa que o projetado. Cisterna calçadão (52.000L): investimento de R$ 4.800 para família de 5 pessoas, potabilidade por até 8 meses de seca"},
        {"medida": "Protocolo de calor extremo nas UBS",         "implementada": False, "custo_implantacao": 0,     "status": "critico",
         "observacao": "Zero protocolo de calor extremo em Apuí. Proposta: temperatura > 38°C = (1) ponto de resfriamento na sede da SMS com água gelada + ventilador; (2) busca ativa de idosos solitários por ACS; (3) orientação de hidratação nas UBS. Custo: R$ 0 para protocolo, R$ 2.400 para 2 ventiladores + bebedouros para pontos de resfriamento"},
        {"medida": "Rastreio de mercúrio em ribeirinhos",        "implementada": False, "custo_implantacao": 28000, "status": "critico",
         "observacao": "Dosagem de mercúrio urinário (Hg-U): R$ 280/exame. 142 expostos identificados: R$ 39.760 para rastrear todos. Medida preventiva: orientação de não comer mais de 300g/semana de peixe carnívoro (tucunaré/dourado). Parceria proposta: FIOCRUZ/LACEN-AM para dosagem in loco com unidade móvel 1x/ano. Criança com Hg-U > 20 μg/L: referência neurológica imediata"},
        {"medida": "Cobertura vacinal febre amarela silvestre",  "implementada": True,  "custo_implantacao": 0,     "status": "atencao",
         "observacao": "72,4% de cobertura (meta 95%). 27,6% da população de Apuí sem vacina antiamarílica em zona de risco silvestre. Surto de febre amarela silvestre: risco real com desmatamento expandindo contato humano-macaco. Vacina disponível nas UBS: custo R$ 0 para o usuário. Barreira: zona ribeirinha sem calendário regular. Solução: vacinação nas embarcações de saúde com calendário semestral"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "focos_queimada": 1842, "temperatura_media": 28.2, "casos_malaria": 142, "intox_agrotoxicos": 18},
        {"ano": "2023", "focos_queimada": 2284, "temperatura_media": 28.4, "casos_malaria": 168, "intox_agrotoxicos": 22},
        {"ano": "2024", "focos_queimada": 2842, "temperatura_media": 28.6, "casos_malaria": 184, "intox_agrotoxicos": 26},
        {"ano": "2025", "focos_queimada": 2284, "temperatura_media": 28.8, "casos_malaria": 196, "intox_agrotoxicos": 28},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Focos de queimada/ano",              "valor": 2842, "meta": 200,   "unidade": "focos", "status": "critico", "observacao": "14x acima da meta. PM2,5 durante queimadas: 284 μg/m³ (meta OMS 15 μg/m³ = 19x). Hospitalização respiratória durante queimadas: +38,4%. Zero protocolo de saúde para qualidade do ar em Apuí. Integração INPE-FMS: medida de custo R$ 0 com impacto imediato"},
        {"indicador": "Exposição ao mercúrio (garimpo)",    "valor": 142,  "meta": 0,     "unidade": "casos", "status": "critico", "observacao": "142 casos identificados — estimados reais: 5x mais (710). Metilmercúrio no peixe = neurotoxicidade permanente em crianças. Peixe é a principal fonte proteica de 72,4% da população ribeirinha: não se pode simplesmente 'não comer'. Solução: substituição de mercúrio por processos alternativos no garimpo + monitoramento trimestral do Hg nos rios"},
        {"indicador": "Temperatura média anual",            "valor": 28.8, "meta": 26.2,  "unidade": "°C",   "status": "critico", "observacao": "+2,6°C desde 1980. Projeção 2050: +4,2°C. 84 dias/ano com temperatura > 35°C: golpe de calor, exacerbação de HAS, desidratação infantil. Amazônia aquece 1,5-2x mais rápido que a média global devido ao desmatamento + efeito albedo"},
        {"indicador": "Cobertura de água tratada",          "valor": 38.4, "meta": 100.0, "unidade": "%",    "status": "critico", "observacao": "61,6% sem água tratada. Na seca: 62,4% sem nenhum tipo de água segura. Diarreia infecciosa: aumento de 48,4% durante seca. Cada R$ 1 investido em saneamento básico poupa R$ 4 em saúde. Solução emergencial: distribuição de hipoclorito de sódio (R$ 0,08/L de água tratada) por ACS nas comunidades sem acesso"},
        {"indicador": "Doencas vetoriais — tendência 10a",  "valor": 42.4, "meta": 0,     "unidade": "% aum.","status": "critico","observacao": "42,4% de aumento nas doenças vetoriais em 10 anos. Malária + dengue + leishmaniose + leptospirose: todas com tendência crescente correlacionada ao desmatamento e variação climática. Controle de vetores em Apuí: 2 agentes de endemias para 24.700 habitantes (meta: 1 para cada 1.000 = 25 agentes)"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/impactos")
def impactos():
    return _IMPACTOS()


@router.get("/adaptacao")
def adaptacao():
    return _ADAPTACAO()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()