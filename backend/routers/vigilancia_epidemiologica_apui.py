from fastapi import APIRouter

router = APIRouter(prefix="/api/vigilancia-epidemiologica-apui", tags=["vigilancia_epidemiologica_apui"])

_DASHBOARD = {
    "notificacoes_compulsorias_ano": 842,
    "doencas_monitoradas_sinan": 18,
    "completude_sinan_pct": 72.4,
    "meta_completude_pct": 95.0,
    "oportunidade_notificacao_pct": 64.2,
    "meta_oportunidade_pct": 80.0,
    "surtos_investigados_prazo_pct": 58.4,
    "meta_surtos_pct": 100.0,
    "surtos_ano": 14,
    "arboviroses_casos_ano": 284,
    "dengue_iip_aedes_pct": 4.2,
    "dengue_nivel_alerta": "alerta",
    "dengue_nivel_critico_pct": 3.9,
    "leishmaniose_visceral_casos_ano": 2,
    "raiva_vacinacao_animais_pct": 48.4,
    "leptospirose_casos_ano": 3,
    "tuberculose_incidencia_100k": 89.0,
    "hanseniase_coef_100k": 113.3,
    "sifilis_congenita_por_mil_nv": 18.4,
    "cievs_referencia": "CIEVS-AM (Manaus)",
    "distancia_cievs_km": 784,
    "epidemiologistas_municipio": 0,
    "tecnico_vigilancia": 2,
    "meta_tecnico_vigilancia": 4,
    "laboratorio_municipal": False,
    "status_sinan": "atencao",
    "status_arboviroses": "critico",
    "status_surtos": "atencao",
}

_AGRAVOS_SINAN = [
    {"agravo": "Malária",                           "casos_2025": 324, "variacao_pct": -4.4,  "incidencia_100k": 1312.0, "nivel_alerta": "critico",  "investigacao_pct": 100.0, "observacao": "IPA 51,9/1k — Grupo 3 PNCM. Transmissão ativa 12 meses/ano. P. vivax 72,4%. Notificação 100% por obrigatoriedade específica e microscopista no polo"},
    {"agravo": "Dengue / Chikungunya / Zika",       "casos_2025": 284, "variacao_pct": 18.4,  "incidencia_100k": 1150.0, "nivel_alerta": "critico",  "investigacao_pct": 64.2,  "observacao": "IIP Aedes 4,2% — acima do nível crítico (3,9%). Surto 2024-2025 com 284 casos, 2 óbitos suspeitos. Nebulização disponível mas cobertura urbana 64%, rural e ribeirinha zero"},
    {"agravo": "Sífilis (todas as formas)",         "casos_2025": 48,  "variacao_pct": 8.4,   "incidencia_100k": 194.3,  "nivel_alerta": "critico",  "investigacao_pct": 72.4,  "observacao": "Sífilis congênita 18,4/1k NV vs meta 0,5. Ascensão constante desde 2018. Diagnóstico tardio: VDRL sem resultado em tempo para iniciar tratamento ainda no pré-natal"},
    {"agravo": "Tuberculose",                       "casos_2025": 22,  "variacao_pct": -2.4,  "incidencia_100k": 89.1,   "nivel_alerta": "critico",  "investigacao_pct": 84.2,  "observacao": "8,9x a média nacional (10/100k). Cura 72,4% vs meta 85%. Abandono 18,4% — DOTS implantado parcialmente. Subnotificação estimada 30%"},
    {"agravo": "Hanseníase",                        "casos_2025": 28,  "variacao_pct": -4.8,  "incidencia_100k": 113.3,  "nivel_alerta": "critico",  "investigacao_pct": 88.4,  "observacao": "Hiperendêmico (>40/100k). Grau 2 incapacidade 22,4% (meta < 10%). Contatos examinados 48,4%"},
    {"agravo": "HIV / AIDS",                        "casos_2025": 12,  "variacao_pct": 4.2,   "incidencia_100k": 48.6,   "nivel_alerta": "atencao",  "investigacao_pct": 92.4,  "observacao": "84 PVHIV em TARV, 78,4% supressão viral. Testagem 48,4% da população (meta 60%). Garimpo e trabalho sexual são vetores de transmissão"},
    {"agravo": "Leishmaniose visceral",             "casos_2025": 2,   "variacao_pct": 0.0,   "incidencia_100k": 8.1,    "nivel_alerta": "atencao",  "investigacao_pct": 100.0, "observacao": "2 casos autóctones — reservatórios (cães) não mapeados. CCZV estruturado apenas na capital. Anfotericina B disponível na UPA para tratamento"},
    {"agravo": "Leptospirose",                      "casos_2025": 3,   "variacao_pct": 50.0,  "incidencia_100k": 12.1,   "nivel_alerta": "atencao",  "investigacao_pct": 100.0, "observacao": "3 casos (vs 2 em 2024) — lixão a céu aberto favorece proliferação de roedores. Período chuvoso amplia risco de contaminação de açudes e igarapés"},
    {"agravo": "Acidentes por animais peçonhentos", "casos_2025": 84,  "variacao_pct": -8.4,  "incidencia_100k": 340.1,  "nivel_alerta": "atencao",  "observacao": "84 acidentes: 48 serpente, 28 escorpião, 8 aranha. Soro antiofídico na UPA mas estoque crítico em 3 meses. Zona rural e ribeirinha chegam em 2-6h: necrose estabelecida antes do soro"},
    {"agravo": "Intoxicação exógena",               "casos_2025": 28,  "variacao_pct": -12.4, "incidencia_100k": 113.3,  "nivel_alerta": "atencao",  "investigacao_pct": 58.4,  "observacao": "Agrotóxico (48%), medicamento (28%), outros (24%). Subnotificação ~70% — trabalhador rural não notifica. SINITOX referência em Manaus. Mercúrio não monitorado"},
]

_SURTOS = [
    {"agravo": "Dengue",             "ano": 2025, "casos": 284, "obitos_suspeitos": 2, "duracao_semanas": 18, "status": "critico", "controle": "Parcial — nebulização + visita ACS"},
    {"agravo": "Gastroenterite",     "ano": 2025, "casos": 84,  "obitos_suspeitos": 0, "duracao_semanas": 3,  "status": "atencao", "controle": "Controlado — água contaminada (escola rural)"},
    {"agravo": "Síndrome gripal",    "ano": 2025, "casos": 648, "obitos_suspeitos": 2, "duracao_semanas": 6,  "status": "atencao", "controle": "Controlado — influenza A"},
    {"agravo": "Sarampo suspeito",   "ano": 2025, "casos": 4,   "obitos_suspeitos": 0, "duracao_semanas": 2,  "status": "atencao", "controle": "Descartado após investigação"},
    {"agravo": "Hepatite A",         "ano": 2024, "casos": 18,  "obitos_suspeitos": 0, "duracao_semanas": 4,  "status": "atencao", "controle": "Controlado — área ribeirinha sem água tratada"},
]

_HISTORICO = [
    {"ano": "2022", "notificacoes": 724, "completude_pct": 62.4, "surtos": 16, "dengue_casos": 184, "malaria_casos": 348},
    {"ano": "2023", "notificacoes": 764, "completude_pct": 66.8, "surtos": 15, "dengue_casos": 224, "malaria_casos": 338},
    {"ano": "2024", "notificacoes": 808, "completude_pct": 69.4, "surtos": 14, "dengue_casos": 264, "malaria_casos": 332},
    {"ano": "2025", "notificacoes": 842, "completude_pct": 72.4, "surtos": 14, "dengue_casos": 284, "malaria_casos": 324},
]

_INDICADORES = [
    {"indicador": "Completude SINAN",                  "valor": 72.4,  "meta": 95.0,  "unidade": "%",          "status": "atencao", "observacao": "27,6% das fichas com campos obrigatórios incompletos — impede análise epidemiológica e tomada de decisão. Zero epidemiologista no município: técnico de nível médio preenche ficha sem formação analítica. SINAN sem conectividade em UBS rurais"},
    {"indicador": "IIP Aedes aegypti",                 "valor": 4.2,   "meta": 1.0,   "unidade": "%",          "status": "critico", "observacao": "Nível de alerta (1-3,9%) ultrapassado: IIP 4,2% = risco de epidemia de dengue. 284 casos em 2025 com tendência ascendente. Agente de endemias (2) insuficiente para 24.700 hab — meta 1/2000 = 12 agentes necessários"},
    {"indicador": "Malária — IPA",                     "valor": 51.9,  "meta": 10.0,  "unidade": "/1.000 hab", "status": "critico", "observacao": "Grupo 3 PNCM (> 50/1k) — pior classificação. Garimpo ilegal impede controle ambiental. Borrifação 42,4% (meta 80%). Transmissão amazônica sem sazonalidade clara: 12 meses de risco"},
    {"indicador": "Surtos investigados no prazo",      "valor": 58.4,  "meta": 100.0, "unidade": "%",          "status": "atencao", "observacao": "41,6% dos surtos fora do prazo de investigação. CIEVS-AM em Manaus (784 km): apoio remoto não substitui epidemiologista local. Surto em área ribeirinha pode levar 3-5 dias para chegar ao sistema, quando já há propagação"},
    {"indicador": "Tuberculose — incidência",          "valor": 89.0,  "meta": 10.0,  "unidade": "/100k",      "status": "critico", "observacao": "8,9x a média nacional. Pobreza + garimpo + desnutrição = determinantes não atacados. Tratamento DOTS incompleto por rotatividade de profissionais. Subnotificação estimada 30%: casos reais podem superar 120/100k"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/agravos")
def agravos():
    return _AGRAVOS_SINAN


@router.get("/surtos")
def surtos():
    return _SURTOS


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
