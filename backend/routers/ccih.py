"""
Router: /api/ccih — ERSUS 360
CCIH — Infecções Hospitalares · Controle · Antimicrobianos · FMS Apuí/AM
Dados de referência municipal — situacao_dado = referencia_municipal
"""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(prefix="/api/ccih", tags=["ccih"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "Jan–Jun 2026",
        "taxa_iras_pct": 4.8,
        "meta_iras_pct": 3.0,
        "internacoes_avaliadas": 624,
        "iras_confirmadas": 30,
        "iras_relacionadas_assistencia": 22,
        "densidade_incidencia_isc_por_mil": 3.2,
        "taxa_pneumonia_associada_vm_pct": 18.4,
        "uso_antibiotico_empirico_pct": 68.4,
        "higienizacao_maos_conformidade_pct": 72.4,
        "bundles_completos_pct": 64.2,
        "nota": "Referência baseada em parâmetros típicos CCIH hospital de pequeno porte amazônico.",
    }


@router.get("/microrganismos")
async def microrganismos():
    return [
        {"situacao_dado": "referencia_municipal", "microrganismo": "Staphylococcus aureus",            "isolamentos": 8,  "mrsa_pct": 25.0, "perfil": "MRSA 2/8. Sensível à vancomicina.",          "topografia": "Ferida cirúrgica / corrente sanguínea", "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "microrganismo": "Klebsiella pneumoniae",            "isolamentos": 6,  "mrsa_pct": None, "perfil": "2/6 produtoras de ESBL.",                   "topografia": "ITU / pneumonia",                       "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "microrganismo": "Escherichia coli",                 "isolamentos": 5,  "mrsa_pct": None, "perfil": "1/5 ESBL. Sensíveis carbapenêmicos.",       "topografia": "ITU / corrente sanguínea",               "status": "ok"},
        {"situacao_dado": "referencia_municipal", "microrganismo": "Pseudomonas aeruginosa",           "isolamentos": 4,  "mrsa_pct": None, "perfil": "Sensível — sem MDR identificado.",           "topografia": "Pneumonia / ferida",                     "status": "ok"},
        {"situacao_dado": "referencia_municipal", "microrganismo": "Candida spp.",                     "isolamentos": 4,  "mrsa_pct": None, "perfil": "C. albicans 3/4. Sensível fluconazol.",     "topografia": "ITU / corrente sanguínea",               "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "microrganismo": "Enterococcus spp.",                "isolamentos": 3,  "mrsa_pct": None, "perfil": "VRE não identificado.",                     "topografia": "ITU",                                   "status": "ok"},
    ]


@router.get("/antibioticos")
async def antibioticos():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "Jan–Jun 2026",
        "uso_total_DDD_por_100_leito_dia": 42.4,
        "meta_DDD_por_100_leito_dia": 35.0,
        "consumo_por_classe": [
            {"classe": "Penicilinas",        "DDD_100ld": 12.4, "pct": 29.2},
            {"classe": "Cefalosporinas",     "DDD_100ld": 10.8, "pct": 25.5},
            {"classe": "Fluoroquinolonas",   "DDD_100ld": 8.2,  "pct": 19.3},
            {"classe": "Aminoglicosídeos",   "DDD_100ld": 4.2,  "pct": 9.9},
            {"classe": "Metronidazol",       "DDD_100ld": 3.8,  "pct": 8.9},
            {"classe": "Carbapenêmicos",     "DDD_100ld": 1.8,  "pct": 4.2},
            {"classe": "Glicopeptídeos",     "DDD_100ld": 1.2,  "pct": 2.8},
        ],
        "antibiotico_stewardship": False,
        "comissao_antimicrobianos": False,
        "observacao": "Sem programa de Stewardship. Farmacêutico hospitalar ausente — contrato externo.",
    }


@router.get("/bundles")
async def bundles():
    return [
        {
            "situacao_dado": "referencia_municipal",
            "bundle": "Prevenção de PAV (Pneumonia Associada à VM)",
            "componentes": ["Cabeceira 30–45°", "Higiene oral c/ clorexidina", "Pressão cuff", "Interrupção diária sedação", "Profilaxia TVP"],
            "conformidade_pct": 58.4,
            "status": "critico",
            "observacao": "VM de curta duração — mas bundle incompleto por falta de treinamento.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "bundle": "Prevenção de IPCS (CVC)",
            "componentes": ["Higienização mãos", "Barreira máxima", "Clorexidina 0,5%", "Revisão diária", "Retirada precoce"],
            "conformidade_pct": 72.4,
            "status": "atencao",
            "observacao": "CVC inserido em emergência sem barreira completa — risco alto.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "bundle": "Prevenção de ITU Associada à Sonda (ITU-SC)",
            "componentes": ["Indicação adequada", "Higiene do meato", "Sistema fechado", "Saco abaixo da bexiga", "Retirada precoce"],
            "conformidade_pct": 78.4,
            "status": "atencao",
            "observacao": "Sonda mantida além do necessário em 28% dos casos.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "bundle": "Higienização das Mãos (5 momentos OMS)",
            "componentes": ["Antes do contato", "Antes de proc. asséptico", "Após risco c/ fluidos", "Após contato", "Após contato amb."],
            "conformidade_pct": 72.4,
            "status": "atencao",
            "observacao": "Dispensers de álcool gel em 100% dos leitos. Aderência 72,4%."},
        {
            "situacao_dado": "referencia_municipal",
            "bundle": "Prevenção de ISC (Infecção de Sítio Cirúrgico)",
            "componentes": ["Antibiótico profilático correto", "Tricotomia adequada", "Normotermia", "Glicemia controlada"],
            "conformidade_pct": 64.2,
            "status": "atencao",
            "observacao": "Antibiótico profilático correto em 72% — tempo de infusão nem sempre respeitado.",
        },
    ]


@router.get("/historico")
async def historico():
    return [
        {"situacao_dado": "referencia_municipal", "trimestre": "1T/2025", "taxa_iras_pct": 5.8, "higiene_maos_pct": 64.2, "bundles_pct": 58.4},
        {"situacao_dado": "referencia_municipal", "trimestre": "2T/2025", "taxa_iras_pct": 5.4, "higiene_maos_pct": 66.4, "bundles_pct": 60.2},
        {"situacao_dado": "referencia_municipal", "trimestre": "3T/2025", "taxa_iras_pct": 5.2, "higiene_maos_pct": 68.4, "bundles_pct": 62.4},
        {"situacao_dado": "referencia_municipal", "trimestre": "4T/2025", "taxa_iras_pct": 5.0, "higiene_maos_pct": 70.4, "bundles_pct": 62.4},
        {"situacao_dado": "referencia_municipal", "trimestre": "1T/2026", "taxa_iras_pct": 4.8, "higiene_maos_pct": 72.4, "bundles_pct": 64.2},
    ]


@router.get("/indicadores")
async def indicadores():
    return [
        {"situacao_dado": "referencia_municipal", "indicador": "Taxa de IRAS (meta: <3%)",                "valor": 4.8,  "meta": 3.0, "unidade": "%",      "status": "atencao", "observacao": "Em queda (5,8% → 4,8% em 5 trimestres). Tendência positiva."},
        {"situacao_dado": "referencia_municipal", "indicador": "Higienização das Mãos (%)",               "valor": 72.4, "meta": 90,  "unidade": "%",      "status": "atencao", "observacao": "Álcool gel 100% disponível. Aderência 72,4% — meta OMS 90%."},
        {"situacao_dado": "referencia_municipal", "indicador": "Bundles Completos (%)",                   "valor": 64.2, "meta": 90,  "unidade": "%",      "status": "atencao", "observacao": "PAV bundle mais crítico (58,4%). Treinamento em andamento."},
        {"situacao_dado": "referencia_municipal", "indicador": "MRSA (% Staph. aureus resistente)",       "valor": 25.0, "meta": 10,  "unidade": "%",      "status": "atencao", "observacao": "2/8 isolamentos MRSA. Sem KPC identificado."},
        {"situacao_dado": "referencia_municipal", "indicador": "Antibiótico Stewardship",                 "valor": 0,    "meta": 1,   "unidade": "program.","status": "critico","observacao": "Sem programa implantado. Farmacêutico hospitalar ausente."},
        {"situacao_dado": "referencia_municipal", "indicador": "Uso Empírico ATB (%)",                   "valor": 68.4, "meta": 40,  "unidade": "%",      "status": "critico", "observacao": "Alta proporção de uso empírico — cultura antes de iniciar ATB."},
    ]
