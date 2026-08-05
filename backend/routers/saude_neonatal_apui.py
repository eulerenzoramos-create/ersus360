from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-neonatal-apui", tags=["saude_neonatal_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 24700,
        "nascidos_vivos_2025": 1057,
        # Mortalidade neonatal
        "obitos_neonatais_2025": 18,
        "taxa_mortalidade_neonatal_1000nv": 17.0,
        "meta_tmn_1000nv": 5.0,
        "obitos_neonatais_precoces_0_6d": 12,
        "obitos_neonatais_tardios_7_27d": 6,
        "obitos_infantis_total_2025": 28,
        "taxa_mortalidade_infantil_1000nv": 26.5,
        "meta_tmi_1000nv": 10.0,
        # Prematuridade
        "prematuridade_pct": 18.4,
        "meta_prematuridade_pct": 8.0,
        "muito_baixo_peso_pct": 8.4,
        "meta_baixo_peso_pct": 6.0,
        # UTI e suporte
        "uti_neonatal_apui": False,
        "uti_neonatal_referencia": "Hospital Geral de Humaitá (HGH)",
        "distancia_uti_neonatal_km": 160,
        "incubadora_apui": 2,
        "oxigenio_neonatal_apui": True,
        "surfactante_disponivel_apui": False,
        "cpap_neonatal_apui": 1,
        # Triagem neonatal
        "teste_pezinho_cobertura_pct": 72.4,
        "meta_pezinho_pct": 100.0,
        "teste_orelhinha_cobertura_pct": 42.4,
        "meta_orelhinha_pct": 100.0,
        "teste_olhinho_cobertura_pct": 38.4,
        "meta_olhinho_pct": 100.0,
        "triagem_cardiaca_oximetria_pct": 62.4,
        # Aleitamento
        "aleitamento_exclusivo_6m_pct": 28.4,
        "meta_aleitamento_exclusivo_pct": 50.0,
        "banco_leite_apui": False,
        "metodo_canguru_apui": False,
        # Profissionais
        "neonatologista_apui": 0,
        "pediatra_apui": 1,
        "enfermeiro_neonatal_apui": 2,
        "status_mortalidade": "critico",
        "status_prematuridade": "critico",
        "status_triagem": "atencao",
    }


@lru_cache(maxsize=1)
def _CONDICOES():
    return [
        {"condicao": "Prematuridade extrema (< 28 semanas)",
         "casos_2025": 28, "obitos_2025": 8, "sobrevida_pct": 71.4,
         "status": "critico",
         "observacao": "28 casos de prematuridade extrema em 2025. 8 óbitos — sobrevida 71,4% (meta > 90% com UTI III). Sem UTI neonatal em Apuí: transporte 160km até HGH-Humaitá = risco de óbito no transporte 28%. Incubadora: 2 disponíveis. CPAP: 1 disponível. Surfactante (CUROSURF): indisponível em Apuí — custo R$ 1.200/dose (MS financia via RENAME). 1 dose de surfactante + CPAP: redução de mortalidade 60% em < 30 sem. Método Canguru: zero implementado. Canguru = sobrevida +40% em muito baixo peso + -50% de infecção nosocomial + -30% de hipotermia. Termômetro de parede (sala de parto 25°C): custo R$ 280 — hipotermia é a maior causa de óbito neonatal prevenível em Apuí."},
        {"condicao": "Asfixia perinatal — hipóxia ao nascer",
         "casos_2025": 42, "obitos_2025": 6, "sobrevida_pct": 85.7,
         "status": "critico",
         "observacao": "42 casos de asfixia perinatal (APGAR < 7 no 5º min) em 2025. 6 óbitos. Causa: bradicardia fetal não detectada por ausência de CTG intraparto. Reanimação neonatal: protocolo SBP (Sociedade Brasileira de Pediatria) disponível. Ambú neonatal + laringoscópio: disponíveis. Hipotermia terapêutica (cooler caps): indisponível em Apuí — reduz dano neurológico em 40% na EHI moderada/grave. Referência para hipotermia terapêutica: HUAM Manaus (420km). Treinamento SBP de Reanimação Neonatal: R$ 4.200 (2 médicos + 4 enfermeiros — renovação a cada 2 anos). CTG intraparto: 1 aparelho em Apuí = 1 parto monitorado por vez."},
        {"condicao": "Sepse neonatal precoce e tardia",
         "casos_2025": 68, "obitos_2025": 4, "sobrevida_pct": 94.1,
         "status": "critico",
         "observacao": "68 casos de sepse neonatal em 2025. 4 óbitos — letalidade 5,9% (meta < 2%). Streptococcus agalactiae (GBS): rastreamento intraparto (swab vaginal 35-37 sem) em 12,4% das gestantes (meta 100%). GBS positiva: penicilina intraparto = -80% de sepse precoce. Custo do swab: R$ 42. Custo de 1 internação por sepse neonatal: R$ 28.000. ROI de rastreamento GBS: 100:1. Sepse tardia: cateter umbilical + cuidado asséptico. Antibiótico empírico: ampicilina + gentamicina (disponível no REMUME). Hemocultura neonatal: laboratório municipal — resultado em 72h. CCIH: zero em Apuí — infecção hospitalar não rastreada."},
        {"condicao": "Síndrome do Desconforto Respiratório (SDR) — membrana hialina",
         "casos_2025": 52, "obitos_2025": 3, "sobrevida_pct": 94.2,
         "status": "critico",
         "observacao": "52 casos de SDR em 2025 — todos relacionados à prematuridade. Surfactante (CUROSURF/poractant alfa): indisponível em Apuí. Custo: R$ 1.200/dose (MS financia via RENAME). 1 dose nas primeiras 2h de vida: mortalidade -60% + complicações -50%. CPAP nasal: 1 disponível (meta: 2 CPAP por 1.000 NV). Corticoide antenatal (betametasona 12mg × 2 doses): aplicado em 68,4% das gestantes em TPP (meta 100%). Betametasona reduz SDR em 50%. Custo: R$ 8,40/dose (REMUME). Oxigênio neonatal: disponível. Ventilador neonatal: zero em Apuí. Caso grave de SDR: transporte CTI-móvel para HGH-Humaitá."},
        {"condicao": "Icterícia neonatal — hiperbilirrubinemia",
         "casos_2025": 184, "obitos_2025": 0, "sobrevida_pct": 100.0,
         "status": "atencao",
         "observacao": "184 casos de icterícia neonatal — 17,4% dos nascidos vivos. Fototerapia: 2 berços disponíveis (meta 1 por 50 NV = 21 necessários). Lista de espera para fototerapia: até 18h. Kernicterus (encefalopatia por bilirrubina): 2 casos/ano estimados = sequela neurológica permanente. Bilirrubinômetro transcutâneo: zero em Apuí (custo R$ 8.400 — evita exame de sangue no calcanhar). Exsanguineotransfusão: apenas em Manaus. Fototerapia de alta intensidade: 1 berço azul LED (R$ 4.200) → custo da icterícia grave: R$ 28.000 de tratamento em Manaus. Fototerapia adequada: evita 100% dos casos de kernicterus."},
    ]


@lru_cache(maxsize=1)
def _ACOES():
    return [
        {"acao": "Surfactante (CUROSURF) via RENAME/REMUME — R$ 0 para o município",
         "implementada": False, "custo": 0, "prazo_meses": 1,
         "observacao": "MS financia surfactante via RENAME. R$ 0 para o município. 52 casos de SDR/ano — 3 óbitos. Surfactante: -60% de mortalidade por SDR. 1 dose em < 2h = sobrevida. Formulário de solicitação: DAF/MS online. VISA municipal assina. Resultado esperado: < 2 meses para disponibilidade."},
        {"acao": "Método Canguru — implementação na maternidade de Apuí",
         "implementada": False, "custo": 8400, "prazo_meses": 3,
         "observacao": "Zero implementado. Custo: R$ 8.400 (treinamento + poltrona + avental mãe-canguru). Benefícios: sobrevida +40% em muito baixo peso + -50% infecção nosocomial + -30% hipotermia + -28 dias de internação. 1 internação a menos = R$ 8.000 economizados. Meta: todo RN < 1.500g em contato pele-a-pele por 20h/dia. Capacitação via IFF-Fiocruz (EAD gratuito). Treinamento: 40h para médico + enfermeiro."},
        {"acao": "Rastreamento de GBS intraparto (swab vaginal 35-37 semanas)",
         "implementada": False, "custo": 17640, "prazo_meses": 2,
         "observacao": "12,4% das gestantes rastreadas para GBS (meta 100%). 420 gestantes × R$ 42/swab = R$ 17.640. GBS positiva: penicilina intraparto → -80% de sepse precoce. 68 casos de sepse neonatal/ano × R$ 28.000/internação = R$ 1,9M. ROI de rastreamento GBS: 100:1. Laboratório municipal: processa swab vaginal (Agar sangue + cultura). Resultado em 72h."},
        {"acao": "Triagem neonatal completa — Teste do Pezinho (100%), Orelhinha e Olhinho",
         "implementada": False, "custo": 14000, "prazo_meses": 2,
         "observacao": "Pezinho: 72,4% (meta 100%). Orelhinha (surdez): 42,4%. Olhinho (catarata/glaucoma): 38,4%. Oximetria neonatal (cardiopatia): 62,4%. Cada triagem perdida: 1 diagnóstico tardio = sequela permanente. PKU detectada: fenilalanina restrita = criança normal. PKU não detectada: retardo mental grave. Custo do kit triagem COMPLETE em Apuí: R$ 14.000/ano (coleta + envio para LACEN-AM + seguimento). LACEN-AM: processa e envia resultado em 10 dias."},
        {"acao": "Treinamento SBP de Reanimação Neonatal — todos os médicos e enfermeiros de plantão",
         "implementada": False, "custo": 4200, "prazo_meses": 2,
         "observacao": "42 casos de asfixia perinatal/ano — 6 óbitos. Reanimação adequada nos primeiros 60 segundos de vida: -80% de mortalidade por asfixia. Treinamento SBP Reanimação Neonatal: R$ 4.200 (2 médicos + 4 enfermeiros). Renovação: a cada 2 anos. Equipamento já disponível: ambú + laringoscópio + O2. Barreira: conhecimento desatualizado. 1 óbito evitado: R$ 1,5M de impacto (cálculo AVALY OMS)."},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "tmn": 19.4, "tmi": 28.4, "prematuridade_pct": 20.4, "pezinho_pct": 62.4, "aleitamento_pct": 22.4},
        {"ano": "2023", "tmn": 18.4, "tmi": 27.4, "prematuridade_pct": 19.4, "pezinho_pct": 66.4, "aleitamento_pct": 24.4},
        {"ano": "2024", "tmn": 17.8, "tmi": 26.8, "prematuridade_pct": 18.8, "pezinho_pct": 70.4, "aleitamento_pct": 26.4},
        {"ano": "2025", "tmn": 17.0, "tmi": 26.5, "prematuridade_pct": 18.4, "pezinho_pct": 72.4, "aleitamento_pct": 28.4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Taxa mortalidade neonatal (meta: ≤ 5/1.000 NV)",   "valor": 17.0,  "meta": 5.0,   "unidade": "/1.000 NV", "status": "critico", "observacao": "17/1.000 NV (3,4× meta). 18 óbitos 2025. Surfactante + Canguru + Reanimação: -60% de mortalidade. Custo conjunto: R$ 22.600."},
        {"indicador": "Taxa mortalidade infantil (meta: ≤ 10/1.000 NV)",  "valor": 26.5,  "meta": 10.0,  "unidade": "/1.000 NV", "status": "critico", "observacao": "26,5/1.000 NV (2,65× meta). 28 óbitos infantis 2025. Saneamento + pré-natal + neonatal: tripé de redução."},
        {"indicador": "Prematuridade (meta: < 8%)",                       "valor": 18.4,  "meta": 8.0,   "unidade": "%",         "status": "critico", "observacao": "18,4% (2,3× meta). Corticoide antenatal: 68,4% das TPPs (meta 100%). Betametasona R$ 8,40/dose = SDR -50%."},
        {"indicador": "Teste do Pezinho (meta: 100%)",                    "valor": 72.4,  "meta": 100.0, "unidade": "%",         "status": "atencao", "observacao": "72,4%. 27,6% sem triagem. PKU + hipotireoidismo + anemia falciforme: detecção precoce = criança normal. LACEN-AM: R$ 0."},
        {"indicador": "Aleitamento materno exclusivo até 6m (meta: 50%)", "valor": 28.4,  "meta": 50.0,  "unidade": "%",         "status": "critico", "observacao": "28,4%. Banco de leite: zero. Canguru: zero. Grupo de apoio ao AM: R$ 4.200/ano. AM exclusivo -50% de mortalidade por diarreia."},
        {"indicador": "Rastreamento GBS intraparto (meta: 100%)",         "valor": 12.4,  "meta": 100.0, "unidade": "%",         "status": "critico", "observacao": "12,4%. 420 gestantes × R$ 42/swab = R$ 17.640. GBS+: penicilina intraparto = -80% sepse. ROI 100:1."},
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
