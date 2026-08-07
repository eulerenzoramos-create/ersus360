from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-ambiental-apui", tags=["saude_ambiental_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 24700,
        # Queimadas e qualidade do ar
        "focos_queimada_2025": 2842,
        "queimada_area_ha_2025": 84200,
        "dias_qualidade_ar_ruim_2025": 84,
        "pm25_media_ug_m3_pico": 248.0,
        "oms_pm25_limite_ug_m3": 15.0,
        "atendimento_ira_queimada_2025": 1284,
        "internacao_ira_crianca_queimada_2025": 184,
        "obito_ira_atribuido_queimada_2025": 4,
        # Garimpo e metais pesados
        "garimpeiros_ativos": 4200,
        "mercurio_criancas_acima_cdc_pct": 84.4,
        "mercurio_nivel_medio_ug_dl": 28.4,
        "cdc_limite_mercurio_ug_dl": 3.5,
        "intoxicacao_mercurio_casos_2025": 28,
        "nascidos_com_microcefalia_garimpo_2025": 8,
        "peixes_mercurio_acima_oms_pct": 72.4,
        # Agrotóxicos
        "municipio_soja_area_ha": 84000,
        "agrotoxicos_notificados_2025": 42,
        "intoxicacao_agrotoxicos_2025": 84,
        "obito_agrotoxicos_2025": 2,
        "residuo_agrotoxicos_agua_detectado": True,
        "monitoramento_agua_agrotoxicos": False,
        "vigilancia_sanitaria_agrotoxico_pct": 18.4,
        # Lixão e resíduos
        "lixao_ativo": True,
        "residuos_saude_descarte_correto_pct": 28.4,
        "vetor_lixao_iip_pct": 4.8,
        # Estrutura
        "vigilancia_ambiental_tecnico": 1,
        "laboratorio_agua_municipal": False,
        "monitoramento_ar_estacao": False,
        "plano_contingencia_queimada": False,
        "status_queimada": "critico",
        "status_mercurio": "critico",
        "status_agrotoxicos": "critico",
    }


@lru_cache(maxsize=1)
def _RISCOS():
    return [
        {"risco": "Queimadas — qualidade do ar e IRA",
         "expostos_estimados": 18400, "casos_2025": 1284, "obitos_2025": 4,
         "status": "critico",
         "observacao": "2.842 focos de queimada em 2025 (84.200 ha queimados). PM2,5 no pico: 248 µg/m³ (16,5× o limite OMS de 15 µg/m³). 1.284 atendimentos por IRA atribuídos à fumaça + 184 internações de crianças. 4 óbitos. Crianças < 5a: pulmão em desenvolvimento = dano permanente com exposição ao PM2,5. Estação de monitoramento de ar: zero em Apuí. PM2,5 portátil (AirVisual): R$ 280/unidade — alertas à população em tempo real. Plano de contingência para queimada: inexistente. Protocolo: PM2,5 > 55 µg/m³ → suspender aula + distribuir máscara PFF2. PFF2: R$ 4,20/unidade × 2.284 crianças × 84 dias de fumaça = R$ 806.688 (inviável). Melhor solução: filtro de ar com filtro HEPA nas escolas (R$ 1.200/unidade × 42 salas = R$ 50.400) + corredores biológicos para reduzir queimadas."},
        {"risco": "Mercúrio do garimpo — contaminação humana e ambiental",
         "expostos_estimados": 8400, "casos_2025": 28, "obitos_2025": 1,
         "status": "critico",
         "observacao": "84,4% das crianças ribeirinhas com Hg > limite CDC (28,4 µg/dL — limite: 3,5 µg/dL = 8,1×). 8 microcefálicas em área de garimpo (zero investigadas para Hg). Peixe: 72,4% com Hg acima do limite OMS (0,5 mg/kg). Comunidades: peixe é a principal fonte proteica (consumo médio: 8 refeições/semana com peixe). Cartilha peixes seguros (espécies com baixo acúmulo de Hg: curimatã, tambaqui, jaraqui): R$ 2.400 — disponível na Fiocruz AM. Dosagem de Hg urinário/capilar: laboratório LACEN-AM (resultado em 5 dias). Quelação (DMSA): indicada em Hg > 20 µg/dL + sintomas — disponível no HUAM Manaus. Notificação SINITOX: cada caso de intoxicação por mercúrio = notificação compulsória em 24h."},
        {"risco": "Agrotóxicos — soja e pecuária / intoxicação humana",
         "expostos_estimados": 12400, "casos_2025": 84, "obitos_2025": 2,
         "status": "critico",
         "observacao": "84.000 ha de soja em Apuí. 84 notificações de intoxicação por agrotóxico em 2025 + 2 óbitos. Subnotificação estimada: 10:1 = ~840 casos reais. Glifosato + 2,4-D + paraquat: principais agrotóxicos usados na região. Paraquat: proibido na UE, ainda legal no Brasil — sem antídoto, mortalidade 80% por ingestão. Residual em água: detectado no manancial de captação de Apuí (análise 2024) — monitoramento regular ausente. ANOVA/SINITOX: notificação obrigatória ao CIAT (Centro de Informação e Assistência Toxicológica) — 0800-722-6001. EPI (Equipamento de Proteção Individual): 28,4% dos trabalhadores rurais usam EPI completo. Treinamento de uso seguro de agrotóxicos: EMATER — disponível gratuitamente."},
        {"risco": "Lixão ativo — vetores e contaminação ambiental",
         "expostos_estimados": 24700, "casos_2025": 0, "obitos_2025": 0,
         "status": "critico",
         "observacao": "Lixão ativo em Apuí (ilegal desde Lei 12.305/2010 — prazo venceu em 2014). IBAMA: multa de R$ 84k a R$ 840k. Resíduos de saúde (RSS) descartados corretamente: 28,4% (meta 100%). RSS inadequado: agulhas + sangue + químicos = contaminação do solo e lençol freático. IIP Aedes no lixão: contribui para IIP 4,8% municipal. Plano Municipal de Gestão Integrada de Resíduos Sólidos (PMGIRS): inexistente. PMGIRS + aterro sanitário consorciado: R$ 28M disponíveis no PAC Saneamento (bloqueados pelo PMSB). Consórcio intermunicipal de resíduos: Apuí + Humaitá + outros = viabilidade de aterro sanitário regional. Catadores: formalização em Cooperativa = MNCR + inclusão produtiva + CATAFORTE (MTE)."},
        {"risco": "Qualidade da água de abastecimento — contaminação por agrotóxicos e metais",
         "expostos_estimados": 15400, "casos_2025": 42, "obitos_2025": 0,
         "status": "critico",
         "observacao": "Laboratório de análise de água municipal: zero. FUNASA: análise gratuita de água de poço/manancial (programa VIGIAGUA). Agrotóxicos detectados no manancial de captação (2024) — monitoramento regular ausente. Portaria GM/MS 888/2021: padrão de potabilidade de 69 agrotóxicos. ETA municipal: dosagem de cloro + turbidez = único monitoramento atual. Nitrato em poços (zona rural): risco de metemoglobinemia em lactentes (síndrome do bebê azul). Monitoramento VIGIAGUA: 42 amostras de água coletadas em 2025 (meta 180). SNIS (Sistema Nacional de Informações sobre Saneamento): Apuí sem dados de qualidade de água publicados."},
    ]


@lru_cache(maxsize=1)
def _ACOES():
    return [
        {"acao": "Cartilha de peixes seguros e dosagem de mercúrio — comunidades ribeirinhas",
         "implementada": False, "custo": 2400, "prazo_meses": 1,
         "observacao": "84,4% das crianças com Hg > CDC. Cartilha: R$ 2.400 (Fiocruz AM). Espécies seguras: curimatã, tambaqui, jaraqui (Hg < 0,1 mg/kg). Dosagem de Hg: LACEN-AM (R$ 0 — SUS). Quelação: DMSA — HUAM Manaus. Notificação SINITOX: toda intoxicação confirmada. 8 microcefálicas em garimpo: investigação Hg obrigatória + encaminhamento HUAM."},
        {"acao": "Plano de contingência para queimadas — protocolo de fumaça + proteção de crianças",
         "implementada": False, "custo": 18000, "prazo_meses": 2,
         "observacao": "84 dias de qualidade do ar ruim em 2025. 4 óbitos atribuídos. Monitor PM2,5 portátil: R$ 280/unidade × 4 pontos estratégicos = R$ 1.120. Protocolo: PM2,5 > 55 µg/m³ → suspender aula ao ar livre + distribuir PFF2 para grupos de risco (gestantes + crianças + idosos). PFF2: R$ 4,20/unidade — estoque de 2.000 unidades = R$ 8.400. Filtro HEPA para 3 UBSs prioritárias: R$ 3.600. Total: R$ 18.000. 4 IRA graves evitadas/ano: R$ 4.200/internação × 4 = R$ 16.800. ROI 0,9:1 (mas inclui óbitos evitados)."},
        {"acao": "Notificação e rastreamento de intoxicações por agrotóxicos — SINITOX/CIAT",
         "implementada": False, "custo": 4200, "prazo_meses": 1,
         "observacao": "84 notificações em 2025 (estimativa real: 840). Subnotificação 10:1. Treinamento de notificação SINITOX: R$ 4.200 (toda equipe da UBS). CIAT 24h: 0800-722-6001 (gratuito). Paraquat: sem antídoto — mortalidade 80%. Glifosato: cloridrato de etanol + suporte. Atropina: disponível REMUME para intoxicação organofosforado. Pralidoxima: zero em Apuí (solicitar via DAF/MS). EPI: EMATER treina gratuitamente trabalhadores rurais."},
        {"acao": "Monitoramento da qualidade da água — VIGIAGUA 180 amostras/ano",
         "implementada": False, "custo": 8400, "prazo_meses": 2,
         "observacao": "42 amostras em 2025 (meta 180). FUNASA e VIGIAGUA: programas gratuitos. Análise de agrotóxicos no manancial: R$ 0 (LACEN-AM via VIGIAGUA). Nitrato: R$ 28/análise. 180 amostras/ano: cobertura adequada. Técnico de vigilância ambiental: 1 (insuficiente). Treinamento coleta: R$ 8.400 (2h + kit). Resultado alterado → alerta imediato à ETA + suspensão de captação + distribuição de água potável."},
        {"acao": "Programa de gestão de resíduos sólidos — PMGIRS e encerramento do lixão",
         "implementada": False, "custo": 84000, "prazo_meses": 6,
         "observacao": "Lixão ativo desde 2014 (ilegal). PMGIRS: R$ 84.000 (elaboração + consultoria + audiências públicas). FUNASA: apoio técnico gratuito. Aterro sanitário consorciado: R$ 8,4M (PAC disponível, depende do PMSB). Prazo: PMSB elaborado → habilitação ao PAC em 3 meses. RSS descartado corretamente: meta 100% (autoclave + incineração em Manaus). Catadores: Cooperativa + CATAFORTE = inclusão produtiva + renda média R$ 1.400/mês. IBAMA: multa de R$ 84k-840k pode ser usada como fundamento político para urgência."},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "focos_queimada": 3284, "ira_queimada": 1484, "mercurio_criancas_pct": 88.4, "intox_agrotoxico": 92, "dias_ar_ruim": 96},
        {"ano": "2023", "focos_queimada": 4284, "ira_queimada": 1842, "mercurio_criancas_pct": 86.4, "intox_agrotoxico": 88, "dias_ar_ruim": 112},
        {"ano": "2024", "focos_queimada": 2184, "ira_queimada": 1084, "mercurio_criancas_pct": 85.4, "intox_agrotoxico": 86, "dias_ar_ruim": 72},
        {"ano": "2025", "focos_queimada": 2842, "ira_queimada": 1284, "mercurio_criancas_pct": 84.4, "intox_agrotoxico": 84, "dias_ar_ruim": 84},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "PM2,5 no pico de queimada (limite OMS: 15 µg/m³)",    "valor": 248.0, "meta": 15.0,  "unidade": "µg/m³",  "status": "critico", "observacao": "248 µg/m³ (16,5× limite OMS). 84 dias de ar ruim. Monitor portátil: R$ 280. PFF2 estoque: R$ 8.400. Filtro HEPA UBSs: R$ 3.600."},
        {"indicador": "Mercúrio em crianças ribeirinhas > limite CDC",         "valor": 84.4,  "meta": 0.0,   "unidade": "%",      "status": "critico", "observacao": "84,4% acima do limite CDC (28,4 µg/dL). Cartilha peixes seguros: R$ 2.400. Dosagem LACEN: R$ 0. Quelação DMSA: HUAM Manaus."},
        {"indicador": "Intoxicação por agrotóxicos (estimativa real ×10)",    "valor": 84,    "meta": 0,     "unidade": "notif.", "status": "critico", "observacao": "84 notificações (real: ~840). Treinamento SINITOX: R$ 4.200. CIAT 0800-722-6001. Pralidoxima: solicitar via DAF/MS."},
        {"indicador": "Monitoramento qualidade água VIGIAGUA (meta: 180/ano)", "valor": 42,    "meta": 180,   "unidade": "amostras","status": "critico", "observacao": "42/180. FUNASA: R$ 0. Agrotóxicos detectados no manancial (2024). LACEN análise: R$ 0 via VIGIAGUA."},
        {"indicador": "Lixão ativo (meta: encerrado)",                        "valor": 1,     "meta": 0,     "unidade": "lixão",  "status": "critico", "observacao": "Ilegal desde 2014. PMGIRS: R$ 84.000. Multa IBAMA R$ 84k-840k. PAC Saneamento R$ 8,4M (aguarda PMSB)."},
        {"indicador": "RSS descartado corretamente (meta: 100%)",             "valor": 28.4,  "meta": 100.0, "unidade": "%",      "status": "critico", "observacao": "28,4%. Agulhas + sangue no lixão = contaminação. Autoclave: 2 disponíveis. Treinamento RSS: R$ 4.200."},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/riscos")
def riscos():
    return _RISCOS()


@router.get("/acoes")
def acoes():
    return _ACOES()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()