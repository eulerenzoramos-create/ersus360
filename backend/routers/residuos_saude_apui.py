from fastapi import APIRouter

router = APIRouter(prefix="/api/residuos-saude-apui", tags=["residuos_saude_apui"])

_DASHBOARD = {
    "municipio": "Apuí/AM",
    "populacao_total": 24700,
    "residuos_infectantes_kg_dia": 48.4,
    "residuos_quimicos_kg_dia": 8.4,
    "residuos_totais_kg_dia": 84.4,
    "descarte_inadequado_pct": 62.4,
    "incineracao_disponivel": False,
    "autoclave_disponivel": False,
    "coleta_especializada_pct": 37.6,
    "pgrss_atualizado": False,
    "pgrss_ultima_atualizacao_ano": 2019,
    "vigilancia_sanitaria_fiscalizacoes_2025": 4,
    "meta_fiscalizacoes_ano": 12,
    "agulhas_descarte_seguro_pct": 48.4,
    "equipamentos_epi_disponibilidade_pct": 62.4,
    "treinamento_manipulacao_rss_pct": 28.4,
    "acidente_perfurocortante_2025": 14,
    "status_descarte": "critico",
    "status_pgrss": "critico",
    "status_epi": "atencao",
}

_TIPOS = [
    {"tipo": "Resíduos Infectantes (Grupo A)",
     "geracao_kg_dia": 48.4, "descarte_adequado_pct": 37.6, "status": "critico",
     "observacao": "48,4 kg/dia de infectantes: sangue, secreções, tecidos, culturas. Descarte inadequado: 62,4% vai para lixo comum — risco de contaminação biológica. Incineração: indisponível em Apuí e Humaitá (284 km). Autoclave: indisponível no HMM. Coleta especializada (empresa licenciada): retira 1x/semana — resíduos ficam armazenados 7 dias em condição inadequada. Meta: coleta diária para infectantes de alto risco (RSS A1/A2: anatomopatológicos e hemato). 14 acidentes com material biológico em 2025 — 8 envolveram material infectante"},
    {"tipo": "Resíduos Químicos (Grupo B)",
     "geracao_kg_dia": 8.4, "descarte_adequado_pct": 18.4, "status": "critico",
     "observacao": "8,4 kg/dia: medicamentos vencidos, soluções de fixação, reagentes de laboratório, mercúrio (termômetros/esfigmo). Mercúrio: HMM tem 38 termômetros de mercúrio ainda em uso — em processo de substituição. Medicamentos vencidos: 81,6% descartados no lixo comum ou vaso sanitário. Logística reversa farmacêutica: não implantada em Apuí. Descarte de medicamentos oncológicos: tóxicos especiais — sem protocolo local. Formol (anatomopatológico): enviado a Manaus via TFD — único protocolo correto existente"},
    {"tipo": "Resíduos Radioativos (Grupo C)",
     "geracao_kg_dia": 0.2, "descarte_adequado_pct": 100.0, "status": "ok",
     "observacao": "0,2 kg/dia: filmes de raio-x, material do serviço de radiologia. Protocolo adequado: armazenamento por decaimento (meias-vidas curtas) + envio a Manaus. Única categoria com 100% de descarte adequado — regulamentação da CNEN (Comissão Nacional de Energia Nuclear) com fiscalização federal rigorosa determina cumprimento. Equipamento de raio-x: 1 aparelho convencional no HMM, 1 na UBS Nova Colina. Dosímetros: fornecidos e monitorados, calibração em dia"},
    {"tipo": "Resíduos Comuns (Grupo D)",
     "geracao_kg_dia": 24.0, "descarte_adequado_pct": 72.4, "status": "atencao",
     "observacao": "24 kg/dia: resíduos administrativos, restos de alimento de refeitório hospitalar, embalagens não contaminadas. 27,6% descartados com infectantes — cross-contamination que aumenta custo de tratamento. Segregação na fonte: treinamento em 28,4% dos funcionários vs meta 80%. Lixo hospitalar misturado com infectante aumenta 3x o custo de tratamento. Compostagem de resíduo orgânico hospitalar: piloto proposto, zero implementação"},
    {"tipo": "Resíduos Perfurocortantes (Grupo E)",
     "geracao_kg_dia": 3.4, "descarte_adequado_pct": 48.4, "status": "critico",
     "observacao": "3,4 kg/dia: agulhas, lâminas de bisturi, ampolas quebradas. 51,6% descartados inadequadamente — em saco de lixo comum ou descartados em campo sem caixa coletora. Descarte em campo (vacinação domiciliar, visita de ACS): maior risco — agulha em saco plástico perfura e causa acidente. 14 acidentes perfurocortantes em 2025: 10 por descarte inadequado, 4 por falha de técnica. Caixa coletora (Descarpack): disponível em unidades fixas, mas sem reposição em atividades de campo. Custo da PEP (profilaxia pós-exposição HIV): R$ 4.800/episódio — 14 casos = R$ 67.200/ano em PEP"},
]

_PREVENCAO = [
    {"medida": "PGRSS atualizado (≤ 3 anos)",
     "implementada": False, "custo": 18000, "responsavel": "SMS + empresa consultora", "prazo_meses": 3,
     "observacao": "PGRSS vencido desde 2022 (6 anos sem atualização — meta: renovar a cada 3 anos). Sem PGRSS atualizado: empresa de coleta não pode renovar contrato, vigilância sanitária municipal não pode emitir alvará sanitário. Multa por PGRSS desatualizado: R$ 5.000-50.000/autuação (RDC 222/2018). Custo de contratação de consultora para elaborar novo PGRSS: R$ 18.000. Disponível via COSEMS-AM: serviço compartilhado de elaboração de PGRSS por R$ 6.000 para municípios menores de 50k hab"},
    {"medida": "Incinerador municipal para RSS",
     "implementada": False, "custo": 284000, "responsavel": "Consórcio Intermunicipal", "prazo_meses": 18,
     "observacao": "Custo unitário para Apuí: R$ 284.000. Via consórcio com Humaitá, Manicoré e Novo Aripuanã: R$ 71.000/município. Reduz custo de TFD de RSS para Manaus (atual R$ 48.000/ano). Payback: 5,9 anos individual / 1,5 anos consorciado. Alternativa: autoclave + triturador (R$ 84.000, disponível em 6 meses). Licença ambiental IPAAM: processo de 6-12 meses. Localização proposta: área industrial + fundo municipal de saúde"},
    {"medida": "EPI completo para manipulação de RSS",
     "implementada": False, "custo": 24000, "responsavel": "SMS / Almoxarifado HMM", "prazo_meses": 1,
     "observacao": "EPI para RSS: avental impermeável, luva nitrilica, máscara N95, óculos, bota de borracha. Disponibilidade atual: 62,4% do necessário. Custo anual completo: R$ 24.000. Em 3 dos 14 acidentes de 2025: funcionário sem EPI adequado. Aquisição via pregão eletrônico: 30 dias. Nota: EPI é custo fixo que compete com medicamentos por linha orçamentária, frequentemente cortado em contenção de despesas"},
    {"medida": "Treinamento em segregação e RSS",
     "implementada": False, "custo": 4800, "responsavel": "CCIH + VISA municipal", "prazo_meses": 2,
     "observacao": "Treinamento atual: 28,4% dos funcionários de saúde vs meta 80%. Custo de treinamento (8h presencial + material): R$ 4.800 para 240 funcionários. CCIH de Apuí: 4 membros vs meta 12, reuniões irregulares — não executa treinamentos com frequência necessária. Online via EAD FIOCRUZ: gratuito, 40h, com certificado. Barreira: funcionário não tem tempo liberado para treinamento durante turno. Treinamento em RSS reduz 60% dos acidentes com perfurocortantes"},
    {"medida": "Logística reversa de medicamentos",
     "implementada": False, "custo": 0, "responsavel": "Farmácias + SMS", "prazo_meses": 3,
     "observacao": "Programa Descarte Correto (ABRADILAN/SINDUSFARMA): gratuito para o município. Farmácias parceiras instalam coletores e retiram gratuitamente. Medicamento descartado no esgoto: antibióticos causam resistência bacteriana no meio ambiente. Medicamento opiáceo descartado: risco de desvio e uso indevido. Implementação: contato com ABRADILAN, cadastramento de farmácias, comunicação à população. Custo zero — exige apenas coordenação administrativa"},
]

_HISTORICO = [
    {"ano": "2022", "residuos_kg_dia": 68.0, "descarte_adequado_pct": 28.4, "acidentes_perfuro": 18, "fiscalizacoes": 2},
    {"ano": "2023", "residuos_kg_dia": 76.0, "descarte_adequado_pct": 32.4, "acidentes_perfuro": 16, "fiscalizacoes": 3},
    {"ano": "2024", "residuos_kg_dia": 80.4, "descarte_adequado_pct": 34.8, "acidentes_perfuro": 15, "fiscalizacoes": 3},
    {"ano": "2025", "residuos_kg_dia": 84.4, "descarte_adequado_pct": 37.6, "acidentes_perfuro": 14, "fiscalizacoes": 4},
]

_INDICADORES = [
    {"indicador": "PGRSS atualizado",                  "valor": "Não",  "meta": "Sim",  "unidade": "",  "status": "critico", "observacao": "PGRSS vencido desde 2022. Risco de multa de R$ 5-50k. Empresa de coleta não renova contrato sem PGRSS válido. Custo de renovação: R$ 6-18k. Disponível via COSEMS-AM por R$ 6.000"},
    {"indicador": "Descarte inadequado de RSS",        "valor": 62.4,   "meta": 5.0,    "unidade": "%", "status": "critico", "observacao": "62,4% dos RSS descartados inadequadamente. Risco biológico para coletores municipais de lixo, catadores e comunidade. Sem incinerador ou autoclave: descarte em Manaus (custo R$ 48k/ano) ou inadequado. Consórcio intermunicipal resolve em 18 meses"},
    {"indicador": "Acidentes perfurocortantes",        "valor": 14,     "meta": 0,      "unidade": "/a","status": "critico", "observacao": "14 acidentes em 2025 — 10 por descarte inadequado. Custo em PEP: R$ 67.200/ano. Treinamento + EPI adequado + caixa coletora em campo: reduz para < 2/ano. Subnotificação estimada: 30-40% dos acidentes não registrados"},
    {"indicador": "Funcionários com treinamento RSS",  "valor": 28.4,   "meta": 80.0,   "unidade": "%", "status": "critico", "observacao": "28,4% vs meta 80%. EAD FIOCRUZ gratuito — barreira é liberação de turno. CCIH precisa ser fortalecida: 4 membros vs 12 necessários, reuniões irregulares. RDC 222/2018 exige treinamento anual de todos os trabalhadores"},
    {"indicador": "Fiscalizações VISA municipal",      "valor": 4,      "meta": 12,     "unidade": "/a","status": "atencao", "observacao": "4/12 fiscalizações realizadas. VISA municipal com 2 servidores vs mínimo de 4. Equipe insuficiente para todas as obrigações: alimentos, medicamentos, serviços de saúde, RSS. Municipalização da VISA: processo incompleto — apoio técnico ADAF/SVSAM irregular"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/tipos")
def tipos():
    return _TIPOS


@router.get("/prevencao")
def prevencao():
    return _PREVENCAO


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
