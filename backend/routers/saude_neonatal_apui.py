from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-neonatal-apui", tags=["saude_neonatal_apui"])

_DASHBOARD = {
    "populacao_total": 24700,
    "nascidos_vivos_ano": 580,
    "parto_hospitalar_pct": 84.2,
    "parto_domiciliar_pct": 15.8,
    "parto_domiciliar_ribeirinho_pct": 28.4,
    "cesarea_pct": 48.4,
    "meta_cesarea_pct": 30.0,
    "prematuridade_pct": 12.4,
    "meta_prematuridade_pct": 8.0,
    "baixo_peso_nascer_pct": 8.4,
    "meta_baixo_peso_pct": 5.0,
    "apgar_5min_menor_7_pct": 4.2,
    "ucin_leitos": 0,
    "uti_neonatal_leitos": 0,
    "uti_neonatal_referencia": "Hospital Universitário Getúlio Vargas — Manaus (784 km)",
    "obito_neonatal_precoce_ano": 8,
    "obito_neonatal_tardio_ano": 4,
    "taxa_mortalidade_neonatal_1k": 20.7,
    "meta_mortalidade_neonatal_1k": 5.0,
    "triagem_neonatal_cobertura_pct": 72.4,
    "meta_triagem_pct": 100.0,
    "teste_orelhinha_pct": 48.4,
    "teste_olhinho_pct": 62.4,
    "teste_coracaozinho_pct": 84.2,
    "aleitamento_exclusivo_6m_pct": 42.4,
    "meta_aleitamento_pct": 50.0,
    "pediatra_municipio": 0,
    "neonatalogista_municipio": 0,
    "status_mortalidade": "critico",
    "status_triagem": "atencao",
    "status_estrutura": "critico",
}

_TRIAGEM = [
    {"teste": "Teste do Pezinho (PKU/hipotireoidismo)",  "cobertura_pct": 72.4, "meta_pct": 100.0, "janela_ideal_horas": "48-72h", "status": "atencao",
     "observacao": "27,6% sem triagem. Parto domiciliar: recém-nascido não chega à UBS nas primeiras 72h para coleta. RN em comunidade ribeirinha: mãe chega ao posto 7-14 dias após o parto. Fenilcetonúria não detectada = deficiência intelectual permanente aos 3 meses. Hipotireoidismo congênito: 1 caso estimado/ano em Apuí sem diagnóstico precoce = atraso cognitivo irreversível"},
    {"teste": "Teste da Orelhinha (PEATE/EOA)",          "cobertura_pct": 48.4, "meta_pct": 100.0, "janela_ideal_horas": "24-48h", "status": "critico",
     "observacao": "51,6% sem triagem auditiva. Equipamento de EOA: disponível no HMM mas sem técnico capacitado em plantão 24h. RN com surdez congênita não detectada: aquisição de linguagem comprometida até 6-7 anos (detecção pela escola). Janela de intervenção: 0-6 meses. Aparelho auditivo via SUS: fila de 12-18 meses em Manaus"},
    {"teste": "Teste do Olhinho (reflexo vermelho)",     "cobertura_pct": 62.4, "meta_pct": 100.0, "janela_ideal_horas": "24-72h", "status": "atencao",
     "observacao": "37,6% sem teste. Catarata congênita: tratável se detectada antes dos 3 meses — após isso, ambliopia irreversível. Retinoblastoma: tumor ocular maligno detectável no reflexo vermelho. Médico em plantão: treinamento insuficiente para interpretar reflexo vermelho bilateral. Oftalmologista: zero em Apuí"},
    {"teste": "Teste do Coraçãozinho (oximetria pulso)", "cobertura_pct": 84.2, "meta_pct": 100.0, "janela_ideal_horas": "24-48h", "status": "atencao",
     "observacao": "15,8% sem triagem cardíaca. Cardiopatia congênita crítica: detectável por oximetria (SpO2 < 95% ou diferença > 3% entre membro superior e inferior). RN com cardiopatia não detectada: colapso circulatório em 1-2 semanas pós-alta. Cardiologista pediátrico: TFD para Manaus. Ecocardiograma neonatal: Manaus ou Humaitá"},
    {"teste": "Teste da Linguinha (frênulo lingual)",    "cobertura_pct": 38.4, "meta_pct": 100.0, "janela_ideal_horas": "antes alta", "status": "critico",
     "observacao": "61,6% sem avaliação. Anquiloglossia: interfere na amamentação (dor, ganho de peso inadequado, abandono precoce do aleitamento). Amamentação exclusiva em 6 meses: 42,4% — abandono por dificuldade técnica (não só pela frênulo). Fonoaudiólogo: zero em Apuí. Frenotomia: procedimento simples realizado no berçário — não implementado como rotina"},
]

_PARTOS = [
    {"local": "HMM — Apuí (sede)",           "numero_ano": 488, "cesarea_pct": 52.4, "prematuridade_pct": 11.4, "obito_neonatal": 10, "status": "atencao",
     "observacao": "488 partos hospitalares. Cesariana 52,4%: acima da meta 30%. Falta de protocolo humanizado + médico sem residência em obstetrícia = tendência à resolução cirúrgica. Sem anestesista de plantão 24h: cesariana emergencial depende de chamado. Neonatologista: zero — médico plantonista clínico atende o RN"},
    {"local": "Domicílio — zona urbana",      "numero_ano": 28,  "cesarea_pct": 0,    "prematuridade_pct": 14.2, "obito_neonatal": 1,  "status": "critico",
     "observacao": "Parto domiciliar urbano por opção ou por não chegar ao HMM a tempo. Parteira sem capacitação em 72,4% dos casos urbanos. Kit de parto limpo: não distribuído pelo município. Cordão umbilical: infecção (tétano neonatal: 0 casos graças à vacina antitetânica materna — mas risco permanece sem assepsia)"},
    {"local": "Domicílio — zona ribeirinha",  "numero_ano": 64,  "cesarea_pct": 0,    "prematuridade_pct": 18.4, "obito_neonatal": 1,  "status": "critico",
     "observacao": "64 partos ribeirinhos/ano = 11% do total. Parteira tradicional: capacitada em 28,4% das comunidades. Distância HMM: 4-14h por barco. Parto prematuro ribeirinho: sem incubadora, sem UCIN = hipotermia, hipoglicemia, sepse. Recém-nascido de alto risco em comunidade fluvial = óbito por falta de transporte adequado"},
]

_HISTORICO = [
    {"ano": "2022", "mortalidade_neonatal_1k": 26.4, "prematuridade_pct": 14.8, "triagem_pct": 58.4, "aleitamento_6m_pct": 36.4},
    {"ano": "2023", "mortalidade_neonatal_1k": 24.8, "prematuridade_pct": 13.6, "triagem_pct": 64.2, "aleitamento_6m_pct": 38.4},
    {"ano": "2024", "mortalidade_neonatal_1k": 22.4, "prematuridade_pct": 13.0, "triagem_pct": 68.4, "aleitamento_6m_pct": 40.4},
    {"ano": "2025", "mortalidade_neonatal_1k": 20.7, "prematuridade_pct": 12.4, "triagem_pct": 72.4, "aleitamento_6m_pct": 42.4},
]

_INDICADORES = [
    {"indicador": "Mortalidade neonatal/1k NV",       "valor": 20.7, "meta": 5.0,   "unidade": "/1k NV",  "status": "critico", "observacao": "4x a meta nacional (ODM: < 5/1k). Principais causas: asfixia ao nascer sem reanimação adequada, prematuridade sem UCIN, infecção neonatal sem UTI. Investimento necessário: 4 leitos UCIN no HMM (R$ 480k equipamento + R$ 84k/mês custeio). Impacto: redução estimada de 40% da mortalidade neonatal em 24 meses"},
    {"indicador": "Triagem neonatal — pezinho",       "valor": 72.4, "meta": 100.0, "unidade": "%",       "status": "atencao", "observacao": "27,6% sem triagem. Cada caso de fenilcetonúria não detectado = deficiência intelectual permanente + cuidado vitalício = custo estimado R$ 2,4M. Custo de 1 teste do pezinho: R$ 8. ROI: 300.000:1. Solução: ACS retorna ao domicílio no 3º dia para orientar mãe e coletar a gota de sangue"},
    {"indicador": "Triagem auditiva — orelhinha",     "valor": 48.4, "meta": 100.0, "unidade": "%",       "status": "critico", "observacao": "51,6% sem triagem auditiva. Surdez não detectada = atraso de linguagem, déficit escolar, exclusão social. Custo de 1 aparelho auditivo bilateral: R$ 12.000. Custo de suporte escolar por 15 anos: R$ 84.000. ROI da triagem: o teste custa R$ 18 — identificar 1 caso economiza R$ 96.000"},
    {"indicador": "Aleitamento exclusivo até 6 meses","valor": 42.4, "meta": 50.0,  "unidade": "%",       "status": "atencao", "observacao": "7,6 pontos abaixo da meta. Aleitamento exclusivo = redução de 13% da mortalidade infantil. Principal causa de abandono: dificuldade técnica (pega, dor, produção insuficiente percebida). Consultora de amamentação: zero em Apuí. Banco de leite: inexistente. Teste da linguinha resolveria 30-40% dos casos de dificuldade"},
    {"indicador": "Cesariana",                        "valor": 48.4, "meta": 30.0,  "unidade": "%",       "status": "critico", "observacao": "18,4 pontos acima da meta OMS. Cesariana sem indicação: risco 3x maior de complicações maternas e neonatais vs parto normal. Sem anestesista fixo: cesariana eletiva inadequada + ausência de protocolo de humanização. Cada cesariana desnecessária: R$ 2.400 a mais vs parto normal + maior tempo de internação"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/triagem")
def triagem():
    return _TRIAGEM


@router.get("/partos")
def partos():
    return _PARTOS


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
