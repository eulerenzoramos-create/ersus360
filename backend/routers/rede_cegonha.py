"""Rede Cegonha — Pré-natal, Parto Humanizado, Puerpério · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/rede-cegonha", tags=["rede_cegonha"])

_GESTANTES = [
    {"equipe": "ESF Sede A",        "gestantes_ativas": 28, "pn_adequado_pct": 78.6, "vdrl_1trim_pct": 96.4, "hiv_1trim_pct": 96.4, "hep_b_pct": 92.8, "puerperio_pct": 82.1, "status": "ok"},
    {"equipe": "ESF Sede B",        "gestantes_ativas": 24, "pn_adequado_pct": 75.0, "vdrl_1trim_pct": 91.7, "hiv_1trim_pct": 87.5, "hep_b_pct": 87.5, "puerperio_pct": 79.2, "status": "atencao"},
    {"equipe": "ESF Matupi",        "gestantes_ativas": 18, "pn_adequado_pct": 61.1, "vdrl_1trim_pct": 83.3, "hiv_1trim_pct": 77.8, "hep_b_pct": 77.8, "puerperio_pct": 66.7, "status": "atencao"},
    {"equipe": "ESF Nova Esperança","gestantes_ativas": 14, "pn_adequado_pct": 57.1, "vdrl_1trim_pct": 71.4, "hiv_1trim_pct": 64.3, "hep_b_pct": 64.3, "puerperio_pct": 57.1, "status": "critico"},
    {"equipe": "ESF Linha 7",       "gestantes_ativas": 16, "pn_adequado_pct": 56.3, "vdrl_1trim_pct": 75.0, "hiv_1trim_pct": 68.8, "hep_b_pct": 68.8, "puerperio_pct": 62.5, "status": "critico"},
    {"equipe": "ESF Ribeirinhas",   "gestantes_ativas": 22, "pn_adequado_pct": 45.5, "vdrl_1trim_pct": 63.6, "hiv_1trim_pct": 54.5, "hep_b_pct": 54.5, "puerperio_pct": 45.5, "status": "critico"},
]

@router.get("/dashboard")
async def dashboard():
    total_gest = sum(e["gestantes_ativas"] for e in _GESTANTES)
    return {
        "gestantes_ativas": total_gest,
        "novos_prenatal_mes": 12,
        "partos_mes": 14,
        "partos_normais_pct": 42.9,
        "partos_cesareas_pct": 57.1,
        "prematuridade_pct": 12.8,
        "baixo_peso_nasc_pct": 9.6,
        "pn_adequado_pct": 62.4,
        "vdrl_1trim_pct": 80.6,
        "hiv_1trim_pct": 74.8,
        "sifilis_congenita_casos_ano": 4,
        "puerperio_realizado_pct": 65.8,
        "aleitamento_exclusivo_pct": 48.4,
        "gestantes_alto_risco": 18,
        "gestantes_alto_risco_referidas_pct": 83.3,
        "obitos_maternos_ano": 3,
        "status_geral": "atencao",
        "competencia": "Jun/2026",
    }

@router.get("/equipes")
async def equipes():
    return _GESTANTES

@router.get("/sifilis")
async def sifilis():
    return {
        "casos_sifilis_gestante_ano": 12,
        "taxa_sifilis_gestante": 8.4,
        "casos_sifilis_congenita_ano": 4,
        "taxa_sifilis_congenita": 2.8,
        "meta_sifilis_congenita": 0.5,
        "tratamento_adequado_gestante_pct": 66.7,
        "parceiro_tratado_pct": 41.7,
        "serie_mensal": [
            {"mes": "Jan/26", "sifilis_gestante": 2, "sifilis_congenita": 0, "tratamento_adequado_pct": 100.0},
            {"mes": "Fev/26", "sifilis_gestante": 1, "sifilis_congenita": 1, "tratamento_adequado_pct": 100.0},
            {"mes": "Mar/26", "sifilis_gestante": 2, "sifilis_congenita": 1, "tratamento_adequado_pct": 50.0},
            {"mes": "Abr/26", "sifilis_gestante": 3, "sifilis_congenita": 1, "tratamento_adequado_pct": 66.7},
            {"mes": "Mai/26", "sifilis_gestante": 2, "sifilis_congenita": 0, "tratamento_adequado_pct": 50.0},
            {"mes": "Jun/26", "sifilis_gestante": 2, "sifilis_congenita": 1, "tratamento_adequado_pct": 50.0},
        ],
    }

@router.get("/historico")
async def historico():
    return [
        {"mes": "Jan/26", "gestantes": 118, "partos": 11, "cesareas_pct": 54.5, "pn_adequado_pct": 60.2, "puerperio_pct": 62.4},
        {"mes": "Fev/26", "gestantes": 120, "partos": 12, "cesareas_pct": 58.3, "pn_adequado_pct": 60.8, "puerperio_pct": 63.1},
        {"mes": "Mar/26", "gestantes": 119, "partos": 13, "cesareas_pct": 53.8, "pn_adequado_pct": 61.4, "puerperio_pct": 64.2},
        {"mes": "Abr/26", "gestantes": 121, "partos": 12, "cesareas_pct": 58.3, "pn_adequado_pct": 61.8, "puerperio_pct": 64.8},
        {"mes": "Mai/26", "gestantes": 120, "partos": 13, "cesareas_pct": 61.5, "pn_adequado_pct": 62.1, "puerperio_pct": 65.2},
        {"mes": "Jun/26", "gestantes": 122, "partos": 14, "cesareas_pct": 57.1, "pn_adequado_pct": 62.4, "puerperio_pct": 65.8},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Pré-natal adequado (≥6 consultas + exames)",      "valor": 62.4, "meta": 85.0,  "unidade": "%",     "status": "critico", "observacao": "ESF Ribeirinhas (45.5%) e ESF Linha 7 (56.3%) com piores coberturas — acesso fluvial crítico"},
        {"indicador": "VDRL no 1º trimestre",                            "valor": 80.6, "meta": 100.0, "unidade": "%",     "status": "atencao", "observacao": "Gestantes ribeirinhas sem acesso a laboratório local respondem por 80% dos não testados"},
        {"indicador": "Sífilis congênita — taxa",                        "valor": 2.8,  "meta": 0.5,   "unidade": "/mil NV","status": "critico", "observacao": "4 casos em 2026 — 58% das mães sem tratamento adequado ou parceiro não tratado"},
        {"indicador": "Puerpério realizado (até 42 dias)",                "valor": 65.8, "meta": 85.0,  "unidade": "%",     "status": "critico", "observacao": "34% das puérperas sem consulta — principal gap nas ESFs Ribeirinhas e Nova Esperança"},
        {"indicador": "Aleitamento materno exclusivo até 6 meses",       "valor": 48.4, "meta": 60.0,  "unidade": "%",     "status": "atencao", "observacao": "Grupo de apoio ao aleitamento ativo na sede — comunidades rurais sem cobertura"},
        {"indicador": "Cesáreas — proporção de partos hospitalares",     "valor": 57.1, "meta": 45.0,  "unidade": "%",     "status": "atencao", "observacao": "Meta MS: ≤45%. Aumento relacionado a preferência e falta de acompanhante de parto noturno"},
    ]
