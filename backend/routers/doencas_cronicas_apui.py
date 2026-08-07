from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/doencas-cronicas-apui", tags=["doencas_cronicas_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "populacao_estimada": 18732,  # IBGE Censo 2022,
        "has_diagnosticados": 2840,
        "has_prevalencia_estimada_pct": 28.0,
        "has_diagnosticados_estimados_pct": 41.1,
        "has_em_tratamento_pct": 64.2,
        "has_controlados_pct": 38.4,
        "meta_has_controlados_pct": 70.0,
        "dm_diagnosticados": 840,
        "dm_prevalencia_estimada_pct": 8.4,
        "dm_em_tratamento_pct": 72.4,
        "dm_hba1c_controlados_pct": 42.4,
        "meta_dm_controlados_pct": 60.0,
        "hiperdia_cadastrados": 3684,
        "hiperdia_acompanhamento_ativo_pct": 58.4,
        "meta_hiperdia_pct": 85.0,
        "ami_casos_ano": 12,
        "ami_trombólise_local": False,
        "ami_transfer_manaus_km": 784,
        "ami_tempo_porta_tpa_media_min": 0,
        "avc_casos_ano": 18,
        "avc_tpa_disponivel": False,
        "drc_estadio_3_5_pacientes": 84,
        "drc_diálise_manaus_pacientes": 28,
        "dpoc_diagnosticados": 284,
        "dpoc_espirometria_disponivel": False,
        "obesidade_grau_2_3_pct": 22.4,
        "status_has": "critico",
        "status_dm": "critico",
        "status_cardiovascular": "critico",
    }


@lru_cache(maxsize=1)
def _CONDICOES():
    return [
        {
            "condicao": "Hipertensão Arterial (HAS)",
            "diagnosticados": 2840,
            "prevalencia_estimada": 6900,
            "diagnostico_pct": 41.1,
            "tratamento_pct": 64.2,
            "controlados_pct": 38.4,
            "meta_controle_pct": 70.0,
            "status": "critico",
            "complicacoes_ano": {"ami": 12, "avc": 18, "drc": 84, "retinopatia": 48},
            "observacao": "58,9% não diagnosticados — HIPERDIA com acompanhamento ativo 58,4%. Sal de cozinha e alimentação hipersódica são determinantes culturais de difícil modificação sem nutricionista (apenas 1 para 24.700 hab)"
        },
        {
            "condicao": "Diabetes Mellitus (DM)",
            "diagnosticados": 840,
            "prevalencia_estimada": 2075,
            "diagnostico_pct": 40.5,
            "tratamento_pct": 72.4,
            "controlados_pct": 42.4,
            "meta_controle_pct": 60.0,
            "status": "critico",
            "complicacoes_ano": {"amputações": 4, "cecidade_retinopatia": 8, "drc_dialise": 12, "internação_cetoacidose": 8},
            "observacao": "HbA1c disponível apenas via TFD (Manaus) — acompanhamento glicêmico baseado em glicemia capilar. Insulina NPH desabastecida 3 meses em 2025. 4 amputações/ano evitáveis com pé diabético sistematizado"
        },
        {
            "condicao": "Doença Renal Crônica (DRC)",
            "diagnosticados": 84,
            "prevalencia_estimada": 148,
            "diagnostico_pct": 56.8,
            "tratamento_pct": 33.3,
            "controlados_pct": None,
            "meta_controle_pct": None,
            "status": "critico",
            "complicacoes_ano": {"necessita_dialise": 28, "peritoneal_domiciliar": 0, "hemodiálise_manaus": 28},
            "observacao": "28 pacientes em hemodiálise em Manaus (784 km) — TFD R$ 284k/mês apenas para DRC dialítica. Sem nefrologista no município: estadiamento tardio, chegando em diálise sem preparo de fístula"
        },
        {
            "condicao": "DPOC / Doenças Respiratórias Crônicas",
            "diagnosticados": 284,
            "prevalencia_estimada": 640,
            "diagnostico_pct": 44.4,
            "tratamento_pct": 58.4,
            "controlados_pct": 38.4,
            "meta_controle_pct": 60.0,
            "status": "atencao",
            "complicacoes_ano": {"exacerbacoes_graves": 48, "internacoes": 28, "obitos": 4},
            "observacao": "Espirometria não disponível — diagnóstico clínico sem confirmação funcional. Queimadas (sazonais) e garimpo (particulado, mercúrio) pioram o controle. Salbutamol e budesonida disponíveis mas corticoide inalatório sem nebulizador"
        },
        {
            "condicao": "Obesidade Grau II/III",
            "diagnosticados": 553,
            "prevalencia_estimada": 1900,
            "diagnostico_pct": 29.1,
            "tratamento_pct": 28.4,
            "controlados_pct": 12.4,
            "meta_controle_pct": 40.0,
            "status": "atencao",
            "complicacoes_ano": {"cirurgia_bariatrica_tfd": 4, "diabetes_incidente": 84, "has_incidente": 120},
            "observacao": "Transição nutricional — desnutrição e obesidade coexistindo. CAPS Metabólico não implantado. Cirurgia bariátrica via TFD (4/ano): fila 18 meses, custo R$ 18k/procedimento"
        },
    ]


@lru_cache(maxsize=1)
def _EVENTOS_CARDIOVASCULARES():
    return [
        {"evento": "Infarto Agudo do Miocárdio (IAM)", "casos_ano": 12, "obitos_hospitais": 4, "obitos_pre_hospitalar": 3, "fibrinolise_local": False, "tempo_porta_dispositivo_min": 0, "observacao": "Zero trombolíticos disponíveis — IAM = transfer 784 km (8-12h). 25% de mortalidade pré-hospitalar. Meta STEMI: reperfusão em 120 min impossível em Apuí"},
        {"evento": "AVC Isquêmico",                    "casos_ano": 18, "obitos_hospitais": 3, "obitos_pre_hospitalar": 2, "fibrinolise_local": False, "tempo_porta_dispositivo_min": 0, "observacao": "tPA (alteplase) não disponível — janela de 4,5h vira nada com transfer. 18 casos/ano = 18 chances desperdiçadas de neuroproteção. Sequela permanente em 72% dos sobreviventes"},
        {"evento": "Insuficiência Cardíaca (IC)",       "casos_ano": 24, "obitos_hospitais": 4, "obitos_pre_hospitalar": 0, "fibrinolise_local": None, "tempo_porta_dispositivo_min": None, "observacao": "24 internações IC/ano — sem ecocardiograma no município. Furosemida, espironolactona e carvedilol disponíveis. Descompensação por má adesão e HAS não controlada"},
        {"evento": "Morte Súbita Cardíaca",             "casos_ano": 4,  "obitos_hospitais": 0, "obitos_pre_hospitalar": 4, "fibrinolise_local": None, "tempo_porta_dispositivo_min": None, "observacao": "4 casos/ano — zero DEA (desfibrilador) em local público. SAMU com DEA mas tempo resposta 48 min. Ressuscitação pré-hospitalar impossível na prática"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "has_controlados_pct": 28.4, "dm_controlados_pct": 32.4, "hiperdia_ativo_pct": 48.4, "ami_casos": 14, "avc_casos": 22, "drc_dialise": 18},
        {"ano": "2023", "has_controlados_pct": 32.4, "dm_controlados_pct": 36.8, "hiperdia_ativo_pct": 52.4, "ami_casos": 13, "avc_casos": 20, "drc_dialise": 22},
        {"ano": "2024", "has_controlados_pct": 35.8, "dm_controlados_pct": 39.4, "hiperdia_ativo_pct": 55.8, "ami_casos": 12, "avc_casos": 19, "drc_dialise": 25},
        {"ano": "2025", "has_controlados_pct": 38.4, "dm_controlados_pct": 42.4, "hiperdia_ativo_pct": 58.4, "ami_casos": 12, "avc_casos": 18, "drc_dialise": 28},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "HAS controlada (PA < 140x90)",       "valor": 38.4, "meta": 70.0,  "unidade": "%",        "status": "critico", "observacao": "61,6% sem controle — HAS descontrolada é a principal causa de IAM, AVC e DRC em Apuí. Ausência de nutricionista e educador físico limita intervenção não farmacológica. Consulta médica HIPERDIA: média 2,4/paciente/ano (meta 4)"},
        {"indicador": "DM controlada (HbA1c < 7%)",         "valor": 42.4, "meta": 60.0,  "unidade": "%",        "status": "critico", "observacao": "HbA1c disponível apenas em Manaus via TFD — controle glicêmico baseado em glicemia capilar. Insulina NPH desabastecida 3 meses em 2025: 184 pacientes em ruptura terapêutica. 4 amputações/ano evitáveis"},
        {"indicador": "HIPERDIA com acompanhamento ativo",  "valor": 58.4, "meta": 85.0,  "unidade": "%",        "status": "critico", "observacao": "41,6% dos cadastrados sem acompanhamento regular — zona rural e ribeirinha com visitas ESF mensais impossíveis. Falta de ACS em 38% das microáreas dificulta busca ativa de faltosos"},
        {"indicador": "IAM — reperfusão em < 120 min",      "valor": 0,    "meta": 100.0, "unidade": "% casos",  "status": "critico", "observacao": "Zero fibrinolíticos disponíveis em Apuí. Transfer 784 km (8-12h) torna reperfusão impossível. 3 mortes pré-hospitalares/ano por IAM que teria sobrevivido com trombolítico (R$ 1.200/dose) na UPA"},
        {"indicador": "AVC — tPA em < 4,5h",                "valor": 0,    "meta": 100.0, "unidade": "% elegíveis","status": "critico","observacao": "Alteplase não disponível — 18 AVC/ano sem chance de neuroproteção. 72% de sequela permanente. Custo da sequela (cadeira de rodas, cuidador, pensão por invalidez) supera 100x o custo do tPA em 1 ano"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/condicoes")
def condicoes():
    return _CONDICOES()


@router.get("/eventos-cardiovasculares")
def eventos_cardiovasculares():
    return _EVENTOS_CARDIOVASCULARES()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()