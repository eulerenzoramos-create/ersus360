from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-mental-infantojuvenil-apui", tags=["saude_mental_infantojuvenil_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 18732,  # IBGE Censo 2022,
        "populacao_0_17_anos": 9882,
        "prevalencia_transtorno_mental_infantojuv_pct": 18.4,
        "criancas_adolescentes_transtorno_estimados": 1818,
        "em_acompanhamento_saude_mental": 142,
        "sem_acompanhamento_pct": 92.2,
        "tea_estimados": 284,
        "tea_diagnosticados": 42,
        "tea_em_terapia": 18,
        "tdah_estimados": 420,
        "tdah_diagnosticados": 84,
        "tdah_medicado": 42,
        "depressao_adolescente_estimados": 284,
        "depressao_adolescente_diagnosticados": 48,
        "ansiedade_adolescente_estimados": 420,
        "ansiedade_adolescente_diagnosticados": 84,
        "tentativa_suicidio_adolescente_2025": 28,
        "suicidio_adolescente_2025": 6,
        "suicidio_adolescente_pct_total_suicidio": 42.9,
        "uso_alcool_menor_12_anos": 84,
        "uso_crack_adolescente_estimados": 42,
        "violencia_sexual_infantojuvenil_notificada_2025": 42,
        "violencia_fisica_infantojuvenil_notificada_2025": 84,
        "transtorno_estresse_pos_traumatico_pct": 28.4,
        "caps_infantojuvenil_apui": 0,
        "psicologo_sus_infantojuvenil": 0,
        "psiquiatra_infantil_apui": 0,
        "assistente_social_cras_apui": 4,
        "scfv_vagas_disponiveis": 80,
        "scfv_vagas_necessarias": 840,
        "custo_ausencia_tratamento_geracao": 8400000,
        "status_diagnostico": "critico",
        "status_servicos": "critico",
        "status_suicidio": "critico",
    }


@lru_cache(maxsize=1)
def _TRANSTORNOS():
    return [
        {"transtorno": "Transtorno do Espectro Autista (TEA)",
         "estimados": 284, "diagnosticados": 42, "em_terapia": 18, "faixa_etaria": "0–17 anos",
         "status": "critico",
         "observacao": "284 crianças com TEA estimadas (1,15% da faixa 0-17 — prevalência OMS). Diagnosticados: 42 (14,8%). Em terapia: 18 (42,9% dos diagnosticados). Diagnóstico: apenas neuropediatra + psiquiatra infantil (zero em Apuí). Família: viagem a Manaus = R$ 2.800 por consulta. Espera no SISREG: 380 dias. Intervenção precoce (ABA, PECS, fonoaudiologia): janela crítica 0-6 anos — cada mês sem terapia = perda irreversível de desenvolvimento. BPC (Benefício de Prestação Continuada): R$ 1.412/mês para TEA severo — 142 crianças TEA elegíveis sem acesso. APAE: zero em Apuí (módulo PcD Criança). Tele-diagnóstico TEA: neuropediatra avalia vídeo de comportamentos da criança — possível via Telessaúde. Custo de 1 criança TEA sem intervenção: R$ 3,2M em cuidados ao longo da vida vs R$ 84k com intervenção precoce"},
        {"transtorno": "TDAH — Transtorno de Déficit de Atenção e Hiperatividade",
         "estimados": 420, "diagnosticados": 84, "em_terapia": 42, "faixa_etaria": "6–17 anos",
         "status": "critico",
         "observacao": "420 crianças com TDAH estimadas (5% da faixa 6-17). Diagnosticados: 84 (20%). Medicados: 42 (50% dos diagnosticados). Metilfenidato (Ritalina): Componente Especializado (CEAF) — gratuito, mas requer psiquiatra (zero em Apuí) + laudo + SISREG (380 dias). TDAH não tratado: evasão escolar × 4, uso de drogas × 3, criminalidade × 2 (dados ABDA). Professor: identifica TDAH — mas sem psicólogo escolar não avança. Tele-psiquiatria: diagnóstico diferencial TDAH vs TEA vs ansiedade — possível via Telessaúde. SCFV (Serviço de Convivência): 80 vagas para 840 necessárias — TDAH se beneficia de estrutura e rotina. TDAH + mercúrio: exposição ao Hg na gestação e infância mimetiza e agrava TDAH (módulo Mercúrio)"},
        {"transtorno": "Depressão e ansiedade em adolescentes",
         "estimados": 704, "diagnosticados": 132, "em_terapia": 48, "faixa_etaria": "10–17 anos",
         "status": "critico",
         "observacao": "284 com depressão + 420 com ansiedade (estimados). Diagnosticados: 132 (18,8%). Em terapia: 48 (36,4% dos diagnosticados). Zero psicólogo no SUS para infantojuvenis em Apuí. Rastreio: PHQ-A (9 itens) para adolescentes = custo R$ 0 (domínio público). Professor + ACS: aplicam PHQ-A na escola ou visita domiciliar. Escitalopram/Sertralina (ISRS): disponível no REMUME para maiores de 12 anos. Psicologia: via tele-psicologia (CFP autoriza) — custo R$ 14k (tablet + internet). Depressão adolescente: fator de risco mais importante para suicídio em Apuí (56,7/100k — módulo Prevenção do Suicídio). 28 tentativas de suicídio em adolescentes em 2025 = 42,9% de todas as tentativas do município. PHQ-A ≥ 10: encaminhamento imediato"},
        {"transtorno": "Trauma e TEPT (violência, abuso, exposição ao mercúrio)",
         "estimados": 2808, "diagnosticados": 142, "em_terapia": 48, "faixa_etaria": "0–17 anos",
         "status": "critico",
         "observacao": "28,4% das crianças (2.808) com TEPT estimado (exposição a violência doméstica, abuso sexual, garimpo, luto). Diagnosticados: 142 (5,1%). Trauma: violência doméstica (módulo Violência Doméstica/Sexual) + 42 casos de violência sexual notificada + 84 de violência física. Mercúrio: dano neurológico de 842 crianças (módulo Mercúrio) gera sintomas de TEPT e déficit cognitivo. TEPT em criança: trauma não tratado = adulto com maior risco de depressão, suicídio, dependência química, violência. Terapia cognitivo-comportamental focada em trauma (TCC-T): eficaz em 8-12 sessões. Psicólogo com especialização em trauma: zero em Apuí. CREAS: equipe multidisciplinar acompanha casos de abuso — mas sem psicólogo para TCC-T. Grupo de apoio a vítimas de violência: facilitado por assistente social — R$ 4.800/ano"},
        {"transtorno": "Uso de álcool e drogas (infanto-juvenil)",
         "estimados": 420, "diagnosticados": 42, "em_terapia": 12, "faixa_etaria": "10–17 anos",
         "status": "critico",
         "observacao": "84 menores de 12 anos com uso de álcool (estimado). 42 adolescentes com uso de crack (estimado). Garimpo: cultura de uso de drogas normalizada expõe filhos precocemente. CAPS AD: zero em Apuí (módulo CAPS AD). SCFV: reduz uso de drogas em 28% (evidência MDSA). 80 vagas vs 840 necessárias. Uso de crack na adolescência: dependência química em 90% dos usuários em < 6 meses. Dependência química no adolescente: custo de vida inteira em tratamento = R$ 840.000/pessoa. Atenção: crack barato (R$ 5/pedra) no contexto do garimpo = disponibilidade altíssima. PROERD (PM): zero em Apuí (módulo Saúde Escolar). Internação compulsória de adolescente: zero leitos psiquiátricos infanto-juvenis na região (mais próximo: Manaus, 480km)"}
    ]


@lru_cache(maxsize=1)
def _INTERVENCOES():
    return [
        {"intervencao": "Rastreio universal de saúde mental nas escolas (PHQ-A + SDQ)",
         "implementada": False, "custo": 4800, "prazo_meses": 1,
         "observacao": "PHQ-A (depressão adolescente) + SDQ (Strengths and Difficulties Questionnaire, 4-17 anos): ambos gratuitos (domínio público). Aplicação: professor treina em 2h + aplica 1×/semestre. PHQ-A ≥ 10: encaminha à UBS. SDQ ≥ 17: encaminha ao CRAS/CREAS. Custo: R$ 4.800 (impressão + treinamento). 1.818 crianças com transtorno estimadas: PHQ-A/SDQ detecta 42% = 763 casos novos identificados. Triagem ≠ diagnóstico: mas gera fila de encaminhamento para tele-psicologia + PSE. Zero custo para o MS: programa de rastreio em saúde mental escolar é ação PSE obrigatória. Cada caso detectado precocemente: -70% do custo do transtorno ao longo da vida (OMS)"},
        {"intervencao": "Tele-psiquiatria infantojuvenil (UFAM + HPS/HUPAA)",
         "implementada": False, "custo": 14000, "prazo_meses": 2,
         "observacao": "Zero psiquiatra infantil + zero neuropediatra em Apuí. Tele-psiquiatria: psiquiatra da UFAM ou HPS atende via videoconferência. Casos: TEA (diagnóstico), TDAH (prescrição de metilfenidato), depressão grave, psicose inicial. Custo: R$ 14.000 (tablet + internet + treinamento). Meta: 100 consultas tele-psiquiátricas/mês para infantojuvenis. Metilfenidato via CEAF: com laudo de tele-psiquiatra = aprovação em 30 dias vs 380 dias pelo SISREG presencial. TEA: tele-diagnóstico + prescrição de fonoaudiologia + BPC. Tele-psicologia (CFP Resolução 11/2018): psicólogo atende por videoconferência = 840/sem. = R$ 84/sessão × plataforma gratuita. 48 adolescentes em terapia: apenas 2,6% dos 1.818 necessários"},
        {"intervencao": "Expansão do SCFV (Serviço de Convivência) de 80 para 840 vagas",
         "implementada": False, "custo": 168000, "prazo_meses": 6,
         "observacao": "SCFV: programa SUAS de atividades socioeducativas (esporte, arte, cultura) para 6-17 anos em situação de vulnerabilidade. 80 vagas vs 840 necessárias = 760 vagas em falta. SCFV: reduz uso de drogas -28%, violência -22%, evasão escolar -18% (evidência MDSA). Custo: MS + MDSA financiam R$ 50/vaga/mês. 840 vagas × R$ 50 × 12 = R$ 504.000/ano (federal). Contrapartida municipal: R$ 168.000/ano (espaço físico + funcionários locais). SCFV + TDAH: estrutura + atividades = alternativa não farmacológica eficaz. SCFV nos finais de semana: crianças de garimpeiros não vão ao garimpo = menos exposição ao Hg e drogas. ROI: R$ 168k municipal vs R$ 8,4M de custo de saúde mental de 1 geração sem suporte"},
        {"intervencao": "Grupo de apoio ao luto e violência para crianças (CREAS + CRAS)",
         "implementada": False, "custo": 4800, "prazo_meses": 1,
         "observacao": "28,4% das crianças com TEPT (trauma). CREAS: já tem assistente social + psicólogo social (nem sempre com formação em trauma). Grupo terapêutico de apoio (não é psicoterapia individual): 10 crianças × 12 encontros = 120h de suporte/ano por grupo. Custo: R$ 4.800 (material lúdico + supervisão de caso). Indicação: crianças que sofreram violência, luto, separação familiar. Luto por suicídio de familiar: fator de risco de TEPT × 4 + suicídio da criança × 3 (efeito manada). Apuí: 14 óbitos por suicídio em 2025 × média 3 filhos = 42 crianças em luto por suicídio de pai/mãe/irmão. Zero grupo de suporte a essas crianças. Material lúdico (caixas de areia, bonecas, máscaras): terapia do jogo para crianças < 10 anos"},
        {"intervencao": "Protocolo de crise suicida em adolescentes (CVV + UBS + CAPS)",
         "implementada": False, "custo": 2400, "prazo_meses": 1,
         "observacao": "28 tentativas de suicídio em adolescentes em 2025, 6 óbitos = 21,4% de letalidade das tentativas. Zero protocolo de busca ativa pós-tentativa para adolescentes. Protocolo: UBS contacta adolescente em 24h pós-tentativa + visita domiciliar em 72h. CVV 188: fixar cartaz em todas as escolas + CRAS + UBS (custo R$ 0). Sentinelas de crise: treinar professores para identificar risco iminente (2h, R$ 2.400). Encaminhamento: adolescente em crise → UBS → tele-psiquiatria em 24h (urgência). Hospitalização: HMM + transferência a Manaus se necessário (único recurso disponível). Fator de risco principal: bullying + depressão não tratada + uso de drogas + acesso a armas (garimpo). Acesso a arma de fogo: 28,4% dos adolescentes em área rural tem contato regular"}
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "em_acompanhamento": 84,  "tentativas_suicidio_adol": 18, "violencia_notificada": 98,  "scfv_vagas": 60},
        {"ano": "2023", "em_acompanhamento": 98,  "tentativas_suicidio_adol": 22, "violencia_notificada": 108, "scfv_vagas": 68},
        {"ano": "2024", "em_acompanhamento": 118, "tentativas_suicidio_adol": 24, "violencia_notificada": 118, "scfv_vagas": 72},
        {"ano": "2025", "em_acompanhamento": 142, "tentativas_suicidio_adol": 28, "violencia_notificada": 126, "scfv_vagas": 80},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Crianças com transtorno s/ acompanhamento", "valor": 92.2, "meta": 0.0,  "unidade": "%",    "status": "critico", "observacao": "92,2% sem nenhum suporte (1.676 de 1.818 estimados). PHQ-A + SDQ nas escolas: R$ 4.800 detecta 763 novos. Tele-psiquiatria: R$ 14k → 100 atendimentos/mês. SCFV: R$ 168k → 840 vagas"},
        {"indicador": "TEA diagnosticados (meta: 100%)",           "valor": 14.8, "meta": 100.0,"unidade": "%",    "status": "critico", "observacao": "14,8% — janela crítica 0-6 anos perdida para 85,2%. Tele-diagnóstico + BPC: R$ 14k conecta a neuropediatra. Intervenção precoce: -97% do custo de vida inteira (R$ 3,2M → R$ 84k)"},
        {"indicador": "Tentativas de suicídio adolescente 2025",   "valor": 28,   "meta": 0,    "unidade": "casos","status": "critico", "observacao": "28 tentativas, 6 óbitos (21,4% de letalidade). 42,9% de todos os suicídios. PHQ-A + protocolo pós-tentativa: R$ 7.200 = salva vidas. Zero busca ativa em 72h"},
        {"indicador": "Vagas SCFV disponíveis vs necessárias",     "valor": 9.5,  "meta": 100.0,"unidade": "%",    "status": "critico", "observacao": "80/840 vagas (9,5%). Federal financia R$ 504k/ano. Municipal: R$ 168k. SCFV: -28% uso de drogas, -18% evasão. Cada R$ 168k investido evita R$ 8,4M de custo geracional"},
        {"indicador": "Violência infantojuvenil notificada",        "valor": 126,  "meta": 0,    "unidade": "casos","status": "critico", "observacao": "126 casos notificados (subnotificação estimada 70%). 42 violência sexual, 84 física. TEPT em 28,4% das crianças. Grupo de apoio CREAS: R$ 4.800 suporta 42 crianças em luto por suicídio familiar"}
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/transtornos")
def transtornos():
    return _TRANSTORNOS()


@router.get("/intervencoes")
def intervencoes():
    return _INTERVENCOES()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()