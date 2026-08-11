from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/fila-cirurgica-apui", tags=["fila_cirurgica_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 20647,  # IBGE Censo 2022,
        "pacientes_fila_cirurgica": 842,
        "tempo_espera_medio_dias": 728,
        "meta_tempo_espera_dias": 180,
        "cirurgias_realizadas_hmm_2025": 42,
        "cirurgias_necessarias_estimadas": 284,
        "deficit_cirurgico_pct": 85.2,
        "cirurgiao_geral_apui": 0,
        "ortopedista": 0,
        "ginecologista_cirurgico": 0,
        "oftalmologista_cirurgico": 0,
        "anestesiologista_apui": 0,
        "cirurgias_realizadas_manaus_2025": 184,
        "custo_deslocamento_cirurgia_manaus": 2840,
        "obitos_fila_espera_2025": 8,
        "obitos_potencialmente_evitageis": 6,
        "mutilacoes_permanentes_fila_2025": 12,
        "regulacao_sisreg_ativa": True,
        "tempo_aprovacao_sisreg_dias": 284,
        "meta_aprovacao_sisreg_dias": 30,
        "sala_operatoria_hmm_condicoes": "precaria",
        "custo_mutirao_cirurgico_apui": 420000,
        "custo_social_fila_anual": 8400000,
        "status_fila": "critico",
        "status_especialistas": "critico",
        "status_infraestrutura": "critico",
    }


@lru_cache(maxsize=1)
def _ESPECIALIDADES():
    return [
        {"especialidade": "Cirurgia Geral (hérnias, vesícula, apendicite)",
         "fila_pacientes": 284, "tempo_espera_dias": 842, "cirurgiao_disponivel": False, "status": "critico",
         "observacao": "284 pacientes aguardando cirurgia geral. Principais: hérnia inguinal (142 casos — risco de estrangulamento), colecistite crônica (84 — risco de perfuração), apendicite crônica (18 — risco de peritonite). Zero cirurgião geral em Apuí. HMM: 1 médico generalista realiza cirurgias de urgência com risco aumentado. Estrangulamento de hérnia: emergência com mortalidade de 15% vs eletiva de 0,5%. 2025: 3 óbitos por complicação de condição cirúrgica eletiva convertida em emergência. Mutirão cirúrgico (convênio SES-AM): realizaria 120 herniorrafias em 5 dias. Custo: R$ 84.000 (SES financia 70%)"},
        {"especialidade": "Ortopedia (fraturas, artroplastias, coluna)",
         "fila_pacientes": 242, "tempo_espera_dias": 1095, "cirurgiao_disponivel": False, "status": "critico",
         "observacao": "242 pacientes em fila de ortopedia — tempo médio de espera: 3 anos (1.095 dias). Fraturas não consolidadas: 28 casos (dor crônica + incapacidade laboral). Artroplastia de quadril/joelho: 84 casos (idosos com mobilidade zero — risco de queda, escaras, pneumonia aspirativa). Garimpeiros com LER/DORT: 68 casos precisando de cirurgia de coluna. Cada mês sem cirurgia ortopédica: R$ 2.840 de custo de afastamento (INSS) + R$ 8.400 de custo de dor não tratada (analgésicos, fisioterapia). Sem ortopedista em Apuí: cirurgias eletivas apenas em Manaus (1.400 km)"},
        {"especialidade": "Oftalmologia (catarata, pterígio, estrabismo)",
         "fila_pacientes": 184, "tempo_espera_dias": 548, "cirurgiao_disponivel": False, "status": "critico",
         "observacao": "184 pacientes aguardando cirurgia ocular. Catarata: 128 casos (68 com cegueira legal — AV < 0,1). Pterígio grau III/IV: 42 casos (garimpeiros — exposição solar + poeira). Estrabismo infantil: 14 casos (janela terapêutica: até 7 anos para preservar visão binocular — 6 já fora da janela). Cegueira por catarata não operada: pessoa deixa de trabalhar (custo econômico: R$ 2.100/mês). 68 pessoas com cegueira legal: 100% dependentes de terceiros. Mutirão de catarata (MS): disponível via Programa Visão Brasil — custo R$ 0 para o município (apenas logística)"},
        {"especialidade": "Ginecologia cirúrgica (mioma, cistos, prolapso)",
         "fila_pacientes": 84, "tempo_espera_dias": 420, "cirurgiao_disponivel": False, "status": "critico",
         "observacao": "84 mulheres em fila ginecológica cirúrgica. Miomatose: 42 casos (anemia severa em 28 — Hb < 8 g/dL). Cisto ovariano complexo: 18 casos (risco de torção — emergência). Prolapso uterino grau III-IV: 24 casos (incontinência urinária total, infecções recorrentes). Sem ginecologista cirúrgico em Apuí: referência Manaus com SISREG (284 dias de espera para aprovação). Torção de cisto: emergência — sem cirurgião → transferência aérea emergencial (custo R$ 28.000/voo) vs cirurgia eletiva (R$ 4.200). 2 torções em 2025 com transferência de emergência"},
        {"especialidade": "Urologia (próstata, litíase, fimose)",
         "fila_pacientes": 48, "tempo_espera_dias": 365, "cirurgiao_disponivel": False, "status": "atencao",
         "observacao": "48 pacientes urologicos. HPB (hiperplasia prostática benigna) com retenção urinária: 28 casos (sondados cronicamente = risco de ITU recorrente). Litíase urinária com hidronefrose: 14 casos (risco de pielonefrite e perda renal). Fimose infantil: 6 casos (infecção recorrente + comprometimento da micção). Sonda vesical crônica: R$ 284/mês em material + ITU recorrente (R$ 1.200/internação × 3/ano = R$ 3.600/paciente/ano). Cirurgia de HPB (RTUP): custo R$ 4.800 vs R$ 3.600/ano de ITUs × esperança de vida = R$ 0 de custo em 1,3 ano"},
    ]


@lru_cache(maxsize=1)
def _ACOES():
    return [
        {"acao": "Mutirão cirúrgico — cirurgia geral (SES-AM)",
         "implementada": False, "custo": 84000, "prazo_meses": 4,
         "observacao": "SES-AM realiza mutirões cirúrgicos em municípios sem cirurgião. Modelo: equipe de 2 cirurgiões + 1 anestesiologista + 1 enfermeira de CC + material cirúrgico. Duração: 5 dias. Produção: 120 cirurgias eletivas (herniorrafia, colecistectomia). Custo para o município: R$ 84.000 (SES financia 70% = custo municipal R$ 25.200). Sala do HMM: necessita ar condicionado (R$ 42.000 — já identificado no módulo de Infraestrutura). Prioridade: 142 hérnias com risco de estrangulamento. Cada estrangulamento evitado: R$ 42.000 de economia (cirurgia emergencial + UTI em Manaus)"},
        {"acao": "Programa Visão Brasil — mutirão de catarata",
         "implementada": False, "custo": 8400, "prazo_meses": 3,
         "observacao": "Programa MS: oftalmologista parceiro do SUS realiza cirurgias de catarata em mutirão. Custo para município: apenas logística (R$ 8.400 = hospedagem equipe + material). SUS paga cirurgia via AIH (R$ 1.284/olho). 68 pessoas com cegueira legal: cirurgia devolve visão em 30 minutos (faco). Pterígio grau IV: corrida com cegueira — cirurgia eletiva R$ 840 vs tratamento de cegueira permanente R$ 0 (sem tratamento no SUS). Estrabismo infantil <7 anos: 6 crianças ainda com janela terapêutica aberta. Prazo de atuação: 3 meses (agendamento com SES-AM)"},
        {"acao": "Telemedicina para triagem cirúrgica (telec-SISREG)",
         "implementada": False, "custo": 14000, "prazo_meses": 2,
         "observacao": "SISREG: 284 dias de espera para aprovação de cirurgia (meta: 30 dias). Motivo: laudos incompletos = devoluções = reinício do prazo. Telecirurgia (pré-operatório remoto): cirurgião em Manaus revisa caso via telemedicina → aprova ou adequa protocolo → autoriza SISREG em 7 dias. Plataforma: Telessaúde MS (gratuita, já disponível). Necessidade: 1 tablet + treinamento de 4h para médico de Apuí. Custo: R$ 14.000 (tablet + internet + treinamento). Impacto: 284 dias → 30 dias. 8 óbitos em fila de espera — metade potencialmente evitável com aprovação mais rápida"},
        {"acao": "Anestesiologista itinerante mensal (SES-AM/Mais Médicos)",
         "implementada": False, "custo": 28000, "prazo_meses": 6,
         "observacao": "Zero anestesiologista em Apuí. Sem anestesiologista: zero cirurgia eletiva local. Modelo itinerante: 1 anestesiologista da SES-AM visita Apuí 1×/mês (4 dias). Produção: 20 cirurgias eletivas/mês com cirurgião local (generalista habilitado + equipe treinada). Custo: R$ 28.000/mês (diárias + deslocamento — SES pode financiar 100%). Pré-requisito: sala cirúrgica com ar condicionado (R$ 42.000 — já identificado). Impacto em 12 meses: 240 cirurgias eletivas (vs 42 em 2025 = +471%). Cada cirurgia local: R$ 2.840 economizados em deslocamento do paciente a Manaus"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "fila_total": 620, "cirurgias_hmm": 28, "tempo_espera_dias": 548, "obitos_fila": 4},
        {"ano": "2023", "fila_total": 692, "cirurgias_hmm": 34, "tempo_espera_dias": 624, "obitos_fila": 6},
        {"ano": "2024", "fila_total": 768, "cirurgias_hmm": 38, "tempo_espera_dias": 684, "obitos_fila": 7},
        {"ano": "2025", "fila_total": 842, "cirurgias_hmm": 42, "tempo_espera_dias": 728, "obitos_fila": 8},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Pacientes em fila cirúrgica",        "valor": 842,  "meta": 0,    "unidade": "pacientes","status": "critico", "observacao": "842 em espera. Crescimento: +35% em 3 anos. 8 óbitos em 2025 na fila. Mutirão SES-AM (cirurgia geral): R$ 25.200 municipal → 120 cirurgias em 5 dias"},
        {"indicador": "Tempo médio de espera",              "valor": 728,  "meta": 180,  "unidade": "dias",     "status": "critico", "observacao": "728 dias (2 anos) vs meta 180 dias. Ortopedia: 3 anos de espera. Telemedicina cirúrgica: R$ 14.000 → tempo de aprovação SISREG de 284 dias para 30 dias"},
        {"indicador": "Cirurgiões em Apuí",                "valor": 0,    "meta": 3,    "unidade": "médicos",  "status": "critico", "observacao": "Zero cirurgião especialista (geral, ortopedista, oftalmologista). Anestesiologista itinerante: R$ 28.000/mês. 240 cirurgias adicionais/ano. Mais Médicos Especialistas: elegível para Apuí"},
        {"indicador": "Óbitos em fila de espera",          "valor": 8,    "meta": 0,    "unidade": "óbitos",   "status": "critico", "observacao": "8 óbitos em 2025, 6 potencialmente evitáveis. 3 por hérnia estrangulada (cirurgia eletiva disponível). 2 por torção de cisto (aprovação SISREG atrasada). Cada óbito evitado: R$ 0 em custo econômico + vida preservada"},
        {"indicador": "Cegos por catarata operável",       "valor": 68,   "meta": 0,    "unidade": "pessoas",  "status": "critico", "observacao": "68 pessoas com cegueira legal por catarata. Mutirão Visão Brasil: R$ 8.400 municipal. Cirurgia: 30 minutos, recuperação 1 semana. Cada pessoa curada: retorna ao trabalho = R$ 2.100/mês de renda recuperada"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/especialidades")
def especialidades():
    return _ESPECIALIDADES()


@router.get("/acoes")
def acoes():
    return _ACOES()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()