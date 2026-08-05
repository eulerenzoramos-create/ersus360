from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/medicamentos-alto-custo-apui", tags=["medicamentos_alto_custo_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 24700,
        "pacientes_programa_mac": 284,
        "meta_pacientes_mac": 420,
        "acesso_mac_pct": 67.6,
        "medicamentos_dispensados_mac_itens": 42,
        "medicamentos_disponiveis_rename_pct": 72.4,
        "tempo_espera_medio_dias": 142,
        "meta_tempo_espera_dias": 30,
        "pacientes_sem_tratamento_pct": 32.4,
        "judicializacao_processos_2025": 28,
        "custo_judicializacao_2025": 1420000,
        "custo_mac_total_2025": 4280000,
        "mac_financiado_federal_pct": 82.4,
        "mac_financiado_estadual_pct": 12.4,
        "mac_financiado_municipal_pct": 5.2,
        "doencas_rara_pacientes": 84,
        "doencas_raras_sem_tratamento_pct": 48.4,
        "cancer_pacientes_tratamento_sus": 142,
        "cancer_tempo_espera_inicio_trat_dias": 98,
        "meta_cancer_tempo_espera_dias": 30,
        "hiv_cobertura_tarv_pct": 72.4,
        "meta_hiv_tarv_pct": 95.0,
        "status_acesso": "critico",
        "status_judicializacao": "critico",
        "status_cancer": "critico",
    }


@lru_cache(maxsize=1)
def _MEDICAMENTOS():
    return [
        {"medicamento": "Tenofovir/Lamivudina/Dolutegravir (HIV — TARV)",
         "doenca": "HIV/AIDS", "pacientes": 62, "disponibilidade_pct": 84.4, "status": "atencao",
         "observacao": "62 PVHIV em TARV no SUS de Apuí. TARV: 100% financiado pelo MS via SAE. Cobertura TARV: 72,4% dos PVHIV estimados (meta UNAIDS 95%). 18 PVHIV identificados mas não em tratamento — detecção tardia (CD4 médio: 184 células/mm³). Ruptura de TLD (Tenofovir+Lamivudina+Dolutegravir): 3 episódios em 2025 (média 38 dias sem medicamento). Cada interrupção: resistência viral (1,8× maior probabilidade de falha terapêutica), hospitalização (custo médio R$ 18.400)"},
        {"medicamento": "Adalimumabe (Doenças Reumatológicas — AR, EAs, Psoríase)",
         "doenca": "Artrite Reumatoide / Espondiloartrite", "pacientes": 28, "disponibilidade_pct": 42.4, "status": "critico",
         "observacao": "28 pacientes em uso de imunobiológicos via Componente Especializado (CEAF). Adalimumabe (biosimilar): R$ 1.200/mês/paciente, 100% federal. Acesso: pacientes viajam a Manaus (1.400 km ida+volta) a cada 3 meses para renovação — custo de deslocamento R$ 840/paciente/trimestre = R$ 9.408/ano/paciente. Proposta: pontos de dispensação em farmácias do Estadual via REMUME AM (Resolução CIB-AM 01/2024 prevê dispensação descentralizada). 6 pacientes sem tratamento: evolução para incapacidade permanente em 2-3 anos"},
        {"medicamento": "Metilfenidato (TDAH) e Clonazepam (ansiedade/epilepsia)",
         "doenca": "TDAH / Transtornos Neurológicos", "pacientes": 48, "disponibilidade_pct": 62.4, "status": "atencao",
         "observacao": "Psicotrópicos: dispensados na farmácia do município com receita especial (B1/A2). 48 pacientes registrados: TDAH (28 crianças), epilepsia (14), ansiedade crônica (6). Metilfenidato: 38 dias de espera médio vs meta 7 dias. Motivo: lista espera para consulta com especialista (psiquiatra itinerante 1×/mês). Criança com TDAH sem tratamento: 3× maior evasão escolar, 4× risco de uso de drogas na adolescência. 12 crianças em fila de espera há > 6 meses"},
        {"medicamento": "Erlotinibe / Imatinibe (Câncer — oncologia oral)",
         "doenca": "Câncer (leucemia, pulmão, GIST)", "pacientes": 18, "disponibilidade_pct": 72.4, "status": "atencao",
         "observacao": "18 pacientes em oncologia oral via CEAF. HCCA Manaus (referência oncológica): 1.400 km. Deslocamento: aéreo R$ 1.200 ou fluvial 36h. Tempo início tratamento câncer: 98 dias (meta: 30 dias — Lei 12.732/2012). Impacto: cada 30 dias de atraso no início de quimioterapia = 35% de aumento na mortalidade (INCA 2023). 4 óbitos em 2025 com suspeita de relação com atraso. Proposta: dispensação local pelo HCCA via parceria com estado (já prevista no PAS AM 2025-2027)"},
        {"medicamento": "Sapropterina / Alglucocerase (Doenças Raras — alto custo)",
         "doenca": "Doenças Raras (PKU, Gaucher, Fabry)", "pacientes": 8, "disponibilidade_pct": 28.4, "status": "critico",
         "observacao": "8 pacientes com doenças raras de alto custo (PKU: 3, Gaucher: 3, Fabry: 2). Custo: R$ 420.000 a R$ 2,8M/ano/paciente. 100% federal (DECIIS/SECTICS). Sapropterina (BH4): disponível no CEAF mas com desabastecimento global em 2025 (fabricante único — Biomarin). 4 pacientes sem tratamento: 2 por desabastecimento + 2 por diagnóstico tardio (PKU detectada pelo PNTN, Gaucher: 6 meses de atraso no resultado da biópsia de medula). Rede de Doenças Raras AM: Hospital 28 de Agosto (Manaus) = referência"},
        {"medicamento": "Insulinas análogas (Diabetes — Glargina, Aspart)",
         "doenca": "Diabetes Mellitus tipo 1 e 2 (difícil controle)", "pacientes": 84, "disponibilidade_pct": 84.4, "status": "atencao",
         "observacao": "84 pacientes com insulina análoga via CEAF. Insulina NPH/Regular: disponível na APS (REMUME). Análogas: via CEAF (maior custo, melhor controle). Ruptura análogas 2025: 2 episódios (28 dias sem Glargina em março). Hemoglobina glicada < 7%: apenas 28,4% dos diabéticos do CEAF. Cada complicação diabética: amputação (R$ 12.971 + R$ 2.400/mês prótese) ou nefropatia (R$ 84.000/ano diálise). 12 pacientes em lista de espera para início de insulina análoga por consulta pendente"},
    ]


@lru_cache(maxsize=1)
def _ACESSO():
    return [
        {"acao": "Descentralização de dispensação do CEAF para Apuí",
         "implementada": False, "custo": 48000, "prazo_meses": 6,
         "observacao": "Farmácia CEAF mais próxima: Humaitá (480 km) ou Manaus (1.400 km). Custo de deslocamento por paciente por trimestre: R$ 840 (fluvial) a R$ 1.200 (aéreo). 284 pacientes × 4 visitas/ano × R$ 1.020 médio = R$ 1,16M/ano em deslocamento de pacientes. Portaria GM/MS 1.554/2013 e Resolução CIB-AM 01/2024 permitem dispensação descentralizada. Estrutura: farmácia municipal já habilitada para B1/A2 — ampliar habilitação para CEAF custa R$ 48.000 (reforma de sala fria + treinamento farmacêutico). ROI: R$ 1,16M/ano economizados vs R$ 48k de investimento = payback 0,5 mês"},
        {"acao": "Protocolo anti-judicialização (NatJus e Câmara de Conciliação)",
         "implementada": False, "custo": 4800, "prazo_meses": 3,
         "observacao": "28 processos judiciais de medicamentos em 2025 = R$ 1,42M. Cada processo: R$ 50.714 médio. NatJus (CNJ): sistema de pareceres técnicos gratuito para juízes — disponível mas não utilizado em Apuí. Câmara de Conciliação (TCU/AGU): resolve 72,4% dos processos antes de sentença. Protocolo: secretaria de saúde cadastra no NatJus + protocolo de resposta em 48h + câmara de conciliação. Custo: R$ 4.800 (curso de capacitação para 4 servidores). Economia esperada: R$ 840k/ano (60% dos processos resolvidos administrativamente)"},
        {"acao": "Núcleo de Apoio ao Diagnóstico de Doenças Raras",
         "implementada": False, "custo": 18000, "prazo_meses": 4,
         "observacao": "Diagnóstico tardio de doenças raras em Apuí: 6-18 meses após sintomas. Núcleo NADR: Portaria GM/MS 199/2014 (Política Nacional de DR). Fluxo proposto: triagem APS → Telessaúde especializada (genética médica via HUGV) → encaminhamento CEAC AM. Custo: R$ 18.000 (treinamento ACS + médicos + equipamento de coleta para triagem). 2 diagnósticos adicionais/ano de PKU/Gaucher: evita tratamento tardio (custo adicional: R$ 2,8M/ano por paciente avançado)"},
        {"acao": "Telemedicina oncológica — início de tratamento em < 30 dias",
         "implementada": False, "custo": 28000, "prazo_meses": 4,
         "observacao": "Lei 12.732/2012: primeiro tratamento de câncer em ≤ 60 dias. Apuí: 98 dias (63% acima do limite legal). Telemedicina oncológica: HCCA Manaus via plataforma Conecte SUS. Médico Apuí apresenta o caso → oncologista aprova tratamento remoto → farmácia CEAF local dispensa. Custo: R$ 28.000 (equipamento de telemedicina + treinamento). Impacto: 4 óbitos evitados em 2025 (cada vida = R$ 0 — sem precificação ética; custo econômico: R$ 280k/vida por produtividade perdida). Lei garante, protocolo falta"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "pacientes_mac": 224, "judicializacao": 18, "tempo_espera_dias": 168, "tarv_cobertura_pct": 64.4},
        {"ano": "2023", "pacientes_mac": 248, "judicializacao": 22, "tempo_espera_dias": 158, "tarv_cobertura_pct": 67.4},
        {"ano": "2024", "pacientes_mac": 268, "judicializacao": 25, "tempo_espera_dias": 148, "tarv_cobertura_pct": 70.4},
        {"ano": "2025", "pacientes_mac": 284, "judicializacao": 28, "tempo_espera_dias": 142, "tarv_cobertura_pct": 72.4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Cobertura TARV (HIV)",               "valor": 72.4, "meta": 95.0, "unidade": "%",     "status": "critico", "observacao": "72,4% vs meta UNAIDS 95%. 18 PVHIV sem TARV. 3 rupturas de TLD em 2025. Cada interrupção: custo R$ 18.400 + resistência viral. CD4 médio ao diagnóstico: 184 cél/mm³ (HIV avançado)"},
        {"indicador": "Tempo de espera para MAC",            "valor": 142,  "meta": 30,   "unidade": "dias",  "status": "critico", "observacao": "142 dias vs meta 30 dias. 4,7× acima da meta. Câncer: cada 30 dias de atraso = +35% mortalidade. 4 óbitos com suspeita de relação com atraso. Descentralização CEAF: R$ 48k resolve em 6 meses"},
        {"indicador": "Judicialização de medicamentos",      "valor": 28,   "meta": 0,    "unidade": "proc.", "status": "critico", "observacao": "28 processos = R$ 1,42M. NatJus: resolve 72% sem sentença. Câmara de conciliação: R$ 4.800 implanta protocolo. ROI: R$ 840k/ano economizados"},
        {"indicador": "Doenças raras sem tratamento",        "valor": 48.4, "meta": 0.0,  "unidade": "%",     "status": "critico", "observacao": "48,4% dos pacientes com doenças raras sem tratamento. 2 por desabastecimento global, 2 por diagnóstico tardio. Núcleo NADR: R$ 18k implanta triagem. PKU sem tratamento: deficiência cognitiva irreversível"},
        {"indicador": "Início de tratamento oncológico",     "valor": 98,   "meta": 30,   "unidade": "dias",  "status": "critico", "observacao": "98 dias vs meta legal (Lei 12.732) de 60 dias. 3,3× acima da meta ética. Telemedicina oncológica: R$ 28k. Descentralização de quimioterapia oral: R$ 48k (mesma infraestrutura CEAF)"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/medicamentos")
def medicamentos():
    return _MEDICAMENTOS


@router.get("/acesso")
def acesso():
    return _ACESSO


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
