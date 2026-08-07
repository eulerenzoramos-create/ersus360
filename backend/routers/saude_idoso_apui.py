from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-idoso-apui", tags=["saude_idoso_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 18732,  # IBGE Censo 2022,
        "idosos_60_mais": 2284,
        "idosos_pct_populacao": 9.2,
        "idosos_80_mais": 284,
        # Quedas
        "queda_idoso_2025": 184,
        "fratura_quadril_2025": 28,
        "obito_fratura_quadril_1ano_pct": 28.4,
        "avaliacao_risco_queda_pct": 18.4,
        "meta_avaliacao_queda_pct": 100.0,
        # Demência
        "demencia_estimados": 342,
        "demencia_diagnosticados": 84,
        "demencia_diagnostico_pct": 24.6,
        "alzheimer_estimados": 228,
        "cuidador_treinado_pct": 12.4,
        "caps_idoso_apui": False,
        # Polifarmácia
        "polifarmacia_5mais_pct": 42.4,
        "meta_polifarmacia_pct": 20.0,
        "reacao_adversa_medicamento_2025": 84,
        "internacao_ram_2025": 28,
        "reconciliacao_medicamentosa_pct": 8.4,
        # Funcionalidade
        "idoso_dependente_avd_pct": 28.4,
        "ilpi_apui": False,
        "cras_idoso_cobertura_pct": 42.4,
        "caderneta_idoso_apui_pct": 28.4,
        "meta_caderneta_pct": 100.0,
        # Vacinas
        "influenza_idoso_pct": 62.4,
        "meta_influenza_pct": 90.0,
        "pneumococo_idoso_pct": 42.4,
        "herpes_zoster_disponivel": False,
        # Profissionais
        "geriatra_apui": 0,
        "fisioterapeuta_apui": 1,
        "nutricionista_apui": 0,
        "assistente_social_apui": 1,
        "status_queda": "critico",
        "status_demencia": "critico",
        "status_polifarmacia": "critico",
    }


@lru_cache(maxsize=1)
def _CONDICOES():
    return [
        {"condicao": "Quedas e fraturas — principal causa de óbito evitável em idosos",
         "casos_2025": 184, "obitos_relacionados": 8, "custo_estimado": 2016000,
         "status": "critico",
         "observacao": "184 quedas em idosos registradas em 2025. 28 fraturas de quadril — mortalidade em 1 ano: 28,4% (8 óbitos). Fratura de quadril: internação média 14 dias + reabilitação 6 meses = R$ 42.000/caso. Custo total: 28 × R$ 42.000 = R$ 1,176M/ano. Avaliação de risco de queda (Escala de Morse): 18,4% dos idosos avaliados (meta 100%). Prevenção: tapete antiderrapante + corrimão + iluminação noturna = R$ 280/domicílio. Fisiote de reabilitação (exercício de equilíbrio): -40% de quedas (Otago Programme). Vitamina D: deficiência em 68,4% dos idosos de Apuí — R$ 0,28/cápsula = -22% de quedas. Caderneta do Idoso: avaliação de risco de queda integrada — 28,4% com caderneta preenchida."},
        {"condicao": "Demência e Alzheimer — diagnóstico tardio e zero suporte",
         "casos_2025": 84, "obitos_relacionados": 12, "custo_estimado": 840000,
         "status": "critico",
         "observacao": "342 casos estimados de demência em Apuí (15% dos idosos > 65a). 84 diagnosticados (24,6%). 228 casos de Alzheimer estimados — 56 diagnosticados. Diagnóstico tardio: estádio moderado/grave = dependência total + cuidador 24h. Mini-Mental State Examination (MMSE): teste de 10 min, gratuito, disponível para qualquer profissional treinado. CAPS Idoso: zero em Apuí. Donepezila (Alzheimer leve-moderado): REMUME — disponível. Memantina: 0 no REMUME local. Cuidador: 12,4% com treinamento formal. Grupo de apoio a cuidadores de demência: R$ 4.200/ano (assistente social + psicólogo). 1 cuidador sem suporte: síndrome de burnout em 6 meses = abandono + institucionalização = R$ 84.000/ano."},
        {"condicao": "Polifarmácia — 5 ou mais medicamentos simultâneos",
         "casos_2025": 968, "obitos_relacionados": 6, "custo_estimado": 420000,
         "status": "critico",
         "observacao": "42,4% dos idosos com 5+ medicamentos (meta < 20%). 968 idosos em polifarmácia. 84 reações adversas a medicamentos (RAM) em 2025 + 28 internações por RAM = R$ 420.000. Critérios de Beers (2023): 28 medicamentos inapropriados para idosos — frequentemente prescritos em Apuí (benzodiazepínico, AINEs, anti-histamínico sedante). Reconciliação medicamentosa: 8,4% dos idosos (meta 100%). Farmacêutico clínico: zero em Apuí. Revisão farmacoterapêutica pelo farmacêutico: -20% de internações por RAM. Custo: R$ 84.000/ano (farmacêutico) vs R$ 420.000 de internações por RAM → ROI 5:1. Caderneta do Idoso: lista de medicamentos integrada = prevenção de interações."},
        {"condicao": "Incapacidade funcional e dependência para AVDs",
         "casos_2025": 648, "obitos_relacionados": 4, "custo_estimado": 648000,
         "status": "critico",
         "observacao": "28,4% dos idosos com dependência para atividades da vida diária (AVD). 648 idosos dependentes em Apuí. ILPI (Instituição de Longa Permanência): zero em Apuí. 142 idosos com dependência severa sem suporte formal — apenas cuidador familiar. Índice de Barthel: avaliação de funcionalidade em 10 min — 8,4% dos idosos avaliados. Centro de Referência do Idoso (CRI): inexistente em Apuí. Fisioterapeuta no eMulti: 1 para 648 dependentes = cobertura < 10%. CRAS: 42,4% dos idosos dependentes com acompanhamento — Benefício de Prestação Continuada (BPC/LOAS) em 184 idosos (84 aguardando concessão). Plano de Cuidado do Idoso (PCI): ferramenta gratuita do MS — 12,4% com PCI elaborado."},
        {"condicao": "Cobertura vacinal em idosos — Influenza e Pneumococo",
         "casos_2025": 0, "obitos_relacionados": 4, "custo_estimado": 168000,
         "status": "atencao",
         "observacao": "Influenza em idosos: 62,4% vacinados (meta 90%). 2.284 idosos × 37,6% sem vacina = 860 idosos suscetíveis à gripe. Influenza grave em idoso: 7 dias de internação = R$ 4.200. Pneumococo 23-valente: 42,4% vacinados (meta 90%). Pneumonia por pneumococo em idoso: mortalidade 28% + internação UTI = R$ 28.000/caso. Herpes Zoster (vacina Shingrix): não disponível no SUS — única vacina com impacto em dor neuropática (neuralgia pós-herpética) em idosos. 4 óbitos por influenza/pneumonia em idosos 2025. Meta SBI/SBIm: pneumococo + influenza anual = -60% de hospitalização respiratória em idosos."},
    ]


@lru_cache(maxsize=1)
def _ACOES():
    return [
        {"acao": "Programa de prevenção de quedas — avaliação de risco + exercício de equilíbrio",
         "implementada": False, "custo": 14000, "prazo_meses": 3,
         "observacao": "18,4% avaliados (meta 100%). 28 fraturas de quadril/ano × R$ 42.000 = R$ 1,176M. Programa Otago (fisioterapeuta + exercícios domiciliares): -40% quedas. Custo: R$ 14.000 (fisioterapeuta 4h/sem + materiais). Vitamina D 1.000 UI/dia: R$ 0,28/cápsula (REMUME) = -22% quedas. Adaptação domiciliar: tapete + corrimão + iluminação = R$ 280/domicílio × 142 idosos de alto risco = R$ 39.760. ROI: R$ 1,176M evitados vs R$ 53.760 investidos = ROI 22:1."},
        {"acao": "Rastreamento de demência — MMSE na Caderneta do Idoso (meta: 100% dos idosos 70+)",
         "implementada": False, "custo": 8400, "prazo_meses": 3,
         "observacao": "24,6% diagnosticados de 342 estimados. MMSE: 10 min, gratuito, qualquer profissional. Treinamento equipe UBS: R$ 8.400. Donepezila (Alzheimer leve-moderado): REMUME disponível. Diagnóstico precoce (leve): intervenção não-farmacológica + donepezila = sobrevida funcional +3 anos. Grupo de apoio a cuidadores: R$ 4.200/ano. 1 cuidador em burnout + institucionalização: R$ 84.000/ano vs grupo de apoio R$ 4.200 = ROI 20:1."},
        {"acao": "Revisão farmacoterapêutica — Critérios de Beers para idosos em polifarmácia",
         "implementada": False, "custo": 0, "prazo_meses": 2,
         "observacao": "42,4% em polifarmácia. 28 internações por RAM/ano = R$ 420.000. Critérios de Beers: lista de medicamentos inapropriados para idosos (benzodiazepínicos, AINEs crônicos, anticolinérgicos). Protocolo de revisão: farmacêutico + médico de família. Custo do protocolo: R$ 0 (usar farmacêutico já existente). Suspensão de BZD (deprescrição): reduz quedas -50% + melhora cognição. Meta: 100% dos idosos com 5+ medicamentos revistos em 6 meses."},
        {"acao": "Caderneta do Idoso — implantação 100% + Plano de Cuidado Individual",
         "implementada": False, "custo": 14000, "prazo_meses": 3,
         "observacao": "28,4% com Caderneta do Idoso preenchida (meta 100%). Caderneta: avaliação funcional + risco de queda + lista de medicamentos + vacinação + cognição. MS distribui gratuitamente. Custo de implantação: R$ 14.000 (treinamento ACS + enfermeiros). Plano de Cuidado do Idoso (PCI): formulário gratuito — 12,4% com PCI. ACS: visita domiciliar mensal a idosos em vulnerabilidade. BPC/LOAS: 84 aguardando concessão — ACS acompanha processo no CRAS."},
        {"acao": "Alcançar meta de vacinação em idosos — influenza 90% + pneumococo 90%",
         "implementada": False, "custo": 4200, "prazo_meses": 2,
         "observacao": "Influenza: 62,4% (meta 90%). Pneumococo: 42,4% (meta 90%). Busca ativa: ACS com lista nominal de idosos não vacinados → visita domiciliar + vacinação in loco. Custo: R$ 4.200 (combustível + caixas térmicas). 860 idosos sem influenza + 1.314 sem pneumococo = risco de hospitalização × R$ 4.200-28.000/internação. Meta: vacinação de 400 idosos/mês × 3 meses = campanha zerada."},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "queda": 210, "fratura_quadril": 34, "demencia_diag": 62, "polifarmacia_pct": 48.4, "influenza_pct": 52.4},
        {"ano": "2023", "queda": 200, "fratura_quadril": 31, "demencia_diag": 70, "polifarmacia_pct": 46.4, "influenza_pct": 56.4},
        {"ano": "2024", "queda": 192, "fratura_quadril": 29, "demencia_diag": 78, "polifarmacia_pct": 44.4, "influenza_pct": 59.4},
        {"ano": "2025", "queda": 184, "fratura_quadril": 28, "demencia_diag": 84, "polifarmacia_pct": 42.4, "influenza_pct": 62.4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Fratura de quadril em idosos (meta: tendência -10%/ano)", "valor": 28,   "meta": 25,   "unidade": "casos",  "status": "critico", "observacao": "28 casos 2025. Mortalidade 1 ano: 28,4%. Otago + Vit D: R$ 14.000 → ROI 22:1. Avaliação de Morse: 18,4% dos idosos."},
        {"indicador": "Demência diagnosticada (estimativa 342 casos)",           "valor": 84,   "meta": 342,  "unidade": "diag.",  "status": "critico", "observacao": "24,6% diagnosticados. MMSE: R$ 0. Treinamento: R$ 8.400. Grupo cuidadores: R$ 4.200. Donepezila no REMUME."},
        {"indicador": "Polifarmácia ≥ 5 medicamentos (meta: < 20%)",            "valor": 42.4, "meta": 20.0, "unidade": "%",      "status": "critico", "observacao": "42,4%. Critérios Beers: deprescrição = -50% quedas + -20% RAM. Revisão: farmacêutico já existente."},
        {"indicador": "Caderneta do Idoso (meta: 100%)",                        "valor": 28.4, "meta": 100.0,"unidade": "%",      "status": "critico", "observacao": "28,4%. MS distribui gratuitamente. Treinamento: R$ 14.000. ACS visita idosos vulneráveis mensalmente."},
        {"indicador": "Influenza em idosos (meta: ≥ 90%)",                      "valor": 62.4, "meta": 90.0, "unidade": "%",      "status": "atencao", "observacao": "62,4%. Busca ativa: R$ 4.200 → +400 idosos/mês. Pneumococo: 42,4% (meta 90%)."},
        {"indicador": "Geriatra em Apuí (meta: ≥ 1)",                          "valor": 0,    "meta": 1,    "unidade": "médicos","status": "critico", "observacao": "Zero. Tele-geriatria TELESSAÚDE-AM: avaliação em 10 dias. Médico de família treinado em geriatria: UNASUS EAD."},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/condicoes")
def condicoes():
    return _CONDICOES()


@router.get("/acoes")
def acoes():
    return _ACOES()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()