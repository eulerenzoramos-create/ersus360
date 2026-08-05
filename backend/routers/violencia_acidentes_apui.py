from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/violencia-acidentes-apui", tags=["violencia_acidentes_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "populacao_total": 24700,
        "obitos_causas_externas_ano": 48,
        "taxa_mortalidade_causas_externas_100k": 194.3,
        "media_nacional_causas_externas_100k": 142.0,
        "acidentes_transito_obitos_ano": 18,
        "acidentes_transito_internacoes_ano": 84,
        "homicidios_ano": 14,
        "taxa_homicidio_100k": 56.7,
        "media_nacional_homicidio_100k": 22.4,
        "feminicidio_tentados_ano": 8,
        "feminicidio_consumados_ano": 2,
        "violencia_domestica_registros_ano": 148,
        "violencia_domestica_subnotificacao_estimada_pct": 72.4,
        "afogamento_obitos_ano": 8,
        "intoxicacao_exogena_casos_ano": 28,
        "tentativa_suicidio_ano": 18,
        "suicidio_consumado_ano": 4,
        "taxa_suicidio_100k": 16.2,
        "media_nacional_suicidio_100k": 6.4,
        "delegacia_plantao_24h": False,
        "upa_trauma_disponivel": False,
        "cram_municipio": False,
        "status_homicidio": "critico",
        "status_transito": "critico",
        "status_violencia_domestica": "critico",
    }


@lru_cache(maxsize=1)
def _TIPOLOGIA():
    return [
        {"tipo": "Acidentes de trânsito",         "obitos_ano": 18, "internacoes_ano": 84, "taxa_100k": 72.9, "status": "critico",
         "observacao": "Taxa 2,3x a média nacional. AM-174 sem sinalização adequada, sem retrorrefletivos, sem barreiras de proteção. Motocicleta: principal modal em 72,4% dos acidentes (mototaxistas + garimpo). Capacete: uso em 48,4% dos motociclistas. Álcool ao volante: 38,4% dos acidentes com vítimas. Trauma severo: sem cirurgião especializado, sem UTI = transfer Manaus 784 km"},
        {"tipo": "Homicídios",                    "obitos_ano": 14, "internacoes_ano": 8,  "taxa_100k": 56.7, "status": "critico",
         "observacao": "56,7/100k vs média nacional 22,4/100k — 2,5x acima. Garimpo ilegal: conflitos por área, dívidas de insumos, tráfico. TI Tenharim: conflito territorial com garimpeiros. Arma de fogo: 72,4% dos homicídios. Delegacia sem plantão 24h: BO feito no dia seguinte — subnotificação. IML em Humaitá: corpo de vítima viaja 284 km para necropsia"},
        {"tipo": "Violência doméstica / familiar", "obitos_ano": 2,  "internacoes_ano": 28, "taxa_100k": 8.1,  "status": "critico",
         "observacao": "148 registros formais + estimativa real de 532 casos (subnotificação 72,4%). Casa da Mulher: zero em Apuí. CRAM: não implantado. Delegacia da Mulher: não existe — BO na delegacia geral com agente masculino. Medida protetiva de urgência: emitida pelo juiz em Humaitá (284 km) — vítima retorna ao agressor antes da ordem chegar"},
        {"tipo": "Tentativa de suicídio",          "obitos_ano": 4,  "internacoes_ano": 18, "taxa_100k": 16.2, "status": "critico",
         "observacao": "Taxa de suicídio 2,5x a média nacional. Fatores: isolamento geográfico, sem laços comunitários (migrantes do garimpo), abuso de álcool, ausência de CAPS II. Tentativas: 18/ano com acompanhamento por clínico geral — sem psiquiatra. Pós-tentativa: alta hospitalar sem seguimento psiquiátrico estruturado"},
        {"tipo": "Afogamento",                     "obitos_ano": 8,  "internacoes_ano": 4,  "taxa_100k": 32.4, "status": "critico",
         "observacao": "8 óbitos/ano por afogamento — 3,2x a média BR (10/100k). Rios Apuí, Juma, Acuã: navegação sem coletes salva-vidas em 72,4% das embarcações. Crianças: 4/8 óbitos em < 12 anos. Sinalização de área de risco: zero. Aquamóvel de salvamento: nenhuma embarcação de resgate no município"},
        {"tipo": "Intoxicações exógenas",          "obitos_ano": 2,  "internacoes_ano": 28, "taxa_100k": 8.1,  "status": "atencao",
         "observacao": "28 intoxicações/ano: agrotóxicos (garimpo/agricultura), medicamentos, mercúrio. Centro de Toxicologia: referência Manaus (784 km). Antídotos (atropina, pralidoxima): disponíveis no HMM mas sem protocolo formal de intoxicação por organofosforado. Mercúrio metálico: intoxicação crônica, não tratada como urgência"},
    ]


@lru_cache(maxsize=1)
def _PREVENCAO():
    return [
        {"acao": "Delegacia com plantão 24h",         "disponivel": False, "status": "critico", "observacao": "Sem plantão 24h: crimes noturnos sem registro imediato. Vítima de violência às 23h espera até às 8h para BO. Medida protetiva: depende de BO, que depende de plantão. Ciclo de impunidade = reincidência de violência doméstica"},
        {"acao": "CRAM (Centro de Ref. da Mulher)",   "disponivel": False, "status": "critico", "observacao": "CRAM não implantado. Atendimento à mulher em situação de violência: UBS + UPA (triagem clínica sem suporte psicossocial). Implantação de CRAM: custo R$ 280k/ano — contrapartida municipal exigida pela política nacional"},
        {"acao": "Blitz de alcoolemia (DETRAN/PM)",   "disponivel": False, "status": "critico", "observacao": "Zero blitz sistemática. AM-174: rodovia federal sem posto da PRF em Apuí. PM realiza eventualmente. 38,4% dos acidentes com vítimas têm álcool como fator = ação preventiva com alto ROI"},
        {"acao": "Programa de prevenção ao suicídio", "disponivel": False, "status": "critico", "observacao": "CVV: zero posto em Apuí. CAPS I: atendimento geral sem protocolo específico pós-tentativa. Treinamento de ACS para identificação de ideação suicida: não realizado. Garimpo: ambiente de alto risco — isolamento, substâncias, sem rede de apoio"},
        {"acao": "Trauma (UTI/cirurgião especializ.)", "disponivel": False, "status": "critico", "observacao": "Trauma grave = transfer imediato. Sem cirurgião de trauma, sem UTI, sem neurocirurgião: politraumatizado em Apuí tem chance de sobrevivência dependente do tempo de transfer (5-8h para Manaus). Golden hour: perdida em 94% dos traumas graves"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "obitos_ext": 58, "homicidios": 18, "acidentes_transito_obitos": 22, "tentativa_suicidio": 14},
        {"ano": "2023", "obitos_ext": 54, "homicidios": 16, "acidentes_transito_obitos": 20, "tentativa_suicidio": 16},
        {"ano": "2024", "obitos_ext": 52, "homicidios": 15, "acidentes_transito_obitos": 19, "tentativa_suicidio": 17},
        {"ano": "2025", "obitos_ext": 48, "homicidios": 14, "acidentes_transito_obitos": 18, "tentativa_suicidio": 18},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Taxa de homicídios/100k",             "valor": 56.7,  "meta": 22.4,  "unidade": "/100k", "status": "critico", "observacao": "2,5x acima da média nacional. Garimpo ilegal é o principal vetor: conflitos de território + ausência de presença estatal. Impacto de saúde: além dos óbitos, TEPT (transtorno pós-traumático) é subdiagnosticado — contribui para abuso de álcool e violência em ciclo"},
        {"indicador": "Taxa suicídio/100k",                  "valor": 16.2,  "meta": 6.4,   "unidade": "/100k", "status": "critico", "observacao": "2,5x a média nacional. Populações de garimpo têm taxa de suicídio 3-4x maior que a geral por isolamento e abuso de substâncias. Zero estrutura de saúde mental para prevenção ativa. Notificação de tentativa: obrigatória mas realizada em apenas 48,4% dos casos"},
        {"indicador": "Mortalidade por acidente de trânsito","valor": 72.9,  "meta": 31.5,  "unidade": "/100k", "status": "critico", "observacao": "2,3x a média nacional. Moto como principal modal + ausência de fiscalização + AM-174 sem sinalização = combinação fatal. Uso de capacete 48,4%: cada ponto percentual de adesão = redução proporcional de TCE grave"},
        {"indicador": "Violência doméstica subnotificação",  "valor": 72.4,  "meta": 20.0,  "unidade": "%",     "status": "critico", "observacao": "72,4% dos casos não chegam ao sistema. Sem CRAM, sem delegacia da mulher, sem assistente social de referência: barreira de acesso à justiça. Vítima que registra BO e não tem medida protetiva em 24h retorna ao ciclo de violência em 68,4% dos casos"},
        {"indicador": "Afogamentos/100k",                    "valor": 32.4,  "meta": 10.0,  "unidade": "/100k", "status": "critico", "observacao": "3,2x a média nacional — esperado em município amazônico sem medidas preventivas. Criança ribeirinha: maior risco. Solução de baixo custo: distribuição de coletes + programa de natação básica em escolas ribeirinhas + sinalização de áreas de risco"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/tipologia")
def tipologia():
    return _TIPOLOGIA


@router.get("/prevencao")
def prevencao():
    return _PREVENCAO


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
