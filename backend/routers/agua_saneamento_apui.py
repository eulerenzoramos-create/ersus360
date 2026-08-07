from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/agua-saneamento-apui", tags=["agua_saneamento_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "populacao_total": 24700,
        "abastecimento_agua_tratada_pct": 48.4,
        "meta_agua_tratada_pct": 100.0,
        "abastecimento_rural_agua_tratada_pct": 12.4,
        "abastecimento_urbano_agua_tratada_pct": 72.4,
        "esgotamento_sanitario_pct": 18.4,
        "meta_esgotamento_pct": 90.0,
        "domicilios_fossa_rudimentar_pct": 64.2,
        "domicilios_sem_banheiro_pct": 8.4,
        "coleta_lixo_pct": 52.4,
        "lixao_ceu_aberto": True,
        "lixao_distancia_manancial_km": 0.8,
        "doencas_diarreicas_incidencia_100k": 2840,
        "doencas_diarreicas_casos_ano": 702,
        "hepatite_a_casos_ano": 8,
        "leptospirose_casos_ano": 3,
        "qualidade_agua_irregular_amostras_pct": 28.4,
        "meta_agua_irregular_pct": 5.0,
        "vigagua_pontos_monitorados": 28,
        "vigagua_pontos_total": 84,
        "cisterna_zona_rural": 148,
        "populacao_sem_agua_zona_rural_estimada": 6400,
        "distancia_sanepar_km": 784,
        "status_agua": "critico",
        "status_esgoto": "critico",
        "status_lixo": "critico",
    }


@lru_cache(maxsize=1)
def _COBERTURA():
    return [
        {"zona": "Sede urbana",       "agua_tratada_pct": 72.4, "esgoto_pct": 28.4, "coleta_lixo_pct": 84.2, "populacao": 12400, "status": "atencao"},
        {"zona": "Zona rural (ramal)","agua_tratada_pct": 18.4, "esgoto_pct": 4.8,  "coleta_lixo_pct": 12.4, "populacao": 7800,  "status": "critico"},
        {"zona": "Comunidades ribeirinhas", "agua_tratada_pct": 4.8, "esgoto_pct": 2.4, "coleta_lixo_pct": 4.8, "populacao": 4500, "status": "critico"},
    ]


@lru_cache(maxsize=1)
def _DOENCAS():
    return [
        {"doenca": "Diarreias agudas (todas)",       "casos_ano": 702, "incidencia_100k": 2840, "hospitalizacoes": 48,  "obitos": 2, "status": "critico",  "nexo": "Água contaminada, fossa rudimentar, manancial próximo ao lixão"},
        {"doenca": "Hepatite A",                     "casos_ano": 8,   "incidencia_100k": 32.4, "hospitalizacoes": 6,   "obitos": 0, "status": "atencao",  "nexo": "Surto 2024 em área ribeirinha — água sem tratamento, contato com fezes"},
        {"doenca": "Leptospirose",                   "casos_ano": 3,   "incidencia_100k": 12.1, "hospitalizacoes": 3,   "obitos": 0, "status": "atencao",  "nexo": "Lixão a 800m do igarapé — roedores + alagamentos período chuvoso"},
        {"doenca": "Esquistossomose (suspeita)",      "casos_ano": 4,   "incidencia_100k": 16.2, "hospitalizacoes": 1,   "obitos": 0, "status": "atencao",  "nexo": "Contato com igarapés — subnotificação alta, diagnóstico raramente solicitado"},
        {"doenca": "Amebíase / parasitoses inttest.", "casos_ano": 284, "incidencia_100k": 1150, "hospitalizacoes": 12,  "obitos": 0, "status": "critico",  "nexo": "Crianças < 5 anos: 64,2% com parasitoses. Água sem tratamento + solo contaminado"},
        {"doenca": "Fluorose dental (crônico)",       "casos_ano": None,"incidencia_100k": None, "hospitalizacoes": None,"obitos": 0, "status": "atencao",  "nexo": "Fluoretação irregular: 4 meses/ano sem flúor monitorado. Custo/dia de tratamento dentário 10x o da fluoretação"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "agua_tratada_pct": 38.4, "esgoto_pct": 12.4, "diarreias_casos": 784, "hepatite_a": 4,  "qualidade_irregular_pct": 34.2},
        {"ano": "2023", "agua_tratada_pct": 42.4, "esgoto_pct": 14.8, "diarreias_casos": 748, "hepatite_a": 6,  "qualidade_irregular_pct": 31.4},
        {"ano": "2024", "agua_tratada_pct": 45.8, "esgoto_pct": 16.4, "diarreias_casos": 724, "hepatite_a": 8,  "qualidade_irregular_pct": 29.8},
        {"ano": "2025", "agua_tratada_pct": 48.4, "esgoto_pct": 18.4, "diarreias_casos": 702, "hepatite_a": 8,  "qualidade_irregular_pct": 28.4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Cobertura de água tratada",              "valor": 48.4,  "meta": 100.0, "unidade": "%",       "status": "critico", "observacao": "51,6% sem acesso a água tratada, principalmente zona rural (87,6%) e ribeirinha (95,2%). Doenças diarreicas: 2.840/100k vs média nacional 420/100k. Cada R$ 1 investido em saneamento poupa R$ 4 em saúde — Apuí investe zero em saneamento rural"},
        {"indicador": "Cobertura de esgotamento sanitário",     "valor": 18.4,  "meta": 90.0,  "unidade": "%",       "status": "critico", "observacao": "81,6% sem esgotamento adequado — fossa rudimentar (64,2%), a céu aberto ou direto em igarapé. Zona ribeirinha: 97,6% sem saneamento. Igarapés usados para consumo, banho, pesca E como destino de dejetos simultaneamente"},
        {"indicador": "Qualidade da água — amostras irregulares","valor": 28.4, "meta": 5.0,   "unidade": "%",       "status": "critico", "observacao": "28,4% das amostras com coliformes totais ou fecais acima do VMP. VIGIAGUA monitora apenas 33% dos pontos (28/84) — 56 pontos sem monitoramento. Área rural e ribeirinha: sem monitoramento há mais de 6 meses"},
        {"indicador": "Lixão a céu aberto",                     "valor": 1,     "meta": 0,     "unidade": "lixão",   "status": "critico", "observacao": "Lixão a 800m de manancial — risco de contaminação de lençol freático e igarapés. Prazo PNRS (2014) vencido há 11 anos. Aterro sanitário: projeto existe, obra não iniciada. Catadores sem registro ou proteção"},
        {"indicador": "Doenças diarreicas agudas",               "valor": 2840,  "meta": 420,   "unidade": "/100k",   "status": "critico", "observacao": "6,8x a média nacional. Crianças < 5 anos respondem por 42% dos casos — desnutrição + diarreia = ciclo de má absorção. Mortalidade infantil por diarreia evitável com saneamento básico: 0 é possível, 18,4/1k NV é real"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/cobertura")
def cobertura():
    return _COBERTURA()


@router.get("/doencas")
def doencas():
    return _DOENCAS()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()