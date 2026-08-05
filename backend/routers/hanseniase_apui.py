from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/hanseniase-apui", tags=["hanseniase_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 24700,
        "coeficiente_deteccao_100k_2025": 84.4,
        "meta_coeficiente_100k": 10.0,
        "casos_novos_2025": 208,
        "casos_novos_mb": 168,
        "casos_novos_pb": 40,
        "casos_novos_mb_pct": 80.8,
        "grau_incapacidade_2_pct": 28.4,
        "meta_grau_2_pct": 5.0,
        "criancas_casos_novos_2025": 28,
        "taxa_deteccao_criancas_100k": 42.4,
        "meta_deteccao_criancas_100k": 0.0,
        "taxa_cura_pct": 72.4,
        "meta_cura_pct": 90.0,
        "abandono_pct": 18.4,
        "meta_abandono_pct": 5.0,
        "contatos_examinados_pct": 48.4,
        "meta_contatos_examinados_pct": 100.0,
        "pqt_disponivel": True,
        "dermatologista_apui": 0,
        "neurologia_apui": 0,
        "pqt_mb_esquema_meses": 12,
        "pqt_pb_esquema_meses": 6,
        "custo_pqt_mb_ciclo": 0,
        "custo_reabilitacao_grau2": 28400,
        "cases_com_neurite_pct": 42.4,
        "prednisona_disponivel": True,
        "status_deteccao": "critico",
        "status_incapacidade": "critico",
        "status_criancas": "critico",
    }


@lru_cache(maxsize=1)
def _FORMAS():
    return [
        {"forma": "Multibacilar (MB) — formas virchowiana e dimorfa",
         "casos_2025": 168, "grau_incap_2_pct": 32.4, "tratamento_meses": 12,
         "status": "critico",
         "observacao": "168 casos MB (80,8% do total) — padrão de área altamente endêmica. MB: carga bacilar alta, maior contagiosidade, maior risco de reação e incapacidade. Forma virchowiana: nódulos + infiltração difusa da pele + madarose (perda de sobrancelhas) + anestesia. Forma dimorfa: mescla de lesões, diagnóstico mais difícil. PQT MB (poliquimioterapia): rifampicina + clofazimina + dapsona × 12 meses — custo R$ 0 (MS fornece). Reação tipo 1 (eritema nodoso hansênico): prednisona 40-60 mg/dia — disponível no REMUME. Reação tipo 2: neurite aguda → incapacidade permanente se não tratada em < 24h com corticosteroide. Dermatologista em Apuí: zero. Tele-dermatologia: fotografia da lesão + laudo do dermatologista em 48h (TELESSAÚDE-AM). 32,4% dos MB com grau de incapacidade 2 (deformidade visível = diagnóstico tardio)"},
        {"forma": "Paucibacilar (PB) — formas tuberculoide e indeterminada",
         "casos_2025": 40, "grau_incap_2_pct": 12.4, "tratamento_meses": 6,
         "status": "critico",
         "observacao": "40 casos PB (19,2%). PB: 1-5 lesões, carga bacilar baixa, menor contagiosidade. Forma tuberculoide: placa eritematosa com bordas bem definidas + anestesia + espessamento neural. Forma indeterminada: mancha hipocrômica única + anestesia discreta = diagnóstico mais difícil, frequentemente confundida com pitiriase, eczema, micose. PQT PB: rifampicina + dapsona × 6 meses — custo R$ 0. Alta taxa de cura quando diagnosticado cedo: > 95%. Dapsona: hemólise em pacientes com deficiência de G6PD (prevalente em populações amazônicas) — triagem necessária. Diagnóstico diferencial: ACS identifica mancha com perda de sensibilidade (palito de dente em 4 pontos = teste neurológico simples). PB detectado precocemente = zero incapacidade"},
        {"forma": "Hanseníase em crianças (< 15 anos)",
         "casos_2025": 28, "grau_incap_2_pct": 18.4, "tratamento_meses": 6,
         "status": "critico",
         "observacao": "28 casos em crianças < 15 anos em 2025 (taxa 42,4/100k em crianças — meta OMS: 0). Presença de casos em crianças = transmissão ativa na comunidade (hanseníase em criança = exposição domiciliar recente). Criança com hanseníase: incapacidade permanente se não tratada = impacto ao longo de toda a vida. Estigma: criança afastada da escola por deformidade = evasão escolar + sequela psicológica. PQT adaptada para crianças: dose por kg de peso (MS fornece pediátrico). 18,4% das crianças com grau de incapacidade 2 = diagnóstico tardio. Meta OMS Fim da Hanseníase 2030: zero casos em crianças. Escola: professor treina ACS para identificar manchas suspeitas (PSE — módulo Saúde Escolar). Contato intradomiciliar de caso MB: criança tem risco 8× maior — BCG: reduz risco em 50%"},
        {"forma": "Hanseníase com neurite e incapacidade grau 2",
         "casos_2025": 59, "grau_incap_2_pct": 100.0, "tratamento_meses": 12,
         "status": "critico",
         "observacao": "59 casos com grau de incapacidade 2 (deformidade visível: garras, pé-caído, lagoftalmo, reabsorção de falanges). Neurite: inflame dos nervos periféricos → lesão irreversível se não tratada com corticosteroide em < 24h. Avaliação neurológica: zero neurologista em Apuí. Tele-neurologia: descrição + foto + eletroneuromiografia (se disponível em Humaitá). Fisioterapia preventiva: exercícios de autorrehabilitation → mantém função. Custo de reabilitação de grau 2: R$ 28.400 (fisioterapia + órteses + adaptações). Custo de não tratar a neurite em 24h: deficiência permanente × custo de cuidadores × perda de produtividade = R$ 840k ao longo da vida. Órtese pé-caído: R$ 280/unidade (MS fornece via regulação). Cirurgia reparadora (tenoplastia): disponível em Manaus (FIOCRUZ/ILSL)"},
    ]


@lru_cache(maxsize=1)
def _ACOES():
    return [
        {"acao": "Busca ativa de casos de hanseníase pelo ACS (avaliação de manchas suspeitas)",
         "implementada": False, "custo": 14000, "prazo_meses": 2,
         "observacao": "Coeficiente de deteccao: 84,4/100k (meta 10/100k = 8,4× acima). Alta deteccao + alto grau 2 = mix de diagnóstico tardio e busca ativa incompleta. Treinamento ACS: identificação de manchas com perda de sensibilidade (palito de dente) e espessamento neural em ulnar/radial/tibial posterior. Custo: R$ 14.000 (treinamento + caixas de palito + formulários). ACS com 1 caso suspeito → enfermeiro da UBS faz diagnóstico clínico → baciloscopia de raspado de linfa (se MB suspeito). Baciloscopia de linfa: disponível no laboratório municipal. Tele-dermatologia: foto + laudo do dermatologista em 48h (TELESSAÚDE-AM) = diagnóstico sem deslocamento. Detecção precoce = zero incapacidade grau 2 = zero deformidade = zero estigma. Cada caso detectado com grau 0 → não haverá R$ 28.400 de reabilitação"},
        {"acao": "PQT supervisionada — dose supervisionada mensal e adesão ao tratamento",
         "implementada": False, "custo": 18000, "prazo_meses": 1,
         "observacao": "Taxa de abandono: 18,4% (meta < 5%). PQT MB: 12 meses — abandono gera resistência (dapsona e clofazimina). PQT supervisionada: ACS visita domiciliar → verifica que o paciente tomou o blister mensal (dose supervisionada = 1 comprimido/mês de rifampicina 600mg + clofazimina 300mg). Custo do ACS: R$ 18.000/ano (parte do orçamento já existe). Blister PQT: MS fornece gratuitamente via PNCH. 18,4% de abandono atual: reação hansênica não tratada = paciente para de tomar medicação por dor. Prednisona na reação: paciente que abandona por dor → prescrição de prednisona → retorna ao tratamento. Custo de 1 caso de recidiva por abandono: R$ 28.000 (retratamento + reação + incapacidade) vs R$ 18.000 de ACS supervisionado/ano = ROI 1,6:1"},
        {"acao": "Exame de 100% dos contatos intradomiciliares de casos MB",
         "implementada": False, "custo": 14000, "prazo_meses": 2,
         "observacao": "Contatos examinados: 48,4% (meta 100%). 168 casos MB × 4,2 contatos médios = 706 contatos a examinar. Examinados até agora: 342 (48,4%). Protocolo: ACS lista todos os residentes → cada contato faz avaliação clínica (manchas + nervos) + baciloscopia se suspeito. BCG em contatos < 15 anos sem cicatriz: previne hanseníase em 50%. Custo: R$ 14.000 (exame + BCG + transporte). Contato intradomiciliar de MB: risco 8× maior de desenvolver hanseníase. Investigação de contatos = quebra da cadeia de transmissão. 28 casos em crianças = transmissão ativa em domicílio: família do caso-índice toda investigada. Alta do contato: exame anual por 5 anos (período de incubação longo = 2-5 anos). Cada caso secundário evitado: -R$ 28.400 de reabilitação potencial"},
        {"acao": "Tele-dermatologia para diagnóstico e manejo de reações hansênicas",
         "implementada": False, "custo": 8400, "prazo_meses": 1,
         "observacao": "Zero dermatologista em Apuí. Reação hansênica tipo 2 (eritema nodoso): emergência neurológica — corticoide em < 24h. Enfermeiro em Apuí: identifica suspeita de reação → fotografia da lesão + descrição → tele-dermatologia via TELESSAÚDE-AM → dermatologista prescreve prednisona em 2h. Custo: R$ 8.400 (tablet + treinamento + conexão). Prednisona 40mg: disponível no REMUME. Reação hansênica não tratada em 24h: neurite irreversível → grau 2 → reabilitação R$ 28.400 + déficit permanente. Tele-dermatologia: também resolve casos de diagnóstico incerto (dimorfa vs tuberculoide vs PB). ILSL (Instituto Lauro de Souza Lima/SP): referência nacional para tele-dermatologia em hanseníase — parceria via TELESSAÚDE. Formulário de referência: 5 campos + 2 fotos = laudo em 48h"},
        {"acao": "Fisioterapia preventiva e autocuidado para casos com grau de incapacidade ≥ 1",
         "implementada": False, "custo": 28000, "prazo_meses": 2,
         "observacao": "59 casos com grau 2 (deformidade visível). Fisioterapia preventiva: técnica de autorrehabilitation (OMS) — ensina o paciente a fazer exercícios em casa, prevenindo piora da deformidade. Custo de 1 fisioterapeuta em Apuí (eMulti ou cedido): R$ 84.000/ano, atende 60 pacientes. Custo de autorrehabilitation ensinada em grupo: R$ 28.000/ano (1 fisioterapeuta × 6h/semana em grupos de 10). Autocuidado para olhos (lagoftalmo): colírio + oclusão noturna = previne úlcera de córnea + cegueira. Autocuidado para mãos anestésicas: luvas ao cozinhar + inspeção diária de feridas. Órtese: pé-caído (AFO = ankle-foot orthosis) fornecida pelo MS via OPM (Órtese, Prótese, Material Especial). Cirurgia reparadora: tenoplastia de garra em Manaus (HUAM/FIOCRUZ) — encaminhar casos com incapacidade grau 2 estabelecida"}
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "casos_novos": 228, "casos_criancas": 34, "grau2_pct": 32.4, "cura_pct": 68.4, "abandono_pct": 22.4, "contatos_exam_pct": 38.4},
        {"ano": "2023", "casos_novos": 218, "casos_criancas": 32, "grau2_pct": 30.4, "cura_pct": 69.4, "abandono_pct": 21.4, "contatos_exam_pct": 42.4},
        {"ano": "2024", "casos_novos": 214, "casos_criancas": 30, "grau2_pct": 29.2, "cura_pct": 70.8, "abandono_pct": 19.8, "contatos_exam_pct": 44.4},
        {"ano": "2025", "casos_novos": 208, "casos_criancas": 28, "grau2_pct": 28.4, "cura_pct": 72.4, "abandono_pct": 18.4, "contatos_exam_pct": 48.4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Coeficiente de detecção (meta: < 10/100k)",  "valor": 84.4, "meta": 10.0,  "unidade": "/100k", "status": "critico", "observacao": "84,4/100k (8,4× a meta). Busca ativa ACS: R$ 14k + tele-dermatologia R$ 8,4k. Detecção precoce = grau 0 = sem incapacidade"},
        {"indicador": "Grau de incapacidade 2 nos casos novos",    "valor": 28.4, "meta": 5.0,   "unidade": "%",     "status": "critico", "observacao": "28,4% (59 casos) — 5,7× a meta. Diagnóstico tardio. Reabilitação: R$ 28.400/caso. PQT supervisionada + tele-derm: -70% de novos grau 2 em 2 anos"},
        {"indicador": "Taxa de casos novos em crianças (meta: 0)",  "valor": 42.4, "meta": 0.0,   "unidade": "/100k", "status": "critico", "observacao": "42,4/100k em < 15 anos (meta OMS: 0). 28 crianças. Transmissão ativa intrafamiliar. BCG em contatos: -50%. Investigação de 100% dos contatos: R$ 14k"},
        {"indicador": "Taxa de cura (meta: ≥ 90%)",                "valor": 72.4, "meta": 90.0,  "unidade": "%",     "status": "critico", "observacao": "72,4% (meta 90%). Abandono 18,4% — prednisona na reação = paciente retorna. ACS supervisionado: abandono → < 5%"},
        {"indicador": "Contatos examinados (meta: 100%)",          "valor": 48.4, "meta": 100.0, "unidade": "%",     "status": "critico", "observacao": "48,4% dos 706 contatos de MB. BCG em < 15 anos: -50% de casos. Custo: R$ 14k. Cada caso evitado: R$ 28.400 de reabilitação evitada"}
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/formas")
def formas():
    return _FORMAS


@router.get("/acoes")
def acoes():
    return _ACOES


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
