from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-auditiva-apui", tags=["saude_auditiva_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "populacao_total": 18732,  # IBGE Censo 2022,
        "otorrinolaringologista_municipio": 0,
        "otorrinolaringologista_referencia": "Humaitá (284 km) ou Manaus (784 km)",
        "fila_consulta_otorrinolaringologia_dias": 120,
        "perda_auditiva_estimada_pct": 12.4,
        "perda_auditiva_estimados": 3063,
        "perda_auditiva_diagnosticados_pct": 28.4,
        "perda_auditiva_congenita_estimados": 18,
        "perda_auditiva_congenita_diagnosticados_pct": 48.4,
        "aparelho_auditivo_fila_meses": 14,
        "aparelho_auditivo_usuarios": 84,
        "aparelho_auditivo_necessitam_estimados": 742,
        "audiometria_disponivel": False,
        "audiometria_referencia": "Humaitá (284 km)",
        "eoa_triagem_neonatal_pct": 48.4,
        "otite_media_cronca_prevalencia_pct": 8.4,
        "otite_media_comunidades_indigenas_pct": 22.4,
        "otite_media_cirurgia_timpanotomia_disponivel": False,
        "perda_induzida_ruido_garimpo_pct": 38.4,
        "perda_induzida_ruido_diagnosticados_pct": 12.4,
        "implante_coclear_casos_indicados": 4,
        "implante_coclear_referencia": "Hospital Universitário de São Paulo ou HUGV Manaus",
        "status_diagnostico": "critico",
        "status_reabilitacao": "critico",
        "status_prevencao": "critico",
    }


@lru_cache(maxsize=1)
def _CONDICOES():
    return [
        {"condicao": "Perda auditiva congênita",             "estimados": 18,  "diagnosticados": 9,  "reabilitados_pct": 44.4, "status": "critico",
         "observacao": "Triagem neonatal (EOA): 48,4% de cobertura — 9 casos/ano não detectados. Janela de intervenção: 0-6 meses. Criança com surdez congênita sem AASI antes dos 6 meses: aquisição de linguagem 84% comprometida. Aparelho auditivo via SUS: fila de 14 meses — criança com 1 ano de idade recebe AASI com 2 anos e 2 meses. Implante coclear: indicado em 4 casos — fila de 3-5 anos no HCFMUSP ou HUGV Manaus. Custo social da surdez não tratada: R$ 2,8M por criança"},
        {"condicao": "Otite média crônica (OMC)",             "estimados": 2075, "diagnosticados": 494, "reabilitados_pct": 28.4, "status": "critico",
         "observacao": "8,4% de prevalência geral, 22,4% em comunidades indígenas. Otite média crônica supurativa: perfuração timpânica persistente + secreção. Timpanotomia/timpanoplastia: não disponível em Apuí. Antibiótico tópico (ciprofloxacino otológico): frequentemente em falta na REMUME (desabastecimento médio 38 dias/ano). OMC em crianças: perda auditiva condutiva de 20-40 dB = dificuldade de aprendizado. Colesteatoma: complicação grave — mastoidite, meningite, abscesso cerebral (referência urgente para Manaus)"},
        {"condicao": "Perda auditiva induzida por ruído (PAIR)", "estimados": 494, "diagnosticados": 59,  "reabilitados_pct": 18.4, "status": "critico",
         "observacao": "38,4% dos trabalhadores de garimpo com PAIR (exposição a > 85 dB por 8h/dia sem EPI). PAIR: perda sensorineural irreversível nas frequências de 3k-4k-6k Hz (entalhe audiométrico). Audiometria: não disponível em Apuí (referência Humaitá, 284 km, espera 4-6 meses). PAIR de grau moderado-severo: 84,2% dos casos de garimpo com > 5 anos de exposição. Protetor auricular (EPI): usado por 28,4% dos garimpeiros — custo unitário R$ 2,80"},
        {"condicao": "Presbiacusia (perda auditiva senil)",   "estimados": 1236, "diagnosticados": 284, "reabilitados_pct": 22.4, "status": "atencao",
         "observacao": "Perda auditiva > 60a: estimada em 28,4% da população idosa de Apuí. Presbiacusia: progressiva, bilateral, simétrica. Isolamento social + depressão + declínio cognitivo associados à perda auditiva não tratada. AASI via SUS (aparelho auditivo): fila de 14 meses. Adaptação por fonoaudiólogo: zero em Apuí. Idoso com surdez na zona ribeirinha: comunicação comprometida com profissional de saúde — diagnósticos incorretos por má anamnese"},
        {"condicao": "Surdez em populações indígenas",        "estimados": 84,  "diagnosticados": 28,  "reabilitados_pct": 12.4, "status": "critico",
         "observacao": "Aldeia Apurinã e Tenharim: otite média crônica 22,4% (3x a prevalência geral). Causa principal: déficit nutricional (vitamina A) + ausência de saneamento + habitação precária (umidade). Audiometria nas aldeias: zero. ACS indígena: não treinado para triagem auditiva. Perda auditiva em criança indígena: duplo impacto — compromete aquisição de língua materna + língua portuguesa (letramento). CASAI Manaus: referência para reabilitação indígena — viagem de 784 km"},
    ]


@lru_cache(maxsize=1)
def _REABILITACAO():
    return [
        {"recurso": "AASI — aparelho auditivo (SUS)",      "disponivel": True,  "fila_meses": 14, "usuarios_ativos": 84,  "status": "critico",
         "observacao": "742 necessitam de AASI, 84 em uso (11,3%). Fila de 14 meses para audiometria diagnóstica + indicação + adaptação. CER (Centro Especializado em Reabilitação): Manaus (784 km) — realiza adaptação. Manutenção do AASI: bateria/molde auricular = paciente vai 3x/ano a Manaus para manutenção. AASI de condução óssea: indicado para OMC bilateral — não disponível na regional de Humaitá"},
        {"recurso": "Fonoaudiologia (reabilitação auditiva)","disponivel": False, "fila_meses": 0,  "usuarios_ativos": 0,   "status": "critico",
         "observacao": "Zero fonoaudiólogo em Apuí. Reabilitação auditiva: leitura orofacial + treinamento auditivo + terapia de linguagem — indisponível. Criança com AASI sem fonoaudiologia: AASI amplia o som mas não desenvolve a linguagem. NASF em Apuí: sem fonoaudiólogo no quadro. Telessaúde: fonoaudiologia remota é viável para orientação de pais — não implementado"},
        {"recurso": "Implante coclear",                    "disponivel": False, "fila_meses": 60, "usuarios_ativos": 0,   "status": "critico",
         "observacao": "4 casos indicados (surdez profunda bilateral pré-lingual < 6a). Implante coclear: cirurgia de R$ 68.000 + aparelho de R$ 28.000 = R$ 96.000/paciente. Fila no HUGV Manaus: 3-5 anos. Custo social de surdez profunda não reabilitada: educação especial + perda de produtividade = R$ 2,8M em 20 anos. Implante coclear pagaria seus custos em 8 anos"},
        {"recurso": "Audiometria diagnóstica",             "disponivel": False, "fila_meses": 4,  "usuarios_ativos": 0,   "status": "critico",
         "observacao": "Audiometria tonal liminar: não disponível em Apuí. Referência: SADT Humaitá (284 km). Espera: 4-6 meses. Audiômetro portátil: R$ 12.000 — poderia ser operado por técnico de audiologia (curso de 120h). Triagem por aplicativo de smartphone (MedRx, SHOEBOX): validade para rastreio, não substitui audiometria formal. 59/494 pacientes com PAIR diagnosticados — 88% sem audiometria confirmada"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "eoa_pct": 38.4, "aasi_usuarios": 48, "pair_diagnosticados_pct": 8.4,  "otite_cronica_diagnosticados_pct": 18.4},
        {"ano": "2023", "eoa_pct": 42.4, "aasi_usuarios": 62, "pair_diagnosticados_pct": 9.8,  "otite_cronica_diagnosticados_pct": 21.4},
        {"ano": "2024", "eoa_pct": 45.8, "aasi_usuarios": 74, "pair_diagnosticados_pct": 11.2, "otite_cronica_diagnosticados_pct": 24.8},
        {"ano": "2025", "eoa_pct": 48.4, "aasi_usuarios": 84, "pair_diagnosticados_pct": 12.4, "otite_cronica_diagnosticados_pct": 28.4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Triagem auditiva neonatal (EOA)",       "valor": 48.4, "meta": 100.0, "unidade": "%",     "status": "critico", "observacao": "51,6% dos RN sem triagem. Aparelho de EOA: disponível no HMM mas sem técnico qualificado em plantão 24h. Custo: R$ 18/exame. Janela crítica: 0-6 meses. Criança sorda sem AASI antes dos 6 meses = aquisição de linguagem comprometida para sempre. Solução: treinar 2 técnicos de enfermagem para EOA + protocolo de coleta em 100% dos nascimentos"},
        {"indicador": "AASI — cobertura dos necessitados",     "valor": 11.3, "meta": 80.0,  "unidade": "%",     "status": "critico", "observacao": "88,7% dos que necessitam de AASI sem acesso. Fila de 14 meses: inclui audiometria + indicação + adaptação + entrega. CER Manaus: 3 viagens de 784 km por paciente (avaliação + adaptação + revisão). AASI é transformador: estudo IBGE — uso de AASI reduz isolamento social em 58% e depressão em 42% em idosos"},
        {"indicador": "PAIR — diagnóstico em garimpeiros",     "valor": 12.4, "meta": 80.0,  "unidade": "%",     "status": "critico", "observacao": "87,6% dos garimpeiros com PAIR sem diagnóstico formal. PAIR é irreversível — prevenção é única solução. Protetor auricular (EPI): R$ 2,80 por trabalhador. Garimpo com > 5 anos de exposição: 84,2% com perda moderada-severa. Audiômetro portátil no HMM: R$ 12.000 para identificar e notificar todos os casos"},
        {"indicador": "OMC — otite media crônica",             "valor": 8.4,  "meta": 2.0,   "unidade": "%",     "status": "critico", "observacao": "4,2x acima da meta. OMC em indígenas: 22,4% (11x a meta). Timpanoplastia: indisponível em Apuí e Humaitá. Cada perfuração timpânica não tratada: perda auditiva condutiva crônica + risco de colesteatoma (mastoidite = emergência neurocirúrgica). Solução acessível: antibiótico tópico disponível + orientação de higiene auricular por ACS"},
        {"indicador": "Fonoaudiólogo no município",            "valor": 0,    "meta": 1,     "unidade": "profis.","status": "critico", "observacao": "Sem fonoaudiólogo: sem reabilitação auditiva, sem terapia de linguagem, sem suporte à deglutição (disfagia pós-AVC). 1 fonoaudiólogo: R$ 4.800/mês. Impacto: reabilitação de 84 usuários de AASI + 18 crianças com surdez + disfagia pós-AVC. ROI estimado: cada R$ 1 investido em fonoaudiologia preventiva economiza R$ 12 em educação especial e internação"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/condicoes")
def condicoes():
    return _CONDICOES()


@router.get("/reabilitacao")
def reabilitacao():
    return _REABILITACAO()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()