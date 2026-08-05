from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/idsus", tags=["idsus"])

@lru_cache(maxsize=1)
def _DIMENSOES():
    return [
        {
            "nome": "Atenção Básica",
            "score": 6.8,
            "peso": 0.30,
            "indicadores": [
                {"codigo": "AB01", "nome": "Cobertura da Atenção Básica",           "dimensao": "Atenção Básica",      "valor": 74.2, "meta": 80.0, "ponderacao": 0.25, "status": "alerta",        "tendencia": "melhora", "fonte": "SCNES",  "competencia": "Jun/2026"},
                {"codigo": "AB02", "nome": "Proporção de consultas médicas na AB",  "dimensao": "Atenção Básica",      "valor": 68.4, "meta": 75.0, "ponderacao": 0.20, "status": "alerta",        "tendencia": "melhora", "fonte": "SISAB",  "competencia": "Jun/2026"},
                {"codigo": "AB03", "nome": "Cobertura de acompanhamento Pré-natal", "dimensao": "Atenção Básica",      "valor": 82.1, "meta": 80.0, "ponderacao": 0.25, "status": "meta_atingida", "tendencia": "melhora", "fonte": "SISPRENATAL", "competencia": "Jun/2026"},
                {"codigo": "AB04", "nome": "Proporção de vacinas básicas em dia",   "dimensao": "Atenção Básica",      "valor": 76.4, "meta": 95.0, "ponderacao": 0.30, "status": "alerta",        "tendencia": "estavel", "fonte": "SI-PNI", "competencia": "Jun/2026"},
            ],
        },
        {
            "nome": "Vigilância em Saúde",
            "score": 6.2,
            "peso": 0.25,
            "indicadores": [
                {"codigo": "VS01", "nome": "Incidência de malária (IPA)",            "dimensao": "Vigilância em Saúde", "valor": 87.5, "meta": 85.0, "ponderacao": 0.30, "status": "meta_atingida", "tendencia": "melhora", "fonte": "SIVEP",  "competencia": "Jun/2026"},
                {"codigo": "VS02", "nome": "Cobertura de exames preventivos (CO)",  "dimensao": "Vigilância em Saúde", "valor": 61.8, "meta": 80.0, "ponderacao": 0.25, "status": "alerta",        "tendencia": "estavel", "fonte": "SISCOLO","competencia": "Jun/2026"},
                {"codigo": "VS03", "nome": "Tx internações causas sensíveis AB",    "dimensao": "Vigilância em Saúde", "valor": 58.2, "meta": 50.0, "ponderacao": 0.25, "status": "alerta",        "tendencia": "queda",   "fonte": "SIH",    "competencia": "2026"},
                {"codigo": "VS04", "nome": "Cobertura de saneamento básico",        "dimensao": "Vigilância em Saúde", "valor": 68.5, "meta": 80.0, "ponderacao": 0.20, "status": "alerta",        "tendencia": "estavel", "fonte": "IBGE",   "competencia": "2026"},
            ],
        },
        {
            "nome": "Atenção Especializada",
            "score": 5.9,
            "peso": 0.20,
            "indicadores": [
                {"codigo": "AE01", "nome": "Acesso a consultas especializadas",      "dimensao": "Atenção Especializada","valor": 42.1, "meta": 60.0, "ponderacao": 0.35, "status": "critico",       "tendencia": "estavel", "fonte": "SISREG", "competencia": "Jun/2026"},
                {"codigo": "AE02", "nome": "Proporção cirurgias eletivas realizadas","dimensao": "Atenção Especializada","valor": 64.3, "meta": 70.0, "ponderacao": 0.30, "status": "alerta",        "tendencia": "melhora", "fonte": "SIH",    "competencia": "Jun/2026"},
                {"codigo": "AE03", "nome": "Cobertura de fisioterapia ambulatorial", "dimensao": "Atenção Especializada","valor": 38.7, "meta": 50.0, "ponderacao": 0.20, "status": "critico",       "tendencia": "estavel", "fonte": "SIA",    "competencia": "Jun/2026"},
                {"codigo": "AE04", "nome": "Saúde Mental — CAPS cobertura",         "dimensao": "Atenção Especializada","valor": 71.2, "meta": 70.0, "ponderacao": 0.15, "status": "meta_atingida", "tendencia": "melhora", "fonte": "RNDS",   "competencia": "Jun/2026"},
            ],
        },
        {
            "nome": "Gestão em Saúde",
            "score": 7.4,
            "peso": 0.15,
            "indicadores": [
                {"codigo": "GS01", "nome": "Execução orçamentária em saúde",        "dimensao": "Gestão em Saúde",     "valor": 61.3, "meta": 50.0, "ponderacao": 0.30, "status": "meta_atingida", "tendencia": "melhora", "fonte": "SIOPS",  "competencia": "Jun/2026"},
                {"codigo": "GS02", "nome": "Profissionais com vínculo estável",     "dimensao": "Gestão em Saúde",     "valor": 78.4, "meta": 70.0, "ponderacao": 0.25, "status": "meta_atingida", "tendencia": "estavel", "fonte": "SCNES",  "competencia": "Jun/2026"},
                {"codigo": "GS03", "nome": "Atas CMS publicadas em prazo legal",    "dimensao": "Gestão em Saúde",     "valor": 100.0,"meta": 100.0,"ponderacao": 0.25, "status": "meta_atingida", "tendencia": "estavel", "fonte": "CMS",    "competencia": "2026"},
                {"codigo": "GS04", "nome": "Indicadores RNDS ativos",               "dimensao": "Gestão em Saúde",     "valor": 85.0, "meta": 80.0, "ponderacao": 0.20, "status": "meta_atingida", "tendencia": "melhora", "fonte": "RNDS",   "competencia": "Jun/2026"},
            ],
        },
        {
            "nome": "Financiamento",
            "score": 7.8,
            "peso": 0.10,
            "indicadores": [
                {"codigo": "FN01", "nome": "Recursos próprios em saúde (15%)",      "dimensao": "Financiamento",       "valor": 17.2, "meta": 15.0, "ponderacao": 0.40, "status": "meta_atingida", "tendencia": "estavel", "fonte": "SIOPS",  "competencia": "Jun/2026"},
                {"codigo": "FN02", "nome": "Repasses federais recebidos em dia",    "dimensao": "Financiamento",       "valor": 91.7, "meta": 90.0, "ponderacao": 0.35, "status": "meta_atingida", "tendencia": "estavel", "fonte": "FNS",    "competencia": "Jun/2026"},
                {"codigo": "FN03", "nome": "Prestação de contas em dia (SIACS)",    "dimensao": "Financiamento",       "valor": 75.0, "meta": 80.0, "ponderacao": 0.25, "status": "alerta",        "tendencia": "melhora", "fonte": "SIACS",  "competencia": "Jun/2026"},
            ],
        },
    ]


@router.get("/resumo")
def resumo():
    score = sum(d["score"] * d["peso"] for d in _DIMENSOES())
    return {
        "score_geral":           round(score, 1),
        "score_geral_anterior":  round(score - 0.3, 1),
        "ranking_am":            12,
        "total_municipios_am":   62,
        "ranking_nacional":      2847,
        "total_municipios_br":   5570,
        "dimensoes":             _DIMENSOES,
        "ultima_atualizacao":    "Jul/2026",
        "competencia":           "2º Quad. 2026",
    }
