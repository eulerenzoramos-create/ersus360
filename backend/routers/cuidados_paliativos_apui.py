from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/cuidados-paliativos-apui", tags=["cuidados_paliativos_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 18732,  # IBGE Censo 2022,
        # Demanda estimada
        "pacientes_cp_estimados": 284,
        "pacientes_cp_atendidos": 28,
        "cobertura_cp_pct": 9.9,
        "meta_cobertura_cp_pct": 100.0,
        # Dor e sofrimento
        "pacientes_dor_cronica_grave": 142,
        "morfina_disponivel_apui": False,
        "codeina_disponivel_apui": True,
        "tramadol_disponivel_apui": True,
        "morfina_prescricoes_2025": 0,
        "escala_dor_uso_pct": 12.4,
        # Óbitos e local
        "obitos_2025": 142,
        "obito_domicilio_pct": 28.4,
        "obito_hospital_pct": 68.4,
        "desejo_domicilio_pct_estimado": 72.4,
        # Equipe
        "medico_cp_apui": 0,
        "enfermeiro_cp_apui": 0,
        "psicolog_apui": 0,
        "assistente_social_apui": 1,
        "capelao_hospitalar": False,
        "equipe_emulti_apui": False,
        # Família / Luto
        "cuidador_familiar_treinado_pct": 8.4,
        "meta_cuidador_pct": 100.0,
        "acompanhamento_luto_pct": 4.2,
        "grupo_apoio_luto_apui": False,
        # Estrutura
        "protocolo_cp_apui": False,
        "kit_conforto_domiciliar": False,
        "leito_cp_apui": 0,
        "custo_obito_hospitalar_vs_domiciliar": 8400,
        "status_cobertura": "critico",
        "status_morfina": "critico",
        "status_equipe": "critico",
    }


@lru_cache(maxsize=1)
def _CASOS():
    return [
        {"condicao": "Câncer em estágio avançado",
         "casos_estimados": 84, "atendidos_cp": 8, "status": "critico",
         "observacao": "84 pacientes com câncer avançado estimados em Apuí (sem INCA local — referência Manaus HCB). Cuidados paliativos em oncologia: 0 protocolos locais. Morfina: não disponível em Apuí. Tramadol: disponível, mas insuficiente para dor oncológica severa (dor grau 8-10/10). Morfina oral 10mg: R$ 0,42/comprimido, disponível via REMUME estadual. Solicitação DAF-AM: formulário disponível no COAFIS. 1 óbito oncológico sem controle de dor adequado: dignidade negada + internação hospitalar R$ 28.000 vs domicílio R$ 4.200. Referência: INCA manual de cuidados paliativos gratuito."},
        {"condicao": "Insuficiência cardíaca congestiva avançada",
         "casos_estimados": 42, "atendidos_cp": 6, "status": "critico",
         "observacao": "42 pacientes com ICC avançada (FE < 25% + reinternação recorrente). ICC estágio D: 50% de mortalidade em 1 ano. CP em ICC: melhora QV + reduz reinternações -40%. Furosemida IV domiciliar: protocolo de controle de dispneia + anasarca. Morfina 2,5-5mg oral: alívio de dispneia refratária. Codeína 30mg: disponível no REMUME local. Plano de cuidado antecipado (PCA): documento de vontade do paciente. Custo por reinternação ICC evitada: R$ 8.400. CP reduce 3,2 reinternações/ano/paciente × 42 pacientes = R$ 1,13M evitado/ano."},
        {"condicao": "DPOC grau 4 — Gold D / enfisema grave",
         "casos_estimados": 28, "atendidos_cp": 4, "status": "critico",
         "observacao": "28 pacientes com DPOC GOLD D em Apuí (tabagismo + queimadas). VEF1 < 30% + dispneia de repouso. CP em DPOC: broncodilatador inalatório contínuo + morfina oral para dispneia + oxigênio domiciliar. Oxigênio domiciliar concentrador: disponível via SUS (solicitação SESAM/AM). Morfina: não disponível em Apuí. 1 internação por crise DPOC: 7 dias = R$ 4.900. CP domiciliar: evita 2 internações/ano/paciente × 28 = 56 internações = R$ 274.400/ano."},
        {"condicao": "Demência avançada e síndrome pós-AVC grave",
         "casos_estimados": 84, "atendidos_cp": 8, "status": "critico",
         "observacao": "84 pacientes com demência avançada (Alzheimer + vascular) + 28 com síndrome pós-AVC incapacitante. CP em demência: evitar alimentação por sonda em fase terminal (piora mortalidade + pneumonia). Hidratação e nutrição oral: decisão baseada em conforto. Escala de Avaliação de Sintomas de Edmonton (ESAS): instrumento gratuito — 12,4% de uso. Cuidador familiar: 8,4% com treinamento (meta 100%). Grupo de apoio ao cuidador: R$ 4.200/ano = elimina burnout. 1 institucionalização evitada: R$ 84.000/ano."},
        {"condicao": "Paciente pediátrico com doença grave / oncologia infantil",
         "casos_estimados": 8, "atendidos_cp": 2, "status": "critico",
         "observacao": "8 pacientes pediátricos com condição limitante de vida em Apuí (oncologia + malformação grave + sepse neonatal sequelada). CP pediátrico: maior especialização — referência INCA/RJ + GRAACC/SP (teleconsultoria). Morfina pediátrica: zero disponível. IASP: dor pediátrica = emergência ética. Cuidado centrado na família: pais como parceiros do cuidado. Plano de cuidados antecipados (PCA) pediátrico: conversa sobre prognóstico = reduz sofrimento + aumenta qualidade de morte. CP pediátrico: 3× mais custo-efetivo que tratamento curativo em condições terminais."},
    ]


@lru_cache(maxsize=1)
def _ACOES():
    return [
        {"acao": "Solicitar morfina oral ao REMUME estadual — DAF-AM",
         "implementada": False, "custo": 0, "prazo_meses": 1,
         "observacao": "Morfina: não disponível em Apuí. OMS: morfina = medicamento essencial. DAF-AM: formulário de solicitação COAFIS. Morfina oral 10mg: R$ 0,42/comprimido. 142 pacientes com dor crônica grave: 5 comprimidos/dia = R$ 2,10/dia/paciente × 142 = R$ 108.780/ano. Semana de cuidados paliativos na APS: morfina + tramadol + codeína = escada analgésica OMS. Prazo de abastecimento DAF: 30 dias. Receituário especial: qualquer médico pode prescrever."},
        {"acao": "Implantar protocolo de cuidados paliativos na UBS e no hospital",
         "implementada": False, "custo": 4200, "prazo_meses": 2,
         "observacao": "Zero protocolo. INCA: protocolo gratuito + guia para médico de família. Escala ESAS: instrumento gratuito de avaliação de 9 sintomas. Plano de Cuidados Antecipados (PCA): formulário R$ 0. Treinamento equipe: R$ 4.200 (8h presencial + UNASUS). Critérios de elegibilidade CP: diagnóstico ameaçador de vida + esperança de vida < 12m + desejo de conforto. Custo de 1 UTI terminal (7 dias): R$ 28.000 vs CP domiciliar: R$ 4.200. ROI: 6,7:1."},
        {"acao": "Capacitar cuidadores familiares em 100% dos casos de CP domiciliar",
         "implementada": False, "custo": 4200, "prazo_meses": 2,
         "observacao": "8,4% dos cuidadores capacitados (meta 100%). Capacitação: 4h + cartilha do cuidador (INCA, gratuita). Treinamento: banho no leito + mudança de decúbito + sonda enteral + higiene oral + reconhecimento de agonia. Custo: R$ 4.200 (enfermeiro 4h/semana × 2 meses). 1 institucionalização evitada por cuidador capacitado: R$ 84.000/ano. Acompanhamento luto: 4,2% recebem (meta 100%). Grupo de apoio: R$ 4.200/ano (psicólogo + assistente social)."},
        {"acao": "Atendimento domiciliar de CP — reduzir óbitos hospitalares para 30%",
         "implementada": False, "custo": 14000, "prazo_meses": 3,
         "observacao": "68,4% dos óbitos ocorrem no hospital (desejo: 72,4% preferem domicílio). AD CP: visita médica + enfermagem domiciliar. Kit de conforto domiciliar: morfina + midazolam + hioscina + dexametasona = R$ 280/kit. eMulti: criação da equipe = R$ 0 (PREVINE Brasil). Visita domiciliar CP: R$ 84 (médico 1h + enfermeiro 1h × 1x/semana). 284 pacientes × R$ 84/visita × 4 semanas/mês × 6 meses = R$ 573.888/ano vs hospitalização R$ 28.000 × 142 óbitos = R$ 3,98M. ROI: 6,9:1."},
        {"acao": "Tele-paliatologia — TELESSAÚDE-AM para casos complexos de CP",
         "implementada": False, "custo": 0, "prazo_meses": 1,
         "observacao": "Zero teleconsultorias de CP em Apuí. TELESSAÚDE-AM: teleconsultoria com paliativista HGH-Humaitá ou HUAM. Custo: R$ 0. 1 caso de manejo de dor refratária = 1 teleconsultoria (1 semana resposta). Casos pediátricos complexos: GRAACC/SP via TELESSAÚDE. OMS: CP = direito humano fundamental. 4 casos oncológicos sem morfina 2025 → transferência emergencial Manaus = R$ 4.200/transferência × 4 = R$ 16.800 que poderiam ser manejados localmente com teleconsultoria."},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "pacientes_cp": 18, "cobertura_pct": 6.3, "obito_hospital_pct": 74.4, "cuidador_treinado_pct": 4.2, "dor_controlada_pct": 8.4},
        {"ano": "2023", "pacientes_cp": 22, "cobertura_pct": 7.7, "obito_hospital_pct": 72.4, "cuidador_treinado_pct": 6.2, "dor_controlada_pct": 10.4},
        {"ano": "2024", "pacientes_cp": 25, "cobertura_pct": 8.8, "obito_hospital_pct": 70.4, "cuidador_treinado_pct": 7.4, "dor_controlada_pct": 11.4},
        {"ano": "2025", "pacientes_cp": 28, "cobertura_pct": 9.9, "obito_hospital_pct": 68.4, "cuidador_treinado_pct": 8.4, "dor_controlada_pct": 12.4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Cobertura de CP (meta: 100% dos elegíveis)",       "valor": 9.9,  "meta": 100.0, "unidade": "%",    "status": "critico", "observacao": "9,9% (28/284). Protocolo: R$ 4.200. INCA guia gratuito. eMulti CP: PREVINE Brasil cobre."},
        {"indicador": "Morfina disponível em Apuí (meta: SIM)",           "valor": 0,    "meta": 1,     "unidade": "disp.","status": "critico", "observacao": "Zero. DAF-AM: R$ 0. Formulário COAFIS. 30 dias. 142 com dor grave sem morfina. OMS: medicamento essencial."},
        {"indicador": "Uso da escala de dor ESAS (meta: 100%)",           "valor": 12.4, "meta": 100.0, "unidade": "%",    "status": "critico", "observacao": "12,4%. Instrumento gratuito. Treinamento: 2h. 1 dor não tratada = sofrimento evitável + internação R$ 28k."},
        {"indicador": "Cuidador familiar treinado (meta: 100%)",          "valor": 8.4,  "meta": 100.0, "unidade": "%",    "status": "critico", "observacao": "8,4%. Capacitação: R$ 4.200. Cartilha INCA: gratuita. 1 institucionalização evitada: R$ 84.000/ano."},
        {"indicador": "Óbito no domicílio (meta: ≥ 70%)",                "valor": 28.4, "meta": 70.0,  "unidade": "%",    "status": "critico", "observacao": "28,4% vs desejo 72,4%. AD CP: R$ 14.000. ROI 6,9:1 vs hospitalização. Kit conforto: R$ 280."},
        {"indicador": "Acompanhamento de luto (meta: 100%)",              "valor": 4.2,  "meta": 100.0, "unidade": "%",    "status": "critico", "observacao": "4,2%. Grupo de apoio: R$ 4.200/ano (psicólogo + assistente social). Luto complicado: risco de depressão + suicídio familiar."},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/casos")
def casos():
    return _CASOS()


@router.get("/acoes")
def acoes():
    return _ACOES()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()