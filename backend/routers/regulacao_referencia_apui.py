from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/regulacao-referencia-apui", tags=["regulacao_referencia_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 18732,  # IBGE Censo 2022,
        # SISREG
        "solicitacoes_sisreg_pendentes": 2840,
        "tempo_medio_espera_dias": 184,
        "meta_tempo_espera_dias": 30,
        "solicitacoes_inseridas_mes": 284,
        "solicitacoes_reguladas_mes": 142,
        "taxa_regulacao_pct": 50.0,
        # Filas por especialidade
        "espera_ortopedia_dias": 240,
        "espera_cardiologia_dias": 320,
        "espera_urologia_dias": 320,
        "espera_neurologia_dias": 420,
        "espera_oftalmologia_dias": 280,
        "espera_gastroenterologia_dias": 184,
        "espera_ginecologia_dias": 210,
        "espera_psiquiatria_dias": 480,
        # Estrutura regulação
        "central_regulacao_municipal_apui": False,
        "regulador_medico_apui": 0,
        "operador_sisreg_apui": 1,
        "telessaude_apui": True,
        "telessaude_consultorias_mes": 18,
        "meta_telessaude_mes": 100,
        # Exames complementares
        "espera_tomografia_dias": 84,
        "espera_ressonancia_dias": 210,
        "espera_ecografia_abdome_dias": 42,
        "ecografo_apui": 1,
        "tomografo_apui": False,
        "laboratorio_municipal_apui": True,
        "exames_laboratoriais_per_capita": 1.2,
        "meta_exames_per_capita": 3.0,
        # Transporte sanitário
        "ambulancia_uti_apui": 0,
        "ambulancia_basica_apui": 2,
        "transporte_sanitario_agendado_mes": 84,
        "transporte_sanitario_urgencia_mes": 28,
        "custo_transporte_manaus_ida_volta": 2800,
        "pacientes_perdidos_consulta_pct": 28.4,
        "status_regulacao": "critico",
        "status_filas": "critico",
        "status_transporte": "critico",
    }


@lru_cache(maxsize=1)
def _FILAS():
    return [
        {"especialidade": "Psiquiatria",
         "espera_dias": 480, "meta_dias": 30, "fila_estimada": 284,
         "status": "critico",
         "observacao": "480 dias de espera para consulta psiquiátrica (meta 30 dias). 284 pacientes na fila. 11 suicídios em 2025 = 1/mês. Crise psiquiátrica: 480 dias → paciente aguarda em sofrimento ativo ou morre. Solução imediata: tele-psiquiatria (TELESSAÚDE-AM) → consulta em 10 dias. Custo: R$ 0 (serviço já disponível em Apuí). Equipe eMulti: psicólogo e assistente social já existentes → pré-triagem e estabilização enquanto aguarda a regulação. CAPS: solicitação formal ao Estado (critério 20k hab — Apuí atende)."},
        {"especialidade": "Neurologia",
         "espera_dias": 420, "meta_dias": 30, "fila_estimada": 148,
         "status": "critico",
         "observacao": "420 dias de espera para neurologia. AVC em paciente hipertenso não regulado em 30 dias: sequela permanente. Tele-neurologia (TELESSAÚDE-AM): disponível — 18 consultorias/mês realizadas (meta 100). Hematoma subdural + hidrocefalia + epilepsia: casos que aguardam 420 dias com progressão neurológica. RM de crânio: 210 dias no SISREG. Ressonância em Humaitá: 1 aparelho para toda a região sul do AM. Eletroencefalograma (EEG): apenas Manaus (280km)."},
        {"especialidade": "Cardiologia",
         "espera_dias": 320, "meta_dias": 30, "fila_estimada": 208,
         "status": "critico",
         "observacao": "320 dias de espera para cardiologia. 8 óbitos por IAM em homens < 60a em 2025. Paciente pós-IAM sem cardiologista = risco de novo evento em 30 dias. Tele-cardiologia: ECG digitalizável + laudo em 24h (TELESSAÚDE-AM). Ecocardiograma: HGH-Humaitá (espera 84 dias). Troponina I: disponível no laboratório municipal. Cateterismo: Manaus FHAJ/HSJLM. Stent: FHAJ Manaus (6 meses de espera). IAM com supra: apenas fibrinólise em Apuí (estreptoquinase disponível, mas protocolo desatualizado)."},
        {"especialidade": "Urologia",
         "espera_dias": 320, "meta_dias": 30, "fila_estimada": 124,
         "status": "critico",
         "observacao": "320 dias para urologista. 72,4% dos cânceres de próstata em estádio tardio. PSA alterado em março + consulta em janeiro do ano seguinte = câncer avançado. Tele-urologia: PSA + exame físico + idade → laudo em 5 dias (TELESSAÚDE-AM). RTUP (ressecção transuretral de próstata): HGH-Humaitá (espera 4 meses). Litotripsia extracorpórea: apenas Manaus. Cálculo renal obstrutivo: dor refratária → internação em Apuí enquanto aguarda regulação."},
        {"especialidade": "Oftalmologia",
         "espera_dias": 280, "meta_dias": 30, "fila_estimada": 168,
         "status": "critico",
         "observacao": "280 dias para oftalmologista. 142 cegueiras irreversíveis por glaucoma + 284 na fila de catarata. Catarata operada: visão restaurada em 100% dos casos (custo R$ 0 via SUS). Catarata não operada: cegueira permanente. Tele-oftalmologia: foto do fundo + laudo em 48h (TELESSAÚDE-AM). Retinografia: câmera não-midriática em HGH-Humaitá. Mutirão de catarata: SES-AM envia oftalmologista + equipe por 1 semana = 40 cirurgias/dia. Custo: R$ 84.000 (SES-AM custeia). Laser de retina (RD/glaucoma): Manaus FHAJ."},
        {"especialidade": "Ortopedia",
         "espera_dias": 240, "meta_dias": 30, "fila_estimada": 312,
         "status": "critico",
         "observacao": "240 dias para ortopedia. 312 pacientes na fila. Fratura de quadril em idoso: sem cirurgia em 48h = mortalidade 30%/ano. Apuí: ortopedia de urgência feita por cirurgião geral. Artroplastia de quadril: Manaus (12 meses de espera). LCA + menisco: HGH-Humaitá (6 meses de espera). Fraturas com tração: internação em Apuí enquanto aguarda. Infiltração de corticoide (artrose): ortopedista em Humaitá (240 dias de espera). Fisioterapia: eMulti cobre 20% da demanda ortopédica."},
    ]


@lru_cache(maxsize=1)
def _ACOES():
    return [
        {"acao": "Central de Regulação Municipal — operador dedicado ao SISREG 8h/dia",
         "implementada": False, "custo": 28000, "prazo_meses": 2,
         "observacao": "Taxa de regulação: 50% (284 solicitações inseridas, 142 reguladas/mês). 2.840 pendentes. Operador dedicado: R$ 28.000/ano (1 técnico administrativo 8h/dia). Metas: inserção < 24h + regulação < 48h. Central: protocolo de priorização (urgências em 24h, eletivas por ordem). 28,4% dos pacientes perdem a consulta por falha de comunicação: SMS + ligação = adesão +42%."},
        {"acao": "Tele-saúde — expansão para 100 consultorias/mês (de 18 atuais)",
         "implementada": False, "custo": 8400, "prazo_meses": 2,
         "observacao": "18 consultorias TELESSAÚDE/mês (meta 100). 5,5× abaixo da capacidade. Disponíveis: tele-psiquiatria, tele-neurologia, tele-cardiologia, tele-dermatologia, tele-oftalmologia, tele-pediatria. Custo: R$ 8.400 (treinamento + agendamento + tablet). 1 tele-consultoria evitada = 1 deslocamento a Manaus = R$ 2.800 economizados. 100 tele-consultorias/mês = R$ 280.000/mês de deslocamento evitado. ROI 33:1."},
        {"acao": "Protocolo de transporte sanitário — mapa de rotas + fila de ambulância",
         "implementada": False, "custo": 14000, "prazo_meses": 2,
         "observacao": "2 ambulâncias básicas, 0 UTI-móvel. 28 transportes de urgência/mês + 84 eletivos. 28,4% dos pacientes perdem consulta após regulação (comunicação falha). Protocolo: ACS notifica paciente por SMS/ligação 24h antes + confirma no dia. Custo de elaboração: R$ 14.000. Ambulância UTI: R$ 280.000 (Fundo de Saúde + emenda parlamentar). SAMU: acionável para urgências via 192."},
        {"acao": "Mutirão de catarata — SES-AM envia oftalmologista por 1 semana",
         "implementada": False, "custo": 84000, "prazo_meses": 3,
         "observacao": "284 na fila de catarata. 142 cegueiras irreversíveis por glaucoma. Mutirão: SES-AM + equipe cirúrgica 1 semana = 40 cirurgias/dia × 5 dias = 200 cirurgias. Custo: R$ 84.000 (custeado pelo Estado). Catarata operada: cegueira zero + produtividade restaurada. 1 cego de catarata: custo social R$ 280.000 (cuidador + LOAS + produtividade perdida). Ofício formal ao Departamento de Regulação/SES-AM."},
        {"acao": "Linha de cuidado do AVC — protocolo FAST + fibrinólise em Apuí",
         "implementada": False, "custo": 18000, "prazo_meses": 3,
         "observacao": "AVC: 3ª causa de óbito em Apuí. Janela de fibrinólise: 4,5h do início dos sintomas. Estreptoquinase disponível em Apuí — mas protocolo desatualizado (rTPA = tratamento atual). Treinamento FAST (Face-Arm-Speech-Time): R$ 4.200. Protocolo AVC em UBS: médico reconhece FAST positivo → aciona SAMU → transporte CTI. CTI-móvel: SAMU regional (Humaitá). Tele-stroke: neurologista autoriza rTPA via tele em 30 min. Custo de 1 AVC não tratado: sequela permanente + LOAS + cuidador = R$ 840.000/vida."},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "pendentes_sisreg": 3284, "tempo_espera_dias": 210, "telessaude_mes": 8,  "transporte_mes": 92, "perdas_consulta_pct": 34.4},
        {"ano": "2023", "pendentes_sisreg": 3084, "tempo_espera_dias": 200, "telessaude_mes": 12, "transporte_mes": 94, "perdas_consulta_pct": 32.4},
        {"ano": "2024", "pendentes_sisreg": 2984, "tempo_espera_dias": 192, "telessaude_mes": 15, "transporte_mes": 96, "perdas_consulta_pct": 30.4},
        {"ano": "2025", "pendentes_sisreg": 2840, "tempo_espera_dias": 184, "telessaude_mes": 18, "transporte_mes": 98, "perdas_consulta_pct": 28.4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Solicitações pendentes SISREG",                  "valor": 2840, "meta": 0,    "unidade": "solicitações","status": "critico", "observacao": "2.840 pendentes. Regulação: 50%. Operador dedicado: R$ 28.000/ano. Meta: inserção < 24h + regulação < 48h."},
        {"indicador": "Tempo médio de espera (meta: ≤ 30 dias)",        "valor": 184,  "meta": 30,   "unidade": "dias",       "status": "critico", "observacao": "184 dias (6,1× meta). Psiquiatria: 480d. Neurologia: 420d. Cardiologia: 320d. Tele-saúde: espera → 10 dias."},
        {"indicador": "Tele-saúde consultorias/mês (meta: 100)",        "valor": 18,   "meta": 100,  "unidade": "consultorias","status": "critico", "observacao": "18/mês (meta 100). Expansão: R$ 8.400. 1 consultoria = R$ 2.800 de deslocamento evitado. ROI 33:1."},
        {"indicador": "Pacientes que perdem consulta após regulação",   "valor": 28.4, "meta": 5.0,  "unidade": "%",          "status": "critico", "observacao": "28,4%. SMS + ligação 24h antes: -42% de perda. Custo: R$ 0 (chip municipal)."},
        {"indicador": "Ambulância UTI-móvel (meta: ≥ 1)",               "valor": 0,    "meta": 1,    "unidade": "veículos",   "status": "critico", "observacao": "Zero. Custo: R$ 280.000 (Fundo Municipal + emenda). IAM + AVC + neonatal: todos transportados em ambulância básica."},
        {"indicador": "Fila de catarata (meta: zero / mutirão anual)",  "valor": 284,  "meta": 0,    "unidade": "pacientes",  "status": "critico", "observacao": "284 na fila. Mutirão SES-AM: R$ 84.000. 200 cirurgias em 1 semana. 1 cego de catarata: R$ 280.000 de custo social."},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/filas")
def filas():
    return _FILAS()


@router.get("/acoes")
def acoes():
    return _ACOES()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()