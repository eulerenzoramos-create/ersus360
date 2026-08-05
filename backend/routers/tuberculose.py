from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/tuberculose", tags=["tuberculose"])

@lru_cache(maxsize=1)
def _CASOS_TIPO():
    return [
        {"tipo": "TB Pulmonar Bacilífera", "casos_ano": 18, "cura_pct": 77.8, "abandono": 3,
         "dots_pct": 61.1, "cultura_realizada_pct": 72.2, "status": "critico"},
        {"tipo": "TB Pulmonar Não Bacilífera", "casos_ano": 9, "cura_pct": 88.9, "abandono": 1,
         "dots_pct": 55.6, "cultura_realizada_pct": 44.4, "status": "atencao"},
        {"tipo": "TB Extrapulmonar", "casos_ano": 6, "cura_pct": 83.3, "abandono": 0,
         "dots_pct": 50.0, "cultura_realizada_pct": 83.3, "status": "atencao"},
        {"tipo": "TB-HIV Coinfecção", "casos_ano": 5, "cura_pct": 60.0, "abandono": 2,
         "dots_pct": 80.0, "cultura_realizada_pct": 100.0, "status": "critico"},
        {"tipo": "TB Drogarresistente (TDR)", "casos_ano": 2, "cura_pct": 50.0, "abandono": 1,
         "dots_pct": 100.0, "cultura_realizada_pct": 100.0, "status": "critico"},
    ]


@lru_cache(maxsize=1)
def _CONTATOS():
    return [
        {"categoria": "Intradomiciliar (<15 anos)", "identificados": 48, "examinados": 34, "pct_examinados": 70.8, "ltbi_detectados": 8},
        {"categoria": "Intradomiciliar (≥15 anos)", "identificados": 112, "examinados": 79, "pct_examinados": 70.5, "ltbi_detectados": 14},
        {"categoria": "Institucional (escola/trabalho)", "identificados": 63, "examinados": 38, "pct_examinados": 60.3, "ltbi_detectados": 6},
    ]


@lru_cache(maxsize=1)
def _SERIE():
    return [
        {"ano": "2022", "casos_novos": 30, "taxa_incidencia": 159.1, "cura_pct": 78.3, "abandono_pct": 10.4, "coinfeccao_hiv_pct": 10.0},
        {"ano": "2023", "casos_novos": 33, "taxa_incidencia": 175.0, "cura_pct": 75.8, "abandono_pct": 12.1, "coinfeccao_hiv_pct": 12.1},
        {"ano": "2024", "casos_novos": 38, "taxa_incidencia": 201.5, "cura_pct": 73.7, "abandono_pct": 13.2, "coinfeccao_hiv_pct": 13.2},
        {"ano": "2025", "casos_novos": 35, "taxa_incidencia": 185.6, "cura_pct": 80.0, "abandono_pct": 8.6, "coinfeccao_hiv_pct": 14.3},
        {"ano": "2026*", "casos_novos": 40, "taxa_incidencia": 212.1, "cura_pct": None, "abandono_pct": None, "coinfeccao_hiv_pct": 12.5},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Taxa de incidência", "valor": 212.1, "meta": 10.0, "unidade": "/100 mil hab",
         "status": "critico", "observacao": "Meta OMS End TB: 10/100mil até 2035 — muito acima do limite"},
        {"indicador": "Taxa de cura (esquema básico)", "valor": 77.8, "meta": 85.0, "unidade": "%",
         "status": "critico", "observacao": "Meta nacional 85% — DOTS insuficiente na zona rural"},
        {"indicador": "Abandono de tratamento", "valor": 17.5, "meta": 5.0, "unidade": "%",
         "status": "critico", "observacao": "Alta taxa de abandono — risco de resistência bacteriana"},
        {"indicador": "DOTS (supervisão direta)", "valor": 61.0, "meta": 80.0, "unidade": "%",
         "status": "critico", "observacao": "Cobertura DOTS abaixo da meta nacional"},
        {"indicador": "Coinfecção TB-HIV testada", "valor": 100.0, "meta": 100.0, "unidade": "%",
         "status": "ok", "observacao": "Todos os casos TB testados para HIV — protocolo cumprido"},
        {"indicador": "TB drogarresistente", "valor": 5.0, "meta": 0.0, "unidade": "% dos casos",
         "status": "critico", "observacao": "2 casos TDR — padrão relacionado a abandono prévio"},
    ]



@router.get("/dashboard")
def dashboard():
    return {
        "casos_novos_ano": 40,
        "taxa_incidencia_100mil": 212.1,
        "em_tratamento": 40,
        "coinfeccao_hiv_pct": 12.5,
        "abandono_pct": 17.5,
        "cura_pct": 77.8,
        "dots_pct": 61.0,
        "tdr_casos": 2,
        "encerramento_cura_pct": 77.8,
        "contatos_examinados_pct": 68.4,
        "cultura_realizada_pct": 72.5,
        "classificacao_municipio": "ALTA PRIORIDADE",
    }


@router.get("/casos-por-tipo")
def casos_por_tipo():
    return _CASOS_TIPO


@router.get("/investigacao-contatos")
def investigacao_contatos():
    return _CONTATOS


@router.get("/serie-historica")
def serie_historica():
    return _SERIE


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
