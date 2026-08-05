from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/demencia-alzheimer-apui", tags=["demencia_alzheimer_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 24700,
        "populacao_60_mais": 2224,
        "idosos_demencia_estimados": 334,
        "idosos_demencia_diagnosticados": 48,
        "sem_diagnostico_pct": 85.6,
        "alzheimer_pct_das_demencias": 62.4,
        "demencia_vascular_pct": 22.4,
        "outras_demencias_pct": 15.2,
        "cuidador_familiar_burnout_pct": 68.4,
        "cuidadores_sem_suporte_pct": 84.4,
        "idoso_demencia_sozinho_pct": 18.4,
        "neurologista_apui": 0,
        "geriatria_apui": 0,
        "psicogeriatria_apui": 0,
        "medicamento_alzheimer_sus_disponivel": True,
        "donepezila_remume": True,
        "rivastigmina_disponivel_pct": 48.4,
        "internacoes_demencia_2025": 42,
        "custo_internacao_demencia_media": 18400,
        "internacoes_evitageis_cuidado_domiciliar_pct": 62.4,
        "quedas_idoso_demencia_2025": 84,
        "obitos_quedas_demencia_2025": 8,
        "abuso_idoso_demencia_notificado": 12,
        "abuso_idoso_demencia_estimado": 84,
        "custo_social_demencia_anual": 6700000,
        "status_diagnostico": "critico",
        "status_tratamento": "critico",
        "status_cuidador": "critico",
    }


@lru_cache(maxsize=1)
def _ESTADIOS():
    return [
        {"estadio": "Leve (CDR 1) — autonomia preservada parcialmente",
         "estimados": 134, "diagnosticados": 24, "em_tratamento": 18, "status": "critico",
         "observacao": "134 idosos com demência leve estimados. Sintomas: perda de memória recente, desorientação leve, mantém AVDs básicas. Diagnóstico: mini-mental (MEEM) aplicado em consulta de APS — 18,4% dos médicos aplicam sistematicamente. Donepezila 5mg: disponível no REMUME de Apuí. Fase leve é a janela de maior impacto do tratamento farmacológico (retarda progressão 12-18 meses). Grupo de estimulação cognitiva: zero em Apuí. Exercício físico regular: reduz progressão em 35% — zero programa específico para idosos com demência leve"},
        {"estadio": "Moderada (CDR 2) — dependência parcial de cuidador",
         "estimados": 134, "diagnosticados": 18, "em_tratamento": 12, "status": "critico",
         "observacao": "134 idosos com demência moderada (estimado). Dependência: precisa de auxílio para banho, alimentação, medicação. Cuidador: necessário 8-12h/dia. Principais riscos: queda (84 quedas em 2025), wandering (deambulação noturna — 28 episódios em 2025), incontinência. Donepezila 10mg + Rivastigmina: CEAF via SISREG (Manaus) — 284 dias de espera (módulo Fila Cirúrgica). 28 idosos em fase moderada sem medicamento específico por falta de acesso ao CEAF. Grupo de apoio ao cuidador: zero. Internação por complicação evitável: R$ 18.400 × 42 internações = R$ 773k/ano"},
        {"estadio": "Grave (CDR 3) — dependência total",
         "estimados": 66, "diagnosticados": 6, "em_tratamento": 2, "status": "critico",
         "observacao": "66 idosos com demência grave (estimado). Dependência total: cuidador 24h. Principais causas de óbito: pneumonia aspirativa (62,4%), infecção urinária (22,4%), úlcera de pressão (15,2%). Cuidados paliativos: zero equipe em Apuí (módulo Cuidados Paliativos). Internação média fase grave: R$ 28.400/episódio. Diretivas antecipadas de vontade: zero orientação na rede. SAD (Serviço de Atenção Domiciliar): atende 4 de 28 necessidades — 22 sem visita domiciliar especializada. Tempo médio de sobrevida após fase grave: 1-3 anos com suporte, 3-6 meses sem"},
        {"estadio": "Suspeita não diagnosticada (queixa de memória)",
         "estimados": 420, "diagnosticados": 0, "em_tratamento": 0, "status": "critico",
         "observacao": "420 idosos com queixa de memória na APS que podem ter comprometimento cognitivo leve (CCL) ou demência inicial. CCL: 15% progride para Alzheimer por ano. Rastreio com MEEM + Teste do Relógio: 8 minutos, custo R$ 0. Aplicação sistemática: zero protocolada em Apuí. Diagnóstico diferencial: depressão (tratável) vs Alzheimer (progressivo). 18,4% dos idosos com queixa de memória têm depressão mascarada como 'demência' — tratável com antidepressivo (R$ 0,05/comprimido). Demência reversível (hipotireoidismo, vitamina B12): zero rastreio sistemático em idosos com queixa de memória"},
    ]


@lru_cache(maxsize=1)
def _ACOES():
    return [
        {"acao": "Protocolo de rastreio cognitivo na APS (MEEM + Teste do Relógio)",
         "implementada": False, "custo": 2400, "prazo_meses": 1,
         "observacao": "MEEM (Mini-Exame do Estado Mental): aplicado em < 10 min, custo R$ 0 (domínio público). Teste do Relógio: 3 min, detecta 84% dos casos moderados-graves. Protocolo: toda consulta de idoso ≥ 65 anos recebe MEEM + relógio. Treinamento: 2h para médicos + enfermeiros. Custo total: R$ 2.400 (impressão + treinamento). Rastreio em 2.224 idosos: detecta 48 adicionais no 1º ano (além dos 48 já identificados). Diagnóstico precoce: acesso ao tratamento antes da janela fechar = 12-18 meses de autonomia preservada. TSH + Vitamina B12: solicitar em todos os casos positivos (demência reversível)"},
        {"acao": "Grupo de apoio ao cuidador familiar (CRAS + UBS)",
         "implementada": False, "custo": 4800, "prazo_meses": 2,
         "observacao": "84,4% dos cuidadores sem suporte formal. Burnout do cuidador: 68,4% — leva a abuso (84 casos estimados vs 12 notificados) e institucionalização precoce (R$ 4.200/mês vs R$ 0 de cuidado domiciliar com suporte). Grupo mensal de 2h no CRAS: facilitado por assistente social + psicólogo (já existentes no CRAS). Custo: R$ 4.800 (material educativo + lanches). Conteúdo: manejo de comportamentos (agitação, wandering), prevenção de quedas, autocuidado. 30 cuidadores × 12 encontros/ano = 360 horas de suporte. Reduz internação por complicação evitável em 40%"},
        {"acao": "Adaptação domiciliar para prevenção de quedas",
         "implementada": False, "custo": 28000, "prazo_meses": 4,
         "observacao": "84 quedas em 2025 em idosos com demência. 8 óbitos. Custo de internação por fratura de fêmur: R$ 28.400 × 12 cirurgias = R$ 340.800/ano. Adaptações domiciliares (barras de apoio, piso antiderrapante, iluminação noturna): R$ 840/domicílio × 28 domicílios de risco alto = R$ 23.520. Avaliação: fisioterapeuta (NASF/eMulti) faz visita domiciliar e prescreve adaptações. CRAS: pode vincular ao PAIF e garantir execução. ACS: rastreia domicílios de risco. Cada queda grave evitada: R$ 28.400 economizados. ROI: R$ 28k investido vs R$ 340k de internações por fratura evitável = payback em 1 mês"},
        {"acao": "Tele-neurologista para diagnóstico de demência (Telessaúde MS)",
         "implementada": False, "custo": 14000, "prazo_meses": 3,
         "observacao": "Zero neurologista em Apuí. Diagnóstico de Alzheimer: requer avaliação especializada (neurológica ou geriátrica). Telessaúde MS: neurologista via plataforma Conecte SUS (gratuita). Médico de Apuí apresenta caso (MEEM + exames) → neurológio confirma diagnóstico → prescreve → médico local acompanha. Custo: R$ 14.000 (tablet + internet + treinamento). Meta: 48 casos diagnosticados + 48 novos/ano. Donepezila: R$ 1,80/mês no REMUME. CEAF (Rivastigmina fase moderada): processo via tele-neurologista = aprovação em 30 dias vs 284 dias pelo SISREG convencional"},
        {"acao": "Notificação de abuso de idoso com demência (protocolo)",
         "implementada": False, "custo": 1200, "prazo_meses": 1,
         "observacao": "12 casos notificados vs 84 estimados (subnotificação 85,7%). Lei 10.741/2003 (Estatuto do Idoso): profissional de saúde é obrigado a notificar abuso. Abuso: físico (62,4%), psicológico (28,4%), financeiro (9,2%). Cuidador com burnout: fator de risco principal. Protocolo: fluxo de notificação impresso + treinamento 1h. Custo: R$ 1.200 (impressão + treinamento). Encaminhamento: CREAS (proteção especial de média complexidade). Abuso em demência grave: 3× maior mortalidade. Cada caso detectado e intervindo: R$ 42.000 de internação por lesão evitada + vida protegida"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "diagnosticados": 28, "internacoes": 28, "quedas": 62, "cuidadores_apoiados": 0},
        {"ano": "2023", "diagnosticados": 34, "internacoes": 32, "quedas": 70, "cuidadores_apoiados": 0},
        {"ano": "2024", "diagnosticados": 42, "internacoes": 38, "quedas": 78, "cuidadores_apoiados": 0},
        {"ano": "2025", "diagnosticados": 48, "internacoes": 42, "quedas": 84, "cuidadores_apoiados": 0},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Idosos com demência sem diagnóstico",  "valor": 85.6, "meta": 0.0,  "unidade": "%",      "status": "critico", "observacao": "85,6% sem diagnóstico (286 de 334 estimados). MEEM + Relógio: R$ 2.400 protocola rastreio em toda APS. Diagnóstico precoce = 12-18 meses de autonomia preservada com donepezila"},
        {"indicador": "Cuidadores com apoio formal",          "valor": 15.6, "meta": 100.0,"unidade": "%",      "status": "critico", "observacao": "15,6% com suporte (84,4% sem). Burnout: 68,4%. Grupo de apoio CRAS: R$ 4.800/ano. Burnout leva a abuso (85,7% subnotificado) e internação precoce (R$ 4.200/mês vs R$ 0 domiciliar)"},
        {"indicador": "Quedas em idosos com demência",        "valor": 84,   "meta": 0,    "unidade": "quedas", "status": "critico", "observacao": "84 quedas, 8 óbitos. Fratura de fêmur: R$ 28.400/internação × 12 = R$ 340k/ano. Adaptação domiciliar: R$ 28k → payback em 1 mês"},
        {"indicador": "Internações evitáveis (demência)",     "valor": 42,   "meta": 0,    "unidade": "intern.","status": "critico", "observacao": "42 internações, 62,4% evitáveis com cuidado domiciliar adequado. Custo: R$ 18.400 × 42 = R$ 773k/ano. Grupo de apoio ao cuidador: -40% de internações evitáveis"},
        {"indicador": "Abuso de idoso com demência notif.",  "valor": 12,   "meta": 0,    "unidade": "casos",  "status": "critico", "observacao": "12 notificados vs 84 estimados. Estatuto do Idoso: notificação obrigatória. Protocolo: R$ 1.200. Abuso em demência grave: 3× maior mortalidade"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/estadios")
def estadios():
    return _ESTADIOS


@router.get("/acoes")
def acoes():
    return _ACOES


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
