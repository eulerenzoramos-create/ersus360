from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-ocular-apui", tags=["saude_ocular_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 24700,
        "populacao_acima_40_anos": 8642,
        "oftalmologista_apui": 0,
        "referencia_oftalmologia": "Humaitá/AM (180 km) ou Manaus (480 km)",
        "espera_sisreg_dias": 280,
        "triagem_visual_ubs_disponivel": False,
        "equipamento_tonometria_apui": 0,
        "fundoscopia_disponivel_apui": False,
        "glaucoma_estimados": 842,
        "glaucoma_diagnosticados": 84,
        "glaucoma_em_tratamento": 42,
        "glaucoma_cegueira_irreversivel_estimada": 142,
        "catarata_estimados": 1284,
        "catarata_cirurgia_fila_espera": 284,
        "catarata_cirurgia_realizada_2025": 28,
        "catarata_cegueira_reversivel_estimada": 284,
        "retinopatia_diabetica_estimados": 420,
        "retinopatia_diabetica_rastreados_pct": 18.4,
        "retinopatia_diabetica_cegueira_estimada": 84,
        "tracoma_prevalencia_escolar_pct": 8.4,
        "tracoma_criancas_estimadas": 574,
        "tracoma_rastreados_pct": 12.4,
        "baixa_visao_n_estimado": 1840,
        "baixa_visao_com_correcao_pct": 22.4,
        "cegueira_legal_estimados": 420,
        "criancas_deficiencia_visual_detectada": 284,
        "criancas_oculos_necessitam": 142,
        "criancas_oculos_receberam": 28,
        "programa_olhar_brasil_ativo": False,
        "cirurgia_catarata_sus_disponivel_apui": False,
        "colecao_retinografia": False,
        "tele_oftalmologia_ativa": False,
        "custo_cegueira_evitavel_per_capita": 84000,
        "status_glaucoma": "critico",
        "status_catarata": "critico",
        "status_retinopatia_diabetica": "critico",
    }


@lru_cache(maxsize=1)
def _CONDICOES():
    return [
        {"condicao": "Glaucoma",
         "estimados": 842, "diagnosticados": 84, "em_tratamento": 42, "cegueira_estimada": 142,
         "reversibilidade": "irreversível", "status": "critico",
         "observacao": "842 estimados (prevalência 9,7% na faixa > 40 anos — população rural tem maior risco por falta de diagnóstico precoce). Diagnosticados: 84 (10%). Em tratamento: 42 (50% dos diagnosticados). Cegueira irreversível estimada: 142 pessoas (glaucoma avançado sem diagnóstico). Glaucoma: 2ª causa de cegueira no mundo — mas 100% dos casos precoces têm tratamento eficaz com colírio. Diagnóstico precoce: tonômetro (PIO) + fundoscopia do nervo óptico. Tonômetro em Apuí: zero. Fundoscopia: zero equipamento nas UBSs. Colírio de maleato de timolol 0,5%: disponível no REMUME por R$ 8,40/mês = controla PIO e preserva a visão indefinidamente. Tele-oftalmologia: retinógrafo envia imagem do disco óptico para oftalmologista via JPEG — diagnóstico sem deslocamento do paciente. Cegueira por glaucoma = irreversível: cada paciente que cega por falta de tonometria e colírio = perda econômica R$ 84k + dependência pelo resto da vida"},
        {"condicao": "Catarata",
         "estimados": 1284, "diagnosticados": 420, "em_tratamento": 28, "cegueira_estimada": 284,
         "reversibilidade": "reversível (cirurgia)", "status": "critico",
         "observacao": "1.284 estimados (prevalência 14,9% > 40 anos — exposição solar intensa na Amazônia acelera formação de catarata). Fila de cirurgia SUS: 284 pacientes aguardando. Realizadas em 2025: 28 (9,9% da fila). Catarata = 1ª causa de cegueira reversível no mundo — cirurgia de facoemulsificação dura 20 min, custo R$ 1.100 no SUS, recuperação 1 semana. Custo de cegueira por catarata não tratada: R$ 84.000 em cuidados ao longo da vida vs R$ 1.100 da cirurgia = ROI 76:1. Mutirão de catarata SUS: município solicita à SES-AM → oftalmologista de Manaus vai a Apuí + sala de cirurgia do HMM adaptada = 40 cirurgias/dia × 3 dias = 120 cirurgias = zera fila atual. Custo: R$ 0 para o município (SES-AM financia via FCECON). 284 pacientes cegos por catarata: todos recuperáveis com mutirão"},
        {"condicao": "Retinopatia Diabética",
         "estimados": 420, "diagnosticados": 84, "em_tratamento": 42, "cegueira_estimada": 84,
         "reversibilidade": "parcialmente reversível (laser precoce)", "status": "critico",
         "observacao": "420 diabéticos estimados com retinopatia (40% dos diabéticos têm RD após 10 anos). Rastreados: 18,4% (77 pacientes). Diagnóstico: retinografia com midríase (pupilas dilatadas + foto do fundo de olho). Retinógrafo portátil (Optomed Aurora): R$ 84.000 — alcance de rastreio de 480 km de raio via tele-oftalmologia. Fotocoagulação a laser (tratamento RD proliferativa): disponível em Manaus (Fundação Altino Ventura + FCSC) via SISREG — espera 280 dias. RD precoce: controle glicêmico + pressão arterial = -70% de progressão para cegueira. Ranibizumabe intraocular (DMRI + RD): disponível no CEAF — zero oftalmologista em Apuí para aplicar. Cada diabético com RD não rastreado: risco de cegueira em 5 anos = R$ 84.000 em perda econômica + dependência. 420 × R$ 84k = R$ 35,3M de passivo de cegueira evitável"},
        {"condicao": "Tracoma",
         "estimados": 574, "diagnosticados": 84, "em_tratamento": 42, "cegueira_estimada": 28,
         "reversibilidade": "reversível (antibiótico)", "status": "critico",
         "observacao": "574 crianças com tracoma estimadas (8,4% prevalência escolar — meta OMS < 5%). Rastreados: 12,4% (71). Tracoma: infecção ocular por Chlamydia trachomatis — transmitida por moscas e contato direto com secreções oculares. Cegueira por tracoma: após décadas de infecção repetida (triquíase = cílios virados para dentro, traumatizam a córnea). Tratamento: azitromicina 1g dose única (adulto) ou 20mg/kg (criança) — disponível no REMUME por R$ 18/dose. OMS: estratégia SAFE (cirurgia + antibiótico + higiene facial + melhoria ambiental). Cirurgia de triquíase: procedimento simples (eletroepilação) — pode ser feito por enfermeiro treinado. PSE: rastreio de tracoma é ação obrigatória nos municípios endêmicos. Água corrente para higiene facial: -50% de transmissão (módulo Saneamento). Tracoma = 1ª causa infecciosa de cegueira prevenível no mundo — zero em municípios com saneamento"},
        {"condicao": "Baixa visão não corrigida (refração)",
         "estimados": 1840, "diagnosticados": 420, "em_tratamento": 412, "cegueira_estimada": 0,
         "reversibilidade": "reversível (óculos)", "status": "critico",
         "observacao": "1.840 estimados com erro de refração sem correção (miopia, hipermetropia, astigmatismo). Corrigidos: 22,4% (412). 142 crianças em idade escolar precisam de óculos — 28 receberam (19,7%). Óculos = intervenção de saúde mais custo-efetiva da história da medicina (OMS). Programa Olhar Brasil (MS + MEC): fornece óculos gratuitos a escolares e adultos > 40 anos com erro refratário confirmado em tabela de Snellen. Apuí: não ativou o Olhar Brasil. Refração simples (tabela Snellen): enfermeiro treinado em 2h. Óculos: R$ 84/par via FNDE (Olhar Brasil) — ZERO custo para o município. 142 crianças com baixa visão não corrigida: -40% no rendimento escolar (OMS). Cada criança que evadir por dificuldade visual não tratada: R$ 84k de perda econômica ao longo da vida"}
    ]


@lru_cache(maxsize=1)
def _ACOES():
    return [
        {"acao": "Ativar Programa Olhar Brasil — óculos gratuitos para escolares e adultos",
         "implementada": False, "custo": 0, "prazo_meses": 1,
         "observacao": "Olhar Brasil: MS + MEC financiam 100% (óculos + consulta de refração) para alunos da rede pública e adultos > 40 anos. Custo municipal: R$ 0. Protocolo: UBS cadastra no sistema do Olhar Brasil → enfermeiro aplica tabela Snellen → paciente positivo encaminhado ao oftalmologista credenciado (Humaitá ou Manaus via SISREG expresso) → óculos entregues em 30 dias via correio. 142 crianças com óculos pendentes + 1.840 adultos sem correção = 1.982 potenciais beneficiários. Impacto escolar: +40% no rendimento. Impacto ocupacional: adulto com óculos tem produtividade 28% maior (OMS). Custo de não fazer: R$ 0 vs perda econômica de R$ 84k/criança evadida por baixa visão"},
        {"acao": "Tonometria de rastreio de glaucoma nas UBSs (> 40 anos e diabéticos)",
         "implementada": False, "custo": 18000, "prazo_meses": 2,
         "observacao": "Tonômetro de não-contato (NCT): R$ 9.000/unidade × 2 UBSs = R$ 18.000. Protocolo: PIO > 21 mmHg + suspeita de escavação em fundoscopia → encaminhar ao oftalmologista via SISREG urgente. Rastreio: todo paciente > 40 anos em qualquer consulta → PIO medida em 2 minutos. Diabéticos + hipertensos: rastreio semestral (risco aumentado). Glaucoma precoce detectado: colírio timolol R$ 8,40/mês = controla PIO por toda a vida. Custo de cegueira por glaucoma não tratado: R$ 84.000 vs R$ 18.000 do tonômetro = ROI 4,7:1 em apenas 1 caso de cegueira evitada. 142 cegueiras irreversíveis estimadas × R$ 84k = R$ 11,9M de passivo evitável"},
        {"acao": "Mutirão de cirurgia de catarata (parceria SES-AM / FCECON)",
         "implementada": False, "custo": 0, "prazo_meses": 3,
         "observacao": "284 pacientes em fila de catarata — 28 operados em 2025 (9,9%). Custo municipal: R$ 0 (SES-AM financia via FCECON/SUS). Logística: gestor municipal solicita mutirão à SES-AM → oftalmologistas de Manaus + equipe de anestesia → sala cirúrgica do HMM adaptada. Capacidade: 40 cirurgias/dia × 3 dias = 120 cirurgias em 1 semana = zera fila atual + margem. Material (faco + LIO monofocal): R$ 1.100/olho (MS tabela SIA/SUS). Pós-operatório: enfermeiro da UBS cuida localmente (colírio + curativo). Catarata = cirurgia mais realizada no mundo — 20 min, recuperação em 1 semana. 284 pessoas recuperando a visão em 1 semana de mutirão: custo R$ 0 para o município"},
        {"acao": "Tele-oftalmologia — retinógrafo para rastreio de retinopatia diabética",
         "implementada": False, "custo": 84000, "prazo_meses": 4,
         "observacao": "Retinógrafo portátil (Optomed Aurora ou NIDEK): R$ 84.000. Protocolo: técnico de enfermagem fotografa o fundo de olho do diabético após midríase com colírio → foto enviada ao oftalmologista via TELESSAÚDE-AM → laudo em 48h. 420 diabéticos com RD estimados: 18,4% rastreados → meta 100% em 12 meses. Custo adicional: colírio midriático (tropicamida 1%) = R$ 8,40/frasco (50 aplicações). Fotocoagulação laser (RD proliferativa confirmada): encaminhar ao FCECON/Manaus via SISREG urgente (espera cai de 280 para 45 dias com laudo tele-oftalmologia). ROI: R$ 84.000 de retinógrafo vs R$ 35,3M de passivo de cegueira por RD em Apuí"},
        {"acao": "Rastreio e tratamento de tracoma nas escolas (PSE + azitromicina)",
         "implementada": False, "custo": 12400, "prazo_meses": 2,
         "observacao": "574 crianças com tracoma estimadas. Rastreio: ACS + professor treinados identificam conjuntivite folicular (sinal de tracoma) → exame confirmado por enfermeiro (lanterna + lupa). Custo treinamento: R$ 2.400. Tratamento em massa: azitromicina 20mg/kg dose única × 574 crianças = R$ 10.000. Tratamento de contato domiciliar (família): R$ 0 (azitromicina disponível no REMUME). OMS recomenda MDA (azitromicina em massa) quando prevalência > 10%. Apuí 8,4% = abaixo do limiar de MDA mas alto o suficiente para protocolo individual. Higiene facial: divulgar nas escolas (custo R$ 0). Água no banheiro escolar: chave para prevenção (módulo Saneamento). Triquíase: encaminhar ao enfermeiro treinado para eletroepilação. Tracoma residual sem saneamento: reinfecção garantida — saneamento = solução definitiva"}
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "glaucoma_diag": 52,  "catarata_cirurgias": 18, "retinopatia_rastreados_pct": 12.4, "tracoma_escolar_pct": 10.4, "oculos_criancas": 12},
        {"ano": "2023", "glaucoma_diag": 62,  "catarata_cirurgias": 22, "retinopatia_rastreados_pct": 14.4, "tracoma_escolar_pct": 9.4,  "oculos_criancas": 18},
        {"ano": "2024", "glaucoma_diag": 74,  "catarata_cirurgias": 24, "retinopatia_rastreados_pct": 16.4, "tracoma_escolar_pct": 9.0,  "oculos_criancas": 22},
        {"ano": "2025", "glaucoma_diag": 84,  "catarata_cirurgias": 28, "retinopatia_rastreados_pct": 18.4, "tracoma_escolar_pct": 8.4,  "oculos_criancas": 28},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Glaucoma diagnosticados (meta: 100%)",        "valor": 10.0, "meta": 100.0,"unidade": "%",    "status": "critico", "observacao": "10% detectados (84/842). 142 com cegueira irreversível estimada. Tonômetro: R$ 18k → rastreio de toda a população > 40 anos. Colírio timolol: R$ 8,40/mês = controla PIO por toda a vida"},
        {"indicador": "Cirurgias de catarata realizadas vs fila",    "valor": 9.9,  "meta": 100.0,"unidade": "%",    "status": "critico", "observacao": "28 de 284 na fila (9,9%). Custo municipal: R$ 0. Mutirão SES-AM: 120 cirurgias em 1 semana. 284 cegos por catarata = todos recuperáveis"},
        {"indicador": "Retinopatia diabética rastreada",             "valor": 18.4, "meta": 100.0,"unidade": "%",    "status": "critico", "observacao": "18,4% rastreados (meta 100%). Retinógrafo: R$ 84k. Passivo de cegueira: R$ 35,3M. ROI 420:1"},
        {"indicador": "Crianças com óculos (do total que precisam)", "valor": 19.7, "meta": 100.0,"unidade": "%",    "status": "critico", "observacao": "28/142 com óculos (19,7%). Programa Olhar Brasil: R$ 0 para o município. -40% no rendimento escolar sem correção. Custo de não fazer: R$ 84k/criança evadida"},
        {"indicador": "Tracoma (prevalência escolar)",               "valor": 8.4,  "meta": 5.0,  "unidade": "%",    "status": "critico", "observacao": "8,4% (574 crianças). MDA azitromicina: R$ 12.400. Tracoma = cegueira prevenível por antibiótico + higiene + saneamento"}
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/condicoes")
def condicoes():
    return _CONDICOES


@router.get("/acoes")
def acoes():
    return _ACOES


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
