from fastapi import APIRouter

router = APIRouter(prefix="/api/mortalidade-prematura-apui", tags=["Mortalidade Prematura Apuí"])

@router.get("/dashboard")
def dashboard():
    return {
        "obitos_totais_ano": 124,
        "taxa_mortalidade_geral": 6.84,
        "mortalidade_prematura_pct": 28.4,
        "obitos_prematuros_30_69": 35,
        "principal_causa": "Doenças cardiovasculares",
        "principal_causa_pct": 38.4,
        "obitos_causas_externas_15_39_100k": 184.0,
        "obitos_investigados_pct": 68.4,
        "meta_investigados_pct": 80.0,
        "do_domicilio_pct": 28.4,
        "anos_vida_perdidos_prematuramente": 1284,
        "status_mortalidade": "atencao",
        "status_investigacao": "atencao",
        "reducao_meta_5anos_pct": 15.0,
    }

@router.get("/causas")
def causas():
    return [
        {"causa": "Doenças cardiovasculares (CID I00-I99)",
         "obitos": 48, "pct": 38.4, "prematuros_pct": 32.4, "tendencia": "estavel",
         "status": "atencao",
         "obs": "HAS não controlada e ausência de cardiologista são os fatores determinantes."},
        {"causa": "Neoplasias (CID C00-D48)",
         "obitos": 23, "pct": 18.4, "prematuros_pct": 22.8, "tendencia": "crescente",
         "status": "critico",
         "obs": "Diagnóstico tardio — mamografia e colonoscopia indisponíveis no município."},
        {"causa": "Causas externas — violência/acidentes (CID V01-Y98)",
         "obitos": 22, "pct": 17.6, "prematuros_pct": 31.4, "tendencia": "crescente",
         "status": "critico",
         "obs": "Acidentes de moto (48%), garimpo ilegal (18%), afogamento (14%)."},
        {"causa": "Diabetes e complicações (CID E10-E14)",
         "obitos": 18, "pct": 14.8, "prematuros_pct": 18.4, "tendencia": "crescente",
         "status": "critico",
         "obs": "DM não diagnosticado ou controlado. Amputações por pé diabético crescentes."},
        {"causa": "Doenças respiratórias (CID J00-J99)",
         "obitos": 8,  "pct": 6.4,  "prematuros_pct": 4.8,  "tendencia": "crescente",
         "status": "atencao",
         "obs": "Queimadas amazônicas agravam DPOC e asma. Internações por queimadas: 48/ano."},
        {"causa": "Doenças infecciosas e parasitárias (CID A00-B99)",
         "obitos": 5,  "pct": 4.0,  "prematuros_pct": 8.4,  "tendencia": "estavel",
         "status": "atencao",
         "obs": "Malária grave, leptospirose e sepse respondem pela maioria dos óbitos infecciosos."},
    ]

@router.get("/perfil-demografico")
def perfil_demografico():
    return [
        {"faixa": "< 1 ano (infantil)",         "obitos": 8,  "taxa_100k": 1142.0, "sexo_m_pct": 62.5, "investigados_pct": 100.0},
        {"faixa": "1–4 anos",                   "obitos": 2,  "taxa_100k": 128.4,  "sexo_m_pct": 50.0, "investigados_pct": 100.0},
        {"faixa": "5–14 anos",                  "obitos": 3,  "taxa_100k": 84.2,   "sexo_m_pct": 66.7, "investigados_pct": 100.0},
        {"faixa": "15–29 anos",                 "obitos": 14, "taxa_100k": 248.4,  "sexo_m_pct": 78.6, "investigados_pct": 71.4},
        {"faixa": "30–49 anos (prematura)",     "obitos": 22, "taxa_100k": 384.2,  "sexo_m_pct": 72.7, "investigados_pct": 63.6},
        {"faixa": "50–69 anos (prematura)",     "obitos": 28, "taxa_100k": 524.8,  "sexo_m_pct": 64.3, "investigados_pct": 67.9},
        {"faixa": "70+ anos",                   "obitos": 47, "taxa_100k": 1284.0, "sexo_m_pct": 57.4, "investigados_pct": 53.2},
    ]

@router.get("/historico")
def historico():
    return [
        {"ano": 2022, "obitos_totais": 118, "prematuros_pct": 32.4, "ext_causas_pct": 20.4, "investigados_pct": 58.4},
        {"ano": 2023, "obitos_totais": 120, "prematuros_pct": 30.8, "ext_causas_pct": 19.2, "investigados_pct": 62.4},
        {"ano": 2024, "obitos_totais": 122, "prematuros_pct": 29.6, "ext_causas_pct": 18.4, "investigados_pct": 65.8},
        {"ano": 2025, "obitos_totais": 124, "prematuros_pct": 28.4, "ext_causas_pct": 17.6, "investigados_pct": 68.4},
    ]

@router.get("/indicadores")
def indicadores():
    return [
        {"indicador": "Mortalidade prematura (30–69 anos)",    "valor": 28.4, "unidade": "%", "meta": 20, "status": "atencao",
         "observacao": "35 óbitos prematuros em 2025 — cardiovascular, neoplasias e causas externas lideram."},
        {"indicador": "DO investigadas (% do total)",          "valor": 68.4, "unidade": "%", "meta": 80, "status": "atencao",
         "observacao": "31,6% dos óbitos sem investigação completa. SIM com subnotificação estrutural."},
        {"indicador": "Óbitos por causas externas (15–39 anos)","valor": 184, "unidade": "/100k", "meta": 80, "status": "critico",
         "observacao": "Mais que o dobro da média nacional. Acidentes de moto e garimpo como principais causas."},
        {"indicador": "Óbito domiciliar sem DO adequada",      "valor": 28.4, "unidade": "%", "meta": 10, "status": "atencao",
         "observacao": "28,4% dos óbitos ocorrem no domicílio com DOs de baixa qualidade diagnóstica."},
        {"indicador": "Anos de Vida Perdidos Prematuramente",  "valor": 1284, "unidade": "anos", "meta": None, "status": "critico",
         "observacao": "1.284 AVPP em 2025 — impacto socioeconômico significativo para Apuí/AM."},
    ]
