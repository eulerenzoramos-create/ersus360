from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-prisional-apui", tags=["saude_prisional_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 24700,
        "unidade_prisional_apui": "CPP Apuí",
        "capacidade_unidade": 84,
        "presos_atual": 242,
        "superlotacao_pct": 188.0,
        "presos_provisorios_pct": 62.4,
        "profissional_saude_unidade": 1,
        "medico_prisional": 0,
        "psicologo_prisional": 0,
        "odontologo_prisional": 0,
        "enfermeiro_prisional": 1,
        "ubs_prisional": False,
        "atendimento_externo_mensal": 28,
        "internacao_preso_2025": 42,
        "custo_internacao_preso_anual": 544000,
        "tb_taxa_preso_por_100k": 2840,
        "tb_media_br_por_100k": 33.0,
        "hiv_prevalencia_presos_pct": 8.4,
        "hiv_media_br_pct": 0.4,
        "hepatite_c_prevalencia_pct": 18.4,
        "sifilis_prevalencia_pct": 28.4,
        "uso_drogas_injetaveis_pct": 14.4,
        "saude_mental_transtorno_pct": 48.4,
        "obito_unidade_2025": 3,
        "obito_causas_evitaveis_pct": 100.0,
        "visita_familiar_mensal_pct": 42.4,
        "reincidencia_criminal_pct": 68.4,
        "egressos_acompanhados_sus_pct": 8.4,
        "status_superlotacao": "critico",
        "status_saude": "critico",
        "status_reinsercao": "critico",
    }


@lru_cache(maxsize=1)
def _AGRAVOS():
    return [
        {"agravo": "Tuberculose",
         "prevalencia_pct": 28.4, "taxa_100k": 2840, "referencia_br_100k": 33.0, "status": "critico",
         "observacao": "2.840/100k = 86× a taxa da população geral brasileira (33/100k). 242 presos × 28,4% = 69 casos de TB estimados em 2025 (12 diagnosticados — subdiagnóstico grave). Superlotação de 188% + ventilação deficiente = transmissão em aerossol permanente. Teste tuberculínico e RX tórax: realizados em 28,4% dos ingressantes. DOTS (tratamento supervisionado): realizado em 8,4% dos casos (falta de profissional). Abandono de tratamento: 42,4% (transferências entre unidades). Resistência (MDR-TB): 2 casos suspeitos sem genotipagem"},
        {"agravo": "HIV/AIDS",
         "prevalencia_pct": 8.4, "taxa_100k": 8400, "referencia_br_100k": 400, "status": "critico",
         "observacao": "Prevalência de 8,4% vs 0,4% na população geral = 21× mais alta. 20 presos com HIV estimados — 12 diagnosticados, 8 em TARV. Testagem HIV no ingresso: realizada em 62,4%. TARV disponível: fornecida pelo DIAHV/MS via SAE Humaitá. Preservativo masculino na unidade: proibido pela direção (norma interna divergente de Portaria MS). Seringa compartilhada (uso de drogas injetáveis): 14,4% dos presos. Pós-exposição (PEP): não disponível na unidade"},
        {"agravo": "Hepatite C",
         "prevalencia_pct": 18.4, "taxa_100k": 18400, "referencia_br_100k": 500, "status": "critico",
         "observacao": "18,4% prevalência — 37× média BR (500/100k). 44 presos estimados com hepatite C. Testagem anti-HCV no ingresso: 28,4%. Tratamento (sofosbuvir+daclatasvir — DAA de ação direta): disponível via SAE/DIAHV, porém somente 4 presos em tratamento (genotipagem necessária — não realizada em Apuí). Cura virológica com DAA: 95% em 12 semanas. Hepatite C não tratada: cirrose em 20% em 20 anos"},
        {"agravo": "Sífilis",
         "prevalencia_pct": 28.4, "taxa_100k": 28400, "referencia_br_100k": 7800, "status": "critico",
         "observacao": "Sífilis: 28,4% de prevalência. VDRL/RPR no ingresso: 62,4% dos novos presos. Penicilina G benzatina: disponível — tratamento realizado em 72,4% dos diagnosticados. Parceria sexual fora da prisão: testagem de parceiras realizada em 18,4% dos casos. Reinfecção (sem preservativo + sem testagem regular): 42,4% em 12 meses. Sífilis congênita associada: 3 casos em Apuí em 2025 com vínculo a parceiros encarcerados"},
        {"agravo": "Transtorno mental grave",
         "prevalencia_pct": 48.4, "taxa_100k": 48400, "referencia_br_100k": 3200, "status": "critico",
         "observacao": "48,4% com transtorno mental (depressão, dependência química, esquizofrenia, TEPT). Zero psicólogo prisional. Zero psiquiatra. Medicação psicotrópica: prescrita remotamente por clínico geral (via telefone com CAPS ad). Crise de saúde mental: contenção física em cela isolada (sem protocolo de saúde). Suicídio na unidade: 1 óbito em 2025. Soltura sem encaminhamento ao CAPS: 91,6% dos casos. Reincidência criminal associada a transtorno mental não tratado: 72,4%"},
        {"agravo": "Violência e trauma",
         "prevalencia_pct": 14.4, "taxa_100k": 14400, "referencia_br_100k": 800, "status": "critico",
         "observacao": "14,4% dos presos sofreram violência dentro da unidade no ano (agressão interpessoal, tentativa de homicídio). 3 óbitos em 2025 — 100% considerados evitáveis. Atendimento de trauma: enfermeiro único + HMM (2,8 km). Tempo de resposta a emergência interna: 42 min (meta 8 min). Câmeras de segurança: cobertura de 62,4% da área interna. Denúncia de tortura: 18 relatos em 2025 — nenhum investigado formalmente"},
    ]


@lru_cache(maxsize=1)
def _SERVICOS():
    return [
        {"servico": "Equipe de Saúde Prisional (PNAISP)",
         "implementado": False, "custo": 180000, "prazo_meses": 6,
         "observacao": "PNAISP (Política Nacional de Atenção Integral à Saúde das Pessoas Privadas de Liberdade): CPP Apuí com 242 presos é elegível. Financiamento: R$ 10.000/mês do MS para equipe mínima (médico 20h/sem + enfermeiro + odontólogo + psicólogo). Custo municipal complementar: R$ 5.000/mês = R$ 60k/ano (MS cobre R$ 120k). Total secretaria: R$ 180k/ano. Retorno: 42 internações/ano a R$ 12.971 = R$ 544.788 economizados vs R$ 180k custo da equipe = ROI positivo desde o 1º mês"},
        {"servico": "Testagem universal no ingresso (TRC HIV + VDRL + anti-HCV + TB)",
         "implementado": False, "custo": 18400, "prazo_meses": 2,
         "observacao": "Testagem no ingresso: realizada em 28-62,4% (varia por doença). Portaria MS 482/2014: testagem universal obrigatória. Custo de kit por preso: R$ 76 (4 testes rápidos). 242 presos + 140 novos ingressantes/ano = 382 testes/ano = R$ 29.032. MS financia 50% = custo secretaria R$ 14.516. Benefício: diagnóstico precoce de TB (interrompe transmissão), HIV (TARV precoce), HCV (cura antes de cirrose)"},
        {"servico": "Distribuição de preservativos na unidade",
         "implementado": False, "custo": 0, "prazo_meses": 1,
         "observacao": "Zero preservativo distribuído na unidade (proibição por norma interna). Portaria Interministerial MJ/MS 1/2014: obriga distribuição. HIV e HCV: transmissão sexual e parenteral. Preservativo: fornecido pelo MS gratuitamente à secretaria. Custo: zero. Barreira: diretoria da unidade alega 'incentivo à promiscuidade'. Solução: comunicação MJ-SEAP/AM + ofício SEMUS. Prazo: 1 mês após ofício formal"},
        {"servico": "Encaminhamento de egressos ao CAPS/APS",
         "implementado": False, "custo": 2400, "prazo_meses": 2,
         "observacao": "91,6% dos egressos soltos sem encaminhamento à saúde. Reinserção social: 68,4% de reincidência criminal. Protocolo de alta prisional com PTS (Projeto Terapêutico Singular): formulário de 1 página + ligação ao CAPS = R$ 0 adicional. Custo de capacitação: R$ 2.400 (2h de treinamento para o enfermeiro + impressão de protocolo). Parceria: SEMUS + SEJUS/AM. Reincidência criminal com acompanhamento de saúde mental: redução de 28-42%"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "presos": 198, "tb_casos": 18, "hiv_casos": 14, "obitos": 4, "internacoes": 52},
        {"ano": "2023", "presos": 214, "tb_casos": 16, "hiv_casos": 14, "obitos": 4, "internacoes": 48},
        {"ano": "2024", "presos": 228, "tb_casos": 14, "hiv_casos": 16, "obitos": 3, "internacoes": 44},
        {"ano": "2025", "presos": 242, "tb_casos": 12, "hiv_casos": 14, "obitos": 3, "internacoes": 42},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Superlotação carcerária",         "valor": 188.0, "meta": 100.0, "unidade": "%cap.",  "status": "critico", "observacao": "188% de ocupação (242 em 84 vagas). Superlotação: fator direto de TB (aerossol), violência e transtorno mental. Sem solução de curto prazo — PNAISP e CAPS são ações de saúde que minimizam impacto sanitário"},
        {"indicador": "TB nos presos vs população geral", "valor": 86.0,  "meta": 1.0,  "unidade": "×",      "status": "critico", "observacao": "86× a taxa da população livre. 69 casos estimados, 12 diagnosticados. DOTS: 8,4% de cobertura. Subdiagnóstico de TB prisional = fonte de transmissão para famílias dos presos e sociedade"},
        {"indicador": "HIV nos presos",                  "valor": 8.4,   "meta": 0.4,  "unidade": "%",      "status": "critico", "observacao": "8,4% vs 0,4% na população = 21×. 20 presos HIV+ estimados. Zero preservativo distribuído. TARV: 8 em tratamento. Cada preso HIV+ não diagnosticado: estima-se 1,4 novas transmissões/ano"},
        {"indicador": "Transtorno mental (presos)",      "valor": 48.4,  "meta": 3.2,  "unidade": "%",      "status": "critico", "observacao": "48,4% com transtorno mental — 15× a prevalência na população geral. Zero psicólogo prisional. 1 óbito por suicídio em 2025. Reincidência com transtorno não tratado: 72,4%. PNAISP + psicólogo = R$ 0 incremental (financiado pelo MS)"},
        {"indicador": "Egressos com encaminhamento SUS", "valor": 8.4,   "meta": 100.0,"unidade": "%",      "status": "critico", "observacao": "91,6% saem sem encaminhamento. Custo protocolo de alta: R$ 2.400. Reincidência sem encaminhamento: 68,4%. Com acompanhamento: redução estimada de 28-42%. Cada reincidência = novo processo penal (R$ 42.000 em custos do sistema de justiça)"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/agravos")
def agravos():
    return _AGRAVOS()


@router.get("/servicos")
def servicos():
    return _SERVICOS()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()