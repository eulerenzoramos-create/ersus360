from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-trabalhador-apui-sst", tags=["saude_trabalhador_apui_sst"])

_DASHBOARD = {
    "acidentes_trabalho_ano": 84,
    "acidentes_graves_afastamento": 28,
    "obitos_acidente_trabalho_ano": 3,
    "taxa_incidencia_acidente_1k": 34.0,
    "cat_emitidas_ano": 43,
    "subnotificacao_cat_estimada_pct": 48.4,
    "trabalhadores_rurais_sem_epi_pct": 68.4,
    "garimpo_trabalhadores_estimados": 3200,
    "garimpo_cobertura_sst_pct": 0.0,
    "mercurio_expostos_estimados": 3200,
    "mercurio_casos_suspeitos_ano": 18,
    "intoxicacoes_agrotoxico_ano": 12,
    "pneumoconiose_casos_suspeitos": 8,
    "cerest_referencia": "Humaitá",
    "cerest_distancia_km": 280,
    "ppra_empresas_cadastradas_pct": 12.4,
    "meta_ppra_pct": 80.0,
    "notificacao_sinan_trabalhador_pct": 38.4,
    "meta_notificacao_pct": 80.0,
    "status_acidentes": "critico",
    "status_garimpo": "critico",
    "status_notificacao": "critico",
}

_ACIDENTES_SETOR = [
    {"setor": "Garimpo ilegal",                 "acidentes": 32, "pct": 38.1, "graves": 12, "obitos": 2, "cat_pct": 4.2,  "status": "critico"},
    {"setor": "Agropecuária / assentamentos",   "acidentes": 19, "pct": 22.6, "graves": 6,  "obitos": 1, "cat_pct": 38.4, "status": "critico"},
    {"setor": "Construção civil",               "acidentes": 15, "pct": 17.9, "graves": 4,  "obitos": 0, "cat_pct": 62.4, "status": "atencao"},
    {"setor": "Serviços (comércio/saúde/educ.)", "acidentes": 10, "pct": 11.9, "graves": 4,  "obitos": 0, "cat_pct": 78.4, "status": "atencao"},
    {"setor": "Transporte fluvial / rodoviário", "acidentes": 8,  "pct": 9.5,  "graves": 2,  "obitos": 0, "cat_pct": 84.2, "status": "ok"},
]

_DOENCAS_OCUPACIONAIS = [
    {"doenca": "Intoxicação por mercúrio (garimpo)",  "casos_suspeitos": 18, "confirmados": 4, "cerest_referenciados": 4,  "monitoramento": "ausente", "status": "critico", "descricao": "Neurotóxico irreversível — sem laboratório de dosagem no município. CEREST Humaitá (280 km) faz confirmação, mas fluxo não estruturado. Crianças de garimpeiros têm exposição indireta via peixes"},
    {"doenca": "Intoxicação por agrotóxico",          "casos_suspeitos": 12, "confirmados": 8, "cerest_referenciados": 6,  "monitoramento": "parcial", "status": "critico", "descricao": "Organofosforados e piretroides em assentamentos sem CIPA, sem EPI, sem PPRA. Subnotificacao estimada 70%. SINAN-trabalhador com 38,4% de completude"},
    {"doenca": "Pneumoconiose / silicose (garimpo)",  "casos_suspeitos": 8,  "confirmados": 2, "cerest_referenciados": 2,  "monitoramento": "ausente", "status": "critico", "descricao": "Garimpo de ouro com exposicao cronica a silica — silicose progressiva. Sem espirometria no municipio. Diagnostico exclusivamente em Manaus. Sem nexo tecnico aplicado"},
    {"doenca": "LER/DORT (servicos/saude)",           "casos_suspeitos": 24, "confirmados": 12,"cerest_referenciados": 8,  "monitoramento": "parcial", "status": "atencao", "descricao": "24 casos suspeitos em trabalhadores de saude, educacao e comercio. DORT subestimado — sem equipe de ergonomia. Afastamentos por LER representam 28% das licencas medicas longas"},
    {"doenca": "Esquistossomose / leptospirose",      "casos_suspeitos": 18, "confirmados": 8, "cerest_referenciados": 0,  "monitoramento": "parcial", "status": "atencao", "descricao": "Trabalhadores rurais e ribeirinhos com exposicao hidrica — leptospirose em colheita e pesca. Nexo causal nao documentado. CAT nao emitida em 100% dos casos"},
]

_HISTORICO = [
    {"ano": "2022", "acidentes": 68, "graves": 22, "obitos": 2, "cat_pct": 42.4, "intox_agrotoxico": 8},
    {"ano": "2023", "acidentes": 74, "graves": 24, "obitos": 2, "cat_pct": 44.2, "intox_agrotoxico": 9},
    {"ano": "2024", "acidentes": 80, "graves": 26, "obitos": 3, "cat_pct": 46.8, "intox_agrotoxico": 11},
    {"ano": "2025", "acidentes": 84, "graves": 28, "obitos": 3, "cat_pct": 48.4, "intox_agrotoxico": 12},
]

_INDICADORES = [
    {"indicador": "Cobertura SST no garimpo ilegal",         "valor": 0.0,  "meta": 100.0, "unidade": "%",      "status": "critico", "observacao": "3.200 garimpeiros sem nenhuma cobertura de saude do trabalhador — atividade ilegal impossibilita PPRA/PCMSO formais. Acidentes graves subnotificados. Mercurio, silica e acidentes mecanicos sao os principais riscos"},
    {"indicador": "Subnotificacao de CAT",                   "valor": 48.4, "meta": 0.0,   "unidade": "%",      "status": "critico", "observacao": "48,4% dos acidentes sem CAT emitida — trabalhadores informais (garimpo/agricultura) sem vinculo CLT nao tem direito reconhecido. Sistema nao mapeia o real impacto. Subnotificacao impede politica baseada em evidencia"},
    {"indicador": "Trabalhadores rurais sem EPI",             "valor": 68.4, "meta": 0.0,   "unidade": "%",      "status": "critico", "observacao": "68,4% dos agricultores dos assentamentos sem EPI adequado — aplicam agrotoxicos de costas, sem mascara ou luva. SMS nao tem programa de distribuicao de EPI. CEREST Humaitá (280 km) e referencia distante"},
    {"indicador": "Notificacao SINAN-trabalhador",            "valor": 38.4, "meta": 80.0,  "unidade": "%",      "status": "critico", "observacao": "38,4% vs meta 80% — doenças ocupacionais com nexo nao reconhecido. Intoxicacao por agrotoxico e mercurio registradas como doenca comum. Perda de direitos previdenciarios para o trabalhador"},
    {"indicador": "Mercurio — dosagem laboratorial",          "valor": 0.0,  "meta": 100.0, "unidade": "%",      "status": "critico", "observacao": "Zero dosagem de mercurio realizada no municipio. CEREST Humaitá e LACEN/AM tem capacidade, mas fluxo nao estabelecido. 3.200 expostos estimados sem monitorizacao. Dano neurologico e renal progressivo e silencioso"},
    {"indicador": "Obitos por acidente de trabalho/ano",      "valor": 3,    "meta": 0,     "unidade": "obitos", "status": "critico", "observacao": "3 obitos/ano — taxa 12,1/100k trabalhadores vs media Brasil 5,3/100k. Garimpo responde por 66% dos obitos. Sem investigacao de obito de trabalhador estruturada na SMS"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/acidentes")
def acidentes():
    return _ACIDENTES_SETOR


@router.get("/doencas")
def doencas():
    return _DOENCAS_OCUPACIONAIS


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
