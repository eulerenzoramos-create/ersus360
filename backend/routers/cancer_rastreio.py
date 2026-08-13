"""
Router: /api/cancer-rastreio — ERSUS 360
Dados de referência municipal — Apuí/AM (pop. ~20 mil).
situacao_dado = referencia_municipal
"""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(prefix="/api/cancer-rastreio", tags=["cancer_rastreio"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "Jan–Jun 2026",
        "citopatologicos_realizados_ano": 312,
        "meta_citopatologico_ano": 520,
        "cobertura_colo_utero_pct": 60.0,
        "alteracoes_colo_detectadas": 18,
        "taxa_alteracao_colo_pct": 5.8,
        "mamografias_realizadas_ano": 68,
        "meta_mamografia_ano": 180,
        "cobertura_mama_pct": 37.8,
        "alteracoes_mama_detectadas": 4,
        "encaminhamentos_oncologia_ano": 22,
        "media_dias_resultado_citopatologico": 28,
        "nota": "Referência baseada em parâmetros típicos rastreio oncológico municípios amazônicos ~20 mil hab.",
    }


@router.get("/rastreio")
async def rastreio():
    return [
        {
            "situacao_dado": "referencia_municipal",
            "tipo": "Câncer de Colo de Útero (citopatológico)",
            "populacao_alvo": "Mulheres 25–64 anos",
            "estimativa_populacao": 5200,
            "exames_realizados_ano": 312,
            "cobertura_pct": 60.0,
            "alteracoes_detectadas": 18,
            "asc_us": 8, "lsil": 6, "hsil": 3, "carcinoma": 1,
            "encaminhamentos": 10,
            "status": "atencao",
            "observacao": "Coleta na UBS Central e equipes eSF. Resultado pelo LACEN Manaus (28 dias).",
        },
        {
            "situacao_dado": "referencia_municipal",
            "tipo": "Câncer de Mama (mamografia)",
            "populacao_alvo": "Mulheres 50–69 anos",
            "estimativa_populacao": 1800,
            "exames_realizados_ano": 68,
            "cobertura_pct": 37.8,
            "alteracoes_detectadas": 4,
            "birads_3": 2, "birads_4": 1, "birads_5": 1,
            "encaminhamentos": 2,
            "status": "critico",
            "observacao": "Mamógrafo em Humaitá — deslocamento 220km. Regulação via TFD.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "tipo": "Câncer Colorretal (pesquisa sangue oculto)",
            "populacao_alvo": "Adultos 50–75 anos",
            "estimativa_populacao": 2800,
            "exames_realizados_ano": 42,
            "cobertura_pct": 1.5,
            "alteracoes_detectadas": 2,
            "encaminhamentos": 2,
            "status": "critico",
            "observacao": "Programa ainda não estruturado em Apuí. Casos detectados por sintomas.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "tipo": "Câncer de Próstata (PSA + toque retal)",
            "populacao_alvo": "Homens ≥50 anos com sintomas ou risco",
            "estimativa_populacao": 2400,
            "exames_realizados_ano": 84,
            "cobertura_pct": 3.5,
            "alteracoes_detectadas": 6,
            "encaminhamentos": 6,
            "status": "critico",
            "observacao": "Rastreio seletivo — urologista por TFD (Manaus). Estadiamento tardio.",
        },
    ]


@router.get("/estadiamento")
async def estadiamento():
    return [
        {"situacao_dado": "referencia_municipal", "topografia": "Colo de Útero",  "casos_notificados_ano": 3, "estadio_i_ii_pct": 33.3, "estadio_iii_iv_pct": 66.7, "media_dias_diagnostico_tto": 62, "status": "critico"},
        {"situacao_dado": "referencia_municipal", "topografia": "Mama",            "casos_notificados_ano": 2, "estadio_i_ii_pct": 50.0, "estadio_iii_iv_pct": 50.0, "media_dias_diagnostico_tto": 78, "status": "critico"},
        {"situacao_dado": "referencia_municipal", "topografia": "Próstata",        "casos_notificados_ano": 4, "estadio_i_ii_pct": 25.0, "estadio_iii_iv_pct": 75.0, "media_dias_diagnostico_tto": 94, "status": "critico"},
        {"situacao_dado": "referencia_municipal", "topografia": "Pele Melanoma",   "casos_notificados_ano": 2, "estadio_i_ii_pct": 50.0, "estadio_iii_iv_pct": 50.0, "media_dias_diagnostico_tto": 58, "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "topografia": "Pulmão/Brônquio", "casos_notificados_ano": 2, "estadio_i_ii_pct": 0.0,  "estadio_iii_iv_pct": 100,  "media_dias_diagnostico_tto": 112,"status": "critico"},
    ]


@router.get("/historico")
async def historico():
    return [
        {"situacao_dado": "referencia_municipal", "ano": 2023, "citopatologicos": 280, "mamografias": 58, "cobertura_colo_pct": 53.8, "cobertura_mama_pct": 32.2},
        {"situacao_dado": "referencia_municipal", "ano": 2024, "citopatologicos": 298, "mamografias": 62, "cobertura_colo_pct": 57.3, "cobertura_mama_pct": 34.4},
        {"situacao_dado": "referencia_municipal", "ano": 2025, "citopatologicos": 312, "mamografias": 68, "cobertura_colo_pct": 60.0, "cobertura_mama_pct": 37.8},
    ]


@router.get("/indicadores")
async def indicadores():
    return [
        {"situacao_dado": "referencia_municipal", "indicador": "Cobertura Citopatológico CU (%)",       "valor": 60.0, "meta": 80,  "unidade": "%",   "status": "atencao", "observacao": "Previne Brasil meta 80%. Coleta apenas na UBS sede — rural descoberto."},
        {"situacao_dado": "referencia_municipal", "indicador": "Cobertura Mamografia (%)",              "valor": 37.8, "meta": 70,  "unidade": "%",   "status": "critico", "observacao": "Mamógrafo em Humaitá — barreira logística. TFD necessário."},
        {"situacao_dado": "referencia_municipal", "indicador": "Tempo Resultado Citopatológico (dias)", "valor": 28,   "meta": 14,  "unidade": "dias","status": "atencao", "observacao": "LACEN Manaus 28 dias. Meta MS: 14 dias."},
        {"situacao_dado": "referencia_municipal", "indicador": "Estadiamento tardio (III/IV) (%)",      "valor": 66.7, "meta": 30,  "unidade": "%",   "status": "critico", "observacao": "2/3 dos casos diagnosticados em estágio avançado — prognóstico ruim."},
        {"situacao_dado": "referencia_municipal", "indicador": "Tempo Diagnóstico → Tratamento (dias)", "valor": 78,   "meta": 60,  "unidade": "dias","status": "atencao", "observacao": "Espera por INCA/Manaus. Fila regulação oncologia: ~90 dias."},
    ]
