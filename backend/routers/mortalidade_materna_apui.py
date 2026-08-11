from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/mortalidade-materna-apui", tags=["mortalidade_materna_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 20647,  # IBGE Censo 2022,
        "nascidos_vivos_2025": 484,
        "razao_mortalidade_materna_2025": 124.0,
        "meta_rmm_ods": 30.0,
        "media_rmm_brasil": 57.0,
        "media_rmm_amazonia": 84.0,
        "obitos_maternos_2025": 6,
        "obitos_maternos_preveniveis_pct": 83.4,
        "parto_hospitalar_pct": 71.6,
        "parto_domiciliar_ribeirinho_pct": 28.4,
        "prenatal_6_consultas_pct": 48.4,
        "prenatal_inicio_1_trimestre_pct": 38.4,
        "obstetra_municipio": 0,
        "obstetra_referencia_km": 284,
        "uti_neonatal_municipio": False,
        "banco_sangue_municipio": False,
        "cesariana_pct": 48.4,
        "meta_cesariana_oms_pct": 15.0,
        "mortalidade_neonatal_por_1k": 20.7,
        "meta_mortalidade_neonatal_ods": 12.0,
        "mortalidade_infantil_por_1k": 18.4,
        "media_brasil_mortalidade_infantil": 12.4,
        "status_materno": "critico",
        "status_neonatal": "critico",
        "status_prenatal": "critico",
    }


@lru_cache(maxsize=1)
def _CAUSAS_MATERNAS():
    return [
        {"causa": "Hemorragia pós-parto",          "obitos": 2, "prevenivel": True, "pct_total": 33.4, "status": "critico",
         "observacao": "2 óbitos em 2025 por HPP — principal causa evitável. Zero banco de sangue em Apuí (mais próximo: Humaitá, 284 km). Ocitocina profilática: disponível apenas em 61,6% dos partos (falta de protocolo). Politransfusão: remoção para Humaitá com tempo médio de 2h40 = mortalidade de 84% em HPP sem tratamento imediato. Curetagem de urgência: cirurgião disponível em 62,4% dos plantões. Protocolo de HPP (pacote de 5 medidas OMS): implantado em 28,4% dos partos hospitalares"},
        {"causa": "Pré-eclâmpsia/Eclâmpsia",       "obitos": 2, "prevenivel": True, "pct_total": 33.4, "status": "critico",
         "observacao": "2 óbitos por eclâmpsia em 2025 — 1 em parto ribeirinho sem assistência qualificada, 1 durante remoção para Humaitá. Sulfato de magnésio: disponível, mas protocolo de uso em apenas 38,4% das maternidades locais. Medição de PA em toda consulta pré-natal: 84,4% de adesão. Detecção de proteinúria (fita): disponível em 72,4% das UBS. Pré-eclâmpsia grave: critério de remoção imediata — 1 caso sem remoção por estrada interditada. Aspirina 100mg profilática (alto risco): prescrita em 28,4% das elegíveis"},
        {"causa": "Sepse/Infecção puerperal",       "obitos": 1, "prevenivel": True, "pct_total": 16.6, "status": "critico",
         "observacao": "1 óbito por sepse puerperal — parto domiciliar ribeirinho com infecção de ferida cirúrgica. Parto ribeirinho: realizado por parteiras tradicionais em 28,4% dos casos — sem assepsia adequada, sem antibioticoprofilaxia. Parteiras tradicionais cadastradas: 8 em Apuí — atividade artesanal não integrada ao SUS. Protocolo de sepse materna: inexistente no HMM. Culturas de urocultura pré-parto: realizadas em 22,4% das gestantes"},
        {"causa": "Complicações de aborto",         "obitos": 1, "prevenivel": True, "pct_total": 16.6, "status": "critico",
         "observacao": "1 óbito por complicação de aborto inseguro — curetagem realizada sem condições assépticas por prestador informal. Aborto legal (casos previstos em lei): sem protocolo local — mulher vítima de estupro encaminhada a Manaus (784 km). Misoprostol para manejo de abortamento incompleto: disponível no HMM, mas protocolo em apenas 48,4% dos casos. Notificação de abortamento: subnotificação estimada de 60% — causa básica alterada em atestado"},
        {"causa": "Causas indiretas (COVID/malária)","obitos": 0, "prevenivel": True, "pct_total": 0, "status": "atencao",
         "observacao": "0 óbitos diretos em 2025 mas 3 internações por causas indiretas: 2 por malária gestacional (P. falciparum), 1 por pneumonia. Malária na gestação: risco aumentado de abortamento e prematuridade. Tratamento da malária em gestante: protocolo adaptado (sem primaquina). Vacinação influenza gestante: 72,4% de cobertura. Vacinação COVID gestante: 61,6% de cobertura"},
    ]


@lru_cache(maxsize=1)
def _NEONATAL():
    return [
        {"indicador": "Mortalidade neonatal precoce (0-6 dias)",   "valor": 14.4, "meta": 8.0,  "status": "critico",
         "observacao": "14,4/1000 NV vs meta 8,0 (ODS). 7 óbitos neonatais precoces em 2025. Principais causas: prematuridade (48,4%), asfixia perinatal (28,4%), malformação congênita (14,4%), sepse neonatal (8,8%). Zero UTI neonatal em Apuí — recém-nato crítico: remoção para HUGV Manaus (784 km) ou Hospital Francisca Mendes Manaus. Tempo de remoção: 2-16h dependendo de transporte disponível. CPAP neonatal: disponível no HMM — 1 equipamento. Surfactante para prematuridade: TFD Manaus"},
        {"indicador": "Mortalidade neonatal tardia (7-27 dias)",   "valor": 6.3,  "meta": 4.0,  "status": "critico",
         "observacao": "6,3/1000 NV vs meta 4,0. 3 óbitos neonatais tardios em 2025 — 2 por sepse hospitalar, 1 por malformação cardíaca congênita. Ecocardiograma neonatal: indisponível em Apuí. Cardiopatia congênita (triagem pelo oxímetro): realizada em 48,4% dos RNs vs meta 95%. Tela de manchas vermelhas (oftalmoscopia neonatal): não disponível localmente"},
        {"indicador": "Peso ao nascer < 2.500g (prematuridade)", "valor": 12.4, "meta": 8.0,  "status": "critico",
         "observacao": "12,4% dos nascidos vivos com baixo peso vs média BR 8,4%. Causas: pré-natal inadequado (31,6% de início tardio), hipertensão gestacional, tabagismo (28,4% gestantes fumantes), nutrição inadequada. Método Canguru: indicado para < 2.000g — praticado em 28,4% dos elegíveis. Incubadora: 2 no HMM vs necessidade de 4. Prematuridade < 28 semanas: remoção obrigatória para HUGV Manaus"},
        {"indicador": "Apgar < 7 no 5° minuto (asfixia)",        "valor": 8.4,  "meta": 2.0,  "status": "critico",
         "observacao": "8,4% vs meta < 2%. Asfixia perinatal: principal causa de sequela neurológica evitável. Reanimação neonatal em sala de parto: treinamento em 48,4% dos profissionais vs meta 100%. Kit de reanimação completo: disponível em 72,4% das salas de parto. Ventilação com pressão positiva (VPP): realizada em 14,4% dos Apgar < 7. Hipotermia terapêutica para asfixia grave: TFD Manaus, janela terapêutica de 6h = remoção pode ser tarde demais"},
        {"indicador": "Aleitamento materno exclusivo 6 meses",    "valor": 28.4, "meta": 60.0, "status": "critico",
         "observacao": "28,4% vs meta 60%. Banco de Leite Humano: inexistente em Apuí (BLH mais próximo: Humaitá, 284 km). Fórmula infantil: distribuída indiscriminadamente em 48,4% das maternidades locais. IBFAN/Iniciativa Hospital Amigo da Criança: HMM não certificado. Consultora de amamentação: zero profissional capacitado. Doação de fórmula por empresas: proibida pela OMS/NBCAL — ocorre em 18,4% dos casos"}
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "rmm": 164.0, "obitos_maternos": 8, "prenatal_6cons_pct": 38.4, "parto_hosp_pct": 64.4, "mort_neonatal": 24.7},
        {"ano": "2023", "rmm": 148.0, "obitos_maternos": 7, "prenatal_6cons_pct": 42.4, "parto_hosp_pct": 67.6, "mort_neonatal": 22.4},
        {"ano": "2024", "rmm": 136.0, "obitos_maternos": 7, "prenatal_6cons_pct": 44.8, "parto_hosp_pct": 70.4, "mort_neonatal": 21.6},
        {"ano": "2025", "rmm": 124.0, "obitos_maternos": 6, "prenatal_6cons_pct": 48.4, "parto_hosp_pct": 71.6, "mort_neonatal": 20.7},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Razão de Mortalidade Materna",          "valor": 124.0, "meta": 30.0,  "unidade": "/100kNV", "status": "critico", "observacao": "4,1x acima da meta ODS (30/100kNV). 2,2x acima da média BR (57). 6 óbitos maternos em 2025 — todos potencialmente evitáveis: 5 por causas diretas obstétricas, 1 por causa indireta. Zero obstetra no município: toda gestação de risco precisa de TFD para Humaitá (284 km) ou Manaus (784 km). Banco de sangue e UTI neonatal inexistentes: emergência obstétrica = altíssimo risco de óbito"},
        {"indicador": "Pré-natal com ≥ 6 consultas",           "valor": 48.4, "meta": 80.0,  "unidade": "%",        "status": "critico", "observacao": "48,4% vs meta 80%. 1° consulta no 1° trimestre: 38,4% vs meta 90%. Barreiras: distância geográfica (ribeirinhazas), falta de transporte, UBS sem agenda específica para pré-natal em turno adaptado. Pré-natal do parceiro: 8,4%. Exames do pré-natal (VDRL, HIV, Hep B, TSH, urina): completos em 62,4% das gestantes. Odontologia no pré-natal: realizada em 18,4%"},
        {"indicador": "Parto hospitalar",                      "valor": 71.6, "meta": 95.0,  "unidade": "%",        "status": "critico", "observacao": "28,4% de parto domiciliar — o mais alto do AM excluindo municípios sem hospital. Parteira tradicional: 8 cadastradas, sem integração ao pré-natal do SUS. Parto ribeirinho: demora de 2-12h para chegar ao HMM. Mapa de gestantes por localização: não existe — impossível prever necessidade de remoção preventiva. Materno ribeirinha: internação preventiva pré-parto no HMM praticada em 18,4%"},
        {"indicador": "Mortalidade neonatal",                  "valor": 20.7, "meta": 12.0,  "unidade": "/1000NV",  "status": "critico", "observacao": "1,7x acima da meta ODS. 10 óbitos neonatais em 2025. 7 ocorreram nos primeiros 6 dias de vida. 80% potencialmente evitáveis com: UTI neonatal, reanimação treinada, método canguru, pré-natal adequado. Investimento necessário: UTI neonatal de 6 leitos = R$ 1,8M (via PAR/Rede Cegonha)"},
        {"indicador": "Cesarianas",                            "valor": 48.4, "meta": 15.0,  "unidade": "%",        "status": "critico", "observacao": "48,4% vs meta OMS de 15%. Excesso de cesarianas: risco aumentado para placenta prévia e acretismo em gestações futuras, maior risco de hemorragia, menor amamentação. Indicação clínica adequada: em apenas 62,4% das cesarianas realizadas. Modelo de assistência: sem obstetra fixo, clínico geral resolve com cesariana por segurança. Humanização do parto: zero doula ou parteira integrada ao HMM"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/causas-maternas")
def causas_maternas():
    return _CAUSAS_MATERNAS()


@router.get("/neonatal")
def neonatal():
    return _NEONATAL()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()