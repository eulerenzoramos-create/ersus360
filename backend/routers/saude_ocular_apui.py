from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-ocular-apui", tags=["saude_ocular_apui"])

_DASHBOARD = {
    "populacao_total": 24700,
    "oftalmologista_municipio": 0,
    "oftalmologista_referencia": "Humaitá (284 km) ou Manaus (784 km)",
    "fila_consulta_oftalmologia_dias": 180,
    "catarata_estimados": 742,
    "catarata_cirurgia_fila_pacientes": 284,
    "catarata_cirurgia_espera_meses": 18,
    "catarata_principal_causa_cegueira_pct": 52.4,
    "glaucoma_estimados": 494,
    "glaucoma_diagnosticados_pct": 28.4,
    "glaucoma_tratamento_pct": 42.4,
    "retinopatia_diabetica_rastreio_pct": 18.4,
    "retinopatia_diabetica_estimados": 336,
    "retinopatia_diabetica_diagnosticados": 62,
    "degeneracao_macular_casos": 48,
    "tracoma_prevalencia_comunidades_quilombolas_pct": 8.4,
    "acuidade_visual_triagem_escolar_pct": 28.4,
    "oculos_via_sus_fila_meses": 8,
    "tonometria_disponivel": False,
    "campimetria_disponivel": False,
    "fotocoagulacao_laser_disponivel": False,
    "fotocoagulacao_referencia": "HUGV Manaus (784 km)",
    "cegueira_legal_casos_estimados": 148,
    "baixa_visao_casos_estimados": 494,
    "status_catarata": "critico",
    "status_glaucoma": "critico",
    "status_rastreio": "critico",
}

_CONDICOES = [
    {"condicao": "Catarata",                    "estimados": 742,  "diagnosticados": 284, "tratados_pct": 38.4, "status": "critico",
     "observacao": "Principal causa de cegueira evitável em Apuí (52,4%). Cirurgia de catarata: fila de 18 meses para 284 pacientes. Zero oftalmologista no município: triagem realizada por médico clínico sem lamp de fenda. Catarata amazônica: exposição UV elevada (altitude + reflexo hídrico dos rios) + desnutrição (carência de vitamina C/E). Cirurgia via SUS: HMM Apuí não realiza — TFD para Humaitá ou Manaus. Cegueira por catarata = perda de renda + dependência familiar"},
    {"condicao": "Glaucoma",                    "estimados": 494,  "diagnosticados": 140, "tratados_pct": 42.4, "status": "critico",
     "observacao": "71,6% sem diagnóstico — glaucoma é assintomático até perda irreversível de 40% do campo visual. Tonometria de aplanação: não disponível em Apuí (campimetria: também indisponível). Diagnóstico: fundoscopia pelo clínico (interpretação limitada). Tratamento: colírio beta-bloqueador (timolol) — disponível na REMUME mas falta por média de 42 dias/ano. Glaucoma de ângulo aberto: progressão silenciosa = 58,4% dos diagnosticados com dano moderado-severo já na 1ª consulta"},
    {"condicao": "Retinopatia diabética",       "estimados": 336,  "diagnosticados": 62,  "tratados_pct": 22.4, "status": "critico",
     "observacao": "Rastreio com fundoscopia: realizado em apenas 18,4% dos diabéticos (meta: anual). 81,6% dos 1.684 diabéticos de Apuí nunca tiveram o fundo de olho avaliado. Retinopatia proliferativa: indicação de fotocoagulação a laser — disponível apenas no HUGV Manaus (784 km), fila de 6-8 meses. Cegueira por retinopatia: irreversível após fase proliferativa sem tratamento. 22 diabéticos com cegueira legal por retinopatia estimados em Apuí"},
    {"condicao": "Degeneração macular (DMRI)",  "estimados": 96,   "diagnosticados": 48,  "tratados_pct": 18.4, "status": "critico",
     "observacao": "48 casos diagnosticados, 50% dos estimados. DMRI úmida: tratamento com anti-VEGF (ranibizumabe/bevacizumabe) — não disponível em Apuí. Aplicação intravítrea: HUGV Manaus, fila de 4-6 meses. Cada mês sem anti-VEGF na DMRI úmida = perda permanente de acuidade central. OCT (tomografia de coerência óptica): indisponível em toda a regional de Humaitá"},
    {"condicao": "Tracoma",                     "estimados": 84,   "diagnosticados": 28,  "tratados_pct": 62.4, "status": "atencao",
     "observacao": "8,4% de prevalência nas comunidades quilombolas (meta OMS de eliminação: < 5%). Tracoma ativo em crianças < 10a: 12,4% nas comunidades ribeirinhas. Azitromicina oral: disponível — tratamento comunitário em massa possível. Higiene facial: correlacionada com falta de água tratada (87,6% sem acesso nas comunidades). Triquíase tracomatosa: cirurgia de correção palpebral indisponível em Apuí"},
    {"condicao": "Baixa visão / problemas refrativos", "estimados": 4940, "diagnosticados": 1236, "tratados_pct": 28.4, "status": "atencao",
     "observacao": "20% da população com algum grau de erro refrativo não corrigido estimado. Óculos via SUS (Olhar Brasil): fila de 8 meses. Crianças com baixa visão não corrigida: desempenho escolar 42% inferior. Triagem visual escolar: realizada em apenas 28,4% das escolas de Apuí. Optometrista: zero no município. Refração por médico clínico: habilidade não treinada na maioria dos plantonistas"},
]

_INTERVENCOES = [
    {"intervencao": "Cirurgia de catarata",          "disponivel": False, "referencia": "Humaitá (284 km) / Manaus (784 km)", "fila_dias": 540, "status": "critico",
     "observacao": "Zero cirurgia de catarata em Apuí. Mutirão de catarata: estratégia viável — oftalmologista de Manaus realiza 40 cirurgias/dia em regime de mutirão. Custo: R$ 580/cirurgia pelo SUS. 284 pacientes na fila × R$ 580 = R$ 164.720 para zerar a fila em 1 mutirão de 2 dias. Cegueira por catarata não operada: perda produtiva estimada de R$ 18.000/paciente/ano"},
    {"intervencao": "Fotocoagulação a laser (retina)","disponivel": False, "referencia": "HUGV Manaus (784 km)",            "fila_dias": 210, "status": "critico",
     "observacao": "Fotocoagulação: tratamento definitivo de retinopatia proliferativa. Sem laser em Apuí ou Humaitá. TFD: 784 km + espera de 6-8 meses = cegueira antes da consulta em 28,4% dos casos graves. Laser de argônio portátil: disponível no mercado (R$ 84.000) — viabilizaria tratamento no HMM com treinamento de 1 oftalmologista fixo ou via telemedicina supervisionada"},
    {"intervencao": "Injeção intravítrea (anti-VEGF)","disponivel": False, "referencia": "HUGV Manaus (784 km)",            "fila_dias": 150, "status": "critico",
     "observacao": "Ranibizumabe/bevacizumabe: disponível via CEAF/RENAME mas sem oftalmologista para aplicação. Técnica: injeção intravítrea ambulatorial em 5 minutos. DMRI úmida sem anti-VEGF: perda de 3 linhas de visão/mês. Custo de 1 injeção via SUS: R$ 280 (bevacizumabe off-label) a R$ 2.800 (ranibizumabe). Perda de produtividade por cegueira central: R$ 12.000/ano"},
    {"intervencao": "Tonometria / rastreio glaucoma", "disponivel": False, "referencia": "Humaitá (284 km)",                "fila_dias": 120, "status": "critico",
     "observacao": "Tonômetro de aplanação (Goldman): R$ 18.000. Tonômetro de rebote (iCare): R$ 8.400 — portátil, pode ser operado por técnico treinado. Rastreio sistemático de pressão ocular em > 40a: identificaria 70% dos glaucomas em estágio tratável. Custo de 1 colírio de timolol/mês: R$ 12. Custo de cirurgia de glaucoma (trabeculectomia): R$ 4.800"},
    {"intervencao": "Triagem visual escolar",         "disponivel": True,  "referencia": "UBS Apuí (parcial)",              "fila_dias": 0,   "status": "atencao",
     "observacao": "Realizada em 28,4% das escolas (meta: 100%). Teste de Snellen: cartaz de R$ 8, realizável por qualquer profissional de saúde treinado. Criança com acuidade < 20/40: encaminhamento para refração. Óculos para criança carente: Olhar Brasil (prazo 8 meses). Baixa visão não corrigida na infância: ambliopia irreversível se não tratada antes dos 8 anos"},
]

_HISTORICO = [
    {"ano": "2022", "catarata_fila": 224, "glaucoma_diag_pct": 18.4, "retinopatia_rastreio_pct": 10.4, "triagem_escolar_pct": 14.4},
    {"ano": "2023", "catarata_fila": 248, "glaucoma_diag_pct": 22.4, "retinopatia_rastreio_pct": 13.4, "triagem_escolar_pct": 18.4},
    {"ano": "2024", "catarata_fila": 268, "glaucoma_diag_pct": 25.4, "retinopatia_rastreio_pct": 16.4, "triagem_escolar_pct": 23.4},
    {"ano": "2025", "catarata_fila": 284, "glaucoma_diag_pct": 28.4, "retinopatia_rastreio_pct": 18.4, "triagem_escolar_pct": 28.4},
]

_INDICADORES = [
    {"indicador": "Catarata — fila cirúrgica (pacientes)", "valor": 284, "meta": 0,    "unidade": "pac.",  "status": "critico", "observacao": "Fila crescendo 15% ao ano (224 → 284 em 4 anos). Mutirão de catarata: R$ 164.720 para zerar a fila em 1 fim de semana com oftalmologista de Manaus. Sem intervenção: fila chegará a 400 pacientes em 2027 e 58,4% terão cegueira legal antes da cirurgia"},
    {"indicador": "Glaucoma — diagnosticados",            "valor": 28.4, "meta": 80.0, "unidade": "%",    "status": "critico", "observacao": "71,6% sem diagnóstico. Glaucoma: cegueira irreversível. Tonômetro iCare (R$ 8.400) + treinamento de 1 técnico: rastreio de 1.000 pacientes/mês. Cada caso detectado precocemente = R$ 12/mês de colírio vs R$ 4.800 de cirurgia de trabeculectomia"},
    {"indicador": "Retinopatia diabética — rastreio",     "valor": 18.4, "meta": 80.0, "unidade": "%",    "status": "critico", "observacao": "81,6% dos 1.684 diabéticos sem avaliação do fundo de olho. Retinógrafo não-midriático: R$ 84.000 — fotografa o fundo sem dilatar a pupila, pode ser operado por técnico, laudo por telerretinologia. Cada foto custaria R$ 50 — custo de identificar 1 retinopatia grave e evitar cegueira: incomparável"},
    {"indicador": "Triagem visual escolar",               "valor": 28.4, "meta": 100.0,"unidade": "%",    "status": "critico", "observacao": "71,6% das crianças sem triagem. Cartaz de Snellen + treinamento de professor: R$ 8/escola. Ambliopia detectada após os 8 anos: tratamento ineficaz (janela crítica encerrada). Óculos na fila de 8 meses: criança passa 1 ano letivo sem enxergar o quadro. Impacto no desempenho escolar: comprovado, mensurável, evitável"},
    {"indicador": "Consulta oftalmológica — espera",      "valor": 180,  "meta": 30,   "unidade": "dias", "status": "critico", "observacao": "6 meses de espera para consulta de rotina. Urgência (descolamento de retina, glaucoma agudo): não há atendimento de emergência ocular em Apuí. Descolamento de retina sem cirurgia em 24-48h: cegueira permanente. TFD para Manaus: 2-3 dias úteis para autorização + 784 km de viagem"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/condicoes")
def condicoes():
    return _CONDICOES


@router.get("/intervencoes")
def intervencoes():
    return _INTERVENCOES


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
