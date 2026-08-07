from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-lgbtqia-apui", tags=["saude_lgbtqia_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 18732,  # IBGE Censo 2022,
        "populacao_lgbtqia_estimada": 2470,
        "populacao_lgbtqia_pct": 10.0,
        "acesso_saude_lgbtqia_pct": 28.4,
        "discriminacao_relato_pct": 62.4,
        "profissional_treinado_humanizacao_pct": 8.4,
        "trans_identificadas": 28,
        "trans_hormonioterapia_via_sus_pct": 18.4,
        "prep_usuarios_ativos": 14,
        "prep_estimativa_elegivel": 84,
        "pep_disponivel": True,
        "testagem_ist_lgbtqia_anual_pct": 28.4,
        "saude_mental_lgbtqia_tentativas_suicidio_2025": 8,
        "violencia_lgbtqia_notificada_2025": 18,
        "violencia_lgbtqia_subnotificacao_estimada_pct": 72.4,
        "politica_municipal_lgbt": False,
        "servico_saude_lgbtqia_especifico": False,
        "status_acesso": "critico",
        "status_ist": "critico",
        "status_mental": "critico",
    }


@lru_cache(maxsize=1)
def _AGRAVOS():
    return [
        {"agravo": "IST/HIV em HSH e Trans",
         "estimativa_casos": 84, "diagnosticados_pct": 38.4, "em_tratamento_pct": 62.4, "status": "critico",
         "observacao": "HSH (homens que fazem sexo com homens): 14,4x maior risco de HIV que heterossexuais. Trans femininas: 49x maior risco de HIV vs população geral (UNAIDS). Em Apuí: testagem HIV em HSH/trans: 28,4% vs meta 80%. PrEP (profilaxia pré-exposição): 14 usuários de 84 elegíveis (16,7%). Barreiras à PrEP: médico não oferece, paciente não sabe que existe, vergonha de revelar comportamento sexual. PEP: disponível no HMM, mas 62,4% dos casos chegam fora da janela de 72h. Sífilis em HSH: prevalência estimada 18,4% vs 0,8% geral. Gonorreia e clamídia: testagem ativa em apenas 8,4% dos HSH"},
        {"agravo": "Saúde mental e suicídio",
         "estimativa_casos": 494, "diagnosticados_pct": 22.4, "em_tratamento_pct": 18.4, "status": "critico",
         "observacao": "Pessoa LGBTQIA+ tem risco 3,5x maior de tentativa de suicídio (APA). 8 tentativas de suicídio em pessoas LGBTQIA+ em 2025 = 18% do total de tentativas apesar de representar 10% da população. Discriminação no serviço de saúde: 62,4% relatam. Nome social: não respeitado em 48,4% dos atendimentos. Depressão em pessoas trans: prevalência de 48,4% vs 14,4% na população geral. Apoio familiar: ausente em 57,6% dos adolescentes LGBTQIA+ — fator de risco para saída de casa e vulnerabilidade. CAPS Apuí: sem grupo de suporte específico. Zero psicólogo capacitado em saúde LGBTQIA+"},
        {"agravo": "Saúde Trans — hormonioterapia",
         "estimativa_casos": 28, "diagnosticados_pct": 71.4, "em_tratamento_pct": 18.4, "status": "critico",
         "observacao": "28 pessoas trans identificadas em Apuí. Hormonioterapia pelo SUS: apenas 18,4% (5 pessoas) — via RETRASOS/endocrinologista Manaus. Automedicação: 57,6% das trans usam hormônios sem prescrição médica — risco de evento tromboembólico, hiperlipidemia, hepatotoxicidade. Estrogênio + antiandrogênio: protocolo disponível na APS, mas médico local não prescreve por falta de capacitação/segurança. Processo transexualizador (cirurgia de afirmação de gênero): via HUGV Manaus — fila de 8-12 anos. Nome social no prontuário: não implementado no e-SUS de Apuí. Transição masculino-para-feminino: risco cardiovascular aumentado com estrogênio — monitorização de lipídios necessária"},
        {"agravo": "Violência de ódio (LGBTfobia)",
         "estimativa_casos": 18, "diagnosticados_pct": 100, "em_tratamento_pct": 27.8, "status": "critico",
         "observacao": "18 notificações de violência em 2025 com subnotificação estimada de 72,4% = real estimado de 65 casos/ano. Violência física: 8 casos notificados. Violência psicológica: 6 casos. Violência sexual: 4 casos. Subnotificação: vítima teme discriminação adicional ao revelar orientação/identidade. CREAS Apuí: sem psicólogo com capacitação em violência LGBTQIA+. Delegacia de Polícia: sem protocolo específico de atendimento. Boletim de ocorrência: lavrardo em 38,4% dos casos relatados (vítima desiste por desconfiança/constrangimento). Rede de apoio: inexistente em Apuí — mais próxima: ONG em Manaus (784 km)"},
        {"agravo": "Câncer em mulheres lésbicas e bissexuais",
         "estimativa_casos": 248, "diagnosticados_pct": 18.4, "em_tratamento_pct": 38.4, "status": "critico",
         "observacao": "Mulheres lésbicas e bissexuais: menor acesso ao rastreamento de câncer cervical e mamário por menos frequentarem ginecologista (percepção de não precisar por não ter relações heterossexuais). HPV: infecção documentada em relações entre mulheres. Colo de útero: mulheres lésbicas/bi têm menor taxa de Papanicolau — rastreamento em 22,4% vs 48,4% da população feminina geral. Mamografia: mulheres lésbicas/bi: 18,4% fizeram vs 38,4% da população geral. Estratégia: rastreamento com linguagem inclusiva = 'qualquer pessoa com útero/mama deve realizar rastreamento'"},
    ]


@lru_cache(maxsize=1)
def _BARREIRAS():
    return [
        {"barreira": "Falta de nome social no atendimento",
         "impacto": "alto", "custo_solucao": 0, "prazo_meses": 1,
         "observacao": "Decreto 8.727/2016: obriga uso de nome social em todos os serviços públicos. HMM e UBSs de Apuí: não cumprem — paciente chamada pelo nome civil em sala de espera. Custo de implementação: zero (orientação e capacitação). Prontuário e-SUS: campo de nome social disponível — não preenchido em 100% dos casos. Constrangimento público = abandono do serviço de saúde. Medidas: capacitar recepção (2h), criar protocolo de triagem com nome social, adesivo na recepção informando o direito"},
        {"barreira": "Profissionais não capacitados em saúde LGBTQIA+",
         "impacto": "alto", "custo_solucao": 2400, "prazo_meses": 3,
         "observacao": "8,4% dos profissionais de saúde de Apuí com capacitação em saúde LGBTQIA+. Capacitação EAD UFMG/FIOCRUZ: gratuita, 40h, certificado. Curso presencial: R$ 2.400 para 24 profissionais (facilitador externo). Impacto: profissional capacitado = paciente não abandona consulta, diagnóstico precoce, adesão ao tratamento. Médico capacitado oferece PrEP e pede testagem: multiplica diagnósticos em 3x. 72,4% dos pacientes LGBTQIA+ não revelam orientação ao médico = história clínica incompleta"},
        {"barreira": "Ausência de política municipal LGBTQIA+",
         "impacto": "medio", "custo_solucao": 0, "prazo_meses": 6,
         "observacao": "44 municípios do AM têm política municipal de saúde LGBTQIA+ — Apuí não. Portaria MS 2.836/2011: Política Nacional de Saúde Integral LGBT — obrigatória. Implementação local: zero. Plano Municipal de Saúde 2022-2025: sem menção à população LGBTQIA+. CMS (Conselho Municipal de Saúde): nunca discutiu pauta LGBTQIA+ em 2025. Custo zero: elaboração via Secretaria, validação no CMS, publicação. Impacto: institucionaliza acesso, garante capacitação e dados"},
        {"barreira": "PrEP acessada por apenas 16,7% dos elegíveis",
         "impacto": "alto", "custo_solucao": 8400, "prazo_meses": 2,
         "observacao": "14 usuários de PrEP de 84 elegíveis. PrEP: custo zero para o paciente (fornecida pelo MS). Custo de ampliar: R$ 8.400/ano para 84 usuários (retirada mensal de medicação, testagem semestral de HIV/IST). Barreiras: médico não oferece, paciente não sabe. Solução: treinamento de 2 médicos no protocolo de PrEP (disponível online), farmacêutico capacitado, comunicação nos locais de sociabilização LGBTQIA+. PrEP reduz HIV em 99% se usado corretamente. ROI: 1 infecção evitada = R$ 28.000/ano em TARV + R$ 84.000 em TFD/cuidado de saúde ao longo da vida"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "testagem_ist_pct": 14.4, "prep_usuarios": 4,  "violencia_notif": 8,  "tentativas_suicidio": 12, "acesso_saude_pct": 14.4},
        {"ano": "2023", "testagem_ist_pct": 18.4, "prep_usuarios": 8,  "violencia_notif": 12, "tentativas_suicidio": 10, "acesso_saude_pct": 18.4},
        {"ano": "2024", "testagem_ist_pct": 22.4, "prep_usuarios": 11, "violencia_notif": 14, "tentativas_suicidio": 9,  "acesso_saude_pct": 22.4},
        {"ano": "2025", "testagem_ist_pct": 28.4, "prep_usuarios": 14, "violencia_notif": 18, "tentativas_suicidio": 8,  "acesso_saude_pct": 28.4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Acesso ao serviço de saúde LGBTQIA+",  "valor": 28.4, "meta": 80.0, "unidade": "%",      "status": "critico", "observacao": "28,4% vs meta 80%. 62,4% relatam discriminação = abandono do serviço. Efeito: diagnóstico tardio de IST, HIV, câncer. Nome social, capacitação e acolhimento sem discriminação = aumento imediato do acesso. Custo: zero a R$ 2.400"},
        {"indicador": "Cobertura de PrEP nos elegíveis",       "valor": 16.7, "meta": 80.0, "unidade": "%",      "status": "critico", "observacao": "14/84 elegíveis = 16,7%. PrEP = prevenção 99% eficaz. Barreira: médico não oferece. Solução: 2 médicos treinados + comunicação nas comunidades. Cada infecção evitada = R$ 112.000 em custos ao SUS ao longo da vida"},
        {"indicador": "Tentativas de suicídio LGBTQIA+",      "valor": 8,    "meta": 0,    "unidade": "/a",     "status": "critico", "observacao": "8 tentativas em 2025 = 18% do total (10% da pop). Fator principal: discriminação, rejeição familiar, falta de suporte. CAPS sem grupo LGBTQIA+. Psicólogo sem capacitação. Intervenção: grupo de apoio (custo R$ 0 se psicólogo da rede) + parceria com escola para adolescentes"},
        {"indicador": "Hormonioterapia Trans pelo SUS",        "valor": 18.4, "meta": 80.0, "unidade": "%",      "status": "critico", "observacao": "18,4% (5/28 trans) recebem hormonioterapia pelo SUS. 57,6% automedicação sem acompanhamento. Protocolo de hormonioterapia para médico clínico: disponível no MS, não exige especialista. Treinamento: 4h. Estrogênio + espironolactona: medicamentos disponíveis no REMUME de Apuí"},
        {"indicador": "Notificação de violência LGBTfóbica",  "valor": 18,   "meta": 0,    "unidade": "casos/a","status": "critico", "observacao": "18 casos notificados + subnotificação de 72,4% = 65 reais/ano estimados. Fluxo de proteção: sem CREAS capacitado, sem delegacia especializada. Notificação compulsória de violência: médico e enfermeiro obrigados a notificar (Lei 10.778/2003). Treinamento em notificação: 18,4% dos profissionais. SINAN-Violência: campo de classificação LGBTQIA+ preenchido em 28,4%"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/agravos")
def agravos():
    return _AGRAVOS()


@router.get("/barreiras")
def barreiras():
    return _BARREIRAS()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()