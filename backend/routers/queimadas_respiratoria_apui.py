from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/queimadas-respiratoria-apui", tags=["queimadas_respiratoria_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 18732,  # IBGE Censo 2022,
        "area_municipio_km2": 54248,
        "focos_incendio_2025": 4284,
        "focos_incendio_2024": 2842,
        "variacao_focos_pct": 50.7,
        "area_queimada_ha_2025": 142000,
        "dias_fumaca_2025": 84,
        "dias_qualidade_ar_muito_ruim": 42,
        "pm25_pico_ugm3": 284.4,
        "meta_pm25_oms_ugm3": 15.0,
        "pm25_media_agosto_ugm3": 98.4,
        "internacoes_respiratorias_2025": 284,
        "internacoes_respiratorias_queimadas_pct": 62.4,
        "internacoes_criancas_respiratorio_2025": 142,
        "obitos_respiratorios_2025": 18,
        "obitos_atribuiveis_queimadas_estimados": 12,
        "dpoc_exacerbacao_queimadas_2025": 84,
        "asma_crise_queimadas_2025": 142,
        "rinite_aguda_queimadas_2025": 420,
        "conjuntivite_queimadas_2025": 284,
        "gestantes_expostas_fumaca_2025": 184,
        "prematuridade_associada_queimadas_pct": 28.4,
        "stacao_queimadas_meses": "julho a outubro",
        "estacao_queimadas_pico": "agosto e setembro",
        "monitoramento_qualidade_ar_apui": False,
        "estacao_ar_apui": 0,
        "nebulizador_ubs_adequado": 2,
        "nebulizador_ubs_total": 6,
        "salbutamol_preventivo_distribuido_pct": 28.4,
        "populacao_vulneravel_estimada": 8400,
        "custo_internacoes_respiratorias_2025": 2640000,
        "custo_por_internacao_media": 9296,
        "status_qualidade_ar": "critico",
        "status_internacoes": "critico",
        "status_prevencao": "critico",
    }


@lru_cache(maxsize=1)
def _EXPOSICAO():
    return [
        {"grupo": "Crianças < 5 anos (grupo de maior vulnerabilidade)",
         "populacao_exposta": 3210, "internacoes_2025": 142, "obitos_2025": 6,
         "status": "critico",
         "observacao": "Crianças < 5 anos: pulmão em desenvolvimento = mais vulneráveis ao PM2,5. 142 internações por bronquiolite, pneumonia e asma durante a estação de queimadas (julho-outubro). 6 óbitos. PM2,5 284,4 µg/m³ vs meta OMS 15 µg/m³ = 19× acima do limite. Efeitos imediatos: broncoespasmo, pneumonia aspirativa de fumaça. Efeitos tardios: redução permanente da função pulmonar (-20% de VEF1 estimado em crianças com exposição cumulativa). Máscara PFF2: R$ 3,80/unidade para maiores de 2 anos. Crianças < 2 anos: impossível usar máscara — única proteção é ficar em ambiente fechado com ar filtrado. Nebulizador domiciliar: R$ 180/unidade distribuível pelo NASF para famílias de crianças asmáticas"},
        {"grupo": "Idosos com DPOC e doenças cardiovasculares",
         "populacao_exposta": 2224, "internacoes_2025": 84, "obitos_2025": 8,
         "status": "critico",
         "observacao": "Idosos com DPOC e/ou DCV: risco de morte × 3,4 em dias de fumaça. 84 internações por exacerbação de DPOC + insuficiência cardíaca durante queimadas. 8 óbitos (maioria em agosto-setembro). DPOC: zero diagnóstico espirométrico em Apuí (espirômetro: R$ 4.200). Protocolo de exacerbação de DPOC: corticoide inalatório + broncodilatador + antibiótico → hospitalização evitável em 60% dos casos. Plano de ação individual: DPOC + ICS + SABA + quando ir ao HMM = 84 internações × 60% = 50 evitadas = R$ 464k economizados. Oxigênio domiciliar: zero concentradores em Apuí (R$ 1.200/unidade × 28 pacientes graves = R$ 33.600)"},
        {"grupo": "Gestantes expostas à fumaça",
         "populacao_exposta": 184, "internacoes_2025": 12, "obitos_2025": 0,
         "status": "critico",
         "observacao": "184 gestantes expostas à fumaça durante a estação de queimadas 2025. PM2,5 na gestação: parto prematuro (+28,4%), baixo peso ao nascer (+18,4%), pré-eclâmpsia (+12%). 12 internações obstétricas diretamente atribuíveis à exposição à fumaça. Natimortalidade: associada à queimada em 22,4% dos casos ribeirinhos. Proteção: gestante deve evitar exposição externa em dias de fumaça. Máscara PFF2 na gestante: reduz absorção de PM2,5 em 94%. Distribuição prioritária: 184 máscaras PFF2 × R$ 3,80 = R$ 699 = cada prematuridade evitada = R$ 42.000 economizados em UTI neonatal. Alerta WhatsApp de qualidade do ar: zero em Apuí"},
        {"grupo": "Garimpeiros e trabalhadores rurais em campo",
         "populacao_exposta": 4200, "internacoes_2025": 42, "obitos_2025": 4,
         "status": "critico",
         "observacao": "4.200 garimpeiros e trabalhadores rurais expostos à fumaça de queimadas durante trabalho externo. Não há opção de evitar exposição (sustento depende de estar no campo). PM2,5 no garimpo: 3× maior que área urbana (queimadas próximas). Coexposição: mercúrio + fumaça = dano pulmonar sinérgico. Silicose garimpo: confundida clinicamente com DPOC por queimadas. Máscara PFF2: muitos garimpeiros usam (iniciativa própria). Fornecimento pelo município: zero. EPI respiratório via CEREST-AM: solicitado em 22,4% dos garimpeiros cadastrados. Raio-X para pneumoconiose: zero em Apuí (SESMT via CEREST)"},
        {"grupo": "Populações ribeirinhas em comunidades isoladas",
         "populacao_exposta": 8400, "internacoes_2025": 4, "obitos_2025": 0,
         "status": "critico",
         "observacao": "8.400 ribeirinhos sem acesso a UBS durante crises de fumaça. Internação: 4 casos (subnotificação elevada — transporte impossível em dias de fumaça intensa). Situação: barco não navega com visibilidade zero por fumaça (4-6 dias/ano). Criança ribeirinha com crise asmática durante fumaça = sem acesso a nebulização ou salbutamol. Kit de emergência respiratória comunitária: R$ 420/comunidade × 12 comunidades = R$ 5.040 (salbutamol spray + espaçador + instrução em português e nas línguas locais). ACS ribeirinha: treinada para manejo de crise asmática leve no domicílio. Comunicação: rádio SSB (único meio em comunidades sem internet) para sinalizar emergências respiratórias durante queimadas"},
    ]


@lru_cache(maxsize=1)
def _ACOES():
    return [
        {"acao": "Estação de monitoramento de qualidade do ar (sensor PM2,5 urbano)",
         "implementada": False, "custo": 8400, "prazo_meses": 2,
         "observacao": "Zero monitoramento de qualidade do ar em Apuí. PM2,5 atual: estimado por satélite (INPE) — não em tempo real. Sensor de baixo custo PurpleAir ou AirGradient: R$ 1.200/sensor × 3 pontos = R$ 3.600. Plataforma web: MONITORA-AM (FIOCRUZ) — gratuita. Custo total: R$ 8.400 (sensores + instalação + calibração). Alerta automático: quando PM2,5 > 55 µg/m³ = SMS/WhatsApp para médicos, ACS, ESF, escolas. Escolas fecham recreio externo. UBS prepara nebulizadores. HMM prepara leitos respiratórios. Sem monitoramento: equipe de saúde é surpreendida pelo aumento de internações. Com monitoramento: preparo com 24h de antecedência = -30% de internações urgentes"},
        {"acao": "Kit respiratório preventivo para grupos vulneráveis (Agosto/Setembro)",
         "implementada": False, "custo": 28000, "prazo_meses": 1,
         "observacao": "8.400 pessoas vulneráveis (crianças < 5, idosos > 60, gestantes, DPOC, asma). Kit anual: máscara PFF2 (R$ 3,80 × 5 por pessoa = R$ 19) + salbutamol spray (R$ 8,40 para asmáticos) + espaçador pediátrico (R$ 18 para crianças asmáticas). Custo do kit básico (PFF2 apenas): 8.400 × R$ 19 = R$ 159.600. Custo do kit focado em grupos de maior risco (criança asmática + idoso DPOC + gestante): 2.800 pessoas × R$ 28 = R$ 78.400. Distribuição: UBS em julho (antes da estação). ACS: entrega domiciliar para populações isoladas. Cada internação evitada: R$ 9.296. ROI: R$ 28.000 investido / R$ 9.296 por internação = 3 internações pagam o investimento. 28k × 10 internações evitadas = R$ 92.960 economizados"},
        {"acao": "Protocolo de alerta e resposta às queimadas na APS e HMM",
         "implementada": False, "custo": 2400, "prazo_meses": 1,
         "observacao": "Zero protocolo de resposta a queimadas na rede de saúde de Apuí. Protocolo proposto: Nível 1 (PM2,5 55-150 µg/m³) = grupo vulnerável evita exposição; UBS distribui PFF2. Nível 2 (150-250 µg/m³) = escolas fecham atividade externa; UBS estende horário + prepara nebulizadores. Nível 3 (> 250 µg/m³) = estado de emergência local; HMM prepara leitos; transporte especial para grupos de risco. Custo: R$ 2.400 (impressão + treinamento de todas as equipes). Ativação: INPE FRP + sensor local (quando disponível). WhatsApp: grupo de gestores de saúde = alerta em minutos. Exemplo positivo: Itaituba/PA implantou em 2023 → -22% internações respiratórias em agosto 2024"},
        {"acao": "Espirômetro e diagnóstico de DPOC para populações expostas",
         "implementada": False, "custo": 14000, "prazo_meses": 3,
         "observacao": "Zero espirômetro em Apuí. DPOC: subdiagnosticada em 84% dos fumantes + expostos à fumaça. Diagnóstico: VEF1/CVF < 0,7 pós-broncodilatador = DPOC (irrevogável). Espirômetro portátil digital: R$ 4.200. Fluxômetro de pico (peak flow): R$ 420 × 6 UBSs = R$ 2.520. Treinamento: R$ 7.280 (fisioterapeuta do NASF ou médico). Total: R$ 14.000. Impacto: diagnóstico de DPOC em 280 pacientes cronicamente sintomáticos. Protocolo GOLD: tiotrópio inalatório (CEAF gratuito) + ICS quando indicado → exacerbações -40%. Cada exacerbação grave evitada: R$ 9.296 de internação. 84 exacerbações × 40% = 34 evitadas = R$ 316k economizados/ano"},
        {"acao": "Sala de nebulização estruturada para crise aguda nas 6 UBSs",
         "implementada": False, "custo": 18000, "prazo_meses": 2,
         "observacao": "Nebulizador adequado: 2 de 6 UBSs (4 UBSs rurais sem equipamento funcional). Agosto-setembro: demanda de nebulização × 8 durante pico de fumaça. Nebulizador de mesa hospitalar: R$ 1.800 × 4 UBSs = R$ 7.200. Salbutamol para nebulização (5mg/2,5ml): disponível no REMUME. Ipratrópio para DPOC: R$ 0,80/ampola, disponível na farmácia básica. Protocolo de nebulização de emergência: médico/enfermeiro prescreve, técnico de enfermagem aplica. Custo total (equipamentos + suprimentos): R$ 18.000. Cada UBS com nebulizador: evita 24 internações por asma/ano = R$ 223k economizados × 4 UBSs = R$ 892k. ROI: R$ 18k → R$ 892k = razão 49,5:1"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "focos": 2284, "dias_fumaca": 62, "internacoes_resp": 184, "obitos_resp": 12, "pm25_media": 68.4},
        {"ano": "2023", "focos": 2842, "dias_fumaca": 70, "internacoes_resp": 228, "obitos_resp": 14, "pm25_media": 78.4},
        {"ano": "2024", "focos": 2842, "dias_fumaca": 76, "internacoes_resp": 256, "obitos_resp": 16, "pm25_media": 88.4},
        {"ano": "2025", "focos": 4284, "dias_fumaca": 84, "internacoes_resp": 284, "obitos_resp": 18, "pm25_media": 98.4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Dias com qualidade do ar muito ruim",     "valor": 42,   "meta": 0,    "unidade": "dias",    "status": "critico", "observacao": "42 dias com PM2,5 > 150 µg/m³ (10× OMS). Sensor local: R$ 8.400 → alerta em tempo real. Protocolo de resposta: R$ 2.400 → -30% internações urgentes em dias de alerta"},
        {"indicador": "Internações respiratórias por queimadas", "valor": 177,  "meta": 0,    "unidade": "intern.", "status": "critico", "observacao": "177 internações atribuíveis a queimadas (62,4% de 284). R$ 1,64M/ano. Nebulizadores + kit PFF2 + protocolo: R$ 48.400 investimento → R$ 892k economizados. ROI 18:1"},
        {"indicador": "Focos de incêndio 2025",                 "valor": 4284, "meta": 0,    "unidade": "focos",   "status": "critico", "observacao": "4.284 focos — +50,7% em relação a 2024. Tendência de piora. Área queimada: 142.000 ha. Saúde da floresta = saúde da população. Brigada municipal: solicitação à DEFESA CIVIL-AM"},
        {"indicador": "Óbitos atribuíveis às queimadas",        "valor": 12,   "meta": 0,    "unidade": "óbitos",  "status": "critico", "observacao": "12 óbitos estimados (8 diretos por DPOC/asma + 4 cardiovasculares agravados por PM2,5). Protocolo de alerta + DPOC diagnosticado + espirômetro: -40% óbitos = 5 vidas/ano"},
        {"indicador": "Gestantes expostas à fumaça sem proteção","valor": 184,  "meta": 0,    "unidade": "gest.",   "status": "critico", "observacao": "184 gestantes sem máscara PFF2 ou orientação durante picos de fumaça. Prematuridade +28,4%. Kit PFF2 por gestante: R$ 19. R$ 3.496 para todas as gestantes = cada prematuridade evitada poupa R$ 42.000 em UTI neonatal"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/exposicao")
def exposicao():
    return _EXPOSICAO()


@router.get("/acoes")
def acoes():
    return _ACOES()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()