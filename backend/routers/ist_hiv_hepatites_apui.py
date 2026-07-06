from fastapi import APIRouter

router = APIRouter(prefix="/api/ist-hiv-hepatites-apui", tags=["ist_hiv_hepatites_apui"])

_DASHBOARD = {
    "sifilis_adquirida_casos_ano": 48,
    "sifilis_adquirida_incidencia_100k": 194,
    "sifilis_congenita_casos_ano": 18,
    "sifilis_congenita_por_1k_nv": 18.0,
    "meta_sifilis_congenita_por_1k_nv": 0.5,
    "hiv_novos_casos_ano": 12,
    "hiv_incidencia_100k": 48.6,
    "pvhiv_total": 84,
    "pvhiv_tarv_pct": 78.4,
    "meta_pvhiv_tarv_pct": 95.0,
    "pvhiv_carga_indetectavel_pct": 58.4,
    "meta_carga_indetectavel_pct": 73.0,
    "hepatite_b_casos_ano": 22,
    "hepatite_c_casos_ano": 8,
    "hepatite_b_incidencia_100k": 89.0,
    "testagem_ubs_cobertura_pct": 48.4,
    "meta_testagem_pct": 80.0,
    "preservativos_distribuidos_ano": 24000,
    "profilaxia_prep_usuarios": 4,
    "profilaxia_pep_dispensacoes_ano": 12,
    "coinfeccao_tb_hiv_pct": 18.2,
    "gestantes_testadas_sifilis_pct": 84.2,
    "gestantes_testadas_hiv_pct": 82.4,
    "tratamento_sifilis_parceiro_pct": 28.4,
    "meta_tratamento_parceiro_pct": 70.0,
    "status_sifilis_congenita": "critico",
    "status_tarv": "critico",
    "status_testagem": "critico",
}

_SIFILIS = [
    {"categoria": "Sífilis adquirida — 15 a 24 anos", "casos": 18, "pct": 37.5, "tratamento_oportuno_pct": 68.4, "parceiro_tratado_pct": 28.4, "status": "critico"},
    {"categoria": "Sífilis adquirida — 25 a 39 anos", "casos": 16, "pct": 33.3, "tratamento_oportuno_pct": 72.4, "parceiro_tratado_pct": 31.2, "status": "critico"},
    {"categoria": "Sífilis em gestante",              "casos": 9,  "pct": 18.8, "tratamento_oportuno_pct": 78.4, "parceiro_tratado_pct": 28.4, "status": "critico"},
    {"categoria": "Sífilis adquirida — demais faixas","casos": 5,  "pct": 10.4, "tratamento_oportuno_pct": 80.0, "parceiro_tratado_pct": 40.0, "status": "atencao"},
]

_HEPATITES = [
    {"agravo": "Hepatite B aguda",    "casos_ano": 8,  "incidencia_100k": 32.4, "vacinacao_pct": 72.4, "meta_vacina_pct": 95.0, "status": "critico"},
    {"agravo": "Hepatite B crônica",  "casos_ano": 14, "incidencia_100k": 56.7, "vacinacao_pct": 72.4, "meta_vacina_pct": 95.0, "status": "critico"},
    {"agravo": "Hepatite C",          "casos_ano": 8,  "incidencia_100k": 32.4, "vacinacao_pct": None,  "meta_vacina_pct": None,  "status": "critico"},
    {"agravo": "Hepatite A",          "casos_ano": 28, "incidencia_100k": 113.4,"vacinacao_pct": 84.2, "meta_vacina_pct": 95.0,  "status": "atencao"},
    {"agravo": "Hepatite D (delta)",  "casos_ano": 4,  "incidencia_100k": 16.2, "vacinacao_pct": None,  "meta_vacina_pct": None,  "status": "critico"},
]

_HISTORICO = [
    {"ano": "2022", "sifilis_adq": 38, "sifilis_cong": 14, "hiv_novos": 8,  "hepatite_b": 18, "pvhiv_tarv_pct": 68.4},
    {"ano": "2023", "sifilis_adq": 42, "sifilis_cong": 15, "hiv_novos": 10, "hepatite_b": 20, "pvhiv_tarv_pct": 72.4},
    {"ano": "2024", "sifilis_adq": 46, "sifilis_cong": 17, "hiv_novos": 11, "hepatite_b": 21, "pvhiv_tarv_pct": 75.2},
    {"ano": "2025", "sifilis_adq": 48, "sifilis_cong": 18, "hiv_novos": 12, "hepatite_b": 22, "pvhiv_tarv_pct": 78.4},
]

_INDICADORES = [
    {"indicador": "Sífilis congênita (por 1k NV)",       "valor": 18.0, "meta": 0.5,  "unidade": "/1k NV", "status": "critico", "observacao": "18,0/1k NV vs meta 0,5 — 36× acima da meta de eliminação. Reflexo direto da baixa testagem de parceiros (28,4%) e início tardio do tratamento na gestação. Crime de saúde pública evitável com penicilina benzatina"},
    {"indicador": "PVHIV em TARV",                       "valor": 78.4, "meta": 95.0, "unidade": "%",       "status": "critico", "observacao": "21,6% das PVHIV sem antirretroviral — risco individual de progressão para AIDS e risco coletivo de transmissão. Barreira: distância, estigma, falta de busca ativa"},
    {"indicador": "Carga viral indetectável",             "valor": 58.4, "meta": 73.0, "unidade": "%",       "status": "atencao", "observacao": "41,6% das PVHIV com carga detectável — indetectável = intransmissível (U=U). Meta UNAIDS 73%. Adesão ao TARV comprometida pela distância ao serviço"},
    {"indicador": "Testagem IST nas UBS",                 "valor": 48.4, "meta": 80.0, "unidade": "%",       "status": "critico", "observacao": "51,6% da população elegível sem testagem — diagnóstico tardio alimenta a cadeia de transmissão. Testes rápidos disponíveis, mas busca ativa inexistente"},
    {"indicador": "Tratamento do parceiro (sífilis)",     "valor": 28.4, "meta": 70.0, "unidade": "%",       "status": "critico", "observacao": "71,6% dos parceiros de casos de sífilis não tratados — principal razão para reinfecção e manutenção da sífilis congênita em níveis altíssimos"},
    {"indicador": "Hepatite B — cobertura vacinal",       "valor": 72.4, "meta": 95.0, "unidade": "%",       "status": "critico", "observacao": "22,6 pp abaixo da meta — populações ribeirinhas e garimpeiros com acesso à vacina limitado. Hepatite D (delta) é superendêmica na Amazônia e só pode ser prevenida com vacina B"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/sifilis")
def sifilis():
    return _SIFILIS


@router.get("/hepatites")
def hepatites():
    return _HEPATITES


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
