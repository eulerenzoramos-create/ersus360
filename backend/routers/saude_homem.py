"""
Router: /api/saude-homem — ERSUS 360
Dados de referência municipal — Apuí/AM (pop. ~20 mil).
situacao_dado = referencia_municipal
"""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-homem", tags=["Saúde do Homem"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "Jan–Jun 2026",
        "homens_populacao_estimada": 10800,
        "consultas_medicas_homens_mes": 820,
        "pct_consultas_homens_total": 28.4,
        "hipertensao_homens_pct": 34.2,
        "diabetes_homens_pct": 14.8,
        "tabagismo_homens_pct": 28.4,
        "alcoolismo_homens_pct": 22.4,
        "psa_realizados_ano": 84,
        "cancer_prostata_novos_ano": 4,
        "obitos_causas_externas_homens_pct": 84.2,
        "obitos_masculinos_pct_total": 62.4,
        "nota": "Referência baseada em parâmetros PNAISH para municípios amazônicos ~20 mil hab.",
    }


@router.get("/producao")
async def producao():
    return [
        {"situacao_dado": "referencia_municipal", "mes": "Jan/26", "consultas": 760, "preventivos": 18, "psa": 12, "vasectomias": 0},
        {"situacao_dado": "referencia_municipal", "mes": "Fev/26", "consultas": 784, "preventivos": 22, "psa": 14, "vasectomias": 0},
        {"situacao_dado": "referencia_municipal", "mes": "Mar/26", "consultas": 812, "preventivos": 24, "psa": 16, "vasectomias": 1},
        {"situacao_dado": "referencia_municipal", "mes": "Abr/26", "consultas": 828, "preventivos": 20, "psa": 14, "vasectomias": 0},
        {"situacao_dado": "referencia_municipal", "mes": "Mai/26", "consultas": 840, "preventivos": 22, "psa": 14, "vasectomias": 1},
        {"situacao_dado": "referencia_municipal", "mes": "Jun/26", "consultas": 820, "preventivos": 20, "psa": 14, "vasectomias": 0},
    ]


@router.get("/internacoes")
async def internacoes():
    return [
        {"situacao_dado": "referencia_municipal", "causa": "Causas externas (trauma)",                  "internacoes": 42, "pct": 34.4, "status": "critico"},
        {"situacao_dado": "referencia_municipal", "causa": "Doenças cardiovasculares",                  "internacoes": 28, "pct": 22.9, "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "causa": "Doenças respiratórias",                     "internacoes": 18, "pct": 14.8, "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "causa": "Doenças infecciosas e parasitárias",        "internacoes": 14, "pct": 11.5, "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "causa": "Doenças geniturinárias (próstata/rim)",     "internacoes": 12, "pct": 9.8,  "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "causa": "Outras causas",                              "internacoes": 8,  "pct": 6.6,  "status": "ok"},
    ]


@router.get("/acoes")
async def acoes():
    return [
        {"situacao_dado": "referencia_municipal", "acao": "Novembro Azul — rastreio próstata",          "realizada": True,  "alcance": 342,  "observacao": "Campanha anual. PSA + toque retal em ≥50a. 84 exames/ano."},
        {"situacao_dado": "referencia_municipal", "acao": "Prevenção cardiovascular (HAS/DM homens)",   "realizada": True,  "alcance": 1240, "observacao": "Hipertensão 34,2% e Diabetes 14,8% em homens adultos."},
        {"situacao_dado": "referencia_municipal", "acao": "Tabagismo — Programa Nacional (PNCT)",       "realizada": True,  "alcance": 84,   "observacao": "Grupo de cessação tabagismo — 84 participantes (6 meses)."},
        {"situacao_dado": "referencia_municipal", "acao": "CAPS AD — Tratamento alcoolismo",            "realizada": True,  "alcance": 120,  "observacao": "68% dos pacientes CAPS AD são homens."},
        {"situacao_dado": "referencia_municipal", "acao": "Vasectomia — oferta regulada",               "realizada": True,  "alcance": 2,    "observacao": "Apenas 2/ano. Procedimento em Humaitá — logística limita."},
        {"situacao_dado": "referencia_municipal", "acao": "Saúde mental masculina (PNAISH)",            "realizada": False, "alcance": 0,    "observacao": "Grupo específico não implantado. Homens: 80% dos suicídios."},
        {"situacao_dado": "referencia_municipal", "acao": "Prevenção de acidentes de trabalho",         "realizada": False, "alcance": 0,    "observacao": "CEREST-AM: ação regional pendente — garimpo e agropecuária."},
    ]


@router.get("/indicadores")
async def indicadores():
    return [
        {"situacao_dado": "referencia_municipal", "indicador": "Consultas Homens / Total (%)",          "valor": 28.4, "meta": 50,  "unidade": "%",    "status": "critico", "observacao": "Homens consultam menos. PNAISH: barreiras culturais e horário."},
        {"situacao_dado": "referencia_municipal", "indicador": "Mortalidade Prematura Masculina (%)",   "valor": 62.4, "meta": 50,  "unidade": "%",    "status": "critico", "observacao": "Homens: 62,4% dos óbitos totais. Causas externas e DCNT."},
        {"situacao_dado": "referencia_municipal", "indicador": "Tabagismo Homens (%)",                  "valor": 28.4, "meta": 12,  "unidade": "%",    "status": "critico", "observacao": "2,4× a meta nacional. PNCT implantado na UBS Central."},
        {"situacao_dado": "referencia_municipal", "indicador": "Alcoolismo Homens (%)",                 "valor": 22.4, "meta": 10,  "unidade": "%",    "status": "critico", "observacao": "CAPS AD com 120 pacientes — 68% masculinos."},
        {"situacao_dado": "referencia_municipal", "indicador": "PSA ≥50 anos realizados/ano",          "valor": 84,   "meta": 200, "unidade": "exam.", "status": "atencao", "observacao": "Rastreio seletivo — urologista TFD Manaus. Estadiamento tardio."},
        {"situacao_dado": "referencia_municipal", "indicador": "Óbitos Causas Externas — Homens (%)", "valor": 84.2, "meta": 50,  "unidade": "%",    "status": "critico", "observacao": "Homicídios, acidente moto, afogamento. Garimpo = risco extra."},
    ]
