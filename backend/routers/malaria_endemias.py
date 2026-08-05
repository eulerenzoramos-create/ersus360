from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/malaria-endemias", tags=["malaria_endemias"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "malaria_casos_ano": 842,
        "malaria_ivp": 36.8,
        "malaria_falciparum_pct": 24.2,
        "malaria_vivax_pct": 73.6,
        "malaria_mista_pct": 2.2,
        "malaria_obitos_ano": 1,
        "leishmaniose_visceral_casos": 4,
        "leishmaniose_tegumentar_casos": 18,
        "chagas_casos_confirmados": 2,
        "dengue_casos_ano": 284,
        "dengue_graves_ano": 3,
        "status_malaria": "critico",
        "status_dengue": "atencao",
    }


@lru_cache(maxsize=1)
def _MALARIA_DETALHE():
    return {
        "casos_ano": 842,
        "ivp": 36.8,
        "ivp_classificacao": "Alto risco",
        "meta_ivp": 10.0,
        "distribuicao_especie": [
            {"especie": "P. vivax",         "casos": 620, "pct": 73.6},
            {"especie": "P. falciparum",    "casos": 204, "pct": 24.2},
            {"especie": "Mista (v+f)",      "casos": 18,  "pct": 2.2},
        ],
        "zonas_criticas": [
            {"zona": "PA Aripuanã",          "casos": 284, "pct_total": 33.7, "status": "critico"},
            {"zona": "Comunidades Rio Juma", "casos": 198, "pct_total": 23.5, "status": "critico"},
            {"zona": "Garimpos (ilegais)",   "casos": 164, "pct_total": 19.5, "status": "critico"},
            {"zona": "Zona Rural Mapari",    "casos": 112, "pct_total": 13.3, "status": "atencao"},
            {"zona": "Sede Urbana",          "casos": 84,  "pct_total": 10.0, "status": "atencao"},
        ],
        "laminoscopia_positiva_pct": 42.8,
        "tratamento_concluido_pct": 84.2,
        "recidivas_pct": 8.4,
        "obs": "Apuí/AM está entre os municípios com maior IVP do Amazonas. Garimpo ilegal é o principal fator de dispersão sem controle vetorial.",
    }


@lru_cache(maxsize=1)
def _OUTRAS_ENDEMIAS():
    return [
        {
            "doenca": "Leishmaniose Tegumentar Americana (LTA)",
            "casos_ano": 18,
            "forma": "Cutânea/mucosa",
            "tratamento": "Glucantime (1ª linha)",
            "cura_pct": 88.9,
            "status": "atencao",
            "obs": "Alta incidência em trabalhadores rurais — 72% dos casos em zona rural",
        },
        {
            "doenca": "Leishmaniose Visceral (Calazar)",
            "casos_ano": 4,
            "forma": "Visceral sistêmica",
            "tratamento": "Anfotericina B lipossomal",
            "cura_pct": 75.0,
            "status": "critico",
            "obs": "4 casos em 2025 — 1 óbito por diagnóstico tardio. Expansão do vetor (lutzomyia) para área urbana",
        },
        {
            "doenca": "Doença de Chagas",
            "casos_ano": 2,
            "forma": "Crônica cardíaca",
            "tratamento": "Benznidazol / Nifurtimox",
            "cura_pct": 0,
            "status": "atencao",
            "obs": "2 casos confirmados — forma crônica, sem cura mas com controle da progressão",
        },
        {
            "doenca": "Dengue",
            "casos_ano": 284,
            "forma": "Hemorrágica/clássica",
            "tratamento": "Suporte clínico",
            "cura_pct": 98.9,
            "status": "atencao",
            "obs": "3 casos graves hospitalizados. Aedes aegypti com alta infestação no bairro Maravilha (IIP 4,2%)",
        },
        {
            "doenca": "Hanseníase",
            "casos_ano": 12,
            "forma": "Multibacilar/paucibacilar",
            "tratamento": "PQT (Poliquimioterapia)",
            "cura_pct": 91.7,
            "status": "atencao",
            "obs": "Coeficiente 5,2/10k hab — classificação ENDÊMICA. Meta de eliminação (<1/10k) não atingida",
        },
        {
            "doenca": "Tuberculose",
            "casos_ano": 8,
            "forma": "Pulmonar (72%)",
            "tratamento": "RIPE (6 meses)",
            "cura_pct": 87.5,
            "status": "atencao",
            "obs": "Taxa de abandono 12,5% — acima da meta nacional (5%). 1 caso de TB-RR (resistente a Rifampicina)",
        },
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "malaria": 612, "ivp": 26.8, "dengue": 148, "lta": 14, "lv": 2, "hanseniase": 10},
        {"ano": "2023", "malaria": 724, "ivp": 31.6, "dengue": 184, "lta": 16, "lv": 3, "hanseniase": 11},
        {"ano": "2024", "malaria": 784, "ivp": 34.2, "dengue": 248, "lta": 17, "lv": 3, "hanseniase": 12},
        {"ano": "2025", "malaria": 842, "ivp": 36.8, "dengue": 284, "lta": 18, "lv": 4, "hanseniase": 12},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "IVP da Malária",                        "valor": 36.8, "meta": 10.0, "unidade": "IVP",      "status": "critico", "observacao": "Alto risco — 3,7× acima da meta. Garimpo ilegal é principal vetor de disseminação sem controle"},
        {"indicador": "P. falciparum (% dos casos malária)",   "valor": 24.2, "meta": 10.0, "unidade": "%",        "status": "critico", "observacao": "Falciparum com potencial letal — 204 casos em 2025, principalmente em garimpeiros"},
        {"indicador": "Leishmaniose Visceral (Calazar)",        "valor": 4,    "meta": 0,    "unidade": "casos",    "status": "critico", "observacao": "1 óbito por diagnóstico tardio em 2025 — expansão do vetor para área urbana"},
        {"indicador": "Hanseníase (coef. detecção/10k hab)",   "valor": 5.2,  "meta": 1.0,  "unidade": "por 10k",  "status": "atencao", "observacao": "Município endêmico — meta de eliminação (<1/10k) não atingida"},
        {"indicador": "Dengue (IIP Aedes aegypti)",             "valor": 4.2,  "meta": 1.0,  "unidade": "% índice", "status": "critico", "observacao": "IIP 4,2% no bairro Maravilha — risco de surto de dengue/chikungunya/zika"},
        {"indicador": "Tratamento Malária concluído",           "valor": 84.2, "meta": 95.0, "unidade": "%",        "status": "atencao", "observacao": "15,8% de abandono de tratamento — favorece recidivas e resistência"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/malaria")
def malaria():
    return _MALARIA_DETALHE


@router.get("/outras-endemias")
def outras_endemias():
    return _OUTRAS_ENDEMIAS


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
