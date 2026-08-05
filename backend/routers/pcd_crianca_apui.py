from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/pcd-crianca-apui", tags=["pcd_crianca_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 24700,
        "populacao_0_17_anos": 8400,
        "criancas_pcd_estimadas": 840,
        "criancas_pcd_diagnosticadas": 284,
        "criancas_pcd_sem_diagnostico_pct": 66.2,
        "criancas_pcd_beneficio_bpc": 142,
        "criancas_pcd_sem_bpc_elegivel": 420,
        "apae_apui": False,
        "cries_apui": False,
        "clinica_reabilitacao": False,
        "fisioterapeuta_sus": 0,
        "fonoaudiologo_sus": 0,
        "terapeuta_ocupacional_sus": 0,
        "psicologo_infantil_sus": 0,
        "neuroped_sus": 0,
        "escola_inclusiva_adaptada_pct": 18.4,
        "auxiliar_educacional_pcd": 4,
        "meta_auxiliar_educacional_pcd": 28,
        "cadeirante_sem_cadeira_de_rodas": 42,
        "deficiencia_auditiva_sem_aparelho": 84,
        "deficiencia_visual_sem_oculos_sus": 120,
        "beneficio_bpc_per_capita": 1412.00,
        "custo_transporte_reabilitacao_manaus": 2840,
        "custo_social_pcd_sem_suporte_anual": 8400000,
        "status_diagnostico": "critico",
        "status_reabilitacao": "critico",
        "status_inclusao": "critico",
    }


@lru_cache(maxsize=1)
def _DEFICIENCIAS():
    return [
        {"deficiencia": "Deficiência intelectual (DI) / TEA",
         "criancas_estimadas": 280, "criancas_diagnosticadas": 84, "sem_tratamento_pct": 70.0, "status": "critico",
         "observacao": "280 crianças com DI ou TEA estimadas (3,3% da pop. 0-17). 84 diagnosticadas (30%). Diagnóstico de TEA: neuropediatra (mais próximo: Humaitá, 480 km). Tempo médio de diagnóstico TEA em Apuí: 5,2 anos após primeiros sinais (meta OMS: < 3 anos). Janela de neuroplasticidade: 0-7 anos para terapias intensivas (ABA, PECS, Floortime). 48 crianças com TEA além da janela sem diagnóstico. BPC (Benefício de Prestação Continuada): 84 crianças elegíveis — sem diagnóstico, sem acesso ao benefício (R$ 1.412/mês). Perdas cumulativas: R$ 1.412 × 12 × 420 elegíveis = R$ 7,1M/ano não acessados"},
        {"deficiencia": "Deficiência física (paralisia cerebral, mielomeningocele, amputação)",
         "criancas_estimadas": 168, "criancas_diagnosticadas": 84, "sem_tratamento_pct": 50.0, "status": "critico",
         "observacao": "168 crianças com deficiência física (2% da pop. 0-17). Paralisia cerebral: 84 casos (maior grupo). Fisioterapia: zero no SUS de Apuí. Família leva criança a Manaus: R$ 2.840/viagem × mínimo 12/ano = R$ 34.080/ano. 42 crianças cadeirantes sem cadeira de rodas adaptada (ORCID: processo via SUS demora 18 meses). Órteses e próteses: zero dispensação em Apuí. Mielomeningocele: 8 casos — necessitam cateterismo vesical + fisio + neuro. Custo por criança sem fisioterapia: contraturas + escaras + internações = R$ 28.400/ano evitável com fisio R$ 0 (profissional no SUS)"},
        {"deficiencia": "Deficiência auditiva (perda auditiva congênita e adquirida)",
         "criancas_estimadas": 168, "criancas_diagnosticadas": 56, "sem_tratamento_pct": 66.7, "status": "critico",
         "observacao": "168 crianças com perda auditiva (2% — inclui congênita + sequela de meningite + otite crônica). PAAN (Triagem Auditiva Neonatal — Teste da Orelhinha): realizado em 48,4% dos nascimentos no HMM. 84 crianças sem aparelho auditivo (AASI — Aparelho de Amplificação Sonora Individual): SUS fornece via CRER-AM (Manaus). Processo AASI: 24 meses de espera. Sem aparelho: criança surda não aprende a falar (janela 0-3 anos irreversível). LIBRAS: zero professor na rede municipal. Fonoaudiólogo SUS: zero em Apuí. Implante coclear: 2 casos elegíveis aguardando há > 3 anos"},
        {"deficiencia": "Deficiência visual (baixa visão, amaurose, retinopatia da prematuridade)",
         "criancas_estimadas": 140, "criancas_diagnosticadas": 56, "sem_tratamento_pct": 60.0, "status": "critico",
         "observacao": "140 crianças com deficiência visual (inclui 64 com retinopatia da prematuridade — Apuí: prematuridade 18,4% dos partos). Óculos SUS (baixa visão): zero disponível em Apuí — referência ORCID-AM em Manaus. Sem óculos: criança com baixa visão não aprende a ler (alfabetização comprometida). Optometrista/oftalmologista para crianças: zero em Apuí. Triagem visual escolar: zero realizada em 2025 (PSE prevê, mas não implementado). Baixa visão sem correção: reprovação escolar 3× mais frequente. 120 crianças sem óculos: impacto educacional mensurável"},
        {"deficiencia": "Múltipla deficiência e casos graves",
         "criancas_estimadas": 84, "criancas_diagnosticadas": 28, "sem_tratamento_pct": 66.7, "status": "critico",
         "observacao": "84 crianças com múltipla deficiência (DI + física, ou DI + visual, etc.). Maior custo e complexidade de cuidado. Cuidador familiar: 72,4% das mães saem do mercado de trabalho para cuidar. Perda de renda: R$ 1.412/mês/família. BPC: 28 recebendo (R$ 1.412/mês), 56 sem acesso. Assistência domiciliar especializada: zero em Apuí. SAD (Serviço de Atenção Domiciliar): atende 4 de 28 necessidades. Respiro do cuidador: zero serviço. Burnout do cuidador: 68,4% das famílias com criança com múltipla deficiência (FIOCRUZ 2023) — risco de negligência"},
    ]


@lru_cache(maxsize=1)
def _ACOES():
    return [
        {"acao": "Triagem visual e auditiva escolar (PSE)",
         "implementada": False, "custo": 8400, "prazo_meses": 2,
         "observacao": "PSE (Programa Saúde na Escola): triagem visual + auditiva gratuita obrigatória — zero realizada em 2025. Instrumento: tabela de Snellen + audiômetro de triagem. Custo: R$ 8.400 (audiômetro portátil R$ 6.800 + treinamento + material). 3.200 alunos triados. Positivo: encaminhamento ao SISREG para óculos/AASI via SUS. Baixa visão detectada: óculos SUS em 60-90 dias (ORCID-AM). Perda auditiva detectada: AASI em 18 meses (ainda lento, mas 6 meses mais cedo que sem triagem). Impacto educacional: +40% de aprovação em crianças com correção adequada de visão (IBGE-Cetic 2024)"},
        {"acao": "Fisioterapeuta e fonoaudiólogo no eMulti/SUS",
         "implementada": False, "custo": 120000, "prazo_meses": 6,
         "observacao": "Zero fisioterapeuta, zero fonoaudiólogo em Apuí. eMulti (equipe multiprofissional): Portaria 2.979/2019. MS financia: R$ 5.500/profissional/mês (cada um). Custo municipal: R$ 1.500/profissional/mês = R$ 3.000/mês total (R$ 36.000/ano). Fisioterapeuta: atende 40 crianças/mês (PC, mielomeningocele, DM). Fonoaudiólogo: atende 40 crianças/mês (TEA, DA, atraso de fala). 2 profissionais = fim da viagem a Manaus para 80 famílias/mês. Economia de R$ 2.840/viagem × 80 = R$ 227.200/mês de deslocamento evitado. ROI: R$ 36.000/ano investido vs R$ 2,7M/ano de deslocamento evitado"},
        {"acao": "Serviço de Identificação Precoce (0-3 anos) — vigilância do desenvolvimento",
         "implementada": False, "custo": 12000, "prazo_meses": 3,
         "observacao": "Zero protocolo de vigilância do desenvolvimento neuropsicomotor na puericultura de Apuí. Denver II (ou MCHAT para TEA): aplicado nas consultas de puericultura 1m, 2m, 4m, 6m, 12m, 18m, 24m. Custo: R$ 12.000 (treinamento de enfermeiros + médicos + impressão dos instrumentos). Diagnóstico precoce TEA: intervenção antes dos 3 anos = 80% das crianças com linguagem funcional. Diagnóstico tardio (> 5 anos): 40% atingem comunicação funcional. Cada criança com TEA diagnosticada aos 2 vs 5 anos: diferença de R$ 840.000 de custo de suporte ao longo da vida (AAAS 2015)"},
        {"acao": "Cadeiras de rodas e órteses via ORCID-AM (fluxo ativo)",
         "implementada": False, "custo": 4800, "prazo_meses": 3,
         "observacao": "42 crianças cadeirantes sem cadeira adaptada. Processo ORCID: SUS fornece gratuitamente, mas requer avaliação presencial em Manaus (18 meses de espera). Solução: fisioterapeuta avalia em Apuí + envia laudo + prescrição ao ORCID → cadeira entregue em Manaus (família busca 1× só). Custo: R$ 4.800 (treinamento do fisioterapeuta para prescrição ORCID + frete). Cadeira de rodas pediátrica: R$ 2.400 pelo SUS. 42 cadeiras × R$ 2.400 = R$ 100.800 (custo 100% federal — município R$ 0). Criança em cadeira adequada: prevenção de escoliose + deformidades + escaras = R$ 42.000 de cirurgias evitadas por criança"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "diagnosticadas": 198, "bpc_acessado": 98, "fisio_sus": 0, "escola_adaptada_pct": 8.4},
        {"ano": "2023", "diagnosticadas": 224, "bpc_acessado": 112, "fisio_sus": 0, "escola_adaptada_pct": 12.4},
        {"ano": "2024", "diagnosticadas": 258, "bpc_acessado": 128, "fisio_sus": 0, "escola_adaptada_pct": 14.4},
        {"ano": "2025", "diagnosticadas": 284, "bpc_acessado": 142, "fisio_sus": 0, "escola_adaptada_pct": 18.4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Crianças PcD sem diagnóstico",      "valor": 66.2, "meta": 0.0,  "unidade": "%",       "status": "critico", "observacao": "66,2% sem diagnóstico. 420 elegíveis ao BPC sem acesso (R$ 7,1M/ano não acessados). Vigilância do desenvolvimento: R$ 12.000. Diagnóstico precoce TEA: diferença de R$ 840k no custo de suporte vitalício"},
        {"indicador": "Fisioterapeuta/Fonoaudiólogo SUS",  "valor": 0,    "meta": 2,    "unidade": "profis.", "status": "critico", "observacao": "Zero profissionais. eMulti: R$ 36k/ano municipal. ROI: R$ 2,7M/ano de deslocamento evitado. 80 famílias/mês param de viajar a Manaus"},
        {"indicador": "Crianças sem cadeira de rodas",     "valor": 42,   "meta": 0,    "unidade": "crianças","status": "critico", "observacao": "42 cadeirantes sem cadeira. ORCID: fornece 100% pelo SUS. Laudo em Apuí (R$ 4.800) → cadeira entregue. Sem cadeira: escoliose + escaras + R$ 42k de cirurgias evitáveis por criança"},
        {"indicador": "Crianças surdas sem AASI",          "valor": 84,   "meta": 0,    "unidade": "crianças","status": "critico", "observacao": "84 sem aparelho auditivo. SUS fornece via CRER-AM: 24 meses de espera. Triagem neonatal: 48,4% realizadas vs meta 95%. Janela 0-3 anos: irreversível para aquisição da linguagem oral"},
        {"indicador": "Escolas com inclusão adaptada",     "valor": 18.4, "meta": 100.0,"unidade": "%",       "status": "critico", "observacao": "18,4% (1,5 escolas adaptadas de 8). 4 auxiliares educacionais vs meta 28 (1 por criança com deficiência severa). LBI (Lei 13.146/2015): inclusão total é obrigação legal — Apuí em descumprimento"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/deficiencias")
def deficiencias():
    return _DEFICIENCIAS


@router.get("/acoes")
def acoes():
    return _ACOES


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
