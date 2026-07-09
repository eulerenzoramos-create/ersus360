from fastapi import APIRouter

router = APIRouter(prefix="/api/reabilitacao-apui", tags=["reabilitacao_apui"])

_DASHBOARD = {
    "crie_implantado": False,
    "cer_referencia": "Humaitá/AM",
    "cer_distancia_km": 284,
    "cer_tempo_horas": 6.5,
    "populacao_estimada_deficiencia": 2840,
    "pct_populacao_total": 11.4,
    "beneficiarios_bpc": 384,
    "pacientes_fisioterapia_municipio": 148,
    "fisioterapeutas_sus": 2,
    "fisioterapeutas_necessarios": 6,
    "lista_espera_reab": 284,
    "tempo_medio_espera_meses": 8.4,
    "meta_espera_meses": 3.0,
    "cadeirantes_necessidade": 128,
    "cadeirantes_atendidos_ano": 42,
    "cadeirantes_atendimento_pct": 32.8,
    "status_crie": "critico",
    "status_espera": "critico",
    "status_cobertura": "critico",
}

_DEFICIENCIAS = [
    {"tipo": "Deficiência física / motora",    "estimativa": 1284, "pct": 45.2, "bpc_beneficiarios": 148, "cobertura_reab_pct": 22.4, "status": "critico"},
    {"tipo": "Deficiência intelectual",         "estimativa": 568,  "pct": 20.0, "bpc_beneficiarios": 112, "cobertura_reab_pct": 18.4, "status": "critico"},
    {"tipo": "Deficiência auditiva",            "estimativa": 412,  "pct": 14.5, "bpc_beneficiarios": 64,  "cobertura_reab_pct": 12.8, "status": "critico"},
    {"tipo": "Deficiência visual",              "estimativa": 284,  "pct": 10.0, "bpc_beneficiarios": 38,  "cobertura_reab_pct": 8.4,  "status": "critico"},
    {"tipo": "Deficiência múltipla",            "estimativa": 212,  "pct": 7.5,  "bpc_beneficiarios": 18,  "cobertura_reab_pct": 6.2,  "status": "critico"},
    {"tipo": "Transtorno do Espectro Autista",  "estimativa": 80,   "pct": 2.8,  "bpc_beneficiarios": 4,   "cobertura_reab_pct": 5.0,  "status": "critico"},
]

_SERVICOS = [
    {"servico": "Fisioterapia ambulatorial",     "disponivel": True,  "profissionais": 2, "vagas_mes": 96,  "demanda_estimada": 384, "cobertura_pct": 25.0, "status": "critico"},
    {"servico": "Fonoaudiologia",                "disponivel": True,  "profissionais": 1, "vagas_mes": 48,  "demanda_estimada": 284, "cobertura_pct": 16.9, "status": "critico"},
    {"servico": "Terapia Ocupacional",           "disponivel": False, "profissionais": 0, "vagas_mes": 0,   "demanda_estimada": 212, "cobertura_pct": 0.0,  "status": "critico"},
    {"servico": "Psicologia (reab.)",            "disponivel": True,  "profissionais": 1, "vagas_mes": 32,  "demanda_estimada": 184, "cobertura_pct": 17.4, "status": "critico"},
    {"servico": "APAE / Educação especial",      "disponivel": True,  "profissionais": 4, "vagas_mes": 64,  "demanda_estimada": 128, "cobertura_pct": 50.0, "status": "atencao"},
    {"servico": "CAPS (saúde mental)",           "disponivel": True,  "profissionais": 8, "vagas_mes": 148, "demanda_estimada": 284, "cobertura_pct": 52.1, "status": "atencao"},
    {"servico": "CRIE (Reab. Intelectual)",      "disponivel": False, "profissionais": 0, "vagas_mes": 0,   "demanda_estimada": 568, "cobertura_pct": 0.0,  "status": "critico"},
    {"servico": "AASI / Aparelho auditivo",      "disponivel": False, "profissionais": 0, "vagas_mes": 0,   "demanda_estimada": 412, "cobertura_pct": 0.0,  "status": "critico"},
]

_HISTORICO = [
    {"ano": "2022", "pacientes_fisio": 112, "bpc_novos": 48, "dispensados_orteses": 28, "encaminhados_cer": 84},
    {"ano": "2023", "pacientes_fisio": 128, "bpc_novos": 52, "dispensados_orteses": 32, "encaminhados_cer": 92},
    {"ano": "2024", "pacientes_fisio": 138, "bpc_novos": 58, "dispensados_orteses": 36, "encaminhados_cer": 98},
    {"ano": "2025", "pacientes_fisio": 148, "bpc_novos": 64, "dispensados_orteses": 42, "encaminhados_cer": 112},
]

_INDICADORES = [
    {"indicador": "CRIE implantado",                 "valor": 0,    "meta": 1,     "unidade": "sim/não",   "status": "critico", "observacao": "Apuí não possui CRIE — 568 pessoas com deficiência intelectual sem reabilitação especializada. Referência: Humaitá a 284 km"},
    {"indicador": "Fisioterapeutas SUS / 10k hab.",  "valor": 0.8,  "meta": 2.4,   "unidade": "prof/10k",  "status": "critico", "observacao": "2 fisioterapeutas para população de 25k — cobertura 3× abaixo do mínimo. Lista de espera: 284 pacientes (8,4 meses)"},
    {"indicador": "Cobertura em reabilitação",       "valor": 22.4, "meta": 80.0,  "unidade": "%",         "status": "critico", "observacao": "77,6% das PCD sem qualquer serviço de reabilitação — barreira geográfica + ausência de serviços especializados"},
    {"indicador": "Dispensação de órteses/próteses", "valor": 32.8, "meta": 100.0, "unidade": "%",         "status": "critico", "observacao": "128 cadeirantes estimados, 42 atendidos/ano (32,8%) — filas de 18-24 meses para cadeiras de rodas via SUS"},
    {"indicador": "Tempo de espera para fisio.",     "valor": 8.4,  "meta": 3.0,   "unidade": "meses",     "status": "critico", "observacao": "8,4 meses vs meta 3 — piora progressiva com aumento da demanda pós-pandemia e ampliação de diagnósticos"},
    {"indicador": "Encaminhamentos para CER",        "valor": 112,  "meta": None,  "unidade": "pac./ano",  "status": "atencao", "observacao": "112 pacientes encaminhados ao CER de Humaitá — 40% abandonam o tratamento pela distância e custo de deslocamento"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/deficiencias")
def deficiencias():
    return _DEFICIENCIAS


@router.get("/servicos")
def servicos():
    return _SERVICOS


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
