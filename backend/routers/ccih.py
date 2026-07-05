"""CCIH — Controle de Infecções Relacionadas à Assistência à Saúde · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/ccih", tags=["ccih"])

@router.get("/dashboard")
async def dashboard():
    return {
        "iras_total_mes": 7,
        "taxa_iras_pct": 3.2,
        "meta_taxa_iras_pct": 2.0,
        "iih_pneumonia_pct": 1.4,
        "iih_itu_pct": 0.9,
        "iih_cs_pct": 0.6,
        "iih_cirurgica_pct": 0.3,
        "consumo_antibioticos_ddd": 82.4,
        "meta_ddd": 60.0,
        "alertas_resistencia": 2,
        "culturas_positivas_mes": 14,
        "microrganismos_mdr": 3,
        "status_geral": "atencao",
        "tendencia": "estavel",
        "bundles_adesao_pct": 74.2,
    }

@router.get("/microrganismos")
async def microrganismos():
    return [
        {"organismo": "Staphylococcus aureus",          "resistencia": "MRSA",   "casos_mes": 3, "sensibilidade": "Vancomicina, Linezolida",                  "alerta": True,  "tendencia": "alta"},
        {"organismo": "Klebsiella pneumoniae",           "resistencia": "KPC",    "casos_mes": 2, "sensibilidade": "Polimixina B, Tigeciclina",               "alerta": True,  "tendencia": "estavel"},
        {"organismo": "Pseudomonas aeruginosa",          "resistencia": "MDR",    "casos_mes": 1, "sensibilidade": "Polimixina B",                            "alerta": True,  "tendencia": "queda"},
        {"organismo": "Escherichia coli",                "resistencia": "ESBL",   "casos_mes": 4, "sensibilidade": "Carbapenêmicos, Amicacina",               "alerta": False, "tendencia": "estavel"},
        {"organismo": "Candida albicans",                "resistencia": "Sensível","casos_mes": 2, "sensibilidade": "Fluconazol, Anfotericina B",             "alerta": False, "tendencia": "estavel"},
        {"organismo": "Acinetobacter baumannii",         "resistencia": "XDR",    "casos_mes": 1, "sensibilidade": "Polimixina B (CMI=2)",                    "alerta": True,  "tendencia": "alta"},
        {"organismo": "Staphylococcus epidermidis",      "resistencia": "MRSE",   "casos_mes": 2, "sensibilidade": "Vancomicina, Rifampicina",                "alerta": False, "tendencia": "queda"},
        {"organismo": "Enterococcus faecalis",           "resistencia": "VRE",    "casos_mes": 1, "sensibilidade": "Linezolida",                              "alerta": True,  "tendencia": "alta"},
    ]

@router.get("/antibioticos")
async def antibioticos():
    return [
        {"antibiotico": "Ceftriaxona",       "classe": "Cefalosporina 3ª",   "ddd_100ld": 28.4, "status": "ok",      "restrito": False, "tendencia": "estavel"},
        {"antibiotico": "Ciprofloxacino",    "classe": "Fluoroquinolona",     "ddd_100ld": 14.2, "status": "ok",      "restrito": False, "tendencia": "queda"},
        {"antibiotico": "Meropeném",         "classe": "Carbapenêmico",       "ddd_100ld": 12.8, "status": "atencao", "restrito": True,  "tendencia": "alta"},
        {"antibiotico": "Vancomicina",       "classe": "Glicopeptídeo",       "ddd_100ld": 11.6, "status": "atencao", "restrito": True,  "tendencia": "alta"},
        {"antibiotico": "Piperacilina/Tazo","classe": "Penicilina + inibidor","ddd_100ld": 8.4,  "status": "ok",      "restrito": True,  "tendencia": "estavel"},
        {"antibiotico": "Polimixina B",      "classe": "Polipeptídeo",        "ddd_100ld": 4.2,  "status": "critico", "restrito": True,  "tendencia": "alta",    "alerta": "Uso crescente — avaliar protocolos KPC"},
        {"antibiotico": "Linezolida",        "classe": "Oxazolidinona",       "ddd_100ld": 2.8,  "status": "atencao", "restrito": True,  "tendencia": "estavel"},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Out/25", "taxa_iras": 2.8, "pneumonia": 1.2, "itu": 0.8, "cs": 0.5, "cirurgica": 0.3, "ddd_total": 74.2},
        {"mes": "Nov/25", "taxa_iras": 3.0, "pneumonia": 1.3, "itu": 0.9, "cs": 0.5, "cirurgica": 0.3, "ddd_total": 76.8},
        {"mes": "Dez/25", "taxa_iras": 3.4, "pneumonia": 1.5, "itu": 1.0, "cs": 0.6, "cirurgica": 0.3, "ddd_total": 81.2},
        {"mes": "Jan/26", "taxa_iras": 3.6, "pneumonia": 1.6, "itu": 1.1, "cs": 0.6, "cirurgica": 0.3, "ddd_total": 84.6},
        {"mes": "Fev/26", "taxa_iras": 3.3, "pneumonia": 1.4, "itu": 1.0, "cs": 0.6, "cirurgica": 0.3, "ddd_total": 83.0},
        {"mes": "Mar/26", "taxa_iras": 3.2, "pneumonia": 1.4, "itu": 0.9, "cs": 0.6, "cirurgica": 0.3, "ddd_total": 82.4},
    ]

@router.get("/bundles")
async def bundles():
    return [
        {"bundle": "Prevenção de pneumonia associada à VM",  "adesao_pct": 82.0, "status": "ok",      "itens": ["Cabeceira 30-45°","Higiene oral clorexidina","Pause diária sedação","Fisioterapia motora"]},
        {"bundle": "Prevenção de ITU associada a cateter",   "adesao_pct": 78.5, "status": "ok",      "itens": ["Avaliação diária necessidade","Fixação adequada","Cuidados meato","Fluxo urinário livre"]},
        {"bundle": "Prevenção de ICS associada a CVC",       "adesao_pct": 71.4, "status": "atencao", "itens": ["Barreira máxima","Clorexidina alcoólica","Sítio preferencial jugular/subclávia","Revisão diária necessidade"]},
        {"bundle": "Prevenção de infecção de sítio cirúrgico","adesao_pct": 65.0, "status": "atencao", "itens": ["ATB profilático <60min","Tricotomia adequada","Normotermia","Glicemia controlada"]},
    ]
