from fastapi import APIRouter
router = APIRouter(prefix="/api/banco-leite-apui", tags=["Banco de Leite Humano Apuí"])

_DASHBOARD = {
    "doadoras_ativas": 14,
    "doadoras_cadastradas_2025": 38,
    "coleta_ml_mes": 4280,
    "coleta_meta_ml_mes": 6000,
    "leite_pasteurizado_ml_mes": 3840,
    "leite_distribuido_ml_mes": 3624,
    "receptores_rnpt_ativo": 22,
    "receptores_rnpt_meta": 28,
    "neonatos_em_utin_referencia": 8,
    "cobertura_aleitamento_exclusivo_6m_pct": 38.4,
    "cobertura_aleitamento_meta_pct": 50.0,
    "visitas_busca_ativa_mes": 124,
    "grupos_aleitamento_mes": 6,
    "perdas_controle_qualidade_pct": 4.2,
    "perdas_meta_pct": 3.0,
    "doadoras_zona_rural_pct": 21.4,
    "status_coleta": "atencao",
    "status_cobertura": "critico",
    "status_qualidade": "atencao",
}

_DOADORAS = [
    {"perfil":"Puérperas internadas UPA",        "doadoras":6,  "coleta_ml_perfil":1840,"motivacao":"Abordagem equipe pós-parto","barreira":"Alta precoce — média 18h"},
    {"perfil":"Mães com excesso de produção",    "doadoras":5,  "coleta_ml_perfil":1620,"motivacao":"Orientação ACS / puericultura","barreira":"Armazenamento domiciliar inadequado"},
    {"perfil":"Mães de bebês internados (UTIN)", "doadoras":3,  "coleta_ml_perfil":820, "motivacao":"Participação no cuidado do filho","barreira":"Distância UTIN referência (200 km)"},
    {"perfil":"Área rural e ribeirinha",         "doadoras":0,  "coleta_ml_perfil":0,   "motivacao":"—","barreira":"Sem acesso a coleta — transporte fluvial sem refrigeração"},
]

_RECEPTORES = [
    {"categoria":"RNPT < 1500g — Pasteurizado",     "receptores":8, "volume_prescrito_ml_dia":180,"atendimento_pct":88.9,"prioridade":"máxima"},
    {"categoria":"RNPT 1500–2500g",                 "receptores":10,"volume_prescrito_ml_dia":120,"atendimento_pct":90.0,"prioridade":"alta"},
    {"categoria":"RN termo com patologia",          "receptores":4, "volume_prescrito_ml_dia":90, "atendimento_pct":75.0,"prioridade":"alta"},
    {"categoria":"Bebês ambulatoriais < 6 meses",   "receptores":0, "volume_prescrito_ml_dia":0,  "atendimento_pct":0,   "prioridade":"media","obs":"Sem oferta para ambulatório — estoque insuficiente"},
]

_ACOES_ALEITAMENTO = [
    {"acao":"Grupo de apoio ao aleitamento materno", "realizacoes_mes":6,  "participantes_mes":48, "local":"UBS Centro + Cohab","resultado":"Aumento 8% AM exclusivo nos grupos participantes"},
    {"acao":"Visita domiciliar busca ativa doadora",  "realizacoes_mes":124,"participantes_mes":124,"local":"Todos os territórios","resultado":"14 doadoras ativas captadas"},
    {"acao":"Oficina para gestantes (pré-natal)",    "realizacoes_mes":4,  "participantes_mes":32, "local":"UBS Centro","resultado":"62% pretendem amamentar exclusivamente até 6 meses"},
    {"acao":"Capacitação equipe de saúde",           "realizacoes_mes":1,  "participantes_mes":18, "local":"SMS","resultado":"Enfermeiros e técnicos de enfermagem UPA"},
    {"acao":"Semana Mundial do Aleitamento Materno",  "realizacoes_mes":1,  "participantes_mes":284,"local":"Praça Central","resultado":"Realizada em ago — maior mobilização do ano"},
]

_HISTORICO = [
    {"ano":"2022","doadoras":24,"coleta_ml":38400,"cobertura_am6m_pct":32.4,"grupos":48,"receptores":16},
    {"ano":"2023","doadoras":28,"coleta_ml":42480,"cobertura_am6m_pct":34.8,"grupos":56,"receptores":18},
    {"ano":"2024","doadoras":34,"coleta_ml":46800,"cobertura_am6m_pct":36.2,"grupos":60,"receptores":20},
    {"ano":"2025","doadoras":38,"coleta_ml":51360,"cobertura_am6m_pct":38.4,"grupos":72,"receptores":22},
]

_INDICADORES = [
    {"indicador":"Cobertura Aleitamento Exclusivo 6 meses","valor":"38,4%","meta":"≥ 50%","status":"critico","obs":"Meta Previne Brasil e OMS não atingida. Fatores: retorno precoce ao trabalho informal (garimpo), leite em pó amplamente distribuído por programas sociais, falta de suporte pós-alta"},
    {"indicador":"Coleta BLH / Meta",                     "valor":"4.280/6.000 mL/mês","meta":"6.000 mL","status":"atencao","obs":"71,3% da meta. Captação de doadoras em zona rural zero — ausência de estrutura de coleta e refrigeração para transporte fluvial"},
    {"indicador":"Perdas Controle de Qualidade",          "valor":"4,2%","meta":"≤ 3%","status":"atencao","obs":"Principal causa: contaminação microbiológica por técnica de extração domiciliar incorreta. Frascos de coleta inadequados (vidro não esterilizado). Kit de coleta entregue mas sem supervisão"},
    {"indicador":"Receptores RNPT Atendidos",             "valor":"22 bebês","meta":"28","status":"atencao","obs":"6 RNPT sem acesso ao leite pasteurizado — estoque insuficiente para demanda da UTIN referência em Humaitá. Transporte refrigerado até 200 km sem garantia de manutenção de cadeia de frio"},
    {"indicador":"Grupos de Aleitamento / mês",           "valor":"6","meta":"≥ 8","status":"atencao","obs":"Grupos inexistentes nas UBS rurais e ribeirinhas — onde AM exclusivo é mais baixo. Sem agente comunitário treinado especificamente em amamentação nas comunidades"},
]

@router.get("/dashboard")
def dashboard(): return _DASHBOARD

@router.get("/doadoras")
def doadoras(): return _DOADORAS

@router.get("/receptores")
def receptores(): return _RECEPTORES

@router.get("/acoes-aleitamento")
def acoes(): return _ACOES_ALEITAMENTO

@router.get("/historico")
def historico(): return _HISTORICO

@router.get("/indicadores")
def indicadores(): return _INDICADORES
