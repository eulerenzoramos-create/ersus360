from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/doencas-raras-apui", tags=["doencas_raras_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "populacao_total": 18732,  # IBGE Censo 2022,
        "doencas_raras_estimados": 1482,
        "doencas_raras_estimados_pct": 6.0,
        "doencas_raras_cadastrados": 148,
        "doencas_raras_cadastrados_pct": 10.0,
        "diagnostico_confirmado_pct": 42.4,
        "tempo_medio_diagnostico_anos": 7.2,
        "meta_tempo_diagnostico_anos": 2.0,
        "medicamento_orfao_disponivel_municipio_pct": 18.4,
        "medicamento_orfao_via_ceaf_pct": 48.4,
        "medicamento_orfao_via_judicial_pct": 28.4,
        "processos_judiciais_ativos": 38,
        "custo_medio_judicial_mes": 8400,
        "geneticista_municipio": 0,
        "geneticista_referencia": "Hospital Universitário Getúlio Vargas — Manaus (784 km)",
        "teste_triagem_expandida_disponivel": False,
        "triagem_neonatal_fase1_pct": 72.4,
        "doenca_lisossomial_casos": 12,
        "hemofilia_casos": 8,
        "mucoviscidose_casos": 4,
        "sickle_cell_casos": 28,
        "doencas_neurologicas_raras_casos": 48,
        "associacao_pacientes_apui": False,
        "status_diagnostico": "critico",
        "status_tratamento": "critico",
        "status_acesso": "critico",
    }


@lru_cache(maxsize=1)
def _DOENCAS():
    return [
        {"doenca": "Doença Falciforme (Anemia Falciforme)", "casos_confirmados": 28, "casos_suspeitos": 12, "tratamento_pct": 72.4, "status": "atencao",
         "observacao": "28 casos confirmados — prevalência amazônica elevada (raízes africanas + miscigenação). Triagem neonatal (teste do pezinho): detecta DF na fase 1 — cobertura 72,4% em Apuí. Hidroxiureia: disponível na REMUME mas com desabastecimento médio 28 dias/ano. Transfusão em crise: HMM sem banco de sangue próprio (hemocomponentes via HEMOAM Manaus). Crise álgica grave: morphina disponível no HMM. Pneumococo 23-valente: vacinação em 84,2% dos pacientes com DF. Esplenectomia: TFD Manaus"},
        {"doenca": "Hemofilia A e B",                       "casos_confirmados": 8,  "casos_suspeitos": 4,  "tratamento_pct": 84.2, "status": "atencao",
         "observacao": "8 casos confirmados (6 hemofilia A, 2 hemofilia B). Fator VIII e IX: disponíveis via CEAF pela Secretaria Estadual — entrega mensal em Manaus (paciente retira presencialmente ou via Correios com atraso de 7-14 dias). Hemartroses: 48,4% dos pacientes com sequela articular por tratamento tardio. Centro de Tratamento de Hemofilia (CTH): Manaus (784 km). Infusão de fator em casa (profilaxia domiciliar): realizada em 62,4% dos casos — sem treinamento formal em Apuí"},
        {"doenca": "Mucoviscidose (Fibrose Cística)",        "casos_confirmados": 4,  "casos_suspeitos": 2,  "tratamento_pct": 72.4, "status": "critico",
         "observacao": "4 casos confirmados — triagem neonatal no pezinho fase 1 detecta: cobertura 72,4% = 1-2 casos não detectados/ano. Enzima pancreática (creon): disponível via CEAF. Fisioterapia respiratória: indisponível em Apuí (zero fisioterapeuta respiratório). DNase inalatória: CEAF com espera de 60-90 dias para 1ª liberação. Ivacaftor/tezacaftor: terapia moduladora de CFTR — via judicial em 100% dos casos de Apuí. Expectativa de vida sem tratamento adequado: reduzida em 20 anos"},
        {"doenca": "Doenças Lisossomais (Gaucher, Fabry, Pompe)", "casos_confirmados": 12, "casos_suspeitos": 8, "tratamento_pct": 42.4, "status": "critico",
         "observacao": "Diagnóstico: dosagem enzimática específica (Gaucher: beta-glicocerebrosidase) — não disponível em Apuí ou Humaitá. Laboratório em Manaus: espera de 30-60 dias. TRS (Terapia de Reposição Enzimática): imiglicerase, agalsidase, alglucosidase — disponíveis via CEAF/JUDICIAL. Custo anual de TRS: R$ 480.000 a R$ 2,4M por paciente. Diagnóstico tardio: dano orgânico irreversível (Gaucher = esplenomegalia gigante + osteonecrose; Fabry = insuficiência renal + AVC jovem)"},
        {"doenca": "Doenças Neurológicas Raras (esclerose múltipla, SLA, DMD)", "casos_confirmados": 48, "casos_suspeitos": 24, "tratamento_pct": 38.4, "status": "critico",
         "observacao": "48 casos: 22 esclerose múltipla, 8 SLA, 12 distrofia muscular de Duchenne (DMD), 6 outras. Neurologista: zero em Apuí. RM cerebral: disponível em Manaus (TFD, espera 90-120 dias). Tratamento de EM: interferon beta/glatiramer — via CEAF com 90-120 dias para 1ª liberação. SLA: riluzol disponível via CEAF. Nusinersena (SMA): implantação intratecal em Manaus. DMD com atalureno: via judicial. Fisioterapia: 0 fisioterapeuta em Apuí — paciente com DMD sem reabilitação motora"},
        {"doenca": "Erros Inatos do Metabolismo (PKU, galactosemia, MSUD)", "casos_confirmados": 8, "casos_suspeitos": 4, "tratamento_pct": 62.4, "status": "critico",
         "observacao": "PKU: detectável no pezinho fase 1 (72,4% de cobertura). Fórmula de aminoácidos para PKU: via CEAF — fornecimento irregular, falta em 42 dias/ano. Galactosemia: dieta sem lactose + sem galactose — fórmula especial disponível via CEAF com atraso. MSUD (xarope do bordo): fórmula de aminoácidos ramificados — espera 60-90 dias para 1ª liberação. Criança com PKU sem fórmula por 7 dias: dano neurológico irreversível. Nutricionista especializada em EIM: zero em Apuí"},
    ]


@lru_cache(maxsize=1)
def _JUDICIALIZACAO():
    return [
        {"tipo": "Medicamentos órfãos via judicial",         "processos": 22, "custo_mes_total": 184800, "tempo_medio_liberacao_dias": 28, "status": "critico",
         "observacao": "22 processos ativos para medicamentos de alto custo não disponíveis via CEAF. Medicamentos mais judicializados: atalureno (DMD), ivacaftor (fibrose cística), alglucosidase (Pompe). Custo médio por ação judicial: R$ 12.000 (honorários + custas). Liminar em 48h: 84,2% concedidas. Descumprimento de liminar: sequestro de verbas do município em 28,4% dos casos. Farmácia especializada em Apuí: não existe — paciente compra em Manaus e reembolsa"},
        {"tipo": "Internação para diagnóstico em Manaus",    "processos": 8,  "custo_mes_total": 28000,  "tempo_medio_liberacao_dias": 14, "status": "atencao",
         "observacao": "8 processos para custeio de internação diagnóstica em Manaus. TFD cobre transporte + diária + alimentação, mas não cobre internação de acompanhante. Criança com doença rara sem diagnóstico: família fica 15-30 dias em Manaus com custo de R$ 3.500-5.000 não coberto. Laudos de geneticista: exigência documental do CEAF — sem geneticista em Apuí, laudo custa R$ 2.800 em Manaus"},
        {"tipo": "Fisioterapia / reabilitação especializada","processos": 8,  "custo_mes_total": 22400,  "tempo_medio_liberacao_dias": 21, "status": "critico",
         "observacao": "8 processos para fisioterapia especializada (DMD, SLA, Pompe). Fisioterapia em Apuí: inexistente. Clínica de reabilitação mais próxima: Humaitá (284 km). Paciente com DMD em cadeira de rodas: viagem de 284 km para 3 sessões/semana = inviável. Fisioterapia domiciliar via judicial: liberada em 62,4% dos casos. Custo de fisioterapeuta domiciliar: R$ 2.800/mês vs custo de progressão da doença sem fisio: hospitalização recorrente R$ 18.000/ano"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "cadastrados": 98,  "judiciais_ativos": 22, "tratamento_pct": 28.4, "tempo_diag_anos": 9.2},
        {"ano": "2023", "cadastrados": 118, "judiciais_ativos": 28, "tratamento_pct": 32.4, "tempo_diag_anos": 8.4},
        {"ano": "2024", "cadastrados": 134, "judiciais_ativos": 34, "tratamento_pct": 38.4, "tempo_diag_anos": 7.8},
        {"ano": "2025", "cadastrados": 148, "judiciais_ativos": 38, "tratamento_pct": 42.4, "tempo_diag_anos": 7.2},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Tempo médio até diagnóstico",         "valor": 7.2,  "meta": 2.0,   "unidade": "anos",  "status": "critico", "observacao": "3,6x acima da meta. Odisseia diagnóstica: paciente com doença rara consulta média de 8,4 especialistas antes do diagnóstico. Sem geneticista em Apuí: toda suspeita = TFD para Manaus (784 km, espera 4-6 meses). Triagem neonatal expandida (72 doenças): poderia reduzir tempo diagnóstico de 7,2 para 0 anos nas doenças triáveis"},
        {"indicador": "Cadastrados no sistema municipal",    "valor": 148,  "meta": 1482,  "unidade": "pac.",  "status": "critico", "observacao": "Apenas 10% dos estimados cadastrados. Doença rara sem cadastro = sem acesso a CEAF, sem referência, sem protocolo. Registro estadual (RAAAS): Apuí com cobertura 10% vs média AM 28,4%. Cadastro único para doenças raras: proposta apresentada ao CONASS — não implementada"},
        {"indicador": "Medicamento órfão disponível local",  "valor": 18.4, "meta": 60.0,  "unidade": "%",     "status": "critico", "observacao": "81,6% dos medicamentos de alto custo para doenças raras não disponíveis em Apuí. CEAF: cobre 48,4% — mas exige laudo de especialista (zero em Apuí). Judicial: via mais rápida mas mais cara. Cada ação judicial custa R$ 12.000 ao município. Farmácia especializada regional em Humaitá: solução de custo compartilhado entre municípios do Alto Purus/Madeira"},
        {"indicador": "Processos judiciais ativos",          "valor": 38,   "meta": 0,     "unidade": "proc.", "status": "critico", "observacao": "Crescendo 10/ano (22 → 38 em 4 anos). Custo mensal total: R$ 235.200 em judicializações. Sem regulação: tende a dobrar em 3 anos. Custo para o município: honorários + sequestro de verbas + gestão de estoque irregular. Solução estrutural: protocolo de diagnóstico + acesso via CEAF organizado = reduz judicial em 60%"},
        {"indicador": "Triagem neonatal fase 1 (pezinho)",  "valor": 72.4, "meta": 100.0, "unidade": "%",     "status": "atencao", "observacao": "27,6% das crianças sem triagem. Fase 1 detecta: hipotireoidismo, PKU, DF, fibrose cística, hiperplasia adrenal. Cada caso não detectado = evolução grave até diagnóstico tardio (7,2 anos). ACS com visita domiciliar no 3º dia: solução operacional de R$ 0 para zerar a cobertura da triagem"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/doencas")
def doencas():
    return _DOENCAS()


@router.get("/judicializacao")
def judicializacao():
    return _JUDICIALIZACAO()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()