from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/seguranca-paciente-apui", tags=["seguranca_paciente_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 24700,
        "leitos_hospitalares_apui": 28,
        # Eventos adversos
        "eventos_adversos_2025": 42,
        "eventos_adversos_graves_2025": 8,
        "obito_evento_adverso_2025": 2,
        "subnotificacao_ea_estimativa": 10,
        "notificacao_ea_2025": 4,
        "notificacao_ea_pct": 9.5,
        "meta_notificacao_ea_pct": 100.0,
        # Cirurgia segura
        "checklist_cirurgico_uso_pct": 18.4,
        "meta_checklist_cirurgico_pct": 100.0,
        "cirurgias_apui_2025": 284,
        "complicacao_cirurgica_pct": 8.4,
        "reoperacao_30d_pct": 4.2,
        # Identificação do paciente
        "pulseira_identificacao_pct": 28.4,
        "meta_pulseira_pct": 100.0,
        "erro_medicacao_2025": 28,
        "erro_medicacao_grave_2025": 4,
        # Higiene das mãos
        "higiene_maos_pct": 38.4,
        "meta_higiene_maos_pct": 80.0,
        "iras_taxa_pct": 12.4,
        "meta_iras_pct": 5.0,
        # Queda hospitalar
        "queda_hospitalar_2025": 28,
        "queda_com_dano_2025": 8,
        "avaliacao_risco_queda_hospitalar_pct": 18.4,
        "meta_avaliacao_queda_hospitalar_pct": 100.0,
        # Lesão por pressão
        "lesao_pressao_incidencia_pct": 8.4,
        "meta_lesao_pressao_pct": 3.0,
        "protocolo_lesao_pressao": False,
        # Estrutura
        "nsp_apui": False,
        "nucleo_seguranca_paciente": False,
        "plansp_apui": False,
        "notivisa_notificacoes_2025": 4,
        "meta_notivisa_mes": 10,
        "custo_evento_adverso_estimado": 2016000,
        "status_notificacao": "critico",
        "status_checklist": "critico",
        "status_higiene_maos": "critico",
    }


@lru_cache(maxsize=1)
def _METAS():
    return [
        {"meta": "Protocolo de identificação do paciente — pulseira 100%",
         "atingida": False, "valor": 28.4, "valor_meta": 100.0,
         "status": "critico",
         "observacao": "28,4% com pulseira de identificação (meta 100%). Erro de identificação: causa de 80% dos eventos adversos evitáveis. Pulseira: R$ 0,28/unidade × 28 leitos × 365 dias = R$ 2.876/ano. ANVISA RDC 36/2013: exige sistema de identificação. 28 erros de medicação 2025 (4 graves) — subnotificação estimada: 280 casos reais. Protocolo de conciliação medicamentosa: zero em Apuí. Nome completo + data de nascimento + número do prontuário: mínimo obrigatório por pulseira."},
        {"meta": "Protocolo cirúrgico seguro — checklist OMS 100%",
         "atingida": False, "valor": 18.4, "valor_meta": 100.0,
         "status": "critico",
         "observacao": "18,4% das cirurgias com checklist OMS (meta 100%). Checklist cirúrgico: 3 etapas (antes da anestesia + antes da incisão + antes do paciente sair da sala). OMS: -47% de complicações + -36% de mortalidade cirúrgica. 284 cirurgias/ano × 8,4% complicação = 24 complicações/ano. Custo por complicação cirúrgica: R$ 28.000. 24 × R$ 28.000 = R$ 672.000/ano. Custo do checklist: R$ 0 (formulário OMS disponível gratuitamente). ROI: infinito (custo zero)."},
        {"meta": "Higiene das mãos — 80% de adesão (meta OMS)",
         "atingida": False, "valor": 38.4, "valor_meta": 80.0,
         "status": "critico",
         "observacao": "38,4% de adesão à higiene das mãos (meta OMS: 80%). IRAS: 12,4% (meta < 5%). Cada 1% de aumento na higiene das mãos = -2,1% de IRAS. Custo álcool gel 70%: R$ 8,40/500ml × 12 dispensers/UH × 12 meses = R$ 1.210/ano. Custo de 1 infecção hospitalar: R$ 28.000 (internação prolongada + antibiótico). 12,4% IRAS × 28 leitos × 280 dias de ocupação = ~97 infecções/ano = R$ 2,72M/ano. ROI do álcool gel: R$ 1.210 vs R$ 2,72M = ROI 2.248:1."},
        {"meta": "Notificação de eventos adversos — NOTIVISA 100%",
         "atingida": False, "valor": 9.5, "valor_meta": 100.0,
         "status": "critico",
         "observacao": "9,5% de notificação de eventos adversos (4 de 42 estimados). NOTIVISA: sistema ANVISA gratuito. Subnotificação estimada 10:1 = ~420 eventos adversos reais. Notificação não é punição: é aprendizagem organizacional. Núcleo de Segurança do Paciente (NSP): obrigatório por RDC 36/2013 — inexistente em Apuí. Gerenciamento de risco: identificar → analisar → barreira. Custo NSP: R$ 0 (redesignação de profissional já existente). Prazo de implantação: 30 dias."},
        {"meta": "Prevenção de quedas hospitalares — avaliação Morse 100%",
         "atingida": False, "valor": 18.4, "valor_meta": 100.0,
         "status": "critico",
         "observacao": "18,4% dos pacientes internados com avaliação de risco de queda (Escala de Morse). 28 quedas hospitalares 2025 (8 com dano). Custo de queda com fratura: R$ 42.000 (fratura de quadril). 8 quedas com dano × R$ 8.400 médio = R$ 67.200/ano. Grade lateral + sinalização de risco + orientação à família: R$ 0. Protocolo de prevenção de quedas: custo zero. ANVISA: protocolo disponível gratuitamente. Avaliação Morse: 5 min + disponível no papel."},
        {"meta": "Prevenção de lesão por pressão — incidência < 3%",
         "atingida": False, "valor": 8.4, "valor_meta": 3.0,
         "status": "critico",
         "observacao": "8,4% de incidência de lesão por pressão (meta < 3%). Protocolo de prevenção: zero em Apuí. Escala de Braden: avaliação de risco em 5 min, disponível gratuitamente. Mudança de decúbito 2/2h: custo zero. Coxim posicionamento: R$ 42/unidade. Óleo de girassol (hidratação): R$ 8,40/500ml. 1 lesão grau 4: cicatrização 6 meses + internação prolongada = R$ 84.000. Custo prevenção/paciente: R$ 42. ROI: 2.000:1."},
    ]


@lru_cache(maxsize=1)
def _ACOES():
    return [
        {"acao": "Implantar Núcleo de Segurança do Paciente (NSP) — RDC ANVISA 36/2013",
         "implementada": False, "custo": 0, "prazo_meses": 1,
         "observacao": "NSP obrigatório por lei (RDC 36/2013). Zero em Apuí. Composição: médico + enfermeiro + farmacêutico + direção hospitalar. Custo: R$ 0 (redesignação de função). Prazo: 30 dias. NSP: elabora Plano de Segurança do Paciente (PSP). NOTIVISA: registro de eventos adversos — ativa por NSP. ANVISA fiscaliza: auto de infração R$ 2.000 a R$ 75.000 por não conformidade. 42 eventos adversos em 2025 vs 4 notificados = subnotificação 10:1. NSP + cultura de segurança: +500% de notificação em 3 meses."},
        {"acao": "Implantar checklists OMS — cirurgia segura + medicação + identificação",
         "implementada": False, "custo": 0, "prazo_meses": 1,
         "observacao": "Custo: R$ 0 (formulários OMS disponíveis em português). Checklist cirúrgico: 3 etapas × 3 min = 9 min/cirurgia → -47% complicações. Checklist de medicação: 5 certos (paciente, medicamento, dose, via, hora) → -60% de erros. Checklist de identificação: pulseira + conferência vocal → -80% de erros de identificação. 284 cirurgias/ano × R$ 0 de custo × -47% complicações = R$ 316.000 economizados/ano. Treinamento: 2h por equipe. ANVISA: checklists disponíveis em saude.gov.br."},
        {"acao": "Programa de higiene das mãos — álcool gel 70% em todos os pontos de cuidado",
         "implementada": False, "custo": 4200, "prazo_meses": 1,
         "observacao": "38,4% → meta 80%. IRAS: 12,4% (custo R$ 2,72M/ano). Álcool gel 70%: R$ 8,40/500ml × 24 dispensers × 12 meses = R$ 2.419/ano. Campanha 5 momentos OMS: cartaz gratuito + treinamento 2h = R$ 4.200. ROI: R$ 4.200 vs R$ 2,72M de IRAS evitadas = 648:1. Meta OMS 80%: alcançável em 6 meses com campanha ativa. Auditoria mensal de adesão: observação direta 30 min/UH → % adesão."},
        {"acao": "Protocolo de prevenção de quedas hospitalares — Escala de Morse + grade + sinalização",
         "implementada": False, "custo": 2800, "prazo_meses": 1,
         "observacao": "18,4% avaliados (meta 100%). 28 quedas 2025. Escala de Morse: R$ 0 (formulário gratuito). Grade lateral para camas de alto risco: R$ 280/unidade × 8 camas = R$ 2.240. Sinalização de risco: R$ 280 (impressão + plastificação). Custo total: R$ 2.800. 1 queda com fratura de quadril evitada: R$ 42.000. ROI: 15:1. Protocolo: avaliação na admissão + revisão diária + orientação da família."},
        {"acao": "Protocolo de lesão por pressão — Escala de Braden + mudança de decúbito",
         "implementada": False, "custo": 840, "prazo_meses": 1,
         "observacao": "8,4% incidência (meta < 3%). Escala de Braden: R$ 0 (formulário gratuito). Mudança de decúbito 2/2h: R$ 0 (rotina de enfermagem). Óleo de girassol hidratação: R$ 8,40/500ml × 28 pacientes/mês = R$ 235/mês = R$ 2.820/ano. Coxim de posicionamento: R$ 140/unidade × 6 = R$ 840. Total: R$ 840. 1 lesão grau 4 evitada/ano: R$ 84.000. ROI: 100:1."},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "eventos_adversos": 52, "notificados": 2, "checklist_pct": 8.4, "higiene_maos_pct": 28.4, "queda_hospitalar": 34},
        {"ano": "2023", "eventos_adversos": 48, "notificados": 3, "checklist_pct": 12.4, "higiene_maos_pct": 32.4, "queda_hospitalar": 31},
        {"ano": "2024", "eventos_adversos": 46, "notificados": 3, "checklist_pct": 15.4, "higiene_maos_pct": 36.4, "queda_hospitalar": 29},
        {"ano": "2025", "eventos_adversos": 42, "notificados": 4, "checklist_pct": 18.4, "higiene_maos_pct": 38.4, "queda_hospitalar": 28},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Notificação de eventos adversos (meta: 100%)",       "valor": 9.5,  "meta": 100.0, "unidade": "%",    "status": "critico", "observacao": "9,5% (4/42). NSP: R$ 0 (obrigatório por lei). NOTIVISA: gratuito. Sub-notificação 10:1 = ~420 EA reais/ano."},
        {"indicador": "Checklist cirúrgico OMS (meta: 100%)",               "valor": 18.4, "meta": 100.0, "unidade": "%",    "status": "critico", "observacao": "18,4%. R$ 0. -47% complicações + -36% mortalidade. 284 cirurgias × R$ 28k complicação = R$ 316k economizados."},
        {"indicador": "Higiene das mãos (meta OMS: ≥ 80%)",                "valor": 38.4, "meta": 80.0,  "unidade": "%",    "status": "critico", "observacao": "38,4%. Álcool gel: R$ 4.200. IRAS 12,4% = R$ 2,72M/ano. ROI 648:1."},
        {"indicador": "Identificação do paciente — pulseira (meta: 100%)",  "valor": 28.4, "meta": 100.0, "unidade": "%",    "status": "critico", "observacao": "28,4%. R$ 2.876/ano. 28 erros medicação (4 graves). Erro identificação = 80% dos EA."},
        {"indicador": "Avaliação de risco de queda hospitalar (meta: 100%)","valor": 18.4, "meta": 100.0, "unidade": "%",    "status": "critico", "observacao": "18,4%. 28 quedas 2025. Grade: R$ 2.800. ROI 15:1. Escala Morse: R$ 0."},
        {"indicador": "Lesão por pressão — incidência (meta: < 3%)",        "valor": 8.4,  "meta": 3.0,   "unidade": "%",    "status": "critico", "observacao": "8,4%. Braden: R$ 0. Decúbito 2/2h: R$ 0. Coxim: R$ 840. 1 lesão g4 evitada = R$ 84.000. ROI 100:1."},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/metas")
def metas():
    return _METAS


@router.get("/acoes")
def acoes():
    return _ACOES


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
