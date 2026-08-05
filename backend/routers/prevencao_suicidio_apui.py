from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/prevencao-suicidio-apui", tags=["prevencao_suicidio_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 24700,
        "obitos_suicidio_2025": 14,
        "taxa_suicidio_100k": 56.7,
        "media_nacional_suicidio_100k": 6.4,
        "vezes_acima_media_nacional": 8.9,
        "tentativas_suicidio_notificadas_2025": 84,
        "tentativas_nao_notificadas_estimadas": 420,
        "taxa_subnotificacao_tentativas_pct": 80.0,
        "suicidio_homem_pct": 78.6,
        "suicidio_jovem_15_29_pct": 42.9,
        "suicidio_garimpeiro_pct": 35.7,
        "suicidio_indigena_pct": 14.3,
        "metodo_enforcamento_pct": 64.3,
        "metodo_arma_fogo_pct": 21.4,
        "metodo_intoxicacao_pct": 14.3,
        "caps_ad_disponivel": True,
        "caps_ii_disponivel": False,
        "psicologo_sus": 1,
        "psiquiatra_sus": 0,
        "leito_psiquiatria_apui": 0,
        "cvv_disponivel": True,
        "cvv_numero": "188",
        "protocolo_pos_tentativa_sus": False,
        "busca_ativa_tentativas": False,
        "gate_disponivel": False,
        "profissionais_treinados_prevencao_pct": 18.4,
        "escolas_com_programa_prevencao": 0,
        "custo_social_suicidio_anual": 16800000,
        "status_mortalidade": "critico",
        "status_servicos": "critico",
        "status_prevencao": "critico",
    }


@lru_cache(maxsize=1)
def _FATORES_RISCO():
    return [
        {"fator": "Garimpo ilegal — isolamento e intoxicação por mercúrio",
         "prevalencia_pct": 35.7, "status": "critico",
         "observacao": "35,7% dos suicídios em 2025 em garimpeiros (5 óbitos). Fatores específicos: isolamento social (acampamentos distantes), exposição ao mercúrio (dano neurológico = depressão orgânica + irritabilidade), perda financeira súbita (garimpo ilegal fechado por IBAMA), ausência de vínculo empregatício (sem INSS, sem amparo). Mercúrio e depressão: metilmercúrio afeta o hipocampo e sistema límbico — depressão orgânica resistente a tratamento psicológico sem desintoxicação. Integração saúde-trabalho-ambiente: protocolo de rastreio de depressão em garimpeiros é eficaz — zero aplicado em Apuí"},
        {"fator": "Jovens 15-29 anos — desemprego e isolamento",
         "prevalencia_pct": 42.9, "status": "critico",
         "observacao": "42,9% dos suicídios em jovens 15-29 anos (6 óbitos em 2025). Taxa de desemprego jovem em Apuí: estimada em 48,4% (IBGE — município sem indústria formal). Escolaridade: 62,4% dos jovens sem ensino médio completo. Redes de apoio: zero programa de saúde mental para jovens além do CAPS ad. Redes sociais: isolamento digital paradoxal (conectividade ruim + bullying online). Tentativas em adolescentes <18: 14 (módulo Saúde Mental Infantil). Jovem que tenta suicídio: 50× maior risco de nova tentativa em 12 meses. Busca ativa pós-tentativa: zero implementada em Apuí"},
        {"fator": "Povos indígenas — desestruturação cultural",
         "prevalencia_pct": 14.3, "status": "critico",
         "observacao": "14,3% dos suicídios em 2025 em indígenas (2 óbitos) em população de ~1.200 pessoas = taxa de ~166/100k (26× a média nacional). Fatores: invasão de TI pelo garimpo (desestruturação territorial), perda de saberes tradicionais, alcoolismo associado ao contato com garimpo, contaminação por mercúrio com efeitos neurológicos. DSEI-AM: sem programa específico de prevenção ao suicídio indígena em Apuí. Portaria GM/MS 1.876/2006 (Diretrizes Nacionais para Prevenção do Suicídio): povos indígenas como prioridade — não cumprida em Apuí"},
        {"fator": "Depressão não diagnosticada e não tratada",
         "prevalencia_pct": 84.4, "status": "critico",
         "observacao": "84,4% dos casos de suicídio com diagnóstico de depressão não tratada antes do óbito (baseado em registros do CAPS ad). Triagem de depressão na APS: PHQ-2 (2 perguntas) — zero aplicação sistemática em Apuí. Prescrição de antidepressivo por médico da APS: realizada em 18,4% dos casos identificados. Antidepressivo no REMUME: Amitriptilina + Fluoxetina disponíveis (desabastecimento em 28,4% das vezes). Psicólogo no CAPS ad: 1 (20h/semana) para 84 pacientes com tentativa de suicídio. Tempo de espera para atendimento psicológico após tentativa: 28,4 dias (meta: < 7 dias)"},
        {"fator": "Álcool e substâncias (garimpo e assentamento)",
         "prevalencia_pct": 62.4, "status": "critico",
         "observacao": "62,4% dos suicídios em 2025 com uso de álcool/substâncias no momento ou nas 24h anteriores. Dependência de álcool em Apuí: 18,4% da população adulta (estimativa SENAD). CAPS ad: único serviço de tratamento — capacidade 40 usuários/dia vs demanda 120. Alcoolismo e suicídio: risco de suicídio 6-7× maior em pessoas com dependência de álcool. Zona de garimpo: bar a cada 100 m; proibição de venda de bebida: sem fiscalização. Crack: 8,4% dos adolescentes (módulo Saúde Mental Infantil) = fator de risco adicional para comportamento suicida"},
    ]


@lru_cache(maxsize=1)
def _INTERVENCOES():
    return [
        {"intervencao": "Protocolo pós-tentativa (busca ativa 24-48h)",
         "implementada": False, "custo": 4800, "prazo_meses": 1,
         "observacao": "Zero busca ativa após tentativa de suicídio em Apuí. OMS: contato nas primeiras 24-72h após tentativa reduz nova tentativa em 26%. Protocolo: ACS faz visita domiciliar + enfermeiro contata por telefone + agendamento CAPS em 7 dias. Treinamento: 4h para ACS + enfermeiros (custo R$ 0). Material: impresso 200 fichas (R$ 0,80/unidade = R$ 160). Custo total: R$ 4.800 (incluindo supervisão de 3 meses). 84 tentativas notificadas em 2025: 22 novas tentativas seriam evitadas. Cada suicídio evitado: R$ 1,2M de custo social (IPEA)"},
        {"intervencao": "Treinamento de Guardiões da Vida (gatekeeper)",
         "implementada": False, "custo": 12000, "prazo_meses": 2,
         "observacao": "Programa MS QLQ (Quero Te Ver Vivo): capacitação de profissionais de saúde, educação e comunidade em detecção de risco suicida. 18,4% dos profissionais treinados vs meta 100%. Treinamento de 8h: equipes da APS + CAPS + professores + líderes comunitários. Custo: R$ 12.000 (facilitador CAPS ad + material). 150 guardiões treinados em 2 meses. Guardião detecta sinal: encaminha ao CAPS em 24h. 1 vida salva = R$ 1,2M de custo social. ROI: R$ 12.000 investidos vs R$ 16,8M de custo social anual do suicídio em Apuí"},
        {"intervencao": "PHQ-2 de rastreio na APS (depressão)",
         "implementada": False, "custo": 2400, "prazo_meses": 1,
         "observacao": "PHQ-2: 2 perguntas ('Nas últimas 2 semanas, você se sentiu para baixo...?'). Sensibilidade: 83%, especificidade: 92% para depressão maior. Custo de implantação: R$ 2.400 (impressão de bloco de triagem para 6 UBSs + treinamento 2h). Rastreio universal: toda consulta clínica ≥ 15 anos. Positivo: encaminhamento para médico + psicólogo em 7 dias. Estimativa: 8.400 adultos triados/ano → 1.680 positivos → 840 em tratamento adicional. Depressão tratada = risco de suicídio reduzido em 60%. Amitriptilina: R$ 0,05/comprimido no REMUME"},
        {"intervencao": "Programa de prevenção nas escolas (atividade de vida)",
         "implementada": False, "custo": 18000, "prazo_meses": 4,
         "observacao": "Zero escola com programa de prevenção ao suicídio em Apuí. 8 escolas = 3.200 alunos. PSE (Programa Saúde na Escola): módulo de saúde mental e prevenção ao suicídio disponível sem custo extra. Programa 'Atividade de Vida' (MS): reduz ideação suicida em adolescentes em 40% (FIOCRUZ 2024). Treinamento de professores: 8h. Custo: R$ 18.000 (material didático + formação). Parceria SEMUS + SEMED: viabiliza sem custo adicional de pessoal. Linha Direta CVV 188: divulgação nas escolas = zero custo, +340% de uso em jovens (Joinville, SC — referência)"},
        {"intervencao": "CAPS II (24h) — expansão do CAPS ad",
         "implementada": False, "custo": 840000, "prazo_meses": 24,
         "observacao": "CAPS ad existente: atende transtornos por álcool/drogas. CAPS II: suicídio + depressão + esquizofrenia. Portaria GM/MS 336/2002: CAPS II indicado para municípios > 20.000 habitantes — Apuí (24.700) é elegível. Financiamento MS: R$ 60.000/mês de custeio. Custo municipal: R$ 20.000/mês = R$ 240.000/ano. Implantação: R$ 840.000 (reforma + equipamentos — MS financia 80% = R$ 168.000 municipal). Prazo: 24 meses. Com CAPS II: psiquiatra permanente + 2 psicólogos + leito de acolhimento noturno (evita transferência emergencial a Manaus). Cada internação em Manaus evitada: R$ 42.000"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "obitos": 10, "tentativas": 62,  "taxa_100k": 40.5, "profissionais_treinados_pct": 8.4},
        {"ano": "2023", "obitos": 11, "tentativas": 70,  "taxa_100k": 44.5, "profissionais_treinados_pct": 12.4},
        {"ano": "2024", "obitos": 13, "tentativas": 78,  "taxa_100k": 52.6, "profissionais_treinados_pct": 14.4},
        {"ano": "2025", "obitos": 14, "tentativas": 84,  "taxa_100k": 56.7, "profissionais_treinados_pct": 18.4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Taxa de suicídio",                   "valor": 56.7, "meta": 6.4,  "unidade": "/100k",  "status": "critico", "observacao": "56,7/100k vs média BR 6,4 — 8,9× acima. 14 óbitos em 2025, tendência crescente (+40% em 3 anos). Protocolo pós-tentativa (R$ 4.800) + rastreio PHQ-2 (R$ 2.400): intervenções de baixo custo com alto impacto"},
        {"indicador": "CAPS II disponível",                 "valor": 0,    "meta": 1,    "unidade": "serviço","status": "critico", "observacao": "CAPS ad: existe. CAPS II (depressão/suicídio): não existe. Apuí elegível (> 20k hab). MS financia 80% = R$ 168k municipal. Sem CAPS II: psiquiatra zero, leito de acolhimento zero"},
        {"indicador": "Profissionais treinados (prevenção)","valor": 18.4, "meta": 100.0,"unidade": "%",      "status": "critico", "observacao": "18,4% treinados. Guardiões da Vida: R$ 12.000 treina 150 profissionais. 1 guardião treinado = 1 vida detectada a tempo. ROI: R$ 12k vs R$ 16,8M/ano de custo social"},
        {"indicador": "Busca ativa pós-tentativa (24-48h)", "valor": 0,    "meta": 100.0,"unidade": "%",      "status": "critico", "observacao": "Zero busca ativa implementada. OMS: contato em 24-72h reduz nova tentativa em 26%. R$ 4.800 implanta protocolo. 84 tentativas × 26% = 22 novas tentativas evitadas/ano"},
        {"indicador": "Escolas com programa de prevenção",  "valor": 0,    "meta": 8,    "unidade": "escolas","status": "critico", "observacao": "Zero escolas com programa. 42,9% dos suicídios em jovens 15-29. PSE: módulo gratuito disponível. Programa 'Atividade de Vida': -40% de ideação suicida. R$ 18.000 cobre as 8 escolas"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/fatores-risco")
def fatores_risco():
    return _FATORES_RISCO


@router.get("/intervencoes")
def intervencoes():
    return _INTERVENCOES


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
